import { ShipDef } from '../types/space';

export const LIGHT_SHIPS: ShipDef[] = [
  {
    id: 'x_wing',
    name: 'T-65 X-Wing',
    faction: 'light',
    description: 'The iconic rebel starfighter. Well-balanced speed, shielding, and firepower.',
    color: '#10b981', // Green lasers
    stats: {
      speed: 4.8,
      power: 15,
      rate: 300,
      range: 650,
      shield: 560
    }
  },
  {
    id: 'falcon',
    name: 'Millennium Falcon',
    faction: 'light',
    description: 'A heavily modified YT-1300 light freighter. Extremely durable with dual laser cannons.',
    color: '#06b6d4', // Cyan/Blue lasers
    stats: {
      speed: 3.8,
      power: 28,
      rate: 450,
      range: 800,
      shield: 950
    }
  },
  {
    id: 'delta_7',
    name: 'Delta-7 Aethersprite',
    faction: 'light',
    description: 'A highly agile Jedi starfighter. Excellent acceleration and quick laser fire.',
    color: '#3b82f6', // Dark blue lasers
    stats: {
      speed: 5.6,
      power: 12,
      rate: 200,
      range: 600,
      shield: 400
    }
  },
  {
    id: 'jedi_interceptor',
    name: 'Eta-2 Jedi Starfighter',
    faction: 'light',
    description: 'Anakin Skywalker\'s custom interceptor. Fast, deadly, but thin shields.',
    color: '#10b981', // Green lasers
    stats: {
      speed: 6.2,
      power: 18,
      rate: 250,
      range: 700,
      shield: 360
    }
  }
];

export const DARK_SHIPS: ShipDef[] = [
  {
    id: 'solar_sailer',
    name: 'Punworcca Solar Sailer',
    faction: 'dark',
    description: 'Count Dooku\'s custom transport. Outfitted with specialized solar sails for extreme speed.',
    color: '#ef4444', // Red lasers
    stats: {
      speed: 6.0,
      power: 10,
      rate: 180,
      range: 550,
      shield: 380
    }
  },
  {
    id: 'tie_fighter',
    name: 'TIE/ln Fighter',
    faction: 'dark',
    description: 'Standard Imperial starfighter. Fast, mass-produced, lacks shields but very agile.',
    color: '#f43f5e', // Rose lasers
    stats: {
      speed: 5.0,
      power: 10,
      rate: 220,
      range: 550,
      shield: 320
    }
  },
  {
    id: 'tie_vader',
    name: 'TIE Advanced x1 (Vader)',
    faction: 'dark',
    description: 'Darth Vader\'s personal prototype. High shields and heavy targeting lasers.',
    color: '#ef4444', // Dark Red lasers
    stats: {
      speed: 4.5,
      power: 25,
      rate: 350,
      range: 750,
      shield: 640
    }
  },
  {
    id: 'tie_n2',
    name: 'TIE Advanced N2',
    faction: 'dark',
    description: 'An upgraded Imperial prototype. Advanced hyperdrive and reinforced hull plating.',
    color: '#f43f5e', // Rose lasers
    stats: {
      speed: 5.2,
      power: 16,
      rate: 280,
      range: 650,
      shield: 520
    }
  },
  {
    id: 'tie_silencer',
    name: 'TIE/vn Silencer',
    faction: 'dark',
    description: 'Kylo Ren\'s custom interceptor. Hyper-lethal speeds, heavy firepower, and long range.',
    color: '#b91c1c', // Crimson lasers
    stats: {
      speed: 6.5,
      power: 20,
      rate: 240,
      range: 850,
      shield: 480
    }
  }
];

export function getShipDefById(id: string): ShipDef | undefined {
  return [...LIGHT_SHIPS, ...DARK_SHIPS].find(s => s.id === id);
}
