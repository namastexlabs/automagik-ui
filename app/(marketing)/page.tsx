import Link from 'next/link';
import Image from 'next/image';
import { Clock, Lock, LineChart } from 'lucide-react';
import {
  FeatureBody,
  FeatureContainer,
  FeatureHeader,
  FeatureIconWrapper,
  FeatureTitle,
  GradientButton,
  GradientText,
  HeroParagraph,
  WaitlistForm,
} from '@/components/marketing';

export default function Home() {
  return (
    <div className="font-nunito min-h-screen text-foreground bg-accent">
      <section className="lg:min-h-screen mx-auto py-10 max-w-[1440px] flex flex-col justify-center">
        <div className="flex flex-col md:flex-row justify-center">
          <div className="w-full hidden lg:flex justify-center mb-10 md:mb-0">
            <div className="relative flex-col items-center justify-center size-full flex">
              <Image
                src="/images/automagik-logo-white.svg"
                alt="Namastex statue"
                width={352}
                height={80}
                className="aspect-[16/3] w-[302px] xl:w-[352px] object-cover absolute z-20 top-0"
              />
              <Image
                src="/images/hero-section-image.png"
                alt="Automagik AI"
                width={850}
                height={850}
                className="z-10 absolute top-0 size-full object-contain object-top"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-6 lg:pr-10 md:text-lg lg:text-base xl:text-lg md:text-left lg:max-w-[484px] xl:max-w-[650px] lg:h-[80vh]">
            <Image
              src="/images/automagik-logo-white.svg"
              alt="Automagik AI"
              width={250}
              height={20}
              className="aspect-[16/3] w-[250px] sm:w-[302px] object-cover z-20 mx-auto lg:hidden"
            />
            <h2 className="leading-none text-3xl !mt-4 sm:text-[2.5rem] px-4 md:p-0 mx-auto max-lg:!mb-0 lg:!mt-0 lg:mx-0 lg:text-left lg:text-[2.5rem] xl:text-[3.35rem]">
              <p className="font-extralight">
                <GradientText>Effortless productivity.</GradientText>
              </p>
              <p className="font-extralight">
                <GradientText>Elevated results.</GradientText>
              </p>
            </h2>
            <Image
              src="/images/hero-section-image.png"
              alt="Namastex statue"
              width={500}
              height={500}
              className="z-10 object-contain object-top aspect-square mx-auto !my-0 lg:hidden"
            />
            <div className="!mb-12 !mt-2 lg:order-1 text-center lg:text-left lg:!mb-0 lg:!mt-auto px-8 lg:p-0">
              <div className="flex flex-col lg:flex-row lg:gap-2 font-bold text-2xl xl:text-[1.4rem]">
                <p>Unleash your potential.</p>
                <p>Redefine your limits.</p>
              </div>
              <div>
                <GradientButton
                  asChild
                  className="w-full max-w-[400px] lg:w-auto lg:px-12 mt-4"
                >
                  <Link href="/#waitlist">JOIN THE REVOLUTION</Link>
                </GradientButton>
              </div>
            </div>
            <HeroParagraph>
              Automagik is the next step in the evolution of human productivity.
            </HeroParagraph>
            <HeroParagraph>
              Born from Namastex Labs expertise that created multiple multimodal
              AI on WhatsApp, transforming financial decisions, and global
              impact collaborations with Nature and NASA, Automagik represents
              the ultimate democratization of advanced AI power.
            </HeroParagraph>
            <HeroParagraph>
              Forget technical barriers. Forget complex code. Forget time wasted
              on repetitive tasks. Automagik is the silent revolution that puts
              the power of creating autonomous intelligent agents in
              anyone&apos;s hands. Your agents work tirelessly 24/7/365,
              learning, analyzing, and executing while you focus on what truly
              matters.
            </HeroParagraph>
          </div>
        </div>
      </section>
      <div className="space-background">
        <section className="mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:w-fit lg:gap-24 lg:mx-auto gap-10">
            <FeatureContainer>
              <FeatureIconWrapper>
                <Clock className="size-10 text-white" />
              </FeatureIconWrapper>
              <FeatureHeader>
                <FeatureTitle>Reclaim your time</FeatureTitle>
                <FeatureTitle>from repetitive tasks</FeatureTitle>
              </FeatureHeader>
              <FeatureBody>
                The tool that automates AI&apos;s amplified autonomy. It&apos;s
                the perfect fusion between human intuition and machine
                precision.
              </FeatureBody>
            </FeatureContainer>
            <FeatureContainer>
              <FeatureIconWrapper>
                <Lock className="size-10 text-white" />
              </FeatureIconWrapper>
              <FeatureHeader>
                <FeatureTitle>Secure by design</FeatureTitle>
                <FeatureTitle>privacy first approach</FeatureTitle>
              </FeatureHeader>
              <FeatureBody>
                Brief description of productivity challenges in today&apos;s
                high-performance world.
              </FeatureBody>
            </FeatureContainer>
            <FeatureContainer>
              <FeatureIconWrapper>
                <LineChart className="size-10 text-white" />
              </FeatureIconWrapper>
              <FeatureHeader>
                <FeatureTitle>Data-driven</FeatureTitle>
                <FeatureTitle>decision making</FeatureTitle>
              </FeatureHeader>
              <FeatureBody>
                Brief description of productivity challenges in today&apos;s
                high-performance world.
              </FeatureBody>
            </FeatureContainer>
          </div>
        </section>
        <section className="flex flex-col justify-center bg-accent-cyan lg:min-h-screen py-12 px-4">
          <div className="max-w-5xl font-extralight text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[5rem] mx-auto flex flex-col">
            <h2 className="w-fit mb-8 lg:mb-24 lg:mx-0">
              <GradientText variant="2">Your data, your rules</GradientText>
            </h2>
            <div className="text-gradient-2 flex flex-col mb-8 lg:mb-24">
              <p>Automagik is open-source,</p>
              <p>but your data remains yours.</p>
            </div>
            <p className="text-gradient-2 w-fit">Be in full control.</p>
            <p className="text-gradient-2 w-fit">Just as it should be</p>
          </div>
        </section>
        <div id="waitlist" className="flex flex-col min-h-screen">
          <section className="container mx-auto px-4 py-20 flex flex-col justify-center flex-1">
            <div className="max-w-lg mx-auto text-center">
              <h2 className="text-7xl font-extralight mb-6">
                <GradientText>Join the waitlist</GradientText>
              </h2>
              <p className="mb-10 text-xl font-bold">
                Automagik is only available for invited guests, joining the
                waitlist we&apos;ll make sure to send you an invite!
              </p>
              <WaitlistForm />
            </div>
          </section>
          <footer className="container mx-auto px-4 py-6 text-center text-foreground text-sm">
            <p>
              Namastex Labs Serviços Em Tecnologia Ltda - CNPJ
              46.156.854/0001-62
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
