import { useCallback, useEffect, useRef, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useTranslation } from 'react-i18next';
import { drawPlaneFrame, rollTraits, PlaneTraits } from './plane3d';
import { encodeGif, gifToDataUrl } from './gifEncoder';

const COLLECTION_ADDRESS = import.meta.env.VITE_COLLECTION_ADDRESS as string;

const CANVAS_SIZE = 512;       // resolution of the minted GIF
const PREVIEW_FRAMES = 30;     // frames baked into the looping GIF (~2.5s loop)
const FRAME_DELAY_CS = 5;      // 50ms per frame ≈ 20fps

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

  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const traitsRef = useRef<PlaneTraits>(rollTraits());

  const [traits, setTraits] = useState<PlaneTraits>(traitsRef.current);
  const [gifDataUrl, setGifDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedNft, setGeneratedNft] = useState<string | null>(null);

  // live-animate the preview canvas continuously
  useEffect(() => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const start = performance.now();

    const loop = (now: number) => {
      const t = ((now - start) / 3000) % 1; // 3s loop
      drawPlaneFrame(ctx, canvas.width, canvas.height, traitsRef.current, t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [traits]);

  const handleReroll = useCallback(() => {
    traitsRef.current = rollTraits();
    setTraits(traitsRef.current);
    setGifDataUrl(null);
    setGeneratedNft(null);
    setError(null);
  }, []);

  const handleRenderGif = useCallback(async () => {
    setIsRendering(true);
    setError(null);
    try {
      const off = document.createElement('canvas');
      off.width = CANVAS_SIZE;
      off.height = CANVAS_SIZE;
      const octx = off.getContext('2d')!;

      const frames = [];
      for (let i = 0; i < PREVIEW_FRAMES; i++) {
        const t = i / PREVIEW_FRAMES;
        drawPlaneFrame(octx, CANVAS_SIZE, CANVAS_SIZE, traitsRef.current, t);
        frames.push({ imageData: octx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE), delayCs: FRAME_DELAY_CS });
        if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0));
      }

      const bytes = encodeGif(CANVAS_SIZE, CANVAS_SIZE, frames);
      setGifDataUrl(gifToDataUrl(bytes));
    } catch (e: any) {
      console.error(e);
      setError('Failed to render animation: ' + e.message);
    } finally {
      setIsRendering(false);
    }
  }, []);

  const handleMint = async () => {
    if (!userAddress || !gifDataUrl) return;

    setIsMinting(true);
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
          image: gifDataUrl,
          name: `${traits.material.name} Plane #${traits.editionSeed}`,
          description: 'Generated with TG NFT Gift Generator',
          attributes: [
            { trait_type: 'Material', value: traits.material.name, rarity: `${traits.materialRarity}%` },
            { trait_type: 'Movement', value: traits.movement, rarity: `${traits.movementRarity}%` },
          ],
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
      setIsMinting(false);
      setStatusText(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-white/70">{t('subtitle')}</p>

      <div className="w-64 h-64 rounded-3xl overflow-hidden border border-white/20 shadow-xl">
        <canvas ref={liveCanvasRef} width={300} height={300} className="w-full h-full" />
      </div>

      <div className="text-xs text-white/50 flex gap-3">
        <span>{traits.material.name} ({traits.materialRarity}%)</span>
        <span>{traits.movement} ({traits.movementRarity}%)</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleReroll}
          className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
        >
          🎲 Reroll
        </button>
        <button
          onClick={handleRenderGif}
          disabled={isRendering}
          className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 transition"
        >
          {isRendering ? 'Rendering…' : '✨ Render animation'}
        </button>
      </div>

      {gifDataUrl && (
        <img src={gifDataUrl} alt="minted preview" className="w-48 h-48 rounded-2xl border border-white/20" />
      )}

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
          disabled={isMinting || !gifDataUrl}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition font-medium"
        >
          {isMinting ? (statusText || t('generating')) : t('mint_button')}
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
