# Fashi Sandbox

This is a Next.js starter in Firebase Studio for the Fashi Sandbox application.

## Getting Started

First, you need to set up your Firebase project and environment variables.

1.  Create a project on the [Firebase Console](https://console.firebase.google.com/).
2.  Add a new Web App to your project.
3.  Copy the `firebaseConfig` object values.
4.  Create a new file named `.env.local` in the root of the project.
5.  Add the Firebase configuration to `.env.local`, using the variable names from `.env.example`:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```

6.  In your Firebase project, go to **Authentication** > **Sign-in method** and enable the **Google** provider.
7.  In your Firebase project, go to **Storage** and create a Cloud Storage bucket. Make sure the rules allow reads and writes for authenticated users. A good starting rule for development is:
    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow read, write: if request.auth != null;
        }
      }
    }
    ```

Now, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
