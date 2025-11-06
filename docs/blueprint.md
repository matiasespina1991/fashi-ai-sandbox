# **App Name**: Fashi Sandbox

## Core Features:

- Google Sign-In: Allow users to authenticate with their Google account for secure access.
- Avatar Upload: Enable users to upload their avatar image to Firebase Storage.
- Garment Upload: Enable users to upload multiple garment images to Firebase Storage.
- Try-On Generation: Generate a combined image of the avatar wearing the selected garments using the try-on engine, triggered by a Cloud Function.  This feature provides image composition, and will require the engine to evaluate which parts of each garment best 'fit' the overall picture and use its tool to correctly incorporate them.
- Image Preview: Display the generated image and combination hash (if available) to the user.
- Error Handling: Gracefully handle and display error messages in Spanish to the user.
- Video Generator Placeholder: Provide a placeholder page for future video generation capabilities.

## Style Guidelines:

- Primary color: Deep blue (#1A237E) to evoke a sense of professionalism and trustworthiness.
- Background color: Very light gray (#F5F5F5) to provide a clean and neutral backdrop.
- Accent color: Yellow-Orange (#FFAB40) to highlight interactive elements and calls to action.
- Headline font: 'Poppins' (sans-serif) for titles and important labels, lending a modern and fashionable feel.
- Body font: 'PT Sans' (sans-serif) for body text and descriptions, ensuring readability.
- Use clear, modern icons to represent different actions and categories in the sidebar.
- Maintain a clean and modular layout with a left sidebar and a content area, optimized for user experience.
- Incorporate subtle loading animations during image uploads and generation processes.