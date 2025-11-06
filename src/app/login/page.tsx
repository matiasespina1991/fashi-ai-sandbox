"use client";

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Workaround for a known Firebase bug that causes a long delay when the user closes the sign-in popup.
    // This overrides the 8-second timeout to a more reasonable 1 second.
    // See: https://github.com/firebase/firebase-js-sdk/issues/8061
    (function () {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = function (fn: TimerHandler, delay?: number, ...args: any[]) {
        if (delay === 8000 && fn.toString().includes('POPUP_CLOSED_BY_USER')) {
          delay = 1000;
        }
        return originalSetTimeout(fn, delay, ...args);
      };
    })();
  }, []);


  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);


  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The useEffect above will handle the redirect on successful login.
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      // Don't show a toast for user-cancelled popups
      if ((error as any).code !== 'auth/popup-closed-by-user') {
        toast({
          variant: 'destructive',
          title: 'Error de Autenticación',
          description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.',
        });
      }
    }
  };

  // Render nothing or a loader while checking auth state to prevent flash of login page
  if (loading || user) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
        </div>
      );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
               <Image src="/logos/fashi/fashi_logo.png" alt="Fashi Logo" width={64} height={64} />
            </div>
          <CardTitle className="text-3xl font-headline">AI Fashion Sandbox</CardTitle>
          <CardDescription>Development Environment</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full h-12 text-base overflow-clip" onClick={handleGoogleSignIn}>
             <Image src="/logos/google/google_logo.png" alt="Google" width={20} height={20} className="mr-2" />
            Iniciar sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
