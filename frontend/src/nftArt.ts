// Original generative art system — NOT a copy of Telegram Gifts artwork.
// Same idea (Backdrop + Symbol + Model traits with rarity, glossy premium
// card look, animated), but every shape here is our own simple vector icon.

export type IconName =
  | 'heart' | 'star' | 'diamond' | 'ring' | 'crown'
  | 'rocket' | 'trophy' | 'bolt' | 'flower' | 'gem';

const ICONS: IconName[] = ['heart', 'star', 'diamond', 'ring', 'crown', 'rocket', 'trophy', 'bolt', 'flower', 'gem'];

export interface Trait<T> {
  value: T;
  weight: number; // higher = more common
}

function pickWeighted<T>(items: Trait<T>[]): { value: T; rarityPct: number } {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return { value: item.value, rarityPct: Math.round((item.weight / total) * 1000) / 10 };
    r -= item.weight;
  }
  const last = items[items.length - 1];
  return { value: last.value, rarityPct: Math.round((last.weight / total) * 1000) / 10 };
}

const BACKDROPS: Trait<[string, string]>[] = [
  { value: ['#ff6ec4', '#7873f5'], weight: 12 },
  { value: ['#00c6ff', '#0072ff'], weight: 12 },
  { value: ['#f7971e', '#ffd200'], weight: 12 },
  { value: ['#f857a6', '#ff5858'], weight: 10 },
  { value: ['#43cea2', '#185a9d'], weight: 10 },
  { value: ['#ee0979', '#ff6a00'], weight: 8 },
  { value: ['#8e2de2', '#4a00e0'], weight: 8 },
  { value: ['#ff0844', '#ffb199'], weight: 8 },
  { value: ['#0f2027', '#2c5364'], weight: 5 }, // rare dark
  { value: ['#f6d365', '#fda085'], weight: 5 },
  { value: ['#c31432', '#240b36'], weight: 3 }, // rarer
  { value: ['#ffd700', '#ff8c00'], weight: 2 }, // gold, rarest backdrop
];

const MODELS: Trait<IconName>[] = ICONS.map((v, i) => ({
  value: v,
  weight: v === 'gem' || v === 'crown' ? 4 : v === 'trophy' ? 6 : 10 - (i % 3),
}));

const SYMBOLS: Trait<IconName>[] = ICONS.map((v) => ({ value: v, weight: 10 }));

export interface GiftTraits {
  backdrop: [string, string];
  backdropRarity: number;
  model: IconName;
  modelRarity: number;
  symbol: IconName;
  symbolRarity: number;
  editionSeed: string;
}

export function rollTraits(): GiftTraits {
  const bd = pickWeighted(BACKDROPS);
  const md = pickWeighted(MODELS);
  const sy = pickWeighted(SYMBOLS);
  return {
    backdrop: bd.value,
    backdropRarity: bd.rarityPct,
    model: md.value,
    modelRarity: md.rarityPct,
    symbol: sy.value,
    symbolRarity: sy.rarityPct,
    editionSeed: Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
}

// ---- icon path drawing (unit space: centered at 0,0, radius ~1) --------
function iconPath(ctx: CanvasRenderingContext2D, name: IconName) {
  ctx.beginPath();
  switch (name) {
    case 'heart':
      ctx.moveTo(0, 0.3);
      ctx.bezierCurveTo(0.9, -0.5, 0.5, -1.1, 0, -0.5);
      ctx.bezierCurveTo(-0.5, -1.1, -0.9, -0.5, 0, 0.3);
      ctx.closePath();
      break;
    case 'star': {
      const spikes = 5;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? 1 : 0.42;
        const a = (Math.PI / spikes) * i - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case 'diamond':
      ctx.moveTo(0, -1);
      ctx.lineTo(0.75, -0.2);
      ctx.lineTo(0, 1);
      ctx.lineTo(-0.75, -0.2);
      ctx.closePath();
      break;
    case 'ring':
      ctx.arc(0, 0.1, 0.85, 0, Math.PI * 2);
      ctx.moveTo(0.4, -0.5);
      ctx.arc(0, -0.55, 0.28, 0, Math.PI * 2);
      break;
    case 'crown':
      ctx.moveTo(-0.9, 0.5);
      ctx.lineTo(-0.9, -0.1);
      ctx.lineTo(-0.45, 0.25);
      ctx.lineTo(0, -0.6);
      ctx.lineTo(0.45, 0.25);
      ctx.lineTo(0.9, -0.1);
      ctx.lineTo(0.9, 0.5);
      ctx.closePath();
      break;
    case 'rocket':
      ctx.moveTo(0, -1);
      ctx.quadraticCurveTo(0.55, -0.3, 0.4, 0.6);
      ctx.lineTo(0.15, 0.9);
      ctx.lineTo(-0.15, 0.9);
      ctx.lineTo(-0.4, 0.6);
      ctx.quadraticCurveTo(-0.55, -0.3, 0, -1);
      ctx.closePath();
      break;
    case 'trophy':
      ctx.moveTo(-0.5, -0.9);
      ctx.lineTo(0.5, -0.9);
      ctx.lineTo(0.4, 0.1);
      ctx.quadraticCurveTo(0, 0.5, -0.4, 0.1);
      ctx.closePath();
      break;
    case 'bolt':
      ctx.moveTo(0.15, -1);
      ctx.lineTo(-0.5, 0.1);
      ctx.lineTo(-0.05, 0.1);
      ctx.lineTo(-0.15, 1);
      ctx.lineTo(0.5, -0.15);
      ctx.lineTo(0.05, -0.15);
      ctx.closePath();
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5;
        ctx.moveTo(0, 0);
        ctx.ellipse(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.45, 0.28, a, 0, Math.PI * 2);
      }
      break;
    case 'gem':
      ctx.moveTo(-0.7, -0.3);
      ctx.lineTo(0.7, -0.3);
      ctx.lineTo(1, 0);
      ctx.lineTo(0, 1);
      ctx.lineTo(-1, 0);
      ctx.closePath();
      break;
  }
}

function drawGlossyIcon(ctx: CanvasRenderingContext2D, name: IconName, cx: number, cy: number, size: number, hueShift: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size, size);

  const grad = ctx.createLinearGradient(-1, -1, 1, 1);
  grad.addColorStop(0, `hsl(${hueShift}, 90%, 75%)`);
  grad.addColorStop(0.5, `hsl(${hueShift + 20}, 85%, 55%)`);
  grad.addColorStop(1, `hsl(${hueShift + 40}, 80%, 40%)`);

  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 0.06 * 100;
  ctx.shadowOffsetY = 0.04 * 100;

  iconPath(ctx, name);
  ctx.fillStyle = grad;
  ctx.fill();

  // glossy highlight
  ctx.shadowColor = 'transparent';
  ctx.save();
  ctx.clip();
  const shine = ctx.createRadialGradient(-0.3, -0.5, 0, -0.3, -0.5, 1);
  shine.addColorStop(0, 'rgba(255,255,255,0.65)');
  shine.addColorStop(0.4, 'rgba(255,255,255,0.15)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(-1.2, -1.2, 2.4, 2.4);
  ctx.restore();

  ctx.restore();
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// t: animation phase 0..1 (loops). Draws one full frame.
export function drawGiftFrame(ctx: CanvasRenderingContext2D, W: number, H: number, traits: GiftTraits, t: number) {
  ctx.clearRect(0, 0, W, H);

  roundRectPath(ctx, 0, 0, W, H, W * 0.08);
  ctx.save();
  ctx.clip();

  // backdrop gradient, slowly rotating
  const angle = t * Math.PI * 2;
  const cx = W / 2 + Math.cos(angle) * W * 0.1;
  const cy = H / 2 + Math.sin(angle) * H * 0.1;
  const grad = ctx.createRadialGradient(cx, cy, 0, W / 2, H / 2, W * 0.75);
  grad.addColorStop(0, traits.backdrop[0]);
  grad.addColorStop(1, traits.backdrop[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // tiled translucent symbol pattern, slowly drifting
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#ffffff';
  const step = W / 5;
  const drift = (t * step) % step;
  for (let y = -step; y < H + step; y += step) {
    for (let x = -step; x < W + step; x += step) {
      ctx.save();
      ctx.translate(x + drift, y + drift * 0.6);
      ctx.rotate(angle * 0.2);
      const s = step * 0.16;
      ctx.translate(0, 0);
      ctx.scale(s, s);
      iconPath(ctx, traits.symbol);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // floating sparkles
  const sparkleCount = 10;
  for (let i = 0; i < sparkleCount; i++) {
    const phase = (t + i / sparkleCount) % 1;
    const sx = W * (0.15 + 0.7 * ((i * 0.61803398875) % 1));
    const sy = H * (1 - phase);
    const alpha = Math.sin(phase * Math.PI);
    ctx.globalAlpha = Math.max(0, alpha) * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, W * 0.006, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // center model icon, gentle bob + rotation
  const bob = Math.sin(angle) * H * 0.02;
  const wobble = Math.sin(angle * 2) * 0.06;
  const hue = { heart: 340, star: 45, diamond: 200, ring: 50, crown: 48, rocket: 210, trophy: 40, bolt: 55, flower: 320, gem: 280 }[traits.model];
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(wobble);
  drawGlossyIcon(ctx, traits.model, W / 2, H / 2, W * 0.24, hue);
  ctx.restore();

  ctx.restore(); // clip

  // card border
  roundRectPath(ctx, 1, 1, W - 2, H - 2, W * 0.08);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // edition label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `bold ${Math.round(W * 0.045)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`#${traits.editionSeed}`, W / 2, H * 0.93);
}

export const ICON_NAMES = ICONS;
