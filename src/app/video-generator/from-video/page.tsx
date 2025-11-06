"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Video as VideoIcon, Loader2, PartyPopper, Sparkles, X } from 'lucide-react';
import { startVideoGeneration } from '@/actions/generate-video';

type FilePreview = {
  file: File;
  previewUrl: string;
};

export default function VideoGeneratorFromVideoPage() {
  const [modelImage, setModelImage] = useState<FilePreview | null>(null);
  const [inputVideo, setInputVideo] = useState<FilePreview | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const modelImageInputRef = useRef<HTMLInputElement>(null);
  const inputVideoInputRef = useRef<HTMLInputElement>(null);
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FilePreview | null>>,
    fileType: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
       if (!file.type.startsWith(fileType)) {
        toast({
          variant: 'destructive',
          title: 'Tipo de archivo incorrecto',
          description: `Por favor, selecciona un archivo de ${fileType}.`,
        });
        return;
      }
      setter({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleGenerate = async () => {
    if (!modelImage) {
      toast({
        variant: 'destructive',
        title: 'Falta la imagen del modelo',
        description: 'Por favor, sube una imagen del modelo.',
      });
      return;
    }
    if (!inputVideo) {
      toast({
        variant: 'destructive',
        title: 'Falta el video de entrada',
        description: 'Por favor, sube un video de entrada.',
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedVideo(null);

    try {
      const avatarImageDataUri = await fileToDataUri(modelImage.file);
      const motionVideoDataUri = await fileToDataUri(inputVideo.file);
      
      const result = await startVideoGeneration({ avatarImageDataUri, motionVideoDataUri });

      if (result.success && result.data) {
        setGeneratedVideo(result.data.generatedVideoDataUri);
        toast({
          title: 'Video Generado',
          description: 'Tu video ha sido creado con éxito.',
        });
      } else {
        throw new Error(result.error || 'Ocurrió un error desconocido durante la generación.');
      }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error de Generación",
            description: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const resetState = () => {
    setModelImage(null);
    setInputVideo(null);
    setGeneratedVideo(null);
    setIsGenerating(false);
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Model Upload Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold font-headline mb-1">1. Sube el Modelo</h3>
            <p className="text-sm text-muted-foreground mb-4">Añade una foto del modelo a animar.</p>
            <input
              type="file"
              accept="image/*"
              ref={modelImageInputRef}
              onChange={(e) => handleFileChange(e, setModelImage, 'image')}
              className="hidden"
            />
            <div className="aspect-[4/5] w-full">
              {modelImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={modelImage.previewUrl}
                    alt="Model preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <button onClick={(e) => { e.stopPropagation(); setModelImage(null); }} className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 z-10">
                    <X size={16}/>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => modelImageInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
                  aria-label="Subir imagen del modelo"
                >
                  <User className="h-12 w-12 text-muted-foreground" />
                  <span className="mt-2 text-sm font-medium">Haz clic para subir</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Upload Section */}
        <div className="space-y-6">
          <div>
              <h3 className="text-lg font-semibold font-headline mb-1">2. Sube el Video de Movimiento</h3>
              <p className="text-sm text-muted-foreground mb-4">Añade el video con el desfile o las poses.</p>
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                ref={inputVideoInputRef}
                onChange={(e) => handleFileChange(e, setInputVideo, 'video')}
                className="hidden"
              />
               <div className="aspect-[4/5] w-full">
                {inputVideo ? (
                  <div className="relative w-full h-full">
                      <video
                          src={inputVideo.previewUrl}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="object-cover w-full h-full rounded-lg"
                      />
                      <button onClick={(e) => { e.stopPropagation(); setInputVideo(null); }} className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 z-10">
                          <X size={16}/>
                      </button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputVideoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
                    aria-label="Subir video de movimiento"
                  >
                    <VideoIcon className="h-12 w-12 text-muted-foreground" />
                    <span className="mt-2 text-sm font-medium">Haz clic para subir</span>
                  </button>
                )}
            </div>
            </div>
        </div>
      </div>
      
      {/* Action and Result Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleGenerate} disabled={isGenerating || !modelImage || !inputVideo} size="lg" className="w-full sm:w-auto">
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
            {(modelImage || inputVideo) && (
              <Button onClick={resetState} variant="outline" size="lg" className="w-full sm:w-auto">
                <X className="mr-2 h-5 w-5" />
                Limpiar
              </Button>
            )}
        </div>

        <div className="relative w-full aspect-[9/16] max-w-md mx-auto border rounded-lg bg-card flex items-center justify-center overflow-hidden">
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 w-full">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="font-medium">Generando video...</p>
                    <p className="text-sm text-center text-muted-foreground max-w-xs">Este proceso puede tardar varios minutos. Por favor, no cierres esta ventana.</p>
                </div>
            ) : generatedVideo ? (
                <video
                    src={generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="object-contain w-full h-full"
                />
            ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                <PartyPopper className="h-16 w-16 mb-4" />
                <h3 className="font-headline text-xl font-semibold">3. El resultado aparecerá aquí</h3>
                <p className="mt-1 text-sm max-w-sm">Sube tus archivos y haz clic en "Generar Ahora" para crear el video.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
