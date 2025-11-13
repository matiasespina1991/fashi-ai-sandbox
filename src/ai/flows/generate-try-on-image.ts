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
   prompt: z.string().describe('The text prompt to use for the image generation.'),
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


const generateTryOnImageFlow = ai.defineFlow(
  {
    name: 'generateTryOnImageFlow',
    inputSchema: GenerateTryOnImageInputSchema,
    outputSchema: GenerateTryOnImageOutputSchema,
  },
  async ({ avatarDataUri, garmentDataUris, prompt }) => {
    
    const promptParts = [
        { text: prompt },
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
