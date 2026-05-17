import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'motion/react';
import { Loader2, Coffee } from 'lucide-react';
import { getOptimizedImageUrl, getBlurPlaceholder, ImageSize } from '../../lib/cloudinary';

interface OptimizedImageProps extends HTMLMotionProps<"img"> {
  containerClassName?: string;
  fallbackSrc?: string;
  priority?: boolean;
  showOverlay?: boolean;
  overlayClassName?: string;
  size?: ImageSize;
  blurPlaceholder?: boolean;
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
  size = 'medium',
  blurPlaceholder = true,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [blurredLoaded, setBlurredLoaded] = useState(false);

  const imgRef = React.useRef<HTMLImageElement>(null);

  // Optimized source URL
  const optimizedSrc = getOptimizedImageUrl(src, size);
  const blurSrc = blurPlaceholder ? getBlurPlaceholder(src) : '';

  // Robustly handle empty strings to prevent React warnings and unnecessary network requests
  const safeSrc = (optimizedSrc === "" || optimizedSrc === undefined || optimizedSrc === null) ? (fallbackSrc || null) : optimizedSrc;

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
    setBlurredLoaded(false);
  }, [src, safeSrc]);

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
    <div className={`relative overflow-hidden bg-stone-100 dark:bg-stone-900/50 ${containerClassName}`}>
      {/* Blurred Placeholder */}
      {blurSrc && !isLoaded && !error && (
        <motion.img
          src={blurSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-0 ${className}`}
          animate={{ opacity: blurredLoaded ? 0.6 : 0 }}
          onLoad={() => setBlurredLoaded(true)}
        />
      )}

      {/* Skeleton / Loading pulse */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-200/20 dark:via-white/5 to-transparent animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
      )}

      {safeSrc && (
        <motion.img
          {...props}
          ref={imgRef}
          src={safeSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          initial={priority ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: priority ? 0 : 0.3 }}
          loading={priority ? "eager" : "lazy"}
          {...(priority ? { fetchPriority: "high" } : {})}
          className={`${className} relative z-10 w-full h-full`}
          style={{ ...props.style, display: error ? 'none' : 'block' }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100 dark:bg-stone-900/40 p-4 text-center z-20">
          <Coffee className="w-8 h-8 text-stone-500/20 mb-2" />
        </div>
      )}

      {/* Decorative inner shadow for "sinking in" effect - only show if requested */}
      {showOverlay && (
        <div className={`absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 ${overlayClassName}`} />
      )}
    </div>
  );
}
