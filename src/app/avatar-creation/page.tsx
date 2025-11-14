
"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Loader2, PartyPopper, X, Sparkles, AlertTriangle, Wand2 } from 'lucide-react';
import { startAvatarGeneration } from '@/actions/generate-avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { removeBackground } from "@imgly/background-removal";

const defaultAvatarPrompt = `Transform this photo into a professional full-body avatar for virtual clothing try-on.

PRESERVE EXACTLY:
- Same face (eyes, nose, mouth, jawline)
- Same skin tone and complexion
- Same hairstyle and hair color
- Same body proportions and build
- Same age appearance

REMOVE:
- All accessories (glasses, jewelry, watches)
- All headwear (hats, caps)
- Bags, belts, and worn items

CREATE:
- Person standing straight, arms at sides
- Facing camera directly (front view)
- Neutral facial expression
- Full body visible head to feet, including all toes if applicable
- Wearing plain light gray bodysuit (#D3D3D3)
- Long sleeves to wrists, full legs to ankles
- Form-fitting, matte finish, no logos
- High crew neckline
- Pure white background (RGB 255,255,255)
- Soft studio lighting, no shadows
- Portrait 9:16 ratio, 1024x1792px
- Sharp focus, photorealistic quality

Professional modeling portfolio style. Generate ONE image.`;

type FilePreview = {
  file: File;
  previewUrl: string;
};

export default function AvatarCreationPage() {
  const [userImages, setUserImages] = useState<FilePreview[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageWithoutBg, setImageWithoutBg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [prompt, setPrompt] = useState<string>(defaultAvatarPrompt);
  const { toast } = useToast();

  const imagesInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setUserImages(prev => [...prev, ...newImages].slice(0, 4));
  };
  
  const removeImage = (index: number) => {
    setUserImages(prev => prev.filter((_, i) => i !== index));
  }
  
  const resetState = () => {
    setUserImages([]);
    setGeneratedImage(null);
    setImageWithoutBg(null);
    setIsGenerating(false);
    setIsRemovingBackground(false);
    setPrompt(defaultAvatarPrompt);
  }

  const handleGenerate = async () => {
    if (userImages.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Imágenes insuficientes',
        description: 'Por favor, sube al menos 3 fotos de primer plano.',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setImageWithoutBg(null);

    try {
      const userImageDataUris = await Promise.all(userImages.map(g => fileToDataUri(g.file)));

      const result = await startAvatarGeneration({ userImages: userImageDataUris, prompt });

      if (result.success && result.data) {
        setGeneratedImage(result.data.generatedAvatarDataUri);
        toast({
          title: 'Avatar Generado',
          description: 'Tu avatar ha sido creado con éxito.',
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

  const handleRemoveBackground = useCallback(async () => {
    if (!generatedImage) return;

    setIsRemovingBackground(true);
    try {
      const blob = await fetch(generatedImage).then((res) => res.blob());
      const resultBlob = await removeBackground(blob);
      const resultUrl = URL.createObjectURL(resultBlob);
      setImageWithoutBg(resultUrl);
      toast({
        title: "Fondo Eliminado",
        description: "El fondo de tu avatar ha sido eliminado con éxito.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al Quitar Fondo",
        description:
          error.message || "No se pudo eliminar el fondo. Inténtalo de nuevo.",
      });
    } finally {
      setIsRemovingBackground(false);
    }
  }, [generatedImage, toast]);

  const displayedImage = imageWithoutBg || generatedImage;

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Upload Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold font-headline mb-1">1. Sube tus Fotos</h3>
            <p className="text-sm text-muted-foreground mb-4">Sube al menos 3 fotos de primer plano. Las fotos de cuerpo entero son opcionales pero mejoran el resultado.</p>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={imagesInputRef}
              onChange={handleImagesChange}
              className="hidden"
            />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => {
                const image = userImages[index];
                return (
                  <div key={index} className="relative group aspect-[4/5]">
                    {image ? (
                      <>
                        <Image
                          src={image.previewUrl}
                          alt={`User image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button onClick={() => removeImage(index)} className="absolute top-1.5 right-1.5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                          <X size={14}/>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => imagesInputRef.current?.click()}
                        disabled={userImages.length >= 4}
                        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Subir foto ${index + 1}`}
                      >
                        <ImagePlus className="h-10 w-10 text-muted-foreground" />
                        <span className="mt-2 text-sm text-center font-medium">
                          {`Subir foto ${index + 1}`}
                          {index < 3 ? '' : ' (Opcional)'}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
             <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Consejos para un mejor resultado:</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc pl-5 text-xs">
                        <li>Mínimo 3 fotos de primer plano.</li>
                        <li>Opcional: 1 foto de cuerpo completo.</li>
                        <li>Asegúrate de que la cara sea claramente visible.</li>
                    </ul>
                </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold font-headline mb-1">2. Tu Avatar Generado</h3>
            <p className="text-sm text-muted-foreground mb-4">El resultado aparecerá aquí.</p>
            <div className="relative w-full aspect-[4/5] border rounded-lg bg-card flex items-center justify-center overflow-hidden">
                {isGenerating || isRemovingBackground ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 w-full">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <p className="font-medium">{isGenerating ? 'Creando tu avatar...' : 'Quitando fondo...'}</p>
                        <p className="text-sm text-muted-foreground">Esto puede tardar unos segundos.</p>
                    </div>
                ) : displayedImage ? (
                    <Image
                        src={displayedImage}
                        alt="Generated avatar"
                        fill
                        className="object-contain"
                    />
                ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                    <PartyPopper className="h-16 w-16 mb-4" />
                    <p className="mt-1 text-sm max-w-sm">Sube tus imágenes y haz clic en "Generar Ahora" para crear tu avatar digital.</p>
                </div>
                )}
            </div>
             {generatedImage && (
              <div className="flex justify-start">
                  <Button
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBackground || !!imageWithoutBg}
                  >
                      {isRemovingBackground ? (
                          <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Quitando fondo...
                          </>
                      ) : (
                          <>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Quitar fondo
                          </>
                      )}
                  </Button>
              </div>
            )}
        </div>
      </div>
      
      {/* Action and Prompt Section */}
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
            <Button onClick={handleGenerate} disabled={isGenerating || userImages.length < 3} size="lg" className="w-full sm:w-auto">
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
            {(userImages.length > 0) && (
              <Button onClick={resetState} variant="outline" size="lg" className="w-full sm:w-auto">
                <X className="mr-2 h-5 w-5" />
                Limpiar
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}

    