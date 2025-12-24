// functions/_shared/tools/definitions.ts

export const TOOLS = [
  {
    name: "set_phase",
    description: "Updates the journey phase based on the Foundational Hierarchy. Use only when a specific Observation Gate is cleared.",
    parameters: {
      type: "object",
      properties: {
        phase: {
          type: "string",
          enum: [
            "PERSONA_VALIDATION",   // Observation 1 cleared
            "EXTRACTION",           // Observations 2-4 in progress
            "READINESS_WORTHINESS", // Observation 7 Part A
            "BLUEPRINT_NEGOTIATION",// Observation 7 Part B
            "PROTOCOL_CONSENSUS",   // Final Installation
            "THE_COUNSEL"           // Maintenance
          ]
        }
      },
      required: ["phase"]
    }
  },
  {
    name: "create_action",
    description: "Spawns a tactical task or routine. Use during BLUEPRINT_NEGOTIATION or THE_COUNSEL.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        type: { type: "string", enum: ["routine", "task"] },
        frequency: { type: "string", enum: ["daily", "once"] },
        description: { type: "string" }
      },
      required: ["title", "type", "description"]
    }
  },
  {
    name: "create_mission",
    description: "Saves the final 5-Phase Protocol. Use ONLY after the user explicitly accepts the terms in PROTOCOL_CONSENSUS.",
    parameters: {
      type: "object",
      properties: {
        price_tag: { 
          type: "string", 
          description: "The non-negotiable cost of this transformation (e.g., '90 days of digital silence')." 
        },
        blueprint: { 
          type: "string", 
          description: "The full JSON string containing phases, directives, and spawn_actions as per the Architect Schema." 
        }
      },
      required: ["price_tag", "blueprint"]
    }
  }
];