'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { useResolvedTheme } from '@/hooks/use-resolved-theme';

export function NotFoundHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const colorMode = useResolvedTheme();

  return (
    <div className="w-full h-[90vh] flex justify-center items-center">
      <motion.div
        key="overview"
        className="motion max-w-3xl"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ delay: 0.5 }}
      >
        <div className="rounded-xl flex flex-col gap-2 leading-relaxed text-center max-w-xl">
          <p className="flex flex-row justify-center gap-4 items-center">
            <Image
              src={
                colorMode === 'dark'
                  ? '/images/automagik-logo-white.svg'
                  : '/images/automagik-logo.svg'
              }
              alt="logo"
              width={500}
              height={80}
              className="w-[500px] h-[80px] object-cover"
            />
          </p>
          <div className="max-w-xs mx-auto gap-4 flex mt-8 flex-col items-center">
            <p className="text-xl font-bold">{children}</p>
            <Link
              href="/"
              className="w-full text-xl p-2 rounded-lg border border-primary"
            >
              Return Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
