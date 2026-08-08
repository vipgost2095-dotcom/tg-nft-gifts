require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

// base64 images can be a few hundred KB — raise the body limit
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const {
  SECRET_KEY,
  BASE_URL,
  PORT = 3000,
  GETGEMS_API_KEY,
  GETGEMS_API_HOST = 'https://api.getgems.io',
  NFT_COLLECTION_ADDRESS,
} = process.env;

if (!SECRET_KEY) console.warn('[WARN] SECRET_KEY is not set');
if (!BASE_URL) console.warn('[WARN] BASE_URL is not set — generated image links will be broken');
if (!GETGEMS_API_KEY) console.warn('[WARN] GETGEMS_API_KEY is not set — /api/mint will fail');
if (!NFT_COLLECTION_ADDRESS) console.warn('[WARN] NFT_COLLECTION_ADDRESS is not set — /api/mint will fail');

// ---- image storage -------------------------------------------------
// Railway containers have an ephemeral filesystem (files are wiped on
// every redeploy), but that's fine here: Getgems only needs the URL to
// be reachable once, at mint time, to fetch and pin the image itself.
const IMAGES_DIR = path.join(__dirname, 'generated-images');
fs.mkdirSync(IMAGES_DIR, { recursive: true });
app.use('/images', express.static(IMAGES_DIR));

function saveBase64Image(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('image must be a base64 data URL (png or jpeg)');
  const ext = match[1] === 'jpg' ? 'jpeg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 8 * 1024 * 1024) throw new Error('image too large (max 8MB)');

  const fileName = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(IMAGES_DIR, fileName), buffer);
  return `${BASE_URL}/images/${fileName}`;
}

// ---- getgems minting api --------------------------------------------
async function getgemsRequest(pathSuffix, options = {}) {
  const url = `${GETGEMS_API_HOST}/public-api/minting/${NFT_COLLECTION_ADDRESS}${pathSuffix}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GETGEMS_API_KEY,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const message = data?.error || data?.message || `Getgems API error (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// ---- routes -----------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/mint', async (req, res) => {
  try {
    const { userAddress, image, name, description, attributes } = req.body || {};

    if (!userAddress) return res.status(400).json({ error: 'userAddress is required' });
    if (!image) return res.status(400).json({ error: 'image is required (base64 data URL)' });
    if (!GETGEMS_API_KEY || !NFT_COLLECTION_ADDRESS) {
      return res.status(500).json({ error: 'Server is not configured (missing GETGEMS_API_KEY or NFT_COLLECTION_ADDRESS)' });
    }

    const imageUrl = saveBase64Image(image);
    const requestId = crypto.randomUUID();

    await getgemsRequest('', {
      method: 'POST',
      body: JSON.stringify({
        requestId,
        ownerAddress: userAddress,
        name: name || 'Generated Gift',
        description: description || 'Generated with TG NFT Gift Generator',
        image: imageUrl,
        attributes: attributes || [],
      }),
    });

    res.json({ success: true, requestId });
  } catch (e) {
    console.error('mint error:', e);
    res.status(500).json({ error: 'Mint failed', details: e.message });
  }
});

// Poll this from the frontend after /api/mint returns a requestId.
// Getgems mints asynchronously — "ready" means the NFT now exists on-chain.
app.get('/api/mint/:requestId', async (req, res) => {
  try {
    const data = await getgemsRequest(`/${req.params.requestId}`, { method: 'GET' });
    res.json(data);
  } catch (e) {
    console.error('status check error:', e);
    res.status(500).json({ error: 'Status check failed', details: e.message });
  }
});

app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
