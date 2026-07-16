
/**
 * Cloudinary URL transformation utility
 * Optimizes images for different use cases in the Cappuccino7 app
 */

const CLOUDINARY_REGEX = /res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)/;

export type ImageSize = 'thumbnail' | 'medium' | 'large' | 'hero' | 'avatar';

export function getOptimizedImageUrl(url: string | undefined | null, size: ImageSize = 'medium'): string {
  if (!url) return '';
  
  // Optimize Unsplash URLs for maximum 4K clarity if size is hero
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      if (size === 'hero') {
        u.searchParams.set('w', '3840');
        u.searchParams.set('q', '95');
      } else if (size === 'large') {
        u.searchParams.set('w', '2000');
        u.searchParams.set('q', '90');
      } else if (size === 'medium') {
        u.searchParams.set('w', '1000');
        u.searchParams.set('q', '85');
      } else if (size === 'thumbnail') {
        u.searchParams.set('w', '500');
        u.searchParams.set('q', '80');
      }
      return u.toString();
    } catch (e) {
      // ignore parsing errors and return original
    }
  }

  const match = url.match(CLOUDINARY_REGEX);
  if (!match) return url; // Not a Cloudinary URL, return as is

  const cloudName = match[1];
  const publicId = match[2];

  // Base optimization parameters
  // f_auto: best format for browser
  // q_auto: automated quality
  // dpr_auto: adjust for device pixel ratio
  let params = 'f_auto,q_auto,dpr_auto';

  // size-specific adjustments
  switch (size) {
    case 'thumbnail':
      params += ',w_500,c_fill,g_auto';
      break;
    case 'medium':
      params += ',w_800,c_fill,g_auto';
      break;
    case 'large':
      params += ',w_2000,c_limit';
      break;
    case 'hero':
      // Pristine 4K Quality for Heroes
      params += ',w_3840,c_limit,q_auto:best';
      break;
    case 'avatar':
      params += ',w_100,h_100,c_fill,g_face,r_max';
      break;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${params}/${publicId}`;
}

export function getBlurPlaceholder(url: string | undefined | null): string {
  if (!url) return '';
  
  const match = url.match(CLOUDINARY_REGEX);
  if (!match) return url;

  const cloudName = match[1];
  const publicId = match[2];

  // Ultra low resolution blurred placeholder
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_20,e_blur:1000,f_auto,q_10/${publicId}`;
}
