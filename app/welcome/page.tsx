"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useEmblaCarousel from "embla-carousel-react";

const onboardingSteps = [
  {
    title: ["Bem-vindo ao", "Personal Finance App"],
    description:
      "Sua jornada para uma vida financeira mais organizada começa agora.",
    image: "/icon-512x512.png",
  },
  {
    title: ["Tenha Clareza Total do Seu Mês"],
    description:
      "Saiba exatamente quanto você tem de despesas, o que já pagou e o que ainda falta. Tome decisões com confiança.",
    image: "/Onboarding_02_512.png",
  },
  {
    title: ["Revele os Custos Escondidos"],
    description:
      "Descubra quanto dinheiro você está perdendo com juros. Ao registrar o valor previsto e o pago, você vê onde pode economizar.",
    image: "/Onboarding_03_512.png",
  },
  {
    title: ["Agora, Você Está no Controle."],
    description:
      "Todas as ferramentas que você precisa para organizar suas finanças estão prontas para começar.",
    image: "/Onboarding_04_512.png",
  },
];

export default function WelcomePage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, duration: 25 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const { toast } = useToast();
  // @ts-ignore
  const { completeOnboarding } = useAuth();

  const updateCurrentStep = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", updateCurrentStep);
      return () => {
        emblaApi.off("select", updateCurrentStep);
      };
    }
  }, [emblaApi, updateCurrentStep]);

  const handleNext = async () => {
    if (selectedIndex < onboardingSteps.length - 1) {
      emblaApi?.scrollNext();
    } else {
      try {
        await completeOnboarding();
        toast({
          title: "Tudo pronto!",
          description: "Seja bem-vindo ao seu novo dashboard.",
          variant: "success",
        });
        router.push("/");
      } catch (error) {
        // ...error handling
      }
    }
  };

  const isLastStep = selectedIndex === onboardingSteps.length - 1;

  return (
    // Container principal com overflow-hidden para garantir que a curva funcione
    <div className="h-screen w-full relative overflow-hidden bg-primary">
      {/* CAMADA DE FUNDO - APENAS A PARTE BRANCA ESTÁTICA */}
      <div className="absolute bottom-0 h-1/2 w-full bg-background rounded-t-[2.5rem]" />

      {/* CAMADA DO CARROSSEL - OCUPA TUDO E É "ARRÁSTAVEL" */}
      <div className="embla absolute inset-0" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {onboardingSteps.map((step, index) => (
            <div
              className="embla__slide flex-[0_0_100%] flex flex-col h-full"
              key={index}
            >
              {/* Parte Superior (conteúdo verde) */}
              <div className="h-1/2 flex flex-col items-center justify-center p-8 text-center text-primary-foreground">
                <div className="relative mb-6 h-48 w-48">
                  <Image
                    src={step.image}
                    alt={step.title[0]}
                    fill
                    className="object-contain rounded-3xl"
                  />
                </div>
                <h1 className="text-3xl font-bold">
                  {step.title.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </h1>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CAMADA DE CONTROLES (POR CIMA DE TUDO) */}
      <div className="absolute bottom-0 w-full h-1/2 flex flex-col items-center justify-between p-8 text-center pointer-events-none">
        <div className="h-30 w-full flex items-center justify-center">
          <div className="w-full max-w-xs overflow-hidden">
            <div
              className="flex transition-transform duration-200 ease-in-out"
              style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
            >
              {onboardingSteps.map((step, index) => (
                <p
                  key={index}
                  className="flex-[0_0_100%] text-muted-foreground px-2"
                >
                  {step.description}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs pointer-events-auto">
          <div className="flex gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  selectedIndex === index ? "w-6 bg-primary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext} className="w-full">
            {isLastStep ? "Bora Começar!" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
