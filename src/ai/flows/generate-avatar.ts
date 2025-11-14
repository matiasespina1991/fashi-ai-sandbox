'use server';

/**
 * @fileOverview Generates a professional full-body avatar from user-provided images.
 *
 * - generateAvatar - A function that handles the avatar generation process.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateAvatarInputSchema = z.object({
  userImages: z
    .array(z.string())
    .describe(
      "An array of photos of a person, as data URIs that must include a MIME type and use Base64 encoding."
    ),
   prompt: z.string().describe('The text prompt to use for the avatar generation.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  generatedAvatarDataUri: z
    .string()
    .describe('The generated avatar image, as a data URI.'),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}


const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async ({ userImages, prompt }) => {

    const primaryImage = userImages[0];
    
    const { media } = await ai.generate({
        prompt: [
            { text: prompt },
            { media: { url: primaryImage } },
        ],
        model: googleAI.model('gemini-2.5-flash-image-preview'),
        config: {
          responseModalities: ['IMAGE'],
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
        }
      });

    if (!media) {
      throw new Error('Avatar generation failed to return an image.');
    }
    return { generatedAvatarDataUri: media.url };
  }
);
