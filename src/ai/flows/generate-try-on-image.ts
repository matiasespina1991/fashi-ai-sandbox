'use server';

/**
 * @fileOverview Generates a combined image of an avatar wearing selected garments.
 *
 * - generateTryOnImage - A function that handles the image generation process.
 * - GenerateTryOnImageInput - The input type for the generateTryOnImage function.
 * - GenerateTryOnImageOutput - The return type for the generateTryOnImage function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateTryOnImageInputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "A photo of the avatar, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  garmentDataUris: z
    .array(z.string())
    .describe(
      "An array of photos of garments, as data URIs that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateTryOnImageInput = z.infer<typeof GenerateTryOnImageInputSchema>;

const GenerateTryOnImageOutputSchema = z.object({
  generatedImageDataUri: z
    .string()
    .describe('The generated image of the avatar wearing the garments, as a data URI.'),
});
export type GenerateTryOnImageOutput = z.infer<typeof GenerateTryOnImageOutputSchema>;

export async function generateTryOnImage(input: GenerateTryOnImageInput): Promise<GenerateTryOnImageOutput> {
  return generateTryOnImageFlow(input);
}

const promptText = `CRITICAL PHOTO EDITING TASK: Apply a garment to a person while preserving their identity and the garment's details with 100% accuracy.

IMAGE ROLES (MANDATORY):
- Image 1: **THE IDENTITY**. This is the original person. Their face, hair, skin tone, and body shape are the absolute source of truth. YOU MUST NOT CHANGE THIS PERSON.
- Image 2: **THE CANVAS**. This is the person's current state (either in a gray bodysuit or already wearing clothes). You will work on this image.
- Subsequent Images: **THE GARMENTS**. These are the pieces of clothing to apply.

ABSOLUTE RULES (FAILURE IF NOT FOLLOWED):
1.  **PRESERVE IDENTITY:** The final output's face, hair, skin tone, and body MUST be 100% identical to Image 1 (THE IDENTITY).
2.  **PRESERVE GARMENT DETAILS:** The texture, pattern, collar shape, and fit of THE GARMENTS must be replicated faithfully. Do NOT simplify or alter the clothing's design.
3.  **BAREFOOT & BACKGROUND:** The person must remain barefoot. The background must be plain white.
4.  **PERFECT CENTERING:** The person must be perfectly centered in the image, both horizontally and vertically. The full body from head to feet must be visible with equal spacing on all sides.
5.  **COMPLETE GRAY BODYSUIT REMOVAL:** The gray bodysuit must be COMPLETELY removed and replaced. No gray fabric should remain visible anywhere.

TASK:
1.  Analyze all GARMENT images carefully. Note their exact shape, texture, and details.
2.  Layer the GARMENTS onto THE CANVAS (Image 2) logically (e.g., shirt first, then jacket).
3.  **CRITICAL - EXPOSED SKIN RENDERING:**
    - Any body part NOT covered by the new garments (like arms, legs, neck) MUST be rendered as BARE SKIN.
    - The skin tone MUST exactly match THE IDENTITY (Image 1).
    - **NO GRAY BODYSUIT should remain visible on any exposed area.**
4.  **CENTER THE PERSON:** Position the full-body person perfectly in the center of the frame with equal margins on all sides.

COMMON MISTAKES TO AVOID (CRITICAL):
- **DO NOT** leave ANY parts of the gray bodysuit visible.
- **DO NOT** change the person's face, hair, or body shape from Image 1.
- **DO NOT** "shrink-wrap" the garment texture; respect its original fit and drape.
- **DO NOT** position the person off-center or cut off any part of their body.
- **DO NOT** make the garments look painted on; they should look like real clothing with natural folds and shadows.
FINAL OUTPUT: A single, full-body photorealistic image with the person perfectly centered, all garments applied realistically, and ZERO gray bodysuit visible on any exposed skin areas.`;

const tryOnPrompt = ai.definePrompt(
  {
    name: 'tryOnPrompt',
    prompt: promptText,
    model: googleAI.model('gemini-2.5-flash-image-preview'),
    config: {
      responseModalities: ['IMAGE'],
      temperature: 0.15,
      topK: 15,
      topP: 0.85,
    },
  },
);

const generateTryOnImageFlow = ai.defineFlow(
  {
    name: 'generateTryOnImageFlow',
    inputSchema: GenerateTryOnImageInputSchema,
    outputSchema: GenerateTryOnImageOutputSchema,
  },
  async ({ avatarDataUri, garmentDataUris }) => {
    
    const promptParts = [
        { text: promptText },
        { media: { url: avatarDataUri } }, // THE IDENTITY
        { media: { url: avatarDataUri } }, // THE CANVAS (starts as the avatar)
        ...garmentDataUris.map(url => ({ media: { url } })) // THE GARMENTS
      ];
    
    const { media } = await ai.generate({
        prompt: promptParts,
        model: googleAI.model('gemini-2.5-flash-image-preview'),
        config: {
          responseModalities: ['IMAGE'],
          temperature: 0.15,
          topK: 15,
          topP: 0.85,
        }
      });

    if (!media) {
      throw new Error('Image generation failed to return an image.');
    }
    return { generatedImageDataUri: media.url };
  }
);
