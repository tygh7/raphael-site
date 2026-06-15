import { Faction } from '../types/space';

// Draw retro pixel-art starships on a canvas 2D context
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
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Set line styling for sharp pixel/vector art
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  // Thrust engine flame drawing
  if (isMoving && Math.random() < 0.75) {
    ctx.strokeStyle = faction === 'light' ? '#38bdf8' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, -size * 0.2);
    ctx.lineTo(-size * (1.2 + Math.random() * 0.4), 0);
    ctx.lineTo(-size * 0.7, size * 0.2);
    ctx.stroke();
  }

  // Draw Specific Ship Designs
  switch (defId) {
    case 'x_wing': {
      // T-65 X-Wing
      ctx.lineWidth = 2;
      ctx.fillStyle = '#e2e8f0'; // White fuselage
      ctx.strokeStyle = '#94a3b8';

      // Fuselage (Central cone)
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, -size * 0.15);
      ctx.lineTo(size * 0.8, 0); // Nose cone
      ctx.lineTo(-size * 0.6, size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit
      ctx.fillStyle = '#0ea5e9'; // Blue glass
      ctx.beginPath();
      ctx.rect(0, -size * 0.08, size * 0.2, size * 0.16);
      ctx.fill();

      // Wing markings (Red stripes)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-size * 0.2, -size * 0.6, size * 0.3, size * 0.1);
      ctx.fillRect(-size * 0.2, size * 0.5, size * 0.3, size * 0.1);

      // Wings (4-wing diagonal flat projection)
      ctx.strokeStyle = color; // Cyan/Green highlight
      ctx.beginPath();
      // Left Wing
      ctx.moveTo(-size * 0.3, -size * 0.15);
      ctx.lineTo(-size * 0.2, -size * 0.75);
      ctx.lineTo(size * 0.1, -size * 0.75); // laser tip
      // Right Wing
      ctx.moveTo(-size * 0.3, size * 0.15);
      ctx.lineTo(-size * 0.2, size * 0.75);
      ctx.lineTo(size * 0.1, size * 0.75); // laser tip
      ctx.stroke();

      // Laser Cannons tips (glowing nozzles)
      ctx.fillStyle = color;
      ctx.fillRect(size * 0.1, -size * 0.78, 4, 4);
      ctx.fillRect(size * 0.1, size * 0.72, 4, 4);
      break;
    }

    case 'falcon': {
      // Millennium Falcon (Disk freighter)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#cbd5e1'; // Grey armor
      ctx.strokeStyle = '#64748b';

      // Circular main saucer
      ctx.beginPath();
      ctx.arc(-size * 0.1, 0, size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Front mandibles (rectangular forks)
      ctx.beginPath();
      ctx.rect(size * 0.2, -size * 0.45, size * 0.5, size * 0.22);
      ctx.rect(size * 0.2, size * 0.23, size * 0.5, size * 0.22);
      ctx.fill();
      ctx.stroke();

      // Central cockpit tube (Offset right)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.45);
      ctx.lineTo(size * 0.3, -size * 0.65);
      ctx.lineTo(size * 0.5, -size * 0.65);
      ctx.lineTo(size * 0.3, -size * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Glass
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(size * 0.35, -size * 0.67, size * 0.12, size * 0.1);

      // Radar dish (offset left)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-size * 0.15, size * 0.3, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blue sublight engine strip (along the back)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-size * 0.12, 0, size * 0.6, Math.PI * 0.8, Math.PI * 1.2);
      ctx.stroke();
      break;
    }

    case 'delta_7': {
      // Delta-7 Jedi Starfighter (Triangle)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#be123c'; // Dark Red
      ctx.strokeStyle = '#be123c';

      // Triangle wings
      ctx.beginPath();
      ctx.moveTo(-size * 0.7, -size * 0.65);
      ctx.lineTo(size * 0.8, 0); // Pointy nose
      ctx.lineTo(-size * 0.7, size * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Central white strip
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, -size * 0.1);
      ctx.lineTo(size * 0.5, 0);
      ctx.lineTo(-size * 0.6, size * 0.1);
      ctx.closePath();
      ctx.fill();

      // Cockpit bubble
      ctx.fillStyle = '#fbbf24'; // Yellow canopy
      ctx.beginPath();
      ctx.ellipse(-size * 0.1, 0, size * 0.22, size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left/Right laser points
      ctx.fillStyle = color;
      ctx.fillRect(size * 0.2, -size * 0.25, 4, 4);
      ctx.fillRect(size * 0.2, size * 0.21, 4, 4);
      break;
    }

    case 'jedi_interceptor': {
      // Eta-2 Jedi Interceptor (Anakin Yellow Interceptor)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#eab308'; // Yellow fuselage
      ctx.strokeStyle = '#ca8a04';

      // Wings plates (left/right rectangles)
      ctx.beginPath();
      ctx.rect(-size * 0.4, -size * 0.65, size * 0.7, size * 0.25);
      ctx.rect(-size * 0.4, size * 0.4, size * 0.7, size * 0.25);
      ctx.fill();
      ctx.stroke();

      // Central cockpit pod (Sphere)
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-size * 0.1, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Green dome (R2-D2 astromech on left wing)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(-size * 0.05, -size * 0.45, size * 0.09, 0, Math.PI * 2);
      ctx.fill();

      // Hexagonal cockpit window
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-size * 0.05, 0, size * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'solar_sailer': {
      // Count Dooku Solar Sailer (Geonosian sail)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#475569'; // Grey metal
      ctx.strokeStyle = '#1e293b';

      // Tear shape capsule pod
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, 0);
      ctx.quadraticCurveTo(-size * 0.1, -size * 0.25, size * 0.5, 0);
      ctx.quadraticCurveTo(-size * 0.1, size * 0.25, -size * 0.6, 0);
      ctx.fill();
      ctx.stroke();

      // Curved giant crescent sails extending behind/above
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)'; // Glowing orange-red sail
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      // Upper sail wing
      ctx.moveTo(-size * 0.3, -size * 0.1);
      ctx.bezierCurveTo(-size * 0.8, -size * 0.6, -size * 0.4, -size * 0.9, -size * 0.1, -size * 0.9);
      ctx.bezierCurveTo(-size * 0.2, -size * 0.6, -size * 0.4, -size * 0.2, -size * 0.3, -size * 0.1);
      // Lower sail wing
      ctx.moveTo(-size * 0.3, size * 0.1);
      ctx.bezierCurveTo(-size * 0.8, size * 0.6, -size * 0.4, size * 0.9, -size * 0.1, size * 0.9);
      ctx.bezierCurveTo(-size * 0.2, size * 0.6, -size * 0.4, size * 0.2, -size * 0.3, size * 0.1);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'tie_fighter': {
      // TIE/ln Fighter (Twin Ion Engine standard)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#1e293b'; // Slate wing outline
      ctx.strokeStyle = '#475569';

      // Hexagonal Solar Panels (Vertical profiles left/right)
      ctx.beginPath();
      // Left wing panel
      ctx.rect(-size * 0.25, -size * 0.7, size * 0.1, size * 0.25);
      ctx.rect(-size * 0.25, size * 0.45, size * 0.1, size * 0.25);
      // Right wing panel (when rotating we see 2 panels)
      ctx.rect(-size * 0.1, -size * 0.75, size * 0.2, 1.5 * size);
      ctx.fill();
      ctx.stroke();

      // Center cabin strut (horizontal tube)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-size * 0.1, 0);
      ctx.lineTo(size * 0.1, 0);
      ctx.stroke();

      // Spherical central cabin
      ctx.lineWidth = 2;
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red central laser eye (window)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(size * 0.08, 0, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tie_vader': {
      // TIE Advanced (Darth Vader curved wings)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#334155'; // Darker grey
      ctx.strokeStyle = '#1e293b';

      // Angled/Curved Solar wing panels (thick outer caps)
      ctx.beginPath();
      // Left curved wing
      ctx.moveTo(-size * 0.3, -size * 0.7);
      ctx.lineTo(-size * 0.1, -size * 0.7);
      ctx.lineTo(size * 0.2, -size * 0.4);
      ctx.lineTo(-size * 0.1, -size * 0.4);
      ctx.closePath();
      // Right curved wing
      ctx.moveTo(-size * 0.3, size * 0.7);
      ctx.lineTo(-size * 0.1, size * 0.7);
      ctx.lineTo(size * 0.2, size * 0.4);
      ctx.lineTo(-size * 0.1, size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing support struts
      ctx.beginPath();
      ctx.rect(-size * 0.4, -size * 0.75, size * 0.15, size * 1.5);
      ctx.fill();
      ctx.stroke();

      // Center sphere
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-size * 0.05, 0, size * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red targeting window
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(size * 0.04, 0, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tie_n2': {
      // TIE Advanced N2 (Swept wings prototype)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';

      // Swept forward wings
      ctx.beginPath();
      // Left wing swept forward
      ctx.moveTo(-size * 0.4, -size * 0.7);
      ctx.lineTo(size * 0.3, -size * 0.7);
      ctx.lineTo(-size * 0.1, -size * 0.3);
      ctx.closePath();
      // Right wing swept forward
      ctx.moveTo(-size * 0.4, size * 0.7);
      ctx.lineTo(size * 0.3, size * 0.7);
      ctx.lineTo(-size * 0.1, size * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center pod
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(-size * 0.1, 0, size * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cockpit glass
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tie_silencer': {
      // TIE Silencer (Kylo Ren interceptor - extremely long pointed wings)
      ctx.lineWidth = 2;
      ctx.fillStyle = '#0f172a'; // Near black
      ctx.strokeStyle = '#334155';

      // Left pointy wing
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.7);
      ctx.lineTo(size * 0.8, -size * 0.7); // wing tip forward
      ctx.lineTo(-size * 0.1, -size * 0.25);
      ctx.closePath();
      // Right pointy wing
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, size * 0.7);
      ctx.lineTo(size * 0.8, size * 0.7);
      ctx.lineTo(-size * 0.1, size * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red laser nozzles on wingtips
      ctx.fillStyle = color;
      ctx.fillRect(size * 0.78, -size * 0.72, 3, 3);
      ctx.fillRect(size * 0.78, size * 0.68, 3, 3);

      // Central fuselage (Spherical pod extended back)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, 0);
      ctx.lineTo(-size * 0.2, -size * 0.2);
      ctx.lineTo(size * 0.2, 0);
      ctx.lineTo(-size * 0.2, size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red cockpit glass (Long slit)
      ctx.fillStyle = '#be123c';
      ctx.fillRect(size * 0.05, -size * 0.05, size * 0.15, size * 0.1);
      break;
    }

    default:
      // Generic placeholder triangle ship
      ctx.lineWidth = 2;
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size * 0.5);
      ctx.lineTo(size * 0.6, 0);
      ctx.lineTo(-size * 0.5, size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }

  ctx.restore();
}
