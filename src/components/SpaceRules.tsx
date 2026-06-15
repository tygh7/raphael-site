import React from 'react';
import { Compass, Swords, Shield, Zap, Sparkles, HelpCircle } from 'lucide-react';

export const SpaceRules: React.FC = () => {
  return (
    <div className="w-full max-w-[800px] border border-zinc-800 bg-[#0c0c12]/90 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl font-sans text-zinc-300 backdrop-blur-xl select-none">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Compass className="w-6 h-6 text-sky-400" />
        <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans">
          Galaxy Dogfight: Combat Manual & Specs
        </h2>
      </div>

      {/* Grid of rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Flight School */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-sky-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Flight Controls
          </h3>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">ZQSD / WASD:</span>
              <p>Accelerate and steer in absolute directions. The thruster particles trail behind your ship's movement.</p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">MOUSE AIMING:</span>
              <p>Your ship rotates automatically to align its laser cannons with your mouse cursor on the screen.</p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">LEFT CLICK:</span>
              <p>Fire your primary laser cannons! Hold to autofire at your ship's specific frequency.</p>
            </li>
          </ul>
        </div>

        {/* Fleet Combat */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-rose-500 flex items-center gap-2">
            <Swords className="w-4 h-4" /> Faction Fleet Battles
          </h3>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-rose-500 font-bold font-mono">Allies:</span>
              <p>Your side's AI fleet patrols beside you and automatically locks on and attacks enemy interceptors.</p>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-500 font-bold font-mono">Enemies:</span>
              <p>The opposing faction will warp in replacements continuously to hunt down you and your wingmen.</p>
            </li>
            <li className="flex gap-2">
              <span className="text-rose-500 font-bold font-mono">Asteroids:</span>
              <p>Drifting asteroids block movement. Shoot them to break them into smaller high-velocity rock fragments!</p>
            </li>
          </ul>
        </div>
      </div>

      {/* Ship Attributes Table */}
      <div className="flex flex-col gap-4 border-t border-zinc-800 pt-5">
        <h3 className="font-semibold text-emerald-400 flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" /> Combat Statistics Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-zinc-800 bg-zinc-950/40 rounded-lg">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400">
                <th className="p-2.5 font-bold uppercase tracking-wider">Stat</th>
                <th className="p-2.5 font-bold uppercase tracking-wider">Description</th>
                <th className="p-2.5 font-bold uppercase tracking-wider text-emerald-400">High Tier Example</th>
                <th className="p-2.5 font-bold uppercase tracking-wider text-rose-400">Low Tier Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Speed</td>
                <td className="p-2.5 text-zinc-400">Max flight velocity and thruster acceleration.</td>
                <td className="p-2.5 text-emerald-400">TIE Silencer (6.5)</td>
                <td className="p-2.5 text-rose-400">Millennium Falcon (3.8)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Power</td>
                <td className="p-2.5 text-zinc-400">Damage inflicted per laser hit.</td>
                <td className="p-2.5 text-emerald-400">Millennium Falcon (28)</td>
                <td className="p-2.5 text-rose-400">Solar Sailer (10)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Frequency</td>
                <td className="p-2.5 text-zinc-400">Cooldown between laser discharges (lower cooldown = higher frequency).</td>
                <td className="p-2.5 text-emerald-400">Solar Sailer (180ms)</td>
                <td className="p-2.5 text-rose-400">Millennium Falcon (450ms)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Shield</td>
                <td className="p-2.5 text-zinc-400">Maximum hull points/shields before ship is destroyed.</td>
                <td className="p-2.5 text-emerald-400">Millennium Falcon (250)</td>
                <td className="p-2.5 text-rose-400">TIE Fighter (80)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 text-xs leading-normal">
        <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
        <p>
          <strong className="text-white">Pro Tip:</strong> Falcon has slow speeds but features dual-shooting laser cannons and extreme shielding. Agility-based ships (like Kylo Ren's TIE Silencer or Jedi Starfighters) can easily outrun lasers, but minor mistakes can faint them quickly due to thin shields. Choose wisely!
        </p>
      </div>
    </div>
  );
};
