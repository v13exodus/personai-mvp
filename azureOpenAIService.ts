// azureOpenAIService.ts
// This client will handle communication with your Azure OpenAI Service deployment.

import { Platform } from 'react-native';

// Ensure these environment variables are set in your .env file
const AZURE_OPENAI_ENDPOINT = process.env.EXPO_PUBLIC_AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.EXPO_PUBLIC_AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_MODEL_DEPLOYMENT_NAME = process.env.EXPO_PUBLIC_AZURE_OPENAI_AZURE_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.EXPO_PUBLIC_OPENAI_API_VERSION || "2024-02-15-preview"; // Use the version from .env

if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_MODEL_DEPLOYMENT_NAME) {
  console.error("Missing Azure OpenAI environment variables. Please check your .env file.");
}

// This function will send a list of messages to Azure OpenAI and get a response.
// The 'messages' array should follow the OpenAI chat format: [{role: "user", content: "..."}]
export async function getAzureOpenAIChatCompletion(
  chatMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string | null> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_MODEL_DEPLOYMENT_NAME) {
    return "Error: AI not configured. Please check environment variables.";
  }

  const cleanedEndpoint = AZURE_OPENAI_ENDPOINT.endsWith('/') ? AZURE_OPENAI_ENDPOINT : `${AZURE_OPENAI_ENDPOINT}/`;
  const url = `${cleanedEndpoint}openai/deployments/${AZURE_OPENAI_MODEL_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  try {
    console.log("Sending message to Azure OpenAI at URL:", url);
    console.log("Chat messages being sent:", chatMessages);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: chatMessages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    // --- NEW DEBUG LOG ADDED HERE ---
    console.log("DEBUG: Raw Azure OpenAI Fetch Response:", response);
    // --- END DEBUG LOG ---

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Azure OpenAI API Error:", response.status, errorData);
      return `Error from AI: ${errorData.error?.message || response.statusText || `Status: ${response.status}`}`;
    }

    const data = await response.json();
    console.log("Azure OpenAI Response Data (JSON):", data); // Changed log name for clarity

    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.warn("Azure OpenAI response format unexpected or empty:", data);
      return "No AI response received.";
    }

  } catch (error: any) {
    console.error("Error calling Azure OpenAI Service:", error);
    return `Failed to get AI response: ${error.message}`;
  }
}
