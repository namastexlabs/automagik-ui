import { motion } from 'framer-motion';
import Image from 'next/image';

export const Overview = () => {
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
            src="/images/automagik_logo.png"
            alt="logo"
            width={600}
            height={200}
          />
        </p>
        <p>Because magic shouldn&apos;t be complicated.</p>
      </div>
    </motion.div>
  );
};
