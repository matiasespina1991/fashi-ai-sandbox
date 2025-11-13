'use server';

/**
 * @fileOverview Generates a video by animating a still avatar image based on a motion input video.
 *
 * - generateMotionVideo - A function that handles the video generation process.
 * - GenerateMotionVideoInput - The input type for the generateMotionVideo function.
 * - GenerateMotionVideoOutput - The return type for the generateMotionVideo function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateMotionVideoInputSchema = z.object({
  avatarImageDataUri: z
    .string()
    .describe(
      "A still photo of the avatar, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  motionVideoDataUri: z
    .string()
    .describe(
      "A video of a person posing or walking, used as the motion source, as a data URI that must include a MIME type and use Base64 encoding."
    ),
   prompt: z.string().describe('The text prompt to use for the video generation.'),
});
export type GenerateMotionVideoInput = z.infer<typeof GenerateMotionVideoInputSchema>;

const GenerateMotionVideoOutputSchema = z.object({
  generatedVideoDataUri: z
    .string()
    .describe('The generated video of the avatar animated, as a data URI.'),
});
export type GenerateMotionVideoOutput = z.infer<typeof GenerateMotionVideoOutputSchema>;

export async function generateMotionVideo(input: GenerateMotionVideoInput): Promise<GenerateMotionVideoOutput> {
  return generateMotionVideoFlow(input);
}

const generateMotionVideoFlow = ai.defineFlow(
  {
    name: 'generateMotionVideoFlow',
    inputSchema: GenerateMotionVideoInputSchema,
    outputSchema: GenerateMotionVideoOutputSchema,
  },
  async ({ avatarImageDataUri, motionVideoDataUri, prompt }) => {
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("La variable de entorno GEMINI_API_KEY no está configurada. Por favor, añádela a tu entorno de despliegue.");
    }
    
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        { text: prompt },
        { media: { url: avatarImageDataUri, contentType: 'image/jpeg' } },
        { media: { url: motionVideoDataUri, contentType: 'video/mp4' } }
      ],
      config: {
        durationSeconds: 5,
        aspectRatio: '9:16',
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation for video generation.');
    }
    
    // Poll for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
        throw new Error('Failed to find the generated video in the operation result.');
    }
    
    // The URL from Veo is temporary and needs the API key to be downloaded.
    // We'll fetch it server-side and convert to a data URI to send to the client.
     const fetch = (await import('node-fetch')).default;
     const videoDownloadResponse = await fetch(
       `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
     );

      if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download generated video. Status: ${videoDownloadResponse.statusText}`);
      }

      const videoBuffer = await videoDownloadResponse.buffer();
      const base64Video = videoBuffer.toString('base64');
      const videoContentType = video.media.contentType || 'video/mp4';

      return { generatedVideoDataUri: `data:${videoContentType};base64,${base64Video}` };
  }
);
