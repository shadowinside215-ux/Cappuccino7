import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'motion/react';
import { Loader2, Coffee } from 'lucide-react';

interface OptimizedImageProps extends HTMLMotionProps<"img"> {
  containerClassName?: string;
  fallbackSrc?: string;
  priority?: boolean;
  showOverlay?: boolean;
  overlayClassName?: string;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className, 
  containerClassName = '', 
  fallbackSrc,
  priority = false,
  showOverlay = true,
  overlayClassName = 'bg-gradient-to-tr from-stone-950/10 via-transparent to-white/5',
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const imgRef = React.useRef<HTMLImageElement>(null);

  // Robustly handle empty strings to prevent React warnings and unnecessary network requests
  const safeSrc = (src === "" || src === undefined || src === null) ? (fallbackSrc || null) : src;

  // Reset state when src changes
  useEffect(() => {
    if (!safeSrc) {
      setIsLoaded(false);
      setError(false);
      return;
    }
    
    // Check if already complete (from cache)
    if (imgRef.current?.complete) {
      setIsLoaded(true);
      setError(false);
      return;
    }

    setIsLoaded(false);
    setError(false);
  }, [src, safeSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(false);
  };

  // Determine if we should show the loading state
  // If we have priority, we might want to hide the loader if it's already cached
  const showLoader = !isLoaded && !error && safeSrc;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-900/50 z-20"
          >
            <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
          </motion.div>
        )}

        {(error || !safeSrc) && !showLoader && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-900/40 p-4 text-center z-10"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <Coffee className="w-5 h-5 text-stone-700 dark:text-stone-700" />
            </div>
            <p className="text-[8px] font-black text-stone-700 dark:text-stone-800 uppercase tracking-[0.2em] italic">
              CAPPUCCINO 7
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {safeSrc && (
        <motion.img
          {...props}
          ref={imgRef}
          src={safeSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          initial={priority ? { opacity: 1 } : { opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isLoaded ? 1 : (priority ? 1 : 0),
            scale: isLoaded ? 1 : (priority ? 1 : 1.05)
          }}
          transition={{ 
            duration: 0.4,
            ease: "easeOut"
          }}
          className={`${className} relative z-0`}
        />
      )}

      {/* Decorative inner shadow for "sinking in" effect - only show if requested */}
      {showOverlay && (
        <div className={`absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 ${overlayClassName}`} />
      )}
    </div>
  );
}
