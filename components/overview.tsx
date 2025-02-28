'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Image from 'next/image';

export const Overview = () => {
  const theme = useTheme();

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-2 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <Image
            src={
              theme.resolvedTheme === 'dark'
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
