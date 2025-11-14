
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { startAvatarPosesGeneration } from '@/actions/generate-avatar-poses';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const defaultPrompts = [
  'Full-body shot of a model in a casual, confident pose, facing the camera directly. Neutral studio background. Photorealistic.',
  'Full-body shot of a model in a casual pose, turned three-quarters to the left (diagonal view). Neutral studio background. Photorealistic.',
  'Full-body shot of a model in a casual pose, in full profile facing left. Neutral studio background. Photorealistic.',
];

type FilePreview = {
  file: File;
  previewUrl: string;
};

export default function AvatarPosesPage() {
  const [avatar, setAvatar] = useState<FilePreview | null>(null);
  const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([null, null, null]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<string[]>(defaultPrompts);
  const { toast } = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handlePromptChange = (index: number, value: string) => {
    setPrompts(prev => {
        const newPrompts = [...prev];
        newPrompts[index] = value;
        return newPrompts;
    });
  };
  
  const resetState = () => {
    setAvatar(null);
    setGeneratedImages([null, null, null]);
    setIsGenerating(false);
    setPrompts(defaultPrompts);
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
    
    setIsGenerating(true);
    setGeneratedImages([null, null, null]);

    try {
      const avatarDataUri = await fileToDataUri(avatar.file);
      const posesInput = prompts.map(prompt => ({ prompt }));
      
      const result = await startAvatarPosesGeneration({ avatarDataUri, poses: posesInput });

      if (result.success && result.data?.generatedPoses) {
        const imageUrls = result.data.generatedPoses.map(p => p.generatedImageDataUri);
        setGeneratedImages([
            imageUrls[0] || null,
            imageUrls[1] || null,
            imageUrls[2] || null
        ]);
        toast({
          title: 'Poses Generadas',
          description: 'Las nuevas poses de tu avatar han sido creadas.',
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

  const PoseResult = ({ image, isLoading, index }: { image: string | null, isLoading: boolean, index: number }) => (
    <div className="flex flex-col gap-2 shrink-0">
        <p className="text-sm font-semibold text-left text-foreground">{`Pose ${index + 1}`}</p>
        <div className="relative w-80 aspect-[4/5] border rounded-lg bg-card grid place-items-center overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 text-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="font-medium text-sm">Generando...</p>
                </div>
            ) : image ? (
                <Image
                    src={image}
                    alt={`Generated pose ${index + 1}`}
                    fill
                    className="object-contain"
                />
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm font-medium">El resultado aparecerá aquí</p>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col p-4 sm:p-6 md:p-8 space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left: Avatar Upload */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline mb-1">1. Sube tu Avatar</h3>
                <p className="text-sm text-muted-foreground">Añade la imagen base del avatar para generar las poses.</p>
                <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                />
                <div className="aspect-[4/5] w-full">
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
            
            {/* Right: Prompts */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold font-headline mb-1">2. Personaliza los Prompts</h3>
                <p className="text-sm text-muted-foreground">Edita las instrucciones para cada una de las tres poses.</p>
                <div className="flex flex-col gap-4">
                    {prompts.map((prompt, index) => (
                        <div key={index} className="space-y-2">
                            <Label htmlFor={`prompt-${index}`} className="font-semibold">{`Prompt de Pose ${index + 1}`}</Label>
                            <Textarea 
                                id={`prompt-${index}`}
                                value={prompt}
                                onChange={(e) => handlePromptChange(index, e.target.value)}
                                className="min-h-[100px] text-xs font-mono bg-card"
                                disabled={isGenerating}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    
        {/* Action Buttons Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button onClick={handleGenerate} disabled={isGenerating || !avatar} size="lg" className="w-full sm:w-auto">
                {isGenerating ? (
                    <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generando Poses...
                    </>
                ) : (
                    <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generar Poses
                    </>
                )}
                </Button>
                {avatar && (
                <Button onClick={resetState} variant="outline" size="lg" className="w-full sm:w-auto">
                    <X className="mr-2 h-5 w-5" />
                    Limpiar
                </Button>
                )}
            </div>

        {/* Bottom: Results Section */}
       <div className="flex flex-col">
            <h3 className="text-lg font-semibold font-headline mb-1 text-center">3. Poses Generadas</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">Los resultados aparecerán aquí. Desliza si es necesario.</p>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <div className="flex w-max space-x-6 p-4">
                   {generatedImages.map((image, index) => (
                        <PoseResult 
                            key={index}
                            index={index}
                            image={image}
                            isLoading={isGenerating}
                        />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    </div>
  );
}
