import React from 'react';
import { Compass, Swords, Shield, Zap, Sparkles, HelpCircle } from 'lucide-react';

export const SpaceRules: React.FC = () => {
  return (
    <div className="w-full max-w-[800px] pixel-border-zinc bg-[#050508]/95 p-6 md:p-8 flex flex-col gap-6 shadow-2xl font-press text-zinc-400 select-none crt-scanlines">
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-zinc-800 pb-4">
        <Compass className="w-5 h-5 text-sky-400 animate-spin-slow" />
        <h2 className="text-xs md:text-sm font-bold text-white tracking-wider uppercase pixel-glow-white">
          FLIGHT MANUAL & SPECS
        </h2>
      </div>

      {/* Grid of rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[8px] md:text-[9px]">
        {/* Flight School */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-sky-400 flex items-center gap-2 pixel-glow-sky text-[10px]">
            <Zap className="w-4 h-4" /> FLIGHT CONTROLS
          </h3>
          <ul className="space-y-4 list-none pl-0">
            <li className="flex flex-col gap-1">
              <span className="text-sky-400 font-bold">Z / W (FORWARD):</span>
              <p className="leading-relaxed">FLY FORWARD TOWARDS THE CENTER. HOLD TO ACTIVATE ENGINES.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-sky-400 font-bold">S (BRAKE):</span>
              <p className="leading-relaxed">BRAKE / DECELERATE TO GET A BETTER TARGETING LOCK ON ENEMIES.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-sky-400 font-bold">Q / A / D (ROLL):</span>
              <p className="leading-relaxed">DODGE INCOMING LASERS BY BARREL-ROLLING LEFT (Q/A) OR RIGHT (D).</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-sky-400 font-bold">MOUSE AIM:</span>
              <p className="leading-relaxed">MOVE CROSSHAIR TO STEER STARFIGHTER NOSE AND AIM CANNONS.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-sky-400 font-bold">CLICK / A / I:</span>
              <p className="leading-relaxed">FIRE PRIMARY LASERS. HOLD TO AUTOFIRE CANNONS.</p>
            </li>
          </ul>
        </div>

        {/* Fleet Combat */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-rose-500 flex items-center gap-2 pixel-glow-rose text-[10px]">
            <Swords className="w-4 h-4" /> FLEET ENGAGEMENTS
          </h3>
          <ul className="space-y-4 list-none pl-0">
            <li className="flex flex-col gap-1">
              <span className="text-rose-400 font-bold">HANGAR BASES:</span>
              <p className="leading-relaxed">LIGHT SPAWNS NORTH (~500 Y), DARK SPAWNS SOUTH (~7500 Y). BOTH CLASH IN CENTER.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-rose-400 font-bold">HYPERSPACE WARP:</span>
              <p className="leading-relaxed">REACHING ENEMY RUNWAY TRIGGERS WARP SPEED BACK TO OWN HANGAR BAY.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-rose-400 font-bold">WINGMEN SUPPORT:</span>
              <p className="leading-relaxed">60 STARFIGHTERS (30V30) ENGAGE. SQUADRONS HELP INTERCEPT ENEMY CHASERS.</p>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-rose-400 font-bold">ASTEROID DEBRIS:</span>
              <p className="leading-relaxed">COLLISION CAUSES HEAVY DAMAGE. FIRE CANNONS TO FRAGMENT ASTEROIDS.</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Ship Attributes Table */}
      <div className="flex flex-col gap-4 border-t-2 border-zinc-800 pt-5 text-[8px] md:text-[9px]">
        <h3 className="font-bold text-emerald-400 flex items-center gap-2 pixel-glow-emerald text-[10px]">
          <Sparkles className="w-4 h-4" /> STATS BREAKDOWN
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[8px] text-left border-collapse border-2 border-zinc-800 bg-[#020204]/90 rounded-none">
            <thead>
              <tr className="border-b-2 border-zinc-800 bg-zinc-950 text-zinc-500">
                <th className="p-3 font-bold uppercase tracking-wider">STAT</th>
                <th className="p-3 font-bold uppercase tracking-wider">DESCRIPTION</th>
                <th className="p-3 font-bold uppercase tracking-wider text-emerald-400">HIGH TIER</th>
                <th className="p-3 font-bold uppercase tracking-wider text-rose-500">LOW TIER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              <tr>
                <td className="p-3 text-zinc-300 font-bold">SPEED</td>
                <td className="p-3 text-zinc-500 uppercase">MAX FLIGHT VELOCITY AND ACCELERATION.</td>
                <td className="p-3 text-emerald-400">SILENCER (6.5)</td>
                <td className="p-3 text-rose-500">FALCON (3.8)</td>
              </tr>
              <tr>
                <td className="p-3 text-zinc-300 font-bold">POWER</td>
                <td className="p-3 text-zinc-500 uppercase">DAMAGE INFLICTED PER LASER CHARGE.</td>
                <td className="p-3 text-emerald-400">FALCON (28)</td>
                <td className="p-3 text-rose-500">SAILER (10)</td>
              </tr>
              <tr>
                <td className="p-3 text-zinc-300 font-bold">FREQUENCY</td>
                <td className="p-3 text-zinc-500 uppercase">COOLDOWN INTERVAL BETWEEN SHOTS.</td>
                <td className="p-3 text-emerald-400">SAILER (180MS)</td>
                <td className="p-3 text-rose-500">FALCON (450MS)</td>
              </tr>
              <tr>
                <td className="p-3 text-zinc-300 font-bold">SHIELD</td>
                <td className="p-3 text-zinc-500 uppercase">MAXIMUM HULL STRENGTH CAPACITY.</td>
                <td className="p-3 text-emerald-400">FALCON (250)</td>
                <td className="p-3 text-rose-500">TIE/LN (80)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex gap-3 p-4 rounded-none border-2 border-zinc-800 bg-[#0a0a0f]/90 text-[8px] md:text-[9px] leading-relaxed">
        <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
        <p className="uppercase">
          <strong className="text-white">PRO TIP:</strong> FALCON HAS SLOW SPEEDS BUT FEATURES DUAL SHOOTING LASER CANNONS AND EXTREME SHIELDING. AGILITY INTERCEPTORS CAN OUTRUN LASERS BUT FEATHERWEIGHT HULLS POP QUICKLY.
        </p>
      </div>
    </div>
  );
};
