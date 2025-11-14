"use server";

import { generateAvatarPoses, GenerateAvatarPosesInput } from "@/ai/flows/generate-avatar-poses";

export async function startAvatarPosesGeneration(input: GenerateAvatarPosesInput) {
  try {
    const result = await generateAvatarPoses(input);
    if (result.generatedPoses && result.generatedPoses.length > 0) {
      return { success: true, data: result };
    } else {
       throw new Error("La generación de poses no devolvió ninguna imagen.");
    }
  } catch (error) {
    console.error("Error during pose generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Lo sentimos, ha ocurrido un error al generar las poses. Por favor, inténtalo de nuevo.";
    return { success: false, error: errorMessage };
  }
}
