"use server";

import { generateScenePrompt, GenerateScenePromptInput } from "@/ai/flows/generate-scene-prompt";

export async function startScenePromptGeneration(input: GenerateScenePromptInput) {
  try {
    const result = await generateScenePrompt(input);
    if (result.generatedPrompt) {
      return { success: true, data: result };
    } else {
       throw new Error("La generación de prompts no devolvió un resultado.");
    }
  } catch (error) {
    console.error("Error during prompt generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Lo sentimos, ha ocurrido un error al generar el prompt. Por favor, inténtalo de nuevo.";
    return { success: false, error: errorMessage };
  }
}
