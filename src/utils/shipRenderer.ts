import { Faction } from '../types/space';

// Pixel Art sprite matrices for all 9 spaceships.
// 0 = Transparent
// 1 = Faction/Ship Neon Accent Color
// 2 = Cockpit Glass (glowing blue or Sith red)
// 3 = Engine Thruster Flame (animated)
// 4 = Main Hull Armor Color (Grey, slate, or off-white)

const X_WING_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // Port wing laser cannon barrel
  [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Wingtip base
  [0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Swept wing panel
  [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Wing panel with red stripes
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0], // Wing root attached to fuselage
  [0,0,0,0,0,0,0,1,1,4,4,4,4,4,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,3,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0], // Engine intake & exhaust (port)
  [0,0,0,0,3,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,2,2,4,4,4,4,4,0,0,0,0,0,0,0], // Fuselage side & cockpit
  [0,0,4,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0], // Nose cone pointing right
  [0,4,4,4,4,4,4,4,4,4,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,4], // Nose tip
  [0,4,4,4,4,4,4,4,4,4,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,4], // Nose tip
  [0,0,4,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0], // Nose cone pointing right
  [0,0,0,4,4,4,4,4,4,4,4,4,2,2,4,4,4,4,4,0,0,0,0,0,0,0], // Fuselage side & cockpit
  [0,0,0,0,3,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,3,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0], // Engine intake & exhaust (starboard)
  [0,0,0,0,0,0,0,1,1,4,4,4,4,4,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0], // Wing root
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Wing panel with red stripes
  [0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Swept wing panel
  [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Wingtip base
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // Starboard wing laser cannon barrel
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const FALCON_MATRIX = [
  [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0],
  [0,0,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,0,0,0,0],
  [0,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,0,0,0],
  [0,1,4,4,4,4,4,4,4,4,4,1,1,1,1,4,4,4,4,4,4,4,1,1,0,0], // Sensor dish (represented by accent 1) at columns 11-14
  [1,1,4,4,4,4,4,4,4,4,1,1,1,1,4,4,4,4,4,4,4,4,4,1,1,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
  [3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,1,1], // Center mandible top half
  [3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0], // Center gap between mandibles
  [3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0], // Center gap
  [3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,1,1], // Center mandible bottom half
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,2,4,4,1], // Cockpit pod on bottom right
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,2,2,2,4,1], // Cockpit glass window
  [1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,2,2,2,4,1], // Cockpit glass window
  [0,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2,2,4,4,1], // Cockpit pod
  [0,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,0,0,0],
  [0,0,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,0,0,0,0],
  [0,0,0,1,1,1,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0]
];

const DELTA_7_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,1,2,2,1,0,0,0,0,0,0,0,0,0], // Astromech droid dome (R4-P17) at columns 14-15
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0],
  [3,4,4,4,4,4,4,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,1,1,1,1], // Cockpit & nose cone
  [3,4,4,4,4,4,4,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,1,1,1,1],
  [3,4,4,4,4,4,4,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,1,1,1,1],
  [3,4,4,4,4,4,4,2,2,2,2,2,2,4,4,4,4,4,4,4,4,4,1,1,1,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,4,4,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,4,4,4,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const JEDI_INTERCEPTOR_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Upper wing flap
  [0,1,1,1,1,1,1,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,4,4,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [1,1,1,4,4,4,4,2,2,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0], // Astromech dome (R2-D2) at columns 7-8
  [1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,1,1,1,1,4,4,4,4,4,4,1,1,1,0,0,0],
  [0,1,1,1,1,4,4,4,4,1,1,2,2,1,1,4,4,4,4,4,4,1,1,1,0,0],
  [3,3,3,3,1,1,4,4,4,1,2,2,2,2,1,4,4,4,4,4,4,4,1,1,1,1], // Split nose fork and cockpit glass
  [3,3,3,3,1,1,4,4,4,1,2,2,2,2,1,4,4,4,4,4,4,4,1,1,1,1],
  [3,3,3,3,1,1,4,4,4,1,2,2,2,2,1,4,4,4,4,4,4,4,1,1,1,1],
  [3,3,3,3,1,1,4,4,4,1,2,2,2,2,1,4,4,4,4,4,4,4,1,1,1,1],
  [0,1,1,1,1,4,4,4,4,1,1,2,2,1,1,4,4,4,4,4,4,1,1,1,0,0],
  [1,4,4,4,4,4,4,4,4,4,1,1,1,1,4,4,4,4,4,4,1,1,1,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0],
  [1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0],
  [1,1,1,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0],
  [1,1,1,1,1,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Lower wing flap
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const SOLAR_SAILER_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Geonosian curved prongs (bronze/copper accent)
  [0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0],
  [0,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0],
  [0,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0],
  [0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0],
  [0,4,4,4,4,4,4,4,4,4,4,4,2,2,2,4,4,4,4,4,1,1,1,0,0,0], // Seed-shaped cockpit & nose cone
  [3,3,3,1,1,1,1,1,4,4,4,4,2,2,2,4,4,4,4,4,4,1,1,1,0,0],
  [3,3,3,1,1,1,1,1,4,4,4,4,2,2,2,4,4,4,4,4,4,4,1,1,1,0],
  [3,3,3,1,1,1,1,1,4,4,4,4,2,2,2,4,4,4,4,4,4,4,1,1,1,0],
  [3,3,3,1,1,1,1,1,4,4,4,4,2,2,2,4,4,4,4,4,4,1,1,1,0,0],
  [0,4,4,4,4,4,4,4,4,4,4,4,2,2,2,4,4,4,4,4,1,1,1,0,0,0],
  [0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0],
  [0,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0],
  [0,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,0,0,0,0,0,0],
  [0,1,1,1,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,4,4,4,4,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,4,4,4,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Geonosian curved prongs
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const TIE_FIGHTER_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0], // Top solar panel frame
  [0,0,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,0], // Solar panels (black accent)
  [0,0,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0], // Connecting struts
  [0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0], // Spherical cockpit sphere
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0], // Center cockpit window (Sith red target)
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0], // Connecting struts
  [0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,0], // Bottom solar panel frame
  [0,0,0,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const TIE_VADER_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0], // Curved wing top
  [0,0,4,4,4,4,1,1,1,1,1,1,1,1,1,1,4,4,4,4,0,0,0,0,0,0], // Solar panels
  [0,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0,0,0,0,0],
  [4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0,0,0,0],
  [4,1,1,1,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0], // Connecting struts
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0], // Fuselage elongated for hyperdrive
  [0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [3,3,3,4,4,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,0,0], // Cockpit & Long rear engine
  [3,3,3,4,4,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,0,0],
  [3,3,3,4,4,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,0,0],
  [3,3,3,4,4,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,0,0],
  [0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [4,1,1,1,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0], // Connecting struts
  [4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0,0,0,0],
  [0,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0,0,0,0,0],
  [0,0,4,4,4,4,1,1,1,1,1,1,1,1,1,1,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0] // Curved wing bottom
];

const TIE_N2_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,0], // Sleek angled dagger wings (TIE Interceptor style)
  [0,4,4,4,4,4,1,1,1,1,1,1,1,1,4,4,4,0,0,0,0,4,4,1,1,0],
  [0,0,4,4,4,4,1,1,1,1,1,1,1,1,1,1,4,4,4,0,0,4,1,1,0,0],
  [0,0,0,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,1,1,0,0,0], // Solar panels
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0], // Connecting struts
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0], // Cockpit window
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0], // Connecting struts
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0,4,4,4,4,4,4,4,4,0,0,0,0],
  [0,0,0,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,1,1,0,0,0],
  [0,0,4,4,4,4,1,1,1,1,1,1,1,1,1,1,4,4,4,0,0,4,1,1,0,0],
  [0,4,4,4,4,4,1,1,1,1,1,1,1,1,4,4,4,0,0,0,0,4,4,1,1,0],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,0], // Lower dagger wing
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const TIE_SILENCER_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0], // Long razor wings (TIE Silencer style)
  [4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0],
  [4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0], // Solar panels (black accent)
  [0,4,4,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0], // Connecting struts
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0], // Angled cockpit window (Kylo's red viewport)
  [3,3,3,3,3,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [3,3,3,3,3,4,4,4,4,4,4,4,4,2,2,2,2,4,4,4,4,4,4,4,4,4,0,0],
  [0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0], // Connecting struts
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0],
  [0,4,4,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,0,0],
  [4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0],
  [4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,0], // Solar panels (black accent)
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// Helper to resolve ship matrices
function getShipMatrix(defId: string): number[][] {
  switch (defId) {
    case 'x_wing': return X_WING_MATRIX;
    case 'falcon': return FALCON_MATRIX;
    case 'delta_7': return DELTA_7_MATRIX;
    case 'jedi_interceptor': return JEDI_INTERCEPTOR_MATRIX;
    case 'solar_sailer': return SOLAR_SAILER_MATRIX;
    case 'tie_fighter': return TIE_FIGHTER_MATRIX;
    case 'tie_vader': return TIE_VADER_MATRIX;
    case 'tie_n2': return TIE_N2_MATRIX;
    case 'tie_silencer': return TIE_SILENCER_MATRIX;
    default: return X_WING_MATRIX;
  }
}

// Draw retro pixel-art starships on a canvas 2D context using matrices (sprite feel)
export function drawPixelShip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  angle: number,
  defId: string,
  faction: Faction,
  color: string,
  isMoving: boolean
): void {
  const matrix = getShipMatrix(defId);
  const rows = matrix.length;
  const cols = matrix[0].length;

  const xCenter = (cols - 1) / 2;
  const yCenter = (rows - 1) / 2;

  // Determine ship-specific colors
  let accentColor = color;
  let glassColor = faction === 'light' ? '#38bdf8' : '#ef4444';
  let hullColor = faction === 'light' ? '#cbd5e1' : '#334155';

  switch (defId) {
    case 'x_wing':
      accentColor = '#dc2626'; // Red squadron stripes (high contrast)
      glassColor = '#67e8f9';  // Bright cyan glass
      hullColor = '#f1f5f9';   // Rebel light grey
      break;
    case 'falcon':
      accentColor = '#991b1b'; // Weathered dark red/rust trim
      glassColor = '#22d3ee';  // Vibrant cyan cockpit glow
      hullColor = '#cbd5e1';   // Weathered beige-grey plating
      break;
    case 'delta_7':
      accentColor = '#dc2626'; // Jedi red markings
      glassColor = '#38bdf8';  // Light blue glass
      hullColor = '#f8fafc';   // Pristine white armor
      break;
    case 'jedi_interceptor':
      accentColor = '#fbbf24'; // Anakin's gold-yellow trim
      glassColor = '#4ade80';  // Glowing green cockpit
      hullColor = '#475569';   // Dark steel hull
      break;
    case 'solar_sailer':
      accentColor = '#ea580c'; // Bronze sail frame
      glassColor = '#f43f5e';  // Crimson glass window
      hullColor = '#5c1d02';   // Count Dooku's copper-brown hull
      break;
    case 'tie_fighter':
      accentColor = '#09090b'; // Obsidian black panels (high contrast)
      glassColor = '#ef4444';  // Sith red target window
      hullColor = '#cbd5e1';   // Classic Imperial blue-grey metal
      break;
    case 'tie_vader':
      accentColor = '#09090b'; // Imperial dark panels
      glassColor = '#ef4444';  // Menacing red cockpit glint
      hullColor = '#64748b';   // Darth Vader's custom slate grey metal
      break;
    case 'tie_n2':
      accentColor = '#ef4444'; // Glowing red power lines
      glassColor = '#f97316';  // Orange-red target glass
      hullColor = '#0f172a';   // Obsidian dark carbon fiber hull
      break;
    case 'tie_silencer':
      accentColor = '#020617'; // Deep dark panels
      glassColor = '#f43f5e';  // Kylo Ren's crimson viewport
      hullColor = '#475569';   // Dark metallic slate hull
      break;
  }

  // Pixel size calculated from requested render size
  const pixelSize = size / cols;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Disable smoothing inside rendering logic
  ctx.imageSmoothingEnabled = false;

  // 1. Draw detailed glowing double deflector shield rings around the ship
  ctx.strokeStyle = faction === 'light' ? 'rgba(56, 189, 248, 0.06)' : 'rgba(239, 68, 68, 0.08)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = faction === 'light' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(239, 68, 68, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  // Find cockpit and engine pixels beforehand for advanced localized rendering
  const enginePixels: { r: number; c: number }[] = [];
  const cockpitPixels: { r: number; c: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = matrix[r][c];
      if (val === 3) enginePixels.push({ r, c });
      if (val === 2) cockpitPixels.push({ r, c });
    }
  }

  // 2. Draw localized engine plasma trails for each engine port (pixels value 3)
  if (isMoving && enginePixels.length > 0) {
    enginePixels.forEach(ep => {
      const ox = (ep.c - xCenter) * pixelSize;
      const oy = (ep.r - yCenter) * pixelSize;
      
      // Localized flame trail pointing backwards (leftwards relative to right-facing ship)
      const trailLength = size * (0.35 + Math.sin(Date.now() * 0.025 + ep.r * 1.5) * 0.08);
      const thrusterGlow = ctx.createRadialGradient(ox, oy, 1, ox - trailLength, oy, size * 0.2);
      thrusterGlow.addColorStop(0, faction === 'light' ? 'rgba(56, 189, 248, 0.95)' : 'rgba(239, 68, 68, 0.98)');
      thrusterGlow.addColorStop(0.25, faction === 'light' ? 'rgba(14, 165, 233, 0.55)' : 'rgba(220, 38, 38, 0.6)');
      thrusterGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = thrusterGlow;
      ctx.beginPath();
      ctx.arc(ox - trailLength * 0.5, oy, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 3. Draw a global 3D depth drop-shadow cast behind the ship (making it pop off the canvas)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  const shadowOffset = size * 0.11;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellValue = matrix[r][c];
      if (cellValue === 0 || cellValue === 3) continue; // Skip empty space & engine flame
      const ox = (c - xCenter) * pixelSize + shadowOffset;
      const oy = (r - yCenter) * pixelSize + shadowOffset;
      ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
    }
  }

  // 4. Draw ship pixels with local volumetric shading & greeble textures
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellValue = matrix[r][c];
      if (cellValue === 0) continue; // transparent

      const ox = (c - xCenter) * pixelSize;
      const oy = (r - yCenter) * pixelSize;

      // Identify local edge neighbors for 3D highlights & shadows
      const isTopEdge = r > 0 && matrix[r - 1][c] === 0;
      const isBottomEdge = r < rows - 1 && matrix[r + 1][c] === 0;
      const isLeftEdge = c > 0 && matrix[r][c - 1] === 0;
      const isRightEdge = c < cols - 1 && matrix[r][c + 1] === 0;

      // Deterministic greeble shading factor for complex mechanical detailing
      const hash = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
      const greebleShade = (hash - 0.5) * 0.16; // luminosity variation of +/- 8%

      switch (cellValue) {
        case 1: // Faction Neon Accent
          ctx.fillStyle = accentColor;
          ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          
          // Apply 3D volumetric shading or mechanical greeble details
          if (isTopEdge || isLeftEdge) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // bright highlight
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          } else if (isBottomEdge || isRightEdge) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // dark edge shadow
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          } else {
            // Internal greeble detailing
            if (greebleShade > 0) {
              ctx.fillStyle = `rgba(0, 0, 0, ${greebleShade})`;
              ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            } else {
              ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(greebleShade)})`;
              ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            }
          }
          break;
        case 2: // Cockpit Glass with glint reflection & glow
          ctx.fillStyle = glassColor;
          ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          
          // Glint reflection
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize * 0.4), Math.ceil(pixelSize * 0.4));
          
          // Radial glow inside cockpit glass for 3D look
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(Math.floor(ox + pixelSize * 0.3), Math.floor(oy + pixelSize * 0.3), Math.ceil(pixelSize * 0.45), Math.ceil(pixelSize * 0.45));
          break;
        case 3: // Engine Thruster Flame (oscillates organically)
          if (isMoving) {
            // Pulse width based on time
            const timePulse = Math.sin(Date.now() * 0.02 + r * 0.7) * 0.5 + 0.5;
            ctx.fillStyle = timePulse < 0.35 ? '#ff4500' : (timePulse < 0.75 ? '#ff8c00' : '#ffd700'); 
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            
            // White hot core
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.floor(ox + pixelSize * 0.2), Math.floor(oy + pixelSize * 0.2), Math.ceil(pixelSize * 0.6), Math.ceil(pixelSize * 0.6));
          }
          break;
        case 4: // Main Hull Armor
          ctx.fillStyle = hullColor;
          ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          
          // Apply 3D volumetric shading
          if (isTopEdge || isLeftEdge) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'; // bright highlight
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          } else if (isBottomEdge || isRightEdge) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.32)'; // dark edge shadow
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          } else {
            // Internal greeble paneling
            if (greebleShade > 0) {
              ctx.fillStyle = `rgba(0, 0, 0, ${greebleShade * 0.8})`;
              ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            } else {
              ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(greebleShade) * 0.8})`;
              ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            }
          }
          break;
        default:
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
      }
    }
  }

  // 5. Draw a glowing neon bloom overlay centered on the cockpit
  if (cockpitPixels.length > 0) {
    let sumX = 0, sumY = 0;
    cockpitPixels.forEach(p => {
      sumX += (p.c - xCenter) * pixelSize + pixelSize / 2;
      sumY += (p.r - yCenter) * pixelSize + pixelSize / 2;
    });
    const avgX = sumX / cockpitPixels.length;
    const avgY = sumY / cockpitPixels.length;

    const factionGlowColor = faction === 'light' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(239, 68, 68, 0.26)';
    const cockpitGlow = ctx.createRadialGradient(avgX, avgY, 1, avgX, avgY, size * 0.28);
    cockpitGlow.addColorStop(0, factionGlowColor);
    cockpitGlow.addColorStop(0.4, factionGlowColor.replace(/[\d.]+\)$/, '0.08)'));
    cockpitGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = cockpitGlow;
    ctx.beginPath();
    ctx.arc(avgX, avgY, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
