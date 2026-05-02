import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  priority?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  showOverlay?: boolean;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className, 
  containerClassName = '', 
  fallbackSrc = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800',
  priority = false,
  showOverlay = true,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  useEffect(() => {
    if (!src) return;

    if (priority) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setError(true);
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(false);
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <AnimatePresence mode="wait">
        {!isLoaded && !error && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-900/50"
          >
            <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-900/40 p-4 text-center"
          >
            <ImageOff className="w-8 h-8 text-stone-300 mb-2" />
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Image Failed</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        {...props}
        src={error ? fallbackSrc : src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ 
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 1.05
        }}
        transition={{ 
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1]
        }}
        className={`${className} ${isLoaded ? 'visible' : 'invisible md:visible'}`}
      />

      {/* Decorative inner shadow for "sinking in" effect - only show if requested */}
      {showOverlay && (
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 bg-gradient-to-tr from-stone-950/10 via-transparent to-white/5" />
      )}
    </div>
  );
}
