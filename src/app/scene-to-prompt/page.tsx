
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Sparkles, X, Clipboard, ClipboardCheck } from 'lucide-react';
import { startScenePromptGeneration } from '@/actions/generate-scene-prompt';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type FilePreview = {
  file: File;
  previewUrl: string;
};

export default function SceneToPromptPage() {
  const [sceneImage, setSceneImage] = useState<FilePreview | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const sceneInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSceneImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSceneImage({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setHasCopied(true);
      toast({
        title: 'Copiado!',
        description: 'El prompt ha sido copiado al portapapeles.',
      });
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const resetState = () => {
    setSceneImage(null);
    setGeneratedPrompt(null);
    setIsGenerating(false);
  }

  const handleGenerate = async () => {
    if (!sceneImage) {
      toast({
        variant: 'destructive',
        title: 'Falta la imagen',
        description: 'Por favor, sube una imagen de la escena.',
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedPrompt(null);

    try {
      const sceneDataUri = await fileToDataUri(sceneImage.file);
      
      const result = await startScenePromptGeneration({ sceneDataUri });

      if (result.success && result.data?.generatedPrompt) {
        setGeneratedPrompt(result.data.generatedPrompt);
        toast({
          title: 'Prompt Generado',
          description: 'El prompt de la escena ha sido creado con éxito.',
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
        {/* Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold font-headline mb-1">1. Sube una Imagen de Escena</h3>
          <p className="text-sm text-muted-foreground">Sube una imagen con una persona en una pose y un entorno que quieras replicar.</p>
          <input
            type="file"
            accept="image/*"
            ref={sceneInputRef}
            onChange={handleSceneImageChange}
            className="hidden"
          />
          <div className="aspect-[4/5] w-full">
            {sceneImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={sceneImage.previewUrl}
                  alt="Scene preview"
                  fill
                  className="object-cover rounded-lg"
                />
                <button onClick={(e) => { e.stopPropagation(); setSceneImage(null); }} className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 z-10">
                  <X size={16}/>
                </button>
              </div>
            ) : (
              <button
                onClick={() => sceneInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
                aria-label="Subir escena"
              >
                <Camera className="h-12 w-12 text-muted-foreground" />
                <span className="mt-2 text-sm font-medium">Haz clic para subir una imagen</span>
              </button>
            )}
          </div>
        </div>
            
        {/* Result Section */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold font-headline mb-1">2. Prompt Generado</h3>
                    <p className="text-sm text-muted-foreground">Este es el prompt detallado para recrear la escena.</p>
                </div>
                {generatedPrompt && (
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} aria-label="Copiar prompt">
                        {hasCopied ? <ClipboardCheck className="h-5 w-5 text-green-500" /> : <Clipboard className="h-5 w-5" />}
                    </Button>
                )}
            </div>
            <div className="relative w-full h-full">
              <Textarea 
                value={isGenerating ? "Analizando la imagen y generando el prompt..." : generatedPrompt || "El prompt generado aparecerá aquí."}
                readOnly
                className="min-h-[300px] lg:min-h-[450px] text-sm bg-card font-mono"
              />
              {isGenerating && (
                 <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-md">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
              )}
            </div>
        </div>
      </div>
    
      {/* Action Buttons Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button onClick={handleGenerate} disabled={isGenerating || !sceneImage} size="lg" className="w-full sm:w-auto">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generar Prompt
            </>
          )}
        </Button>
        {sceneImage && (
          <Button onClick={resetState} variant="outline" size="lg" className="w-full sm:w-auto">
            <X className="mr-2 h-5 w-5" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
