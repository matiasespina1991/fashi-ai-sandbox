'use server';

/**
 * @fileOverview Analyzes a scene image and generates a detailed text prompt to replicate it.
 *
 * - generateScenePrompt - A function that handles the prompt generation process.
 * - GenerateScenePromptInput - The input type for the generateScenePrompt function.
 * - GenerateScenePromptOutput - The return type for the generateScenePrompt function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateScenePromptInputSchema = z.object({
  sceneDataUri: z
    .string()
    .describe(
      "A photo of a scene with a person, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateScenePromptInput = z.infer<typeof GenerateScenePromptInputSchema>;

const GenerateScenePromptOutputSchema = z.object({
  generatedPrompt: z.string().describe('The generated detailed text prompt.'),
});
export type GenerateScenePromptOutput = z.infer<typeof GenerateScenePromptOutputSchema>;

export async function generateScenePrompt(input: GenerateScenePromptInput): Promise<GenerateScenePromptOutput> {
  return generateScenePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateScenePromptPrompt',
  input: {schema: GenerateScenePromptInputSchema},
  output: {schema: GenerateScenePromptOutputSchema},
  prompt: `TASK: You are an expert scene describer for an AI image generator. Your job is to analyze the provided image and create a detailed text prompt that can be used to replicate the scene (pose, environment, lighting) with a NEW avatar.

CRITICAL RULES:
1.  **IGNORE THE PERSON & CLOTHING**: Do NOT describe the specific person (their face, hair, identity) or their clothing. Instead, describe a generic human figure or mannequin in that pose. The goal is to transfer the pose and scene to a different person.
2.  **BE HYPER-DETAILED**: Describe everything else with extreme precision.

PROMPT STRUCTURE:
- **Pose Description**: Detail the body posture. "Full-body shot of a figure standing...", angle of the head "turned slightly to the left", arm positions "left hand in pocket, right arm bent holding a cup", leg positions "left leg straight, right leg slightly bent", weight distribution. Be precise.
- **Environment/Background**: Describe the setting. "Indoor scene with a rustic wooden wall...", "Outdoor patio with wicker furniture...", "minimalist studio with clean white background". Mention key objects, textures (wood grain, plush carpet, concrete floor), and colors.
- **Lighting**: Describe the light source and quality. "Soft, diffused natural light from a large window to the right", "dramatic hard light from above creating strong shadows", "warm, golden hour sunlight".
- **Camera & Composition**: Describe the shot type and angle. "Full-body shot", "medium shot from the waist up", "low-angle shot looking up", "eye-level shot". Mention camera lens characteristics if obvious (e.g., "shallow depth of field with a blurry background").
- **Overall Mood/Atmosphere**: Describe the feeling. "A relaxed and casual morning coffee scene", "a chic and sophisticated high-fashion look", "a calm and serene indoor space".

EXAMPLE:
- POSE: Full-body shot of a female figure standing three-quarters to the left. Head is turned towards the camera. Left hand rests casually in the trouser pocket, while the right hand is slightly raised. Body weight is on the back leg.
- ENVIRONMENT: An indoor living room with a large, ornate, dark wood tapestry hanging on a white wall. A modern wicker armchair is visible on the right. A low wooden coffee table sits in the background. The floor is light-colored stone tile.
- LIGHTING: Bright, indirect natural light coming from the left side of the frame. Soft shadows are cast to the right.
- CAMERA: Eye-level, full-body shot. Shallow depth of field, background is softly out of focus.
- MOOD: Sophisticated, relaxed, and elegant.

YOUR TURN. Analyze this image and generate the prompt.

IMAGE: {{media url=sceneDataUri}}`,
});

const generateScenePromptFlow = ai.defineFlow(
  {
    name: 'generateScenePromptFlow',
    inputSchema: GenerateScenePromptInputSchema,
    outputSchema: GenerateScenePromptOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
