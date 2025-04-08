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

  console.log(agent);

  if (agent) {
    return (
      <motion.div
        className="motion max-w-3xl w-full mx-auto md:mt-[20vh]"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ delay: 0.5 }}
      >
        <div className="rounded-xl w-full p-6 flex gap-6">
          <Avatar className="size-36 text-4xl font-bold">
            <AvatarImage
              src={agent.avatarUrl || undefined}
              className="object-cover"
            />
            <AvatarFallback className="bg-transparent">
              <Bot className="size-24" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 gap-3 my-auto min-w-0">
            <h1 className="text-3xl text-start font-bold">
              {agent.name}
            </h1>
            <p className="text-md text-muted-foreground break-words whitespace-pre-wrap">
              {agent.description || 'Hello there!'}
            </p>
          </div>
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
