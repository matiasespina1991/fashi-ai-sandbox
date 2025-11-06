"use server";

import { generateVideoFromFrames, GenerateVideoFromFramesInput } from "@/ai/flows/generate-video-from-frames";

export async function startVideoFromFramesGeneration(input: GenerateVideoFromFramesInput) {
  try {
    const result = await generateVideoFromFrames(input);
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
