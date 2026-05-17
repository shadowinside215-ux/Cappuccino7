
/**
 * Cloudinary URL transformation utility
 * Optimizes images for different use cases in the Cappuccino7 app
 */

const CLOUDINARY_REGEX = /res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+)/;

export type ImageSize = 'thumbnail' | 'medium' | 'large' | 'hero' | 'avatar';

export function getOptimizedImageUrl(url: string | undefined | null, size: ImageSize = 'medium'): string {
  if (!url) return '';
  
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
      params += ',w_200,c_fill,g_auto';
      break;
    case 'medium':
      params += ',w_600,c_fill,g_auto';
      break;
    case 'large':
      params += ',w_1000,c_limit';
      break;
    case 'hero':
      params += ',w_1600,c_limit';
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
