require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/generate-metadata', (req, res) => {
  const { userAddress, refCode } = req.body;
  if (!userAddress) return res.status(400).json({ error: 'No address' });

  const nonce = crypto.randomBytes(16).toString('hex');
  const sig = crypto.createHash('sha256')
    .update(`${userAddress}:${refCode || 'none'}:${nonce}:${process.env.SECRET_KEY}`)
    .digest('hex');

  res.json({
    metadataUrl: `${process.env.BASE_URL}/metadata/${sig}.json`,
    signature: sig,
    price: '50000000'
  });
});

app.get('/metadata/:sig.json', (req, res) => {
  res.json({
    name: "Telegram Gift #" + Math.floor(Math.random() * 9999),
    description: "Exclusive digital collectible",
    image: "https://api.dicebear.com/9.x/glass/svg?seed=" + req.params.sig,
    attributes: [
      { trait_type: "Style", value: "Glassmorphism" },
      { trait_type: "Platform", value: "Telegram" }
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
