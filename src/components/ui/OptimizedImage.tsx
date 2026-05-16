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

    // Only hide if NOT priority to allow seamless swapping
    if (!priority) {
      setIsLoaded(false);
    }
    setError(false);
  }, [src, safeSrc, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(false);
  };

  // Determine if we should show the loading state
  // We prioritize speed/immediate appearance over smooth fading for the "native" feel the user wants
  const showLoader = !isLoaded && !error && safeSrc && !priority;

  return (
    <div className={`relative overflow-hidden bg-bento-card-bg/20 ${containerClassName}`}>
      {safeSrc && (
        <motion.img
          {...props}
          ref={imgRef}
          src={safeSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          initial={priority ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: (isLoaded || priority) ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          className={`${className} relative z-0`}
          style={{ ...props.style, display: error && !priority ? 'none' : 'block' }}
        />
      )}

      {error && !priority && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-900/20 p-4 text-center z-10">
          <Coffee className="w-5 h-5 text-stone-700/20 mb-1" />
        </div>
      )}

      {/* Decorative inner shadow for "sinking in" effect - only show if requested */}
      {showOverlay && (
        <div className={`absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 ${overlayClassName}`} />
      )}
    </div>
  );
}
