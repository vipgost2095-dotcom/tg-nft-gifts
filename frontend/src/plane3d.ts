// High-fidelity paper-plane generator — original geometry & rendering
// (not traced from any brand asset). Real 3D vertex math for the fold
// shape, animated with a small bounded wobble around a fixed "hero"
// camera angle (like the reference look: a steady, glossy icon with
// gentle motion, lens-flare glints and speed streaks — not a spinning
// low-poly toy).

export interface Vec3 { x: number; y: number; z: number; }

// ---- geometry: folded paper dart, 4 panels ------------------------------
const NOSE: Vec3 = { x: 0, y: 0.05, z: 1.5 };
const SPINE: Vec3 = { x: 0, y: 0.3, z: -1.05 };
const WING_L: Vec3 = { x: -1.35, y: -0.05, z: -0.55 };
const WING_R: Vec3 = { x: 1.35, y: -0.05, z: -0.55 };
const KEEL_TIP: Vec3 = { x: 0, y: -0.55, z: 0.55 };  // bottom fold crease, gives the visible "belly" facet
const FIN_TOP: Vec3 = { x: 0, y: 0.62, z: -0.9 };
const FIN_BACK: Vec3 = { x: 0, y: 0.08, z: -1.35 };

interface Face { verts: [Vec3, Vec3, Vec3]; baseShade: number; }
const FACES: Face[] = [
  { verts: [NOSE, SPINE, WING_L], baseShade: 1.0 },   // top-left wing (brightest)
  { verts: [NOSE, SPINE, WING_R], baseShade: 0.72 },  // top-right wing (shadow side)
  { verts: [NOSE, KEEL_TIP, WING_R], baseShade: 0.45 }, // belly fold facet (darkest, reads as the crease)
  { verts: [SPINE, FIN_TOP, FIN_BACK], baseShade: 0.85 }, // tail fin
];

// ---- materials -----------------------------------------------------------
export interface Material {
  name: string;
  hue: number; sat: number; light: number;
  metalness: number; // drives specular sharpness/intensity
  glow: number;       // 0..1, ambient bloom around sparkles (gems glow more than metals)
  weight: number;
}

export const MATERIALS: Material[] = [
  { name: 'Silver',    hue: 210, sat: 6,  light: 76, metalness: 0.92, glow: 0.3, weight: 13 },
  { name: 'Gold',      hue: 45,  sat: 88, light: 55, metalness: 0.92, glow: 0.4, weight: 12 },
  { name: 'Bronze',    hue: 30,  sat: 55, light: 42, metalness: 0.72, glow: 0.25, weight: 11 },
  { name: 'Copper',    hue: 20,  sat: 68, light: 46, metalness: 0.78, glow: 0.25, weight: 10 },
  { name: 'Ice',       hue: 195, sat: 55, light: 82, metalness: 0.55, glow: 0.55, weight: 9 },
  { name: 'Emerald',   hue: 150, sat: 72, light: 42, metalness: 0.4,  glow: 0.5, weight: 9 },
  { name: 'Sapphire',  hue: 220, sat: 82, light: 42, metalness: 0.4,  glow: 0.5, weight: 8 },
  { name: 'Ruby',      hue: 350, sat: 80, light: 42, metalness: 0.4,  glow: 0.5, weight: 7 },
  { name: 'Amethyst',  hue: 270, sat: 62, light: 50, metalness: 0.4,  glow: 0.5, weight: 6 },
  { name: 'Rose Gold', hue: 15,  sat: 62, light: 66, metalness: 0.88, glow: 0.35, weight: 6 },
  { name: 'Platinum',  hue: 200, sat: 8,  light: 84, metalness: 0.96, glow: 0.3, weight: 4 },
  { name: 'Obsidian',  hue: 260, sat: 25, light: 14, metalness: 0.65, glow: 0.2, weight: 3 },
  { name: 'Diamond',   hue: 195, sat: 12, light: 92, metalness: 0.55, glow: 0.7, weight: 2 },
];

// ---- movement archetypes: bounded wobble around a fixed hero pose -------
export type MovementName =
  | 'Gentle Glide' | 'Hover Flicker' | 'Bank & Turn' | 'Swoop Pulse'
  | 'Spin Flash' | 'Drift Cruise' | 'Windswept' | 'Steady Shine';

interface MovementDef { name: MovementName; weight: number; pose: (t: number, p: MovementParams) => Pose; }
export interface MovementParams { speed: number; amp: number; phase: number; dir: 1 | -1; }
export interface Pose { yaw: number; pitch: number; roll: number; bobY: number; driftX: number; streakBoost: number; }

const TAU = Math.PI * 2;
// hero camera pose — matches a pleasing 3/4 view where the fold facet reads clearly
const HERO = { yaw: 0.5, pitch: -0.22, roll: -0.1 };

const MOVEMENTS: MovementDef[] = [
  { name: 'Gentle Glide', weight: 14, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a) * 0.1 * p.amp, pitch: Math.sin(a * 0.6) * 0.05 * p.amp, roll: Math.sin(a * 0.8) * 0.08 * p.amp * p.dir, bobY: Math.sin(a) * 0.05, driftX: Math.sin(a * 0.5) * 0.03, streakBoost: 0.6 };
  }},
  { name: 'Hover Flicker', weight: 11, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a * 1.3) * 0.06 * p.amp, pitch: Math.sin(a) * 0.04 * p.amp, roll: Math.sin(a * 1.7) * 0.05 * p.amp * p.dir, bobY: Math.sin(a * 1.1) * 0.03, driftX: 0, streakBoost: 0.2 };
  }},
  { name: 'Bank & Turn', weight: 11, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a) * 0.22 * p.amp, pitch: Math.sin(a * 0.5) * 0.06, roll: Math.sin(a) * 0.3 * p.amp * p.dir, bobY: Math.sin(a * 0.7) * 0.04, driftX: Math.sin(a) * 0.06, streakBoost: 0.8 };
  }},
  { name: 'Swoop Pulse', weight: 10, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a * 0.4) * 0.08, pitch: Math.sin(a) * 0.18 * p.amp, roll: -Math.cos(a) * 0.15 * p.amp * p.dir, bobY: -Math.sin(a) * 0.08, driftX: 0, streakBoost: 1 };
  }},
  { name: 'Spin Flash', weight: 8, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a * 0.6) * 0.15, pitch: Math.sin(a * 0.9) * 0.06, roll: Math.sin(a) * 0.35 * p.amp * p.dir, bobY: Math.sin(a * 2) * 0.02, driftX: 0, streakBoost: 1.2 };
  }},
  { name: 'Drift Cruise', weight: 9, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a * 0.5) * 0.12 * p.amp, pitch: Math.sin(a * 0.3) * 0.04, roll: Math.sin(a * 0.4) * 0.1 * p.amp * p.dir, bobY: Math.sin(a * 0.6) * 0.06, driftX: Math.sin(a * 0.3) * 0.08, streakBoost: 0.7 };
  }},
  { name: 'Windswept', weight: 7, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a * 1.5) * 0.09 * p.amp, pitch: Math.sin(a * 1.2) * 0.07 * p.amp, roll: Math.sin(a * 2.1) * 0.14 * p.amp * p.dir, bobY: Math.sin(a * 1.3) * 0.045, driftX: Math.sin(a * 0.9) * 0.04, streakBoost: 0.9 };
  }},
  { name: 'Steady Shine', weight: 6, pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return { yaw: Math.sin(a * 0.25) * 0.04, pitch: Math.sin(a * 0.2) * 0.03, roll: Math.sin(a * 0.35) * 0.04 * p.dir, bobY: Math.sin(a * 0.3) * 0.02, driftX: 0, streakBoost: 0.3 };
  }},
];

function pickWeighted<T extends { weight: number }>(items: T[]): { item: T; rarityPct: number } {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return { item, rarityPct: Math.round((item.weight / total) * 1000) / 10 };
    r -= item.weight;
  }
  const last = items[items.length - 1];
  return { item: last, rarityPct: Math.round((last.weight / total) * 1000) / 10 };
}

export interface PlaneTraits {
  material: Material;
  materialRarity: number;
  hueJitter: number; lightJitter: number; satJitter: number;
  movement: MovementName;
  movementRarity: number;
  movementParams: MovementParams;
  editionSeed: string;
}

export function rollTraits(): PlaneTraits {
  const mat = pickWeighted(MATERIALS);
  const mov = pickWeighted(MOVEMENTS);
  return {
    material: mat.item,
    materialRarity: mat.rarityPct,
    hueJitter: (Math.random() - 0.5) * 14,
    lightJitter: (Math.random() - 0.5) * 8,
    satJitter: (Math.random() - 0.5) * 10,
    movement: mov.item.name,
    movementRarity: mov.rarityPct,
    movementParams: {
      speed: 0.6 + Math.random() * 1.0,
      amp: 0.7 + Math.random() * 0.7,
      phase: Math.random() * TAU,
      dir: Math.random() < 0.5 ? 1 : -1,
    },
    editionSeed: Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
}

// ---- 3D math -----------------------------------------------------------
function rotate(v: Vec3, yaw: number, pitch: number, roll: number): Vec3 {
  let { x, y, z } = v;
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  let y1 = y * cx - z * sx, z1 = y * sx + z * cx;
  y = y1; z = z1;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  let x1 = x * cy + z * sy, z2 = -x * sy + z * cy;
  x = x1; z = z2;
  const cz = Math.cos(roll), sz = Math.sin(roll);
  const x2 = x * cz - y * sz, y2 = x * sz + y * cz;
  return { x: x2, y: y2, z };
}
function project(v: Vec3, W: number, H: number, focal: number, camZ: number) {
  const z = v.z + camZ;
  const scale = focal / Math.max(0.1, z);
  return { x: W / 2 + v.x * scale, y: H / 2 - v.y * scale };
}
function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const len = Math.hypot(n.x, n.y, n.z) || 1;
  return { x: n.x / len, y: n.y / len, z: n.z / len };
}
function normalize(v: Vec3): Vec3 { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; }
function dot(a: Vec3, b: Vec3) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function rgbStr(h: number, s: number, l: number) { const [r, g, b] = hslToRgb(h, s, Math.min(97, Math.max(2, l))); return `rgb(${r},${g},${b})`; }

const LIGHT_DIR = normalize({ x: 0.4, y: 0.85, z: -0.5 });

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, glow: number) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  if (glow > 0) {
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = size * (1.5 + glow * 2);
  }
  // 4-point star: two overlapping stretched diamonds
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -size); ctx.lineTo(size * 0.18, -size * 0.18);
  ctx.lineTo(size, 0); ctx.lineTo(size * 0.18, size * 0.18);
  ctx.lineTo(0, size); ctx.lineTo(-size * 0.18, size * 0.18);
  ctx.lineTo(-size, 0); ctx.lineTo(-size * 0.18, -size * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = alpha * 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.32, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// fixed anchor points (in local unit space) sparkles can appear at
const SPARKLE_ANCHORS: Vec3[] = [WING_L, WING_R, NOSE, KEEL_TIP];

export function drawPlaneFrame(ctx: CanvasRenderingContext2D, W: number, H: number, traits: PlaneTraits, t: number) {
  const mov = MOVEMENTS.find((m) => m.name === traits.movement)!;
  const p = mov.pose(t, traits.movementParams);
  const yaw = HERO.yaw + p.yaw, pitch = HERO.pitch + p.pitch, roll = HERO.roll + p.roll;

  const hue = (traits.material.hue + traits.hueJitter + 360) % 360;
  const sat = Math.min(100, Math.max(0, traits.material.sat + traits.satJitter));
  const light = Math.min(100, Math.max(0, traits.material.light + traits.lightJitter));

  // ---- background: deep purple-to-black studio, matching reference ----
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, `hsl(${260}, 35%, 14%)`);
  bgGrad.addColorStop(0.55, `hsl(${265}, 45%, 8%)`);
  bgGrad.addColorStop(1, `hsl(0, 0%, 2%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // soft glow behind the plane, tinted to material
  const glowGrad = ctx.createRadialGradient(W * 0.55, H * 0.4, 0, W * 0.55, H * 0.4, W * 0.55);
  glowGrad.addColorStop(0, `hsla(${hue}, ${sat}%, ${Math.min(85, light + 10)}%, ${0.18 + traits.material.glow * 0.15})`);
  glowGrad.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, H);

  // low dark horizon silhouette for depth, like the reference
  ctx.fillStyle = 'rgba(10,6,14,0.9)';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.86);
  ctx.bezierCurveTo(W * 0.3, H * 0.78, W * 0.7, H * 0.9, W, H * 0.8);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fill();

  const focal = W * 0.95;
  const camZ = 4.2;
  const scaleUnit = W * 0.19;
  const bobY = p.bobY, driftX = p.driftX;

  const projCache = new Map<Vec3, { x: number; y: number }>();
  const getProjected = (v: Vec3) => {
    if (!projCache.has(v)) {
      const r = rotate(v, yaw, pitch, roll);
      const scaled = { x: (r.x + driftX * 3) * scaleUnit, y: (r.y + bobY * 3) * scaleUnit, z: r.z * scaleUnit };
      projCache.set(v, project(scaled, W, H, focal, camZ * scaleUnit));
    }
    return projCache.get(v)!;
  };

  // grounded shadow
  const shadowY = H * 0.8;
  const shScale = 1 - bobY * 0.5;
  ctx.save();
  ctx.translate(W / 2 + driftX * scaleUnit * 1.5, shadowY);
  ctx.scale(shScale, shScale * 0.22);
  const shGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.24);
  shGrad.addColorStop(0, 'rgba(0,0,0,0.5)'); shGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath(); ctx.arc(0, 0, W * 0.24, 0, TAU); ctx.fill();
  ctx.restore();

  // motion streaks, angle follows roll, length/opacity follow archetype's streakBoost
  const streakAlpha = 0.22 * p.streakBoost;
  if (streakAlpha > 0.03) {
    ctx.save();
    ctx.translate(W * 0.62, H * 0.38);
    ctx.rotate(-0.35 + roll * 0.4);
    ctx.strokeStyle = `hsla(${hue}, ${Math.min(60, sat)}%, 90%, ${streakAlpha})`;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      ctx.lineWidth = W * (0.006 - i * 0.002);
      ctx.beginPath();
      ctx.moveTo(-W * (0.32 - i * 0.05), i * H * 0.05);
      ctx.lineTo(-W * (0.12 - i * 0.03), i * H * 0.05);
      ctx.stroke();
    }
    ctx.restore();
  }

  // faces, painter's algorithm
  const withDepth = FACES.map((f) => {
    const rv = f.verts.map((v) => rotate(v, yaw, pitch, roll));
    const normal = faceNormal(rv[0], rv[1], rv[2]);
    const avgZ = (rv[0].z + rv[1].z + rv[2].z) / 3;
    return { face: f, normal, avgZ };
  }).sort((a, b) => b.avgZ - a.avgZ);

  for (const { face, normal } of withDepth) {
    if (normal.z > 0.05) continue;
    const pts = face.verts.map(getProjected);
    const diffuse = Math.max(0, dot(normal, LIGHT_DIR));
    const halfVec = normalize({ x: LIGHT_DIR.x, y: LIGHT_DIR.y, z: LIGHT_DIR.z + 1 });
    const spec = Math.pow(Math.max(0, dot(normal, halfVec)), 6 + traits.material.metalness * 50) * traits.material.metalness;

    const baseL = light * face.baseShade;
    const shadowStop = rgbStr(hue, sat, Math.max(2, baseL * 0.4 * (0.4 + diffuse * 0.6)));
    const midStop = rgbStr(hue, sat * (1 - traits.material.metalness * 0.1), Math.min(94, baseL * (0.55 + diffuse * 0.7)));
    const highStop = rgbStr(hue, sat * (1 - traits.material.metalness * 0.25), Math.min(97, baseL * (0.6 + diffuse) + spec * 40));

    const minX = Math.min(pts[0].x, pts[1].x, pts[2].x), maxX = Math.max(pts[0].x, pts[1].x, pts[2].x);
    const minY = Math.min(pts[0].y, pts[1].y, pts[2].y), maxY = Math.max(pts[0].y, pts[1].y, pts[2].y);
    const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
    grad.addColorStop(0, highStop);
    grad.addColorStop(0.5, midStop);
    grad.addColorStop(1, shadowStop);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    if (spec > 0.3) {
      ctx.save(); ctx.clip();
      ctx.globalAlpha = Math.min(0.85, spec);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  // crisp rim-light edge along the top silhouette (nose -> wingL -> wingR)
  const rimPts = [WING_L, NOSE, WING_R].map(getProjected);
  ctx.strokeStyle = `hsla(${hue}, ${Math.min(50, sat)}%, 95%, 0.55)`;
  ctx.lineWidth = Math.max(1, W * 0.004);
  ctx.beginPath();
  ctx.moveTo(rimPts[0].x, rimPts[0].y);
  ctx.lineTo(rimPts[1].x, rimPts[1].y);
  ctx.lineTo(rimPts[2].x, rimPts[2].y);
  ctx.stroke();

  // lens-flare sparkles at anchor points, twinkling independently
  SPARKLE_ANCHORS.forEach((anchor, i) => {
    const pos = getProjected(anchor);
    const twinklePhase = (t * (1.3 + i * 0.4) + i * 0.37) % 1;
    const twinkle = Math.max(0, Math.sin(twinklePhase * Math.PI * 2)) ** 3;
    const size = W * (0.02 + i % 2 === 0 ? 0.012 : 0.006);
    drawSparkle(ctx, pos.x, pos.y, size, twinkle * 0.9, traits.material.glow);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `bold ${Math.round(W * 0.038)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`#${traits.editionSeed}`, W / 2, H * 0.95);
}
