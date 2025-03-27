import Link from 'next/link';
import Image from 'next/image';
import { Clock, Lock, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  return (
    <div className="font-nunito min-h-screen text-white bg-accent">
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
                width={800}
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
            <h2 className="leading-none text-3xl !mt-4 sm:text-[2.5rem] px-4 md:p-0 mx-auto max-lg:!mb-0 lg:!mt-0 lg:mx-0 lg:text-left lg:text-[2.5rem] xl:text-5xl">
              <p className="text-gradient font-extralight">
                Effortless productivity.
              </p>
              <p className="text-gradient font-extralight">Elevated results.</p>
            </h2>
            <Image
              src="/images/hero-section-image.png"
              alt="Namastex statue"
              width={500}
              height={500}
              className="z-10 object-contain object-top aspect-square mx-auto !my-0 lg:hidden"
            />
            <div className="!mb-12 !mt-2 lg:order-1 text-center lg:text-left lg:!mb-0 lg:!mt-auto px-4 lg:p-0">
              <div className="flex flex-col lg:flex-row lg:gap-2 font-bold text-lg xl:text-xl">
                <p>Unleash your potential.</p>
                <p>Redefine your limits.</p>
              </div>
              <div>
                <Button
                  asChild
                  className="bg-gradient rounded-full h-12 w-full max-w-[400px] lg:w-auto lg:px-12 lg:ml-1 mt-4 text-lg font-bold"
                >
                  <Link href="/#waitlist">JOIN THE REVOLUTION</Link>
                </Button>
              </div>
            </div>
            <p className="px-4 md:p-0 mx-auto max-lg:max-w-[480px]">
              Automagik is the next step in the evolution of human productivity.
            </p>
            <p className="px-4 md:p-0 mx-auto max-lg:max-w-[480px]">
              Born from Namastex Labs expertise that created multiple multimodal
              AI on WhatsApp, transforming financial decisions, and global
              impact collaborations with Nature and NASA, Automagik represents
              the ultimate democratization of advanced AI power.
            </p>
            <p className="px-4 md:p-0 mx-auto max-lg:max-w-[480px]">
              Forget technical barriers. Forget complex code. Forget time wasted
              on repetitive tasks. Automagik is the silent revolution that puts
              the power of creating autonomous intelligent agents in
              anyone&apos;s hands. Your agents work tirelessly 24/7/365,
              learning, analyzing, and executing while you focus on what truly
              matters.
            </p>
          </div>
        </div>
      </section>

      <div className="space-background">
        <section className="mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:w-fit lg:gap-24 lg:mx-auto gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="bg-accent-magenta rounded-full p-6 w-fit">
                <Clock className="size-10 text-white" />
              </div>
              <div className="md:max-lg:min-h-[120px] flex mt-6 mb-2">
                <div>
                  <p className="text-gradient font-bold text-2xl xl:text-3xl">
                    Reclaim your time
                  </p>
                  <p className="text-gradient font-bold text-2xl xl:text-3xl">
                    from repetitive tasks
                  </p>
                </div>
              </div>
              <div className="pt-4 max-w-[360px]">
                <p className="text-lg">
                  The tool that automates AI&apos;s amplified autonomy.
                  It&apos;s the perfect fusion between human intuition and
                  machine precision.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-accent-magenta rounded-full p-6 w-fit">
                <Lock className="size-10 text-white" />
              </div>
              <div className="md:max-lg:min-h-[120px] flex mt-6 mb-2">
                <div>
                  <p className="text-gradient font-bold text-2xl xl:text-3xl">
                    Secure by design
                  </p>
                  <p className="text-gradient font-bold text-2xl xl:text-3xl">
                    privacy first approach
                  </p>
                </div>
              </div>
              <div className="pt-4 max-w-[360px]">
                <p className="text-lg">
                  Brief description of productivity challenges in today&apos;s
                  high-performance world.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-accent-magenta rounded-full p-6 w-fit">
                <LineChart className="size-10 text-white" />
              </div>
              <div className="md:max-lg:min-h-[120px] flex mt-6 mb-2">
                <div>
                  <p className="text-gradient font-bold text-2xl xl:text-3xl">
                    Data-driven
                  </p>
                  <p className="text-gradient font-bold text-2xl xl:text-3xl">
                    decision making
                  </p>
                </div>
              </div>
              <div className="pt-4 max-w-[360px]">
                <p className="text-lg">
                  Brief description of productivity challenges in today&apos;s
                  high-performance world.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="flex flex-col justify-center bg-accent-cyan lg:min-h-screen py-12 px-4">
          <div className="max-w-4xl font-extralight text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] mx-auto flex flex-col">
            <h2 className="text-gradient-2 w-fit mb-8 lg:mb-24 lg:mx-0">
              Your data, your rules
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
              <h2 className="text-6xl font-extralight mb-6">
                <span className="text-gradient">Join the waitlist</span>
              </h2>
              <p className="mb-10 text-xl font-bold">
                Automagik is only available for invited guests, joining the
                waitlist we&apos;ll make sure to send you an invite!
              </p>
              <form className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Your name"
                    className="w-full border border-dark-gray rounded-full p-6 md:text-xl text-white"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your best e-mail"
                    className="w-full border border-dark-gray rounded-full p-6 md:text-xl text-white"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="bg-gradient rounded-full h-12 px-12 mt-4 text-lg font-bold w-full"
                  >
                    JOIN THE WAITLIST
                  </button>
                </div>
              </form>
            </div>
          </section>
          <footer className="container mx-auto px-4 py-6 text-center text-white text-sm">
            <p>
              Namastex Labs Serviços Em Tecnologia Ltda - CNPJ
              48.158.454/0001-82
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
