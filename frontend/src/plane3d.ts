// Original low-poly 3D paper-plane generator — real 3D vertex math
// (rotation matrices + perspective projection + per-face flat shading),
// not a 2D image trick and not a copy of any brand's logo artwork.

export interface Vec3 { x: number; y: number; z: number; }

// ---- geometry: a minimal 3-panel folded paper dart ----------------------
const NOSE: Vec3 = { x: 0, y: 0, z: 1.4 };
const SPINE: Vec3 = { x: 0, y: 0.22, z: -1.15 };
const WING_L: Vec3 = { x: -1.3, y: -0.05, z: -0.6 };
const WING_R: Vec3 = { x: 1.3, y: -0.05, z: -0.6 };
const FIN_TOP: Vec3 = { x: 0, y: 0.6, z: -0.95 };
const FIN_BACK: Vec3 = { x: 0, y: 0.02, z: -1.3 };

interface Face { verts: [Vec3, Vec3, Vec3]; baseShade: number; } // baseShade tweaks brightness per panel
const FACES: Face[] = [
  { verts: [NOSE, SPINE, WING_L], baseShade: 1.0 },
  { verts: [NOSE, SPINE, WING_R], baseShade: 0.78 },
  { verts: [SPINE, FIN_TOP, FIN_BACK], baseShade: 0.9 },
];

// ---- materials -----------------------------------------------------------
export interface Material {
  name: string;
  hue: number; sat: number; light: number;
  metalness: number; // 0..1, drives specular sharpness/intensity
  weight: number;
}

export const MATERIALS: Material[] = [
  { name: 'Silver',    hue: 210, sat: 6,  light: 75, metalness: 0.9,  weight: 14 },
  { name: 'Gold',      hue: 45,  sat: 85, light: 55, metalness: 0.9,  weight: 12 },
  { name: 'Bronze',    hue: 30,  sat: 55, light: 40, metalness: 0.7,  weight: 12 },
  { name: 'Copper',    hue: 20,  sat: 65, light: 45, metalness: 0.75, weight: 12 },
  { name: 'Emerald',   hue: 150, sat: 70, light: 42, metalness: 0.35, weight: 9 },
  { name: 'Sapphire',  hue: 220, sat: 80, light: 42, metalness: 0.35, weight: 9 },
  { name: 'Ruby',      hue: 350, sat: 80, light: 42, metalness: 0.35, weight: 8 },
  { name: 'Amethyst',  hue: 270, sat: 60, light: 50, metalness: 0.35, weight: 7 },
  { name: 'Rose Gold', hue: 15,  sat: 60, light: 65, metalness: 0.85, weight: 7 },
  { name: 'Platinum',  hue: 200, sat: 8,  light: 82, metalness: 0.95, weight: 4 },
  { name: 'Obsidian',  hue: 260, sat: 25, light: 14, metalness: 0.6,  weight: 3 },
  { name: 'Diamond',   hue: 200, sat: 10, light: 90, metalness: 0.5,  weight: 3 },
];

// ---- movement archetypes ---------------------------------------------
export type MovementName = 'Steady Cruise' | 'Barrel Roll' | 'Figure-8 Weave' | 'Corkscrew Climb' | 'Swoop Dive' | 'Hover Wobble';

interface MovementDef {
  name: MovementName;
  weight: number;
  pose: (t: number, p: MovementParams) => Pose;
}
export interface MovementParams { speed: number; amp: number; phase: number; dir: 1 | -1; }
export interface Pose { yaw: number; pitch: number; roll: number; bobY: number; }

const TAU = Math.PI * 2;

const MOVEMENTS: MovementDef[] = [
  {
    name: 'Steady Cruise', weight: 10,
    pose: (t, p) => ({
      yaw: t * TAU * p.speed * p.dir + p.phase,
      pitch: Math.sin(t * TAU + p.phase) * 0.08 * p.amp,
      roll: Math.sin(t * TAU * 0.5 + p.phase) * 0.15 * p.amp,
      bobY: Math.sin(t * TAU + p.phase) * 0.06,
    }),
  },
  {
    name: 'Barrel Roll', weight: 9,
    pose: (t, p) => ({
      yaw: Math.sin(t * TAU * 0.5 + p.phase) * 0.3,
      pitch: Math.sin(t * TAU + p.phase) * 0.1,
      roll: t * TAU * p.speed * p.dir * 1.5 + p.phase,
      bobY: Math.sin(t * TAU * 2 + p.phase) * 0.04,
    }),
  },
  {
    name: 'Figure-8 Weave', weight: 9,
    pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return {
        yaw: Math.sin(a) * 0.7 * p.amp,
        pitch: Math.sin(a * 2) * 0.35 * p.amp,
        roll: Math.cos(a) * 0.5 * p.amp * p.dir,
        bobY: Math.sin(a * 2) * 0.08,
      };
    },
  },
  {
    name: 'Corkscrew Climb', weight: 8,
    pose: (t, p) => ({
      yaw: t * TAU * p.speed * 2 * p.dir + p.phase,
      pitch: -0.25 * p.amp + Math.sin(t * TAU + p.phase) * 0.05,
      roll: t * TAU * p.speed * 2 * p.dir + p.phase,
      bobY: (t - 0.5) * -0.4 * p.amp,
    }),
  },
  {
    name: 'Swoop Dive', weight: 8,
    pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      const pitch = Math.sin(a) * 0.55 * p.amp;
      return {
        yaw: Math.sin(a * 0.5) * 0.2,
        pitch,
        roll: -Math.cos(a) * 0.4 * p.amp * p.dir,
        bobY: -Math.sin(a) * 0.15,
      };
    },
  },
  {
    name: 'Hover Wobble', weight: 6,
    pose: (t, p) => {
      const a = t * TAU * p.speed + p.phase;
      return {
        yaw: Math.sin(a * 0.7) * 0.15 * p.amp,
        pitch: Math.sin(a) * 0.1 * p.amp,
        roll: Math.sin(a * 1.3) * 0.12 * p.amp,
        bobY: Math.sin(a) * 0.05,
      };
    },
  },
];

// ---- weighted pick helper -------------------------------------------
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
  hueJitter: number; lightJitter: number; satJitter: number; // makes every mint's color slightly unique
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
    hueJitter: (Math.random() - 0.5) * 12,     // ±6°
    lightJitter: (Math.random() - 0.5) * 8,    // ±4%
    satJitter: (Math.random() - 0.5) * 10,     // ±5%
    movement: mov.item.name,
    movementRarity: mov.rarityPct,
    movementParams: {
      speed: 0.7 + Math.random() * 0.9,
      amp: 0.7 + Math.random() * 0.6,
      phase: Math.random() * TAU,
      dir: Math.random() < 0.5 ? 1 : -1,
    },
    editionSeed: Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
}

// ---- 3D math -----------------------------------------------------------
function rotate(v: Vec3, yaw: number, pitch: number, roll: number): Vec3 {
  // yaw (Y), then pitch (X), then roll (Z)
  let { x, y, z } = v;
  let cx = Math.cos(pitch), sx = Math.sin(pitch);
  let y1 = y * cx - z * sx, z1 = y * sx + z * cx;
  y = y1; z = z1;
  let cy = Math.cos(yaw), sy = Math.sin(yaw);
  let x1 = x * cy + z * sy, z2 = -x * sy + z * cy;
  x = x1; z = z2;
  let cz = Math.cos(roll), sz = Math.sin(roll);
  let x2 = x * cz - y * sz, y2 = x * sz + y * cz;
  return { x: x2, y: y2, z };
}

function project(v: Vec3, W: number, H: number, focal: number, camZ: number) {
  const z = v.z + camZ;
  const scale = focal / Math.max(0.1, z);
  return { x: W / 2 + v.x * scale, y: H / 2 - v.y * scale, depth: z, scale };
}

function faceNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const len = Math.hypot(n.x, n.y, n.z) || 1;
  return { x: n.x / len, y: n.y / len, z: n.z / len };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const LIGHT_DIR = normalize({ x: 0.45, y: 0.8, z: -0.6 });
function normalize(v: Vec3): Vec3 { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; }
function dot(a: Vec3, b: Vec3) { return a.x * b.x + a.y * b.y + a.z * b.z; }

// ---- frame renderer ------------------------------------------------------
export function drawPlaneFrame(ctx: CanvasRenderingContext2D, W: number, H: number, traits: PlaneTraits, t: number) {
  const mov = MOVEMENTS.find((m) => m.name === traits.movement)!;
  const pose = mov.pose(t, traits.movementParams);

  const hue = (traits.material.hue + traits.hueJitter + 360) % 360;
  const sat = Math.min(100, Math.max(0, traits.material.sat + traits.satJitter));
  const light = Math.min(100, Math.max(0, traits.material.light + traits.lightJitter));

  // ---- background: soft studio vignette tinted by material ----
  const bgGrad = ctx.createRadialGradient(W / 2, H * 0.42, W * 0.05, W / 2, H * 0.5, W * 0.75);
  bgGrad.addColorStop(0, `hsl(${hue}, ${Math.min(40, sat)}%, 18%)`);
  bgGrad.addColorStop(1, `hsl(${hue}, ${Math.min(40, sat)}%, 6%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // drifting light particles tinted to material, denser for rarer materials
  const particleCount = Math.round(6 + (100 - traits.materialRarity) * 0.12);
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 7.37;
    const px = W * ((Math.sin(seed) * 0.5 + 0.5));
    const py = H * ((t + i / particleCount) % 1);
    const alpha = Math.sin(((t + i / particleCount) % 1) * Math.PI) * 0.5;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = `hsl(${hue}, ${sat}%, ${Math.min(90, light + 20)}%)`;
    ctx.beginPath();
    ctx.arc(px, py, W * 0.004, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ---- 3D plane -----------------------------------------------------
  const focal = W * 0.9;
  const camZ = 4.2;
  const scaleUnit = W * 0.16;
  const bobY = pose.bobY;

  const projected = new Map<Vec3, ReturnType<typeof project>>();
  const getProjected = (v: Vec3) => {
    if (!projected.has(v)) {
      const r = rotate(v, pose.yaw, pose.pitch, pose.roll);
      const scaled = { x: r.x * scaleUnit, y: (r.y + bobY * 3) * scaleUnit, z: r.z * scaleUnit };
      projected.set(v, project(scaled, W, H, focal, camZ * scaleUnit));
    }
    return projected.get(v)!;
  };

  // shadow beneath, size follows bob for a grounded feel
  const shadowY = H * 0.78;
  const shadowScale = 1 - bobY * 0.6;
  ctx.save();
  ctx.translate(W / 2, shadowY);
  ctx.scale(shadowScale, shadowScale * 0.28);
  const shGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.22);
  shGrad.addColorStop(0, 'rgba(0,0,0,0.45)');
  shGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.arc(0, 0, W * 0.22, 0, TAU);
  ctx.fill();
  ctx.restore();

  // motion streak behind the plane, aligned with roll/yaw for a sense of speed
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(pose.roll * 0.3);
  ctx.globalAlpha = 0.18;
  const streakGrad = ctx.createLinearGradient(-W * 0.3, 0, W * 0.05, 0);
  streakGrad.addColorStop(0, 'rgba(255,255,255,0)');
  streakGrad.addColorStop(1, `hsl(${hue}, ${sat}%, ${Math.min(95, light + 25)}%)`);
  ctx.fillStyle = streakGrad;
  ctx.fillRect(-W * 0.3, -H * 0.015, W * 0.35, H * 0.03);
  ctx.restore();
  ctx.globalAlpha = 1;

  // sort faces back-to-front (painter's algorithm)
  const facesWithDepth = FACES.map((f) => {
    const rotatedVerts = f.verts.map((v) => rotate(v, pose.yaw, pose.pitch, pose.roll));
    const normal = faceNormal(rotatedVerts[0], rotatedVerts[1], rotatedVerts[2]);
    const avgZ = (rotatedVerts[0].z + rotatedVerts[1].z + rotatedVerts[2].z) / 3;
    return { face: f, normal, avgZ };
  }).sort((a, b) => b.avgZ - a.avgZ);

  for (const { face, normal } of facesWithDepth) {
    // backface cull (camera looks down -Z toward origin from +camZ)
    if (normal.z > 0.05) continue;

    const pts = face.verts.map(getProjected);

    const diffuse = Math.max(0, dot(normal, LIGHT_DIR));
    const viewDir = normalize({ x: 0, y: 0, z: 1 });
    const halfVec = normalize({ x: LIGHT_DIR.x + viewDir.x, y: LIGHT_DIR.y + viewDir.y, z: LIGHT_DIR.z + viewDir.z });
    const spec = Math.pow(Math.max(0, dot(normal, halfVec)), 8 + traits.material.metalness * 40) * traits.material.metalness;

    const baseL = light * face.baseShade;
    const shadedL = Math.min(96, baseL * (0.35 + diffuse * 0.9) + spec * 55);
    const [r, g, b] = hslToRgb(hue, sat * (1 - traits.material.metalness * 0.15), shadedL);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fill();

    if (spec > 0.35) {
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = Math.min(0.8, spec);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  // edition label
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = `bold ${Math.round(W * 0.04)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`#${traits.editionSeed}`, W / 2, H * 0.94);
}
