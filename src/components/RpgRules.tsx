import React from 'react';
import { Shield, Compass, Swords, ArrowRight, Zap, HelpCircle } from 'lucide-react';

export const RpgRules: React.FC = () => {
  return (
    <div className="w-full max-w-[800px] border border-zinc-800 bg-[#0c0c12]/90 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl font-sans text-zinc-300 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Compass className="w-6 h-6 text-sky-400" />
        <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans">
          Pixel RPG: Explorer Guide & Controls
        </h2>
      </div>

      {/* Grid of rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Controls */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-sky-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Keyboard Controls
          </h3>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">ZQSD / WASD:</span>
              <p>Move your character freely in 4 directions.</p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">SPACEBAR:</span>
              <p>Perform a manual jump hop. Essential for hopping over gaps or just showing off!</p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">E / ENTER:</span>
              <p>Interact with chests, read signposts, or talk to NPCs in front of you.</p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">C KEY:</span>
              <p>Open/Close the Adventurer Map to track your coordinates in the 64x64 grid world.</p>
            </li>
          </ul>
        </div>

        {/* Level Up & Battles */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-amber-400 flex items-center gap-2">
            <Swords className="w-4 h-4" /> Tall Grass & Battles
          </h3>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold font-mono">Grass:</span>
              <p>
                Walking in <strong className="text-emerald-400">dark green tall grass</strong> has a 10% chance per step to trigger a wild monster encounter!
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold font-mono">Ledges:</span>
              <p>
                Walk towards a mountain cliff <strong className="text-white">ledge</strong> going down to leap off and descend automatically!
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold font-mono">Treasure:</span>
              <p>
                Find hidden chests around the world map. Opening chests will heal your party or boost their combat levels!
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Info Badge */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 text-xs leading-normal">
        <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
        <p>
          <strong className="text-white">Defeat Condition:</strong> If your team's HP reaches 0 in combat, you faint and black out. You will safely respawn at the center of Pallet Town (starting town) with your party fully healed. Go explore the world!
        </p>
      </div>
    </div>
  );
};
