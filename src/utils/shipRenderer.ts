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
  [0,0,4,4,4,4,4,4,4,0,0], // Top wing plate (Grey)
  [0,0,4,1,1,1,1,1,4,0,0], // Top wing solar panels (Black)
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut (Grey)
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut (Grey)
  [0,0,0,4,4,4,4,4,0,0,0], // Cockpit sphere top (Grey)
  [0,0,4,4,4,4,2,2,4,0,0], // Cockpit sphere center & red glass window
  [0,0,0,4,4,4,4,4,0,0,0], // Cockpit sphere bottom (Grey)
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut (Grey)
  [0,0,0,0,0,4,0,0,0,0,0], // Connecting strut (Grey)
  [0,0,4,1,1,1,1,1,4,0,0], // Bottom wing solar panels (Black)
  [0,0,4,4,4,4,4,4,4,0,0]  // Bottom wing plate (Grey)
];

const TIE_VADER_MATRIX = [
  [0,4,4,4,4,4,4,4,0,0,0], // Curved wing curves inward at the back
  [4,4,1,1,1,1,1,4,4,0,0], // Black solar panels
  [4,1,0,0,0,4,0,0,1,4,0], // Black panels
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,4,4,4,4,2,2,4,0,0], // Cockpit
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [4,1,0,0,0,4,0,0,1,4,0],
  [4,4,1,1,1,1,1,4,4,0,0],
  [0,4,4,4,4,4,4,4,0,0,0]
];

const TIE_N2_MATRIX = [
  [4,4,4,4,4,4,0,0,0,4,0], // Sleek prototype angled dagger wings
  [0,4,1,1,1,1,1,4,4,0,0], // Black solar panels
  [0,0,4,1,1,0,0,0,0,0,0], // Black solar panels
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,4,4,4,4,2,2,4,0,0], // Cockpit
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,4,1,1,0,0,0,0,0,0],
  [0,4,1,1,1,1,1,4,4,0,0],
  [4,4,4,4,4,4,0,0,0,4,0]
];

const TIE_SILENCER_MATRIX = [
  [4,4,4,4,4,4,4,4,4,4,4], // Long razor wings extending far past cockpit
  [4,1,1,1,1,1,1,1,1,1,4], // Black panels
  [0,4,4,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,0,4,4,4,4,4,0,0,0],
  [3,4,4,4,4,4,2,2,4,0,0], // Cockpit with engine flame at back
  [0,0,0,4,4,4,4,4,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,0], // Strut
  [0,0,4,4,1,1,0,0,0,0,0],
  [4,1,1,1,1,1,1,1,1,1,4],
  [4,4,4,4,4,4,4,4,4,4,4]
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

  // 2. Draw an ambient plasma engine trail glow if the ship is moving
  if (isMoving) {
    const engineGlow = ctx.createRadialGradient(-size * 0.45, 0, 1, -size * 0.8, 0, size * 0.45);
    engineGlow.addColorStop(0, faction === 'light' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(239, 68, 68, 0.9)');
    engineGlow.addColorStop(0.3, faction === 'light' ? 'rgba(14, 165, 233, 0.35)' : 'rgba(220, 38, 38, 0.4)');
    engineGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(-size * 0.6, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
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

  // 4. Draw ship pixels with local volumetric shading
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

      switch (cellValue) {
        case 1: // Faction Neon Accent
          ctx.fillStyle = accentColor;
          ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          
          // Apply 3D volumetric shading
          if (isTopEdge || isLeftEdge) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // bright highlight
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          } else if (isBottomEdge || isRightEdge) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // dark edge shadow
            ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
          } else {
            // Ambient vertical gradient
            const shadeVal = (r / rows) * 0.25 - 0.08;
            if (shadeVal > 0) {
              ctx.fillStyle = `rgba(0, 0, 0, ${shadeVal})`;
              ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            } else if (shadeVal < 0) {
              ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(shadeVal)})`;
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
        case 3: // Engine Thruster Flame (flashes with white hot core)
          if (isMoving && Math.random() < 0.85) {
            // Animated outer flame
            ctx.fillStyle = Math.random() < 0.4 ? '#ff4500' : (Math.random() < 0.7 ? '#ff8c00' : '#ffd700'); 
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
            // Ambient vertical gradient
            const shadeVal = (r / rows) * 0.24 - 0.08;
            if (shadeVal > 0) {
              ctx.fillStyle = `rgba(0, 0, 0, ${shadeVal})`;
              ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(pixelSize), Math.ceil(pixelSize));
            } else if (shadeVal < 0) {
              ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(shadeVal)})`;
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

  ctx.restore();
}
