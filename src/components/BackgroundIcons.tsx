import React from 'react';
import { Coffee, Utensils, Croissant, Cake, Pizza, Cookie, Soup, GlassWater, Cherry, IceCream } from 'lucide-react';

const icons = [
  // Top Section
  { Icon: Coffee, t: '2%', l: '5%', r: '12deg', s: 48, c: 'text-amber-600/40 dark:text-amber-400/40' },
  { Icon: Croissant, t: '4%', l: '25%', r: '-15deg', s: 52, c: 'text-stone-500/30 dark:text-stone-300/30' },
  { Icon: Pizza, t: '7%', l: '45%', r: '30deg', s: 64, c: 'text-orange-500/30 dark:text-orange-400/30' },
  { Icon: Cake, t: '3%', l: '65%', r: '-20deg', s: 44, c: 'text-stone-500/35 dark:text-stone-300/35' },
  { Icon: GlassWater, t: '8%', l: '85%', r: '10deg', s: 38, c: 'text-blue-500/30 dark:text-blue-400/30' },
  
  // Upper Mid
  { Icon: Soup, t: '15%', l: '35%', r: '-10deg', s: 56, c: 'text-stone-500/30 dark:text-stone-400/30' },
  { Icon: Cherry, t: '22%', l: '55%', r: '60deg', s: 32, c: 'text-red-500/40 dark:text-red-400/40' },
  { Icon: IceCream, t: '18%', l: '75%', r: '0deg', s: 52, c: 'text-amber-500/40 dark:text-amber-400/40' },
  { Icon: Utensils, t: '28%', l: '92%', r: '-45deg', s: 42, c: 'text-stone-400/40 dark:text-stone-600/40' },
  
  // Mid
  { Icon: Coffee, t: '38%', l: '10%', r: '20deg', s: 58, c: 'text-amber-600/35 dark:text-amber-400/35' },
  { Icon: Pizza, t: '45%', l: '30%', r: '-30deg', s: 68, c: 'text-orange-600/30 dark:text-orange-500/30' },
  { Icon: Croissant, t: '52%', l: '50%', r: '45deg', s: 50, c: 'text-stone-500/35 dark:text-stone-400/35' },
  { Icon: Cake, t: '42%', l: '70%', r: '-15deg', s: 64, c: 'text-stone-400/40 dark:text-stone-300/40' },
  
  // Lower Mid
  { Icon: Cookie, t: '58%', l: '85%', r: '30deg', s: 40, c: 'text-amber-800/45 dark:text-amber-200/45' },
  { Icon: GlassWater, t: '65%', l: '15%', r: '-5deg', s: 46, c: 'text-blue-600/35 dark:text-blue-400/35' },
  { Icon: Soup, t: '72%', l: '40%', r: '15deg', s: 60, c: 'text-stone-600/40 dark:text-stone-400/40' },
  
  // Bottom
  { Icon: Pizza, t: '82%', l: '65%', r: '-40deg', s: 72, c: 'text-orange-600/35 dark:text-orange-500/35' },
  { Icon: Coffee, t: '88%', l: '10%', r: '25deg', s: 62, c: 'text-amber-600/45 dark:text-amber-400/45' },
  { Icon: Croissant, t: '95%', l: '50%', r: '-10deg', s: 54, c: 'text-stone-500/40 dark:text-stone-300/40' },
  { Icon: IceCream, t: '92%', l: '90%', r: '15deg', s: 58, c: 'text-amber-500/45 dark:text-amber-400/45' },
  
  // High Density Fillers
  { Icon: Pizza, t: '25%', l: '80%', r: '120deg', s: 45, c: 'text-orange-500/25' },
  { Icon: Coffee, t: '55%', l: '90%', r: '-80deg', s: 35, c: 'text-amber-500/25' },
  { Icon: Croissant, t: '80%', l: '5%', r: '60deg', s: 48, c: 'text-stone-400/25' },
  { Icon: Cake, t: '12%', l: '20%', r: '-30deg', s: 55, c: 'text-stone-300/30' }
];

export const BackgroundIcons = () => {
  return (
    <div className="absolute inset-0 min-h-[5000px] pointer-events-none z-0 overflow-hidden select-none bg-stone-50 dark:bg-stone-950">
      <div className="absolute inset-0">
        {icons.map((item, index) => (
          <div
            key={index}
            className={`absolute ${item.c} hover:scale-110 transition-transform duration-700`}
            style={{
              top: item.t,
              left: item.l,
              transform: `rotate(${item.r})`,
            }}
          >
            <item.Icon size={item.s} strokeWidth={1} />
          </div>
        ))}
      </div>
      
      {/* Pattern grid for more structure */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:48px_48px] opacity-40" />
    </div>
  );
};
