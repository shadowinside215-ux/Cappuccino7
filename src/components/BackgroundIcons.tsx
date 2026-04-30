import React from 'react';
import { Coffee, Utensils, Croissant, Cake, Pizza, Cookie, Soup, GlassWater, Cherry, IceCream } from 'lucide-react';

const icons = [
  // Optimization: Reduce icon count and use simpler transforms
  { Icon: Coffee, t: '2%', l: '5%', r: '12deg', s: 48, c: 'text-amber-500/10 dark:text-amber-400/20' },
  { Icon: Croissant, t: '4%', l: '25%', r: '-15deg', s: 52, c: 'text-stone-400/10 dark:text-stone-300/10' },
  { Icon: Pizza, t: '7%', l: '45%', r: '30deg', s: 64, c: 'text-orange-500/10 dark:text-orange-400/10' },
  { Icon: Cake, t: '3%', l: '65%', r: '-20deg', s: 44, c: 'text-rose-400/10 dark:text-rose-300/10' },
  { Icon: GlassWater, t: '8%', l: '85%', r: '10deg', s: 38, c: 'text-blue-400/10 dark:text-blue-300/10' },
  { Icon: Cookie, t: '12%', l: '15%', r: '45deg', s: 40, c: 'text-amber-600/10 dark:text-amber-500/10' },
  { Icon: Soup, t: '5%', l: '75%', r: '15deg', s: 42, c: 'text-stone-300/10 dark:text-stone-400/10' },
  { Icon: Cherry, t: '10%', l: '35%', r: '-45deg', s: 28, c: 'text-red-400/10 dark:text-red-300/10' },
  { Icon: Croissant, t: '1%', l: '90%', r: '15deg', s: 34, c: 'text-stone-200/20' },
  { Icon: Pizza, t: '15%', l: '10%', r: '-25deg', s: 48, c: 'text-orange-300/20' },
  
  // Upper Mid
  { Icon: Soup, t: '25%', l: '35%', r: '-10deg', s: 56, c: 'text-stone-500 dark:text-stone-400' },
  { Icon: Cherry, t: '22%', l: '55%', r: '60deg', s: 32, c: 'text-red-500 dark:text-red-400' },
  { Icon: IceCream, t: '18%', l: '75%', r: '0deg', s: 52, c: 'text-amber-500 dark:text-amber-400' },
  { Icon: Utensils, t: '28%', l: '92%', r: '-45deg', s: 42, c: 'text-stone-400 dark:text-stone-600' },
  { Icon: Croissant, t: '25%', l: '15%', r: '30deg', s: 48, c: 'text-stone-500 dark:text-stone-300' },
  { Icon: Pizza, t: '32%', l: '60%', r: '-15deg', s: 60, c: 'text-orange-600 dark:text-orange-400' },
  { Icon: Coffee, t: '20%', l: '80%', r: '45deg', s: 44, c: 'text-amber-600 dark:text-amber-500' },
  { Icon: Cake, t: '35%', l: '45%', r: '10deg', s: 38, c: 'text-stone-400 dark:text-stone-500' },
  { Icon: Soup, t: '30%', l: '10%', r: '90deg', s: 42, c: 'text-stone-500 dark:text-stone-400' },
  
  // Mid
  { Icon: Coffee, t: '45%', l: '10%', r: '20deg', s: 58, c: 'text-amber-600 dark:text-amber-400' },
  { Icon: Pizza, t: '55%', l: '30%', r: '-30deg', s: 68, c: 'text-orange-600 dark:text-orange-500' },
  { Icon: Croissant, t: '52%', l: '50%', r: '45deg', s: 50, c: 'text-stone-500 dark:text-stone-400' },
  { Icon: Cake, t: '48%', l: '70%', r: '-15deg', s: 64, c: 'text-stone-400 dark:text-stone-300' },
  { Icon: GlassWater, t: '40%', l: '5%', r: '90deg', s: 36, c: 'text-blue-500 dark:text-blue-400' },
  { Icon: Cookie, t: '48%', l: '85%', r: '-20deg', s: 42, c: 'text-amber-700 dark:text-amber-600' },
  { Icon: IceCream, t: '55%', l: '20%', r: '15deg', s: 50, c: 'text-amber-400 dark:text-amber-300' },
  { Icon: Pizza, t: '50%', l: '95%', r: '45deg', s: 54, c: 'text-orange-500 dark:text-orange-400' },
  { Icon: Utensils, t: '42%', l: '40%', r: '-60deg', s: 32, c: 'text-stone-400 dark:text-stone-300' },
  
  // Lower Mid
  { Icon: Cookie, t: '65%', l: '85%', r: '30deg', s: 40, c: 'text-amber-800 dark:text-amber-200' },
  { Icon: GlassWater, t: '65%', l: '15%', r: '-5deg', s: 46, c: 'text-blue-600 dark:text-blue-400' },
  { Icon: Soup, t: '72%', l: '40%', r: '15deg', s: 60, c: 'text-stone-600 dark:text-stone-400' },
  { Icon: Utensils, t: '60%', l: '60%', r: '120deg', s: 44, c: 'text-stone-400 dark:text-stone-500' },
  { Icon: Pizza, t: '68%', l: '75%', r: '-45deg', s: 62, c: 'text-orange-500 dark:text-orange-400' },
  { Icon: Cake, t: '75%', l: '5%', r: '30deg', s: 58, c: 'text-stone-300 dark:text-stone-400' },
  { Icon: Coffee, t: '62%', l: '45%', r: '15deg', s: 48, c: 'text-amber-500 dark:text-amber-400' },
  { Icon: Croissant, t: '70%', l: '90%', r: '-30deg', s: 44, c: 'text-stone-400 dark:text-stone-500' },
  
  // Bottom
  { Icon: Pizza, t: '82%', l: '65%', r: '-40deg', s: 72, c: 'text-orange-600 dark:text-orange-500' },
  { Icon: Coffee, t: '88%', l: '10%', r: '25deg', s: 62, c: 'text-amber-600 dark:text-amber-400' },
  { Icon: Croissant, t: '95%', l: '50%', r: '-10deg', s: 54, c: 'text-stone-500 dark:text-stone-300' },
  { Icon: IceCream, t: '92%', l: '90%', r: '15deg', s: 58, c: 'text-amber-500 dark:text-amber-400' },
  { Icon: GlassWater, t: '85%', l: '35%', r: '60deg', s: 34, c: 'text-blue-500 dark:text-blue-400' },
  { Icon: Cookie, t: '98%', l: '20%', r: '-30deg', s: 46, c: 'text-amber-700 dark:text-amber-600' },
  { Icon: Soup, t: '94%', l: '75%', r: '15deg', s: 52, c: 'text-stone-400 dark:text-stone-300' },
  { Icon: Pizza, t: '80%', l: '5%', r: '120deg', s: 60, c: 'text-orange-400 dark:text-orange-500' },
  { Icon: Utensils, t: '90%', l: '95%', r: '45deg', s: 38, c: 'text-stone-400 dark:text-stone-300' },
  
  // High Density Fillers
  { Icon: Pizza, t: '25%', l: '80%', r: '120deg', s: 45, c: 'text-orange-500 dark:text-orange-400' },
  { Icon: Coffee, t: '55%', l: '90%', r: '-80deg', s: 35, c: 'text-amber-500 dark:text-amber-400' },
  { Icon: Croissant, t: '80%', l: '5%', r: '60deg', s: 48, c: 'text-stone-400 dark:text-stone-300' },
  { Icon: Cake, t: '12%', l: '20%', r: '-30deg', s: 55, c: 'text-stone-300 dark:text-stone-400' },
  { Icon: Cookie, t: '40%', l: '40%', r: '15deg', s: 38, c: 'text-amber-600 dark:text-amber-500' },
  { Icon: Soup, t: '70%', l: '95%', r: '-60deg', s: 44, c: 'text-stone-500 dark:text-stone-400' },
  { Icon: Coffee, t: '90%', l: '40%', r: '10deg', s: 50, c: 'text-amber-700 dark:text-amber-600' },
  { Icon: IceCream, t: '30%', l: '5%', r: '45deg', s: 42, c: 'text-amber-400 dark:text-amber-300' },
  { Icon: Pizza, t: '40%', l: '60%', r: '15deg', s: 48, c: 'text-orange-300 dark:text-orange-400' },
  { Icon: Coffee, t: '10%', l: '50%', r: '-45deg', s: 32, c: 'text-amber-400 dark:text-amber-500' },
  { Icon: Cake, t: '60%', l: '25%', r: '30deg', s: 36, c: 'text-stone-300 dark:text-stone-400' },
  { Icon: Soup, t: '15%', l: '85%', r: '-15deg', s: 42, c: 'text-stone-400 dark:text-stone-500' },
  { Icon: Croissant, t: '45%', l: '5%', r: '45deg', s: 38, c: 'text-stone-500 dark:text-stone-300' },
  { Icon: Coffee, t: '75%', l: '95%', r: '10deg', s: 34, c: 'text-amber-600 dark:text-amber-400' },
  { Icon: Pizza, t: '5%', l: '50%', r: '-30deg', s: 50, c: 'text-orange-500 dark:text-orange-400' },
  { Icon: Cookie, t: '22%', l: '12%', r: '15deg', s: 36, c: 'text-amber-600 dark:text-amber-500' },
  { Icon: GlassWater, t: '60%', l: '88%', r: '-45deg', s: 40, c: 'text-blue-400 dark:text-blue-300' },
];

export const BackgroundIcons = () => {
  return (
    <div 
      className="absolute inset-0 min-h-[8000px] pointer-events-none z-0 overflow-hidden select-none bg-bento-bg transition-colors duration-1000"
      id="bg-icons-container"
    >
      <div className="absolute inset-0">
        {[...icons, ...icons, ...icons, ...icons, ...icons].map((item, index) => (
          <div
            key={index}
            className={`absolute ${item.c} animate-breathe will-change-transform`}
            style={{
              top: `${(index * 2.8) % 100}%`,
              left: `${(index * 13.7 + (index % 11) * 3.2) % 96}%`,
              animationDelay: `${index * 0.4}s`,
              animationDuration: `${12 + (index % 8)}s`,
              filter: `drop-shadow(0 0 8px currentColor)`,
              opacity: 0.15
            }}
          >
            <div style={{ transform: `rotate(${item.r || (index * 60) + 'deg'})` }}>
              <item.Icon size={item.s || 32} strokeWidth={1.2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
