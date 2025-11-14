'use server';

/**
 * @fileOverview Generates multiple avatar poses from a single avatar image and multiple prompts.
 *
 * - generateAvatarPoses - A function that handles the avatar pose generation process.
 * - GenerateAvatarPosesInput - The input type for the generateAvatarPoses function.
 * - GenerateAvatarPosesOutput - The return type for the generateAvatarPoses function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const PoseSchema = z.object({
  prompt: z.string().describe('The text prompt to use for generating this specific pose.'),
});

const GenerateAvatarPosesInputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe(
      "A photo of the avatar, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  poses: z.array(PoseSchema).min(1).describe("An array of pose objects, each containing a prompt."),
});
export type GenerateAvatarPosesInput = z.infer<typeof GenerateAvatarPosesInputSchema>;

const GeneratedPoseSchema = z.object({
  generatedImageDataUri: z.string().describe('The generated pose image, as a data URI.'),
});

const GenerateAvatarPosesOutputSchema = z.object({
  generatedPoses: z.array(GeneratedPoseSchema).describe('An array of the generated pose images.'),
});
export type GenerateAvatarPosesOutput = z.infer<typeof GenerateAvatarPosesOutputSchema>;


export async function generateAvatarPoses(input: GenerateAvatarPosesInput): Promise<GenerateAvatarPosesOutput> {
  return generateAvatarPosesFlow(input);
}

const generateAvatarPosesFlow = ai.defineFlow(
  {
    name: 'generateAvatarPosesFlow',
    inputSchema: GenerateAvatarPosesInputSchema,
    outputSchema: GenerateAvatarPosesOutputSchema,
  },
  async ({ avatarDataUri, poses }) => {
    
    // Generate each pose in parallel
    const posePromises = poses.map(async (pose) => {
      const { media } = await ai.generate({
          prompt: [
              { text: pose.prompt },
              { media: { url: avatarDataUri } },
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
        // In a real app, you might want more robust error handling per-image
        throw new Error(`Pose generation failed for prompt: ${pose.prompt}`);
      }
      return { generatedImageDataUri: media.url };
    });

    const generatedPoses = await Promise.all(posePromises);

    return { generatedPoses };
  }
);
