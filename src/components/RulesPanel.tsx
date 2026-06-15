import React from 'react';
import { Shield, Swords, TrendingUp, Zap, Sparkles, AlertCircle } from 'lucide-react';

export const RulesPanel: React.FC = () => {
  return (
    <div className="w-full max-w-[800px] border border-zinc-800 bg-[#0c0c12]/90 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl font-sans text-zinc-300 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Swords className="w-6 h-6 text-sky-400" />
        <h2 className="text-xl font-bold text-white tracking-wide uppercase font-sans">
          Chess-Pokémon: Rule Book & Guide
        </h2>
      </div>

      {/* Grid of rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Core Rules */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-sky-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Core Gameplay
          </h3>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">1.</span>
              <p>
                <strong className="text-white">Movement:</strong> Move your pieces using standard Chess rules.
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">2.</span>
              <p>
                <strong className="text-white">The Clash:</strong> When you land on a square occupied by an opponent's piece, they "meet". You can choose to <span className="text-rose-400 font-semibold">Attack</span> or <span className="text-zinc-400 font-semibold">Retreat</span>.
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">3.</span>
              <p>
                <strong className="text-white">Turn Initiative:</strong> The piece whose board turn it is attacks first on <span className="text-emerald-400 font-semibold">Turn 1</span> of the battle. Subsequent turns use speed priority and speeds.
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-sky-500 font-bold font-mono">4.</span>
              <p>
                <strong className="text-white">Outcome:</strong> The fainted piece is captured. If the attacker wins, they take the square. If the defender wins, they hold the square, and the attacker is removed.
              </p>
            </li>
          </ul>
        </div>

        {/* Level Up & Stats */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-amber-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> RPG Progression
          </h3>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold font-mono">L.</span>
              <p>
                <strong className="text-white">Levelling Up:</strong> Surviving a clash boosts your piece level (Max level 5). Each level grants <span className="text-emerald-400 font-semibold">+10% Base Stats</span> (HP, Attack, Defense, Speed).
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold font-mono">H.</span>
              <p>
                <strong className="text-white">Tactical Healing:</strong> Leveling up fully restores HP to the new maximum. Surviving at max level restores <span className="text-emerald-400 font-semibold">50% HP</span>.
              </p>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold font-mono">P.</span>
              <p>
                <strong className="text-white">Pawn Flail Strategy:</strong> Pawns have low base stats, but their move <strong className="text-white">Desperate Flail</strong> scales damage exponentially as HP drops. Play them at low health to beat Queens!
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Type Strengths & Weaknesses Table */}
      <div className="flex flex-col gap-4 border-t border-zinc-800 pt-5">
        <h3 className="font-semibold text-emerald-400 flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" /> Elemental Type Matchups
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-zinc-800 bg-zinc-950/40 rounded-lg">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400">
                <th className="p-2.5 font-bold uppercase tracking-wider">Piece</th>
                <th className="p-2.5 font-bold uppercase tracking-wider">Type</th>
                <th className="p-2.5 font-bold uppercase tracking-wider text-emerald-400">Strong Against (2x)</th>
                <th className="p-2.5 font-bold uppercase tracking-wider text-rose-400">Weak Against (0.5x)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Pawn</td>
                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-600 text-zinc-100 uppercase">Steel</span></td>
                <td className="p-2.5 text-emerald-400">Dark (Queen)</td>
                <td className="p-2.5 text-rose-400">Fire (Rook)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Knight</td>
                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-600 text-white uppercase">Fighter</span></td>
                <td className="p-2.5 text-emerald-400">Steel (Pawn), Fire (Rook)</td>
                <td className="p-2.5 text-rose-400">Psychic (Bishop)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Bishop</td>
                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white uppercase">Psychic</span></td>
                <td className="p-2.5 text-emerald-400">Fighter (Knight)</td>
                <td className="p-2.5 text-rose-400">Dark (Queen)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Rook</td>
                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white uppercase">Fire</span></td>
                <td className="p-2.5 text-emerald-400">Steel (Pawn)</td>
                <td className="p-2.5 text-rose-400">Fighter (Knight)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">Queen</td>
                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950 text-indigo-200 border border-indigo-500/30 uppercase">Dark</span></td>
                <td className="p-2.5 text-emerald-400">Psychic (Bishop)</td>
                <td className="p-2.5 text-rose-400">Steel (Pawn)</td>
              </tr>
              <tr>
                <td className="p-2.5 text-zinc-100 font-semibold">King</td>
                <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-600 text-white uppercase">Dragon</span></td>
                <td className="p-2.5 text-emerald-400">Dragon (King)</td>
                <td className="p-2.5 text-rose-400">Resists basic elements (0.75x from Fire, Fighter, Steel)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Badge */}
      <div className="flex gap-2.5 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 text-xs leading-normal">
        <AlertCircle className="w-5 h-5 text-sky-400 shrink-0" />
        <p>
          <strong className="text-white">Winning Condition:</strong> Capture the opponent\'s King in battle! Because the King is a powerful Dragon type with high stats, you should level up your pieces before engaging the King.
        </p>
      </div>
    </div>
  );
};
