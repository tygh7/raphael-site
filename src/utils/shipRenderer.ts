import { Faction } from '../types/space';

// Pixel Art sprite matrices for all 9 spaceships.
// 0 = Transparent
// 1 = Faction/Ship Neon Accent Color
// 2 = Cockpit Glass (glowing blue or Sith red)
// 3 = Engine Thruster Flame (animated)
// 4 = Main Hull Armor Color (Grey, slate, or off-white)

const X_WING_MATRIX = [
  [0,0,0,1,0,0,0,0,0,1,0],
  [0,0,0,1,0,0,0,0,0,1,0],
  [0,0,1,1,1,0,0,0,1,1,0],
  [0,1,1,4,1,1,1,1,1,0,0],
  [1,1,4,4,4,4,4,4,0,0,0],
  [3,3,4,4,2,2,4,4,4,4,4], // Center nose
  [1,1,4,4,4,4,4,4,0,0,0],
  [0,1,1,4,1,1,1,1,1,0,0],
  [0,0,1,1,1,0,0,0,1,1,0],
  [0,0,0,1,0,0,0,0,0,1,0],
  [0,0,0,1,0,0,0,0,0,1,0]
];

const FALCON_MATRIX = [
  [0,0,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,1,1,4,4,4,4,1,1,0,0,0],
  [0,1,4,4,4,4,4,4,4,4,1,0,0],
  [0,1,4,4,4,4,4,4,4,4,4,1,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,1],
  [1,4,4,4,4,2,2,4,4,4,4,4,1],
  [3,4,4,4,4,4,4,4,4,1,1,1,1], // Center fork/mandibles
  [1,4,4,4,4,2,2,4,4,4,4,4,1],
  [1,4,4,4,4,4,4,4,4,4,4,4,1],
  [0,1,4,4,4,4,4,4,4,4,4,1,1],
  [0,1,4,4,4,4,4,4,4,4,1,0,0],
  [0,0,1,1,4,4,4,4,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0]
];

const DELTA_7_MATRIX = [
  [1,1,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,0,0,0,0,0,0,0],
  [1,4,4,1,1,1,0,0,0,0,0],
  [1,4,4,4,4,1,1,1,0,0,0],
  [1,4,4,4,4,4,4,1,1,0,0],
  [3,4,4,2,2,2,4,4,1,1,1], // Pointy triangle nose
  [1,4,4,4,4,4,4,1,1,0,0],
  [1,4,4,4,4,1,1,1,0,0,0],
  [1,4,4,1,1,1,0,0,0,0,0],
  [1,1,1,1,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0]
];

const JEDI_INTERCEPTOR_MATRIX = [
  [0,1,1,1,1,0,0,0,0,0,0],
  [1,1,1,4,4,1,1,0,0,0,0],
  [1,1,4,4,4,4,1,1,0,0,0],
  [1,4,4,4,4,4,4,1,1,0,0],
  [0,1,1,4,2,2,4,1,1,0,0],
  [3,3,1,4,2,2,4,4,1,1,1], // Central cockpit pod
  [0,1,1,4,2,2,4,1,1,0,0],
  [1,4,4,4,4,4,4,1,1,0,0],
  [1,1,4,4,4,4,1,1,0,0,0],
  [1,1,1,4,4,1,1,0,0,0,0],
  [0,1,1,1,1,0,0,0,0,0,0]
];

const SOLAR_SAILER_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0],
  [0,0,1,1,4,4,4,0,0,0,0],
  [0,0,0,4,4,4,4,4,0,0,0],
  [3,1,1,4,2,2,4,4,4,4,4], // Crescent wings
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,1,1,4,4,4,0,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0]
];

const TIE_FIGHTER_MATRIX = [
  [0,0,1,1,1,1,1,1,1,0,0], // Top wing plate
  [0,0,1,4,4,4,4,4,1,0,0], // Top wing solar panels
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut
  [0,0,0,4,4,4,4,4,0,0,0], // Cockpit sphere top
  [0,0,4,4,4,4,2,2,1,0,0], // Cockpit sphere center & red glass window
  [0,0,0,4,4,4,4,4,0,0,0], // Cockpit sphere bottom
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut
  [0,0,1,4,4,4,4,4,1,0,0], // Bottom wing solar panels
  [0,0,1,1,1,1,1,1,1,0,0]  // Bottom wing plate
];

const TIE_VADER_MATRIX = [
  [0,1,1,1,1,1,1,1,0,0,0], // Curved wing curves inward at the back
  [1,1,4,4,4,4,4,1,1,0,0],
  [1,4,0,0,0,4,0,0,4,1,0], // Curved ends
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,4,4,4,4,2,2,1,0,0], // Cockpit
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [1,4,0,0,0,4,0,0,4,1,0], // Curved ends
  [1,1,4,4,4,4,4,1,1,0,0],
  [0,1,1,1,1,1,1,1,0,0,0]
];

const TIE_N2_MATRIX = [
  [1,1,1,1,1,1,0,0,0,1,0], // Sleek prototype angled dagger wings
  [0,1,4,4,4,4,4,1,1,0,0],
  [0,0,1,4,4,0,0,0,0,0,0], // Wing root
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,4,4,4,4,2,2,1,0,0], // Cockpit
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,1,4,4,0,0,0,0,0,0],
  [0,1,4,4,4,4,4,1,1,0,0],
  [1,1,1,1,1,1,0,0,0,1,0]
];

const TIE_SILENCER_MATRIX = [
  [1,1,1,1,1,1,1,1,1,1,1], // Long razor wings extending far past cockpit
  [1,4,4,4,4,4,4,4,4,4,1],
  [0,1,1,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,0,4,4,4,4,4,0,0,0],
  [3,4,4,4,4,4,2,2,1,0,0], // Cockpit with engine flame at back
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,1,1,4,4,0,0,0,0,0],
  [1,4,4,4,4,4,4,4,4,4,1],
  [1,1,1,1,1,1,1,1,1,1,1]
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

  // Pixel size calculated from requested render size
  const pixelSize = size / cols;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Disable smoothing inside rendering logic
  ctx.imageSmoothingEnabled = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellValue = matrix[r][c];
      if (cellValue === 0) continue; // transparent

      const ox = (c - xCenter) * pixelSize;
      const oy = (r - yCenter) * pixelSize;

      switch (cellValue) {
        case 1: // Faction Neon Accent
          ctx.fillStyle = color;
          break;
        case 2: // Cockpit Glass
          ctx.fillStyle = faction === 'light' ? '#38bdf8' : '#ef4444';
          break;
        case 3: // Engine Thruster Flame (flashes if ship is moving)
          if (isMoving && Math.random() < 0.75) {
            ctx.fillStyle = Math.random() < 0.5 ? '#f97316' : '#eab308'; // Orange or Yellow
          } else {
            continue; // skip drawing flame if not moving
          }
          break;
        case 4: // Main Hull Armor
          ctx.fillStyle = faction === 'light' ? '#cbd5e1' : '#334155'; // Grey Rebel / Slate Imperial
          break;
        default:
          ctx.fillStyle = '#ffffff';
      }

      // Draw pixel square
      ctx.fillRect(
        Math.floor(ox),
        Math.floor(oy),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    }
  }

  ctx.restore();
}
