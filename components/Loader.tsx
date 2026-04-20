'use client';

import { motion } from 'framer-motion';

export default function Loader({ fullScreen = false }: { fullScreen?: boolean }) {
  const letters = 'Cordneed'.split('');

  const containerV = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2, repeat: Infinity, repeatDelay: 1.5 },
    },
  };

  const letterV = {
    hidden: { y: 20, opacity: 0, filter: 'blur(8px)' },
    visible: { 
      y: 0, 
      opacity: 1, 
      filter: 'blur(0px)',
      transition: { type: 'spring', bounce: 0.5, duration: 0.8 } 
    },
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center">
      {/* Animated Rings/Glow */}
      <div className="relative flex items-center justify-center w-24 h-24 mb-8">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-[3px] border-indigo-500/30 border-r-indigo-500 w-full h-full"
        />
        {/* Inner Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-[3px] border-teal-400/20 border-l-teal-400 w-[calc(100%-16px)] h-[calc(100%-16px)]"
        />
        {/* Deep Glow Pulse */}
        <motion.div
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-indigo-500 blur-xl"
        />
        {/* Center Logo Icon */}
        <img src="/logo.png" alt="Cordneed Icon" className="w-10 h-10 rounded-xl relative z-10 shadow-lg object-cover border border-white/10" />
      </div>

      {/* Word Animation */}
      <motion.div 
        variants={containerV} 
        initial="hidden" 
        animate="visible" 
        className="flex space-x-[2px]"
      >
        {letters.map((letter, i) => (
          <motion.span
            key={i}
            variants={letterV}
            className="text-4xl font-extrabold font-[family-name:var(--font-space-grotesk)] inline-block tracking-tight"
            style={{ 
              background: 'linear-gradient(135deg, #a5b4fc, #5eead4, #818cf8)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }}
        className="text-slate-500 text-sm mt-4 tracking-widest font-medium"
      >
        LOADING
      </motion.p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060d1a]/95 backdrop-blur-xl">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-[400px] items-center justify-center">
      {loaderContent}
    </div>
  );
}
