"use server";

import { generateMotionVideo, GenerateMotionVideoInput } from "@/ai/flows/generate-motion-video";

export async function startVideoGeneration(input: GenerateMotionVideoInput) {
  try {
    const result = await generateMotionVideo(input);
    if (result.generatedVideoDataUri) {
      return { success: true, data: result };
    } else {
       throw new Error("La generación de video no devolvió un resultado.");
    }
  } catch (error) {
    console.error("Error during video generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Lo sentimos, ha ocurrido un error al generar el video. Por favor, inténtalo de nuevo.";
    return { success: false, error: errorMessage };
  }
}
