import { useCallback, useRef, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useTranslation } from 'react-i18next';

const COLLECTION_ADDRESS = import.meta.env.VITE_COLLECTION_ADDRESS as string;

// ---- procedural "gift" image generator ---------------------------------
// Draws a unique glassmorphism-style card each time. No external AI API
// needed to get a working generator; swap generateImage() for a call to
// your own image-gen backend endpoint later if you want real AI art.
function generateImage(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;

  const palettes = [
    ['#ff6ec4', '#7873f5'],
    ['#00c6ff', '#0072ff'],
    ['#f7971e', '#ffd200'],
    ['#f857a6', '#ff5858'],
    ['#43cea2', '#185a9d'],
    ['#ee0979', '#ff6a00'],
  ];
  const [c1, c2] = palettes[Math.floor(Math.random() * palettes.length)];

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // soft glass circles
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const r = 40 + Math.random() * 120;
    ctx.arc(Math.random() * W, Math.random() * H, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`;
    ctx.fill();
  }

  // center glass panel
  const pad = W * 0.12;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 32);
  ctx.stroke();

  const seed = Math.random().toString(36).slice(2, 8).toUpperCase();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GIFT', W / 2, H / 2 - 10);
  ctx.font = '16px sans-serif';
  ctx.fillText(`#${seed}`, W / 2, H / 2 + 20);

  return { dataUrl: canvas.toDataURL('image/png'), seed };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// polling: Getgems mints async, so we wait for status "ready"
async function pollMintStatus(backendUrl: string, requestId: string, tries = 20): Promise<any> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${backendUrl}/api/mint/${requestId}`);
    const data = await res.json();
    const status = data?.response?.status;
    if (status === 'ready') return data.response;
    if (status === 'error') throw new Error(data?.response?.error || 'Mint failed on Getgems side');
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('Mint is taking longer than expected — check back later');
}

export default function App() {
  const { t } = useTranslation();
  const userAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedNft, setGeneratedNft] = useState<string | null>(null);

  const handlePreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { dataUrl } = generateImage(canvas);
    setPreviewUrl(dataUrl);
    setGeneratedNft(null);
    setError(null);
  }, []);

  const handleMint = async () => {
    if (!userAddress) return;
    if (!previewUrl) {
      setError('Generate an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setStatusText(t('generating'));

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) throw new Error('Backend URL not configured');

      const response = await fetch(`${backendUrl}/api/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          image: previewUrl,
          name: 'Exclusive Gift',
          description: 'Generated with TG NFT Gift Generator',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Mint failed on server');
      }

      setStatusText('Waiting for confirmation on-chain...');
      const result = await pollMintStatus(backendUrl, data.requestId);

      const nftLink = result?.address
        ? `https://getgems.io/nft/${result.address}`
        : `https://getgems.io/collection/${COLLECTION_ADDRESS}`;

      setGeneratedNft(nftLink);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Mint failed. Check logs.');
    } finally {
      setIsGenerating(false);
      setStatusText(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-white/70">{t('subtitle')}</p>

      <canvas ref={canvasRef} width={512} height={512} className="hidden" />

      {previewUrl ? (
        <img src={previewUrl} alt="preview" className="w-64 h-64 rounded-2xl object-cover border border-white/20" />
      ) : (
        <div className="w-64 h-64 rounded-2xl border border-dashed border-white/30 flex items-center justify-center text-white/40">
          No preview yet
        </div>
      )}

      <button
        onClick={handlePreview}
        className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        Generate preview
      </button>

      {!userAddress ? (
        <button
          onClick={() => tonConnectUI.openModal()}
          className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 transition font-medium"
        >
          {t('connect_wallet')}
        </button>
      ) : (
        <button
          onClick={handleMint}
          disabled={isGenerating || !previewUrl}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition font-medium"
        >
          {isGenerating ? (statusText || t('generating')) : t('mint_button')}
        </button>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {generatedNft && (
        <div className="mt-4 p-4 rounded-xl bg-white/10 border border-white/20">
          <p className="font-semibold">{t('success_title')}</p>
          <p className="text-sm text-white/70 mb-2">{t('success_desc')}</p>
          <a href={generatedNft} target="_blank" rel="noreferrer" className="text-blue-400 underline">
            {generatedNft}
          </a>
        </div>
      )}

      <p className="text-xs text-white/40 mt-8">{t('powered_by_ton')}</p>
    </div>
  );
}
