export function translateCustomization(customization: string, t: any): string {
  if (!customization) return customization;
  
  // Special case for old customizations that used ' - '
  // We'll replace it with ' | ' so they can be parsed
  let parseStr = customization;
  if (parseStr.includes(' - ') && !parseStr.includes(' | ')) {
      parseStr = parseStr.replace(' - ', ' | ');
  }
  
  if (parseStr.includes(' | ')) {
    const parts = parseStr.split(' | ').map(p => p.trim());
    const translatedParts = parts.map(part => {
       // Check if it's a product
       const productKey = `products.${part}`;
       const productTrans = t(productKey, part);
       if (productTrans !== part && productTrans !== productKey) {
         return productTrans;
       }
       
       // Check if it's a specific sugar/syrup preference
       const key = part.toLowerCase().replace(/ /g, '_');
       return t(key, part);
    });
    return translatedParts.join(' - ');
  }
  
  const key = parseStr.trim().toLowerCase().replace(/ /g, '_');
  return t(key, parseStr);
}
