"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shirt, Loader2, PartyPopper, User, X, Sparkles, ChevronDown } from 'lucide-react';
import { startImageGeneration } from '@/actions/generate-image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';

const defaultTryOnPrompt = `CRITICAL PHOTO EDITING TASK: Apply a garment to a person while preserving their identity and the garment's details with 100% accuracy.

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

type FilePreview = {
  file: File;
  previewUrl: string;
};

export default function TryOnPage() {
  const [avatar, setAvatar] = useState<FilePreview | null>(null);
  const [garments, setGarments] =useState<FilePreview[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string>(defaultTryOnPrompt);
  const { toast } = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const garmentsInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleGarmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newGarments = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setGarments(prev => [...prev, ...newGarments].slice(0, 5)); // Limit to 5 garments
  };
  
  const removeGarment = (index: number) => {
    setGarments(prev => prev.filter((_, i) => i !== index));
  }
  
  const resetState = () => {
    setAvatar(null);
    setGarments([]);
    setGeneratedImage(null);
    setIsGenerating(false);
    setPrompt(defaultTryOnPrompt);
  }

  const handleGenerate = async () => {
    if (!avatar) {
      toast({
        variant: 'destructive',
        title: 'Falta el avatar',
        description: 'Por favor, sube una imagen de tu avatar.',
      });
      return;
    }
    if (garments.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Faltan las prendas',
        description: 'Por favor, sube al menos una prenda.',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const avatarDataUri = await fileToDataUri(avatar.file);
      const garmentDataUris = await Promise.all(garments.map(g => fileToDataUri(g.file)));

      const result = await startImageGeneration({ avatarDataUri, garmentDataUris, prompt });

      if (result.success && result.data) {
        setGeneratedImage(result.data.generatedImageDataUri);
        toast({
          title: 'Imagen Generada',
          description: 'Tu combinación ha sido creada con éxito.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de Generación',
        description: error.message || 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Upload Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold font-headline mb-1">1. Sube tu Avatar</h3>
            <p className="text-sm text-muted-foreground mb-4">Añade una foto tuya o de tu modelo.</p>
            <input
              type="file"
              accept="image/*"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="aspect-square w-full">
              {avatar ? (
                <div className="relative w-full h-full">
                  <Image
                    src={avatar.previewUrl}
                    alt="Avatar preview"
                    fill
                    className="object-contain bg-white rounded-lg"
                  />
                  <button onClick={(e) => { e.stopPropagation(); setAvatar(null); }} className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 z-10">
                    <X size={16}/>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
                  aria-label="Subir avatar"
                >
                  <User className="h-12 w-12 text-muted-foreground" />
                  <span className="mt-2 text-sm font-medium">Haz clic para subir</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Garments Section */}
        <div className="space-y-6">
          <div>
              <h3 className="text-lg font-semibold font-headline mb-1">2. Sube tus Prendas</h3>
              <p className="text-sm text-muted-foreground mb-4">Añade hasta 5 prendas para probar.</p>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={garmentsInputRef}
                onChange={handleGarmentsChange}
                className="hidden"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {garments.map((garment, index) => (
                   <div key={index} className="relative group aspect-square">
                     <Image
                       src={garment.previewUrl}
                       alt={`Garment preview ${index + 1}`}
                       fill
                       className="object-cover rounded-lg"
                     />
                     <button onClick={() => removeGarment(index)} className="absolute top-1.5 right-1.5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                       <X size={14}/>
                     </button>
                   </div>
                ))}
                {garments.length < 5 && (
                  <button
                    onClick={() => garmentsInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
                    aria-label="Subir prendas"
                  >
                    <Shirt className="h-10 w-10 text-muted-foreground" />
                    <span className="mt-2 text-sm text-center font-medium">Añadir prenda</span>
                  </button>
                )}
              </div>
            </div>
        </div>
      </div>
      
      {/* Action and Result Section */}
      <div className="space-y-4">
         <div className="max-w-2xl mx-auto w-full space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                     <span className="font-bold">Editar Prompt</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] text-xs font-mono bg-card"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleGenerate} disabled={isGenerating || !avatar || garments.length === 0} size="lg" className="w-full sm:w-auto">
            {isGenerating ? (
                <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando...
                </>
            ) : (
                <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generar Ahora
                </>
            )}
            </Button>
            {(avatar || garments.length > 0) && (
              <Button onClick={resetState} variant="outline" size="lg" className="w-full sm:w-auto">
                <X className="mr-2 h-5 w-5" />
                Limpiar
              </Button>
            )}
        </div>
        
        <div className="max-w-2xl mx-auto w-full space-y-4">
            <div className="relative w-full aspect-[4/5] border rounded-lg bg-card flex items-center justify-center overflow-hidden">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 w-full">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="font-medium">Creando tu look...</p>
                        <p className="text-sm text-muted-foreground">Esto puede tardar unos segundos.</p>
                    </div>
                ) : generatedImage ? (
                    <Image
                        src={generatedImage}
                        alt="Generated try-on"
                        fill
                        className="object-cover"
                    />
                ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <PartyPopper className="h-16 w-16 mb-4" />
                    <h3 className="font-headline text-xl font-semibold">3. El resultado aparecerá aquí</h3>
                    <p className="mt-1 text-sm max-w-sm">Sube tus imágenes y haz clic en "Generar Ahora" para ver el resultado.</p>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

    