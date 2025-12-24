// functions/chat-turn/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TOOLS } from "../_shared/tools/definitions.ts"
import { SYSTEM_PROMPT } from "../_shared/prompts/systemPrompt.ts"
import { ARCHITECT_PROMPT } from "../_shared/prompts/architectPrompt.ts"
import { PHASE_INSTRUCTIONS } from "../_shared/phases.ts"
import { AppPhase } from "../_shared/types.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Auth Validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("No authorization header");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error("Unauthorized");

    const { message, history = [], conversation_id, phase } = await req.json();
    const user_id = user.id;

    // 2. Ensure Conversation & Phase
    let activeConvId = conversation_id;
    let currentPhase: AppPhase = phase || 'PERSONA_VALIDATION';

    if (!activeConvId) {
      // Fallback: Find latest active conversation or create one
      const { data: existing } = await supabase
        .from('conversations')
        .select('id, phase')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (existing) {
        activeConvId = existing.id;
        currentPhase = existing.phase as AppPhase;
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert([{ user_id, phase: currentPhase }])
          .select()
          .single();
        activeConvId = newConv.id;
      }
    }

    // 3. Persist User Message (Crucial for history)
    await supabase.from('messages').insert([{
      conversation_id: activeConvId,
      user_id,
      role: 'user',
      content: message,
      phase: currentPhase
    }]);

    // 4. Fetch Latest Submission (Audit Awareness)
    const { data: recentSubmissions } = await supabase
      .from('actions')
      .select('title, results_reflection, submission_text, completed_at, origin')
      .eq('conversation_id', activeConvId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    let auditContext = "";
    if (recentSubmissions && recentSubmissions.length > 0) {
      const sub = recentSubmissions[0];
      const subTime = new Date(sub.completed_at).getTime();
      const now = new Date().getTime();
      
      if (now - subTime < 1000 * 60 * 10) {
        auditContext = `
          [USER SUBMISSION DETECTED]
          Type: ${sub.origin === 'trial' ? 'WORTHINESS TRIAL' : 'PROTOCOL TASK'}
          Action Title: "${sub.title}"
          User Reflection: "${sub.results_reflection}"
          Artifact: "${sub.submission_text || 'No artifact'}"
          INSTRUCTION: Audit this submission immediately.
        `;
      }
    }

    // 5. Construct Dynamic System Prompt
    const isArchitectPhase = ['BLUEPRINT_NEGOTIATION', 'PROTOCOL_CONSENSUS'].includes(currentPhase);
    const combinedSystemPrompt = `
      ${SYSTEM_PROMPT}
      ${isArchitectPhase ? `\n--- ARCHITECT MODE ACTIVE ---\n${ARCHITECT_PROMPT}` : ''}
      [CURRENT PHASE: ${currentPhase}]
      ${PHASE_INSTRUCTIONS[currentPhase] || ''}
      ${auditContext}
    `;

    // 6. Call Azure OpenAI
    const baseUrl = Deno.env.get("AZURE_OPENAI_ENDPOINT")?.replace(/\/$/, ""); 
    const deployment = Deno.env.get("AZURE_OPENAI_AZURE_DEPLOYMENT");
    const apiKey = Deno.env.get("AZURE_OPENAI_API_KEY");
    const fullUrl = `${baseUrl}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey! },
      body: JSON.stringify({
        messages: [
          { role: "system", content: combinedSystemPrompt },
          ...history,
          { role: "user", content: message }
        ],
        tools: TOOLS.map(t => ({ type: "function", function: t })),
        tool_choice: "auto"
      })
    });

    const aiData = await res.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const responseMsg = aiData.choices[0].message;
    let finalContent = responseMsg.content;
    let newPhase = currentPhase;

    // 7. Handle Tool Calls
    if (responseMsg.tool_calls) {
      for (const call of responseMsg.tool_calls) {
        const { name, arguments: argsRaw } = call.function;
        const args = JSON.parse(argsRaw);

        if (name === 'set_phase') {
          newPhase = args.phase as AppPhase;
          await supabase.from('conversations').update({ phase: newPhase, updated_at: new Date() }).eq('id', activeConvId);
        }

        if (name === 'create_action') {
          await supabase.from('actions').insert([{
            user_id,
            conversation_id: activeConvId,
            title: args.title,
            description: args.description,
            origin: args.type, 
            status: 'pending'
          }]);
        }

        if (name === 'create_mission') {
          const syllabus = JSON.parse(args.blueprint);
          const { data: mission, error: mError } = await supabase.from('missions').insert([{
            user_id,
            conversation_id: activeConvId,
            title: syllabus.title,
            description: syllabus.description,
            curriculum: syllabus,
            protocol: syllabus.levels[0].protocol,
            status: 'active',
            current_level: 1
          }]).select().single();

          if (!mError) {
            const level1Tasks = syllabus.levels[0].tasks.map((t: any) => ({
              user_id,
              conversation_id: activeConvId,
              mission_id: mission.id,
              title: t.title,
              description: t.action,
              routine_instruction: t.routine,
              origin: 'task',
              requires_submission: t.requires_submission,
              status: 'pending'
            }));
            await supabase.from('actions').insert(level1Tasks);
          }
        }
        if (!finalContent) finalContent = `[System: ${name.replace('_', ' ')} executed]`;
      }
    }

    // 8. Log Assistant Message
    await supabase.from('messages').insert([{
      conversation_id: activeConvId,
      user_id,
      role: 'assistant',
      content: finalContent,
      phase: newPhase
    }]);

    return new Response(
      JSON.stringify({ content: finalContent, new_phase: newPhase, conversation_id: activeConvId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
})