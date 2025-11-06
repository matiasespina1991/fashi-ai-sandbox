"use server";

import { generateTryOnImage, GenerateTryOnImageInput } from "@/ai/flows/generate-try-on-image";

export async function startImageGeneration(input: GenerateTryOnImageInput) {
  try {
    const result = await generateTryOnImage(input);
    if (result.generatedImageDataUri) {
      return { success: true, data: result };
    } else {
       throw new Error("La generación de imágenes no devolvió una imagen.");
    }
  } catch (error) {
    console.error("Error during image generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Lo sentimos, ha ocurrido un error al generar la imagen. Por favor, inténtalo de nuevo.";
    return { success: false, error: errorMessage };
  }
}
