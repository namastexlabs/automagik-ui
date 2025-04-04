'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Bot } from 'lucide-react';

import { useResolvedTheme } from '@/hooks/use-resolved-theme';
import { useCurrentAgent } from '@/hooks/use-current-agent';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export const Overview = () => {
  const colorMode = useResolvedTheme();
  const { agent } = useCurrentAgent();

  if (agent) {
    return (
      <motion.div
        className="motion max-w-3xl mx-auto md:mt-20"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ delay: 0.5 }}
      >
        <div className="rounded-xl p-6 flex items-center gap-6">
          <Avatar className="size-[100px] text-4xl font-bold">
            <AvatarImage
              src={agent.avatarUrl || undefined}
              className="object-cover"
            />
            <AvatarFallback className="bg-transparent">
              <Bot className="size-16" />
            </AvatarFallback>
          </Avatar>
          <h1 className="text-4xl font-bold">Hello there!</h1>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="motion max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <Image
            src={
              colorMode === 'dark'
                ? '/images/automagik-logo-white.svg'
                : '/images/automagik-logo.svg'
            }
            alt="logo"
            width={600}
            height={100}
            className="w-[600px] h-[100px] object-cover mb-5"
          />
        </p>
        <p>Because magic shouldn&apos;t be complicated.</p>
      </div>
    </motion.div>
  );
};
