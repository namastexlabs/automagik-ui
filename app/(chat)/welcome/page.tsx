'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { LoaderIcon } from 'lucide-react';

export default function WelcomePage() {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadingPhrases = [
    'BREWING MAGICAL ALGORITHMS',
    'SUMMONING DIGITAL ALCHEMISTS',
    'UNTANGLING NEURAL NETWORKS',
    'CONVINCING AGENTS TO BE NICE',
    'SALTING EXTRA MAGIC POWDER',
  ];

  useEffect(() => {
    const duration = 20000;
    const updateInterval = duration / loadingPhrases.length;
    let currentStep = 0;

    intervalRef.current = setInterval(() => {
      currentStep++;
      setCurrentPhrase((prev) => prev + 1);
      if (currentStep >= loadingPhrases.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadingPhrases.length]);

  return (
    <div className="flex min-h-screen bg-accent bg-gradient-to-tl from-accent from-40% to-white/15">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gradient w-fit">Namastê,</h1>
            <p className="text-foreground mt-2">
              We have a special message for you before you get started!
            </p>
          </div>
          <div className="relative p-[2px] rounded-lg bg-gradient-to-r from-accent-magenta to-accent-cyan">
            <div className="relative bg-background rounded-lg aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
                  title="Welcome to Namastex"
                  frameBorder="0"
                  allow="autoplay"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="size-full p-1"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 relative">
            <AnimatePresence mode="wait">
              {currentPhrase >= loadingPhrases.length ? (
                <motion.div
                  key="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="motion flex justify-center mt-4"
                >
                  <Button
                    asChild
                    variant="gradient"
                    size="pill"
                    className="font-medium text-lg w-full px-10 py-6"
                  >
                    <Link href="/">LET&apos;S GET STARTED</Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="motion w-full"
                >
                  <div className="w-full h-12 border border-light-gray rounded-full flex items-center justify-center overflow-hidden">
                    <div className="relative flex items-center z-10">
                      <span className="animate-spin">
                        <LoaderIcon />
                      </span>
                      <div className="h-6 flex w-[17rem]">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={currentPhrase}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="motion text-foreground font-medium block ml-auto"
                          >
                            {loadingPhrases[currentPhrase]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
