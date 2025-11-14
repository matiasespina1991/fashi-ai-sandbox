"use server";

import { generateAvatar, GenerateAvatarInput } from "@/ai/flows/generate-avatar";

export async function startAvatarGeneration(input: GenerateAvatarInput) {
  try {
    const result = await generateAvatar(input);
    if (result.generatedAvatarDataUri) {
      return { success: true, data: result };
    } else {
       throw new Error("La generación de avatares no devolvió una imagen.");
    }
  } catch (error) {
    console.error("Error during avatar generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Lo sentimos, ha ocurrido un error al generar el avatar. Por favor, inténtalo de nuevo.";
    return { success: false, error: errorMessage };
  }
}
