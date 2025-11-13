"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Image as ImageIcon, Loader2, PartyPopper, Sparkles, X } from 'lucide-react';
import { startVideoFromFramesGeneration } from '@/actions/generate-video-from-frames';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';


const defaultPrompt = 'Animate the person from the avatar image. The animation should start with the pose from the first frame image and end with the pose from the last frame image. The final video should feature the person from the avatar image, not the people from the frame images.';

type FilePreview = {
  file: File;
  previewUrl: string;
};

export default function VideoGeneratorFromFramesPage() {
  const [modelImage, setModelImage] = useState<FilePreview | null>(null);
  const [firstFrame, setFirstFrame] = useState<FilePreview | null>(null);
  const [lastFrame, setLastFrame] = useState<FilePreview | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string>(defaultPrompt);
  const { toast } = useToast();

  const modelImageInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  
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
    setter: React.Dispatch<React.SetStateAction<FilePreview | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image')) {
        toast({
          variant: 'destructive',
          title: 'Tipo de archivo incorrecto',
          description: 'Por favor, selecciona un archivo de imagen.',
        });
        return;
      }
      setter({ file, previewUrl: URL.createObjectURL(file) });
    }
  };
  
  const resetState = () => {
    setModelImage(null);
    setFirstFrame(null);
    setLastFrame(null);
    setGeneratedVideo(null);
    setIsGenerating(false);
    setPrompt(defaultPrompt);
  }

  const handleGenerate = async () => {
    if (!modelImage || !firstFrame || !lastFrame) {
      toast({
        variant: 'destructive',
        title: 'Faltan imágenes',
        description: 'Por favor, sube el modelo, el fotograma inicial y el fotograma final.',
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedVideo(null);

    try {
      const [avatarImageDataUri, firstFrameDataUri, lastFrameDataUri] = await Promise.all([
        fileToDataUri(modelImage.file),
        fileToDataUri(firstFrame.file),
        fileToDataUri(lastFrame.file),
      ]);
      
      const result = await startVideoFromFramesGeneration({ avatarImageDataUri, firstFrameDataUri, lastFrameDataUri, prompt });

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

  const UploadBox = ({ title, file, onButtonClick, onClearClick, inputRef, 'aria-label': ariaLabel, Icon }: { title: string, file: FilePreview | null, onButtonClick: () => void, onClearClick: (e: React.MouseEvent) => void, inputRef: React.RefObject<HTMLInputElement>, 'aria-label': string, Icon: React.ElementType }) => (
    <div className="space-y-2">
      <h3 className="text-md font-semibold font-headline text-center">{title}</h3>
      <div className="aspect-[4/5] w-full">
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          onChange={(e) => handleFileChange(e, (setter) => {
              const file = (e.target.files as FileList)[0];
              if (file) {
                  const newFilePreview = { file, previewUrl: URL.createObjectURL(file) };
                  if (title === 'Modelo') setModelImage(newFilePreview);
                  else if (title === 'Fotograma Inicial') setFirstFrame(newFilePreview);
                  else setLastFrame(newFilePreview);
              }
          })}
          className="hidden"
        />
        {file ? (
          <div className="relative w-full h-full">
            <Image src={file.previewUrl} alt={`${title} preview`} fill className="object-cover rounded-lg" />
            <button onClick={onClearClick} className="absolute top-2 right-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full p-1.5 z-10">
              <X size={16}/>
            </button>
          </div>
        ) : (
          <button
            onClick={onButtonClick}
            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg hover:bg-muted transition-colors"
            aria-label={ariaLabel}
          >
            <Icon className="h-12 w-12 text-muted-foreground" />
            <span className="mt-2 text-sm font-medium">Haz clic para subir</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <UploadBox 
          title="Modelo" 
          file={modelImage} 
          onButtonClick={() => modelImageInputRef.current?.click()}
          onClearClick={(e) => { e.stopPropagation(); setModelImage(null); }}
          inputRef={modelImageInputRef}
          aria-label="Subir imagen del modelo"
          Icon={User}
        />
        <UploadBox 
          title="Fotograma Inicial" 
          file={firstFrame}
          onButtonClick={() => firstFrameInputRef.current?.click()}
          onClearClick={(e) => { e.stopPropagation(); setFirstFrame(null); }}
          inputRef={firstFrameInputRef}
          aria-label="Subir fotograma inicial"
          Icon={ImageIcon}
        />
        <UploadBox 
          title="Fotograma Final" 
          file={lastFrame}
          onButtonClick={() => lastFrameInputRef.current?.click()}
          onClearClick={(e) => { e.stopPropagation(); setLastFrame(null); }}
          inputRef={lastFrameInputRef}
          aria-label="Subir fotograma final"
          Icon={ImageIcon}
        />
      </div>
      
      <div className="space-y-4">
         <div className="max-w-md mx-auto w-full space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                     <span>Editar Prompt</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[150px] text-xs font-mono bg-card"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleGenerate} disabled={isGenerating || !modelImage || !firstFrame || !lastFrame} size="lg" className="w-full sm:w-auto">
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
            {(modelImage || firstFrame || lastFrame) && (
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
                <h3 className="font-headline text-xl font-semibold">El resultado aparecerá aquí</h3>
                <p className="mt-1 text-sm max-w-sm">Sube tus tres imágenes y haz clic en "Generar Ahora" para crear el video.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}
