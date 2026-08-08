require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const API_KEY = process.env.GETGEMS_API_KEY;
const COLLECTION_ADDR = process.env.COLLECTION_ADDRESS;

// Правильный endpoint для создания элементов в cNFT коллекции
// Формат: POST /api/v2/collections/{address}/items
const MINT_URL = `https://api.getgems.io/api/v2/collections/${COLLECTION_ADDR}/items`;

app.post('/api/mint', async (req, res) => {
  try {
    console.log('--- MINT REQUEST START ---');
    const { userAddress } = req.body;
    
    if (!userAddress || !API_KEY || !COLLECTION_ADDR) {
      throw new Error('Missing required fields');
    }

    // Формат payload для cNFT (REST API)
    const payload = {
      owner_address: userAddress,
      metadata: {
        name: `TG Gift #${Math.floor(Math.random() * 9999)}`,
        description: "Exclusive digital gift from TG Giftverse",
        image: `https://api.dicebear.com/9.x/glass/svg?seed=${userAddress}`
      }
    };

    console.log('Sending to:', MINT_URL);
    console.log('Payload:', JSON.stringify(payload));
    
    const response = await fetch(MINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
        'User-Agent': 'Mozilla/5.0 (compatible; TG-GiftBot/1.0)'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response Status:', response.status);
    const contentType = response.headers.get("content-type");
    console.log('Content-Type:', contentType);

    // Проверяем, пришел ли JSON
    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error(`API returned non-JSON. Status: ${response.status}`);
    }

    console.log('API Response:', JSON.stringify(result));

    if (!response.ok) {
      throw new Error(result.message || result.error || `HTTP ${response.status}`);
    }

    // REST API возвращает объект созданного элемента
    const nftAddress = result.address || result.nft_address || result.item?.address;
    if (!nftAddress) {
      throw new Error('No NFT address in response');
    }

    res.json({ success: true, nftAddress });

  } catch (error) {
    console.error('CRITICAL ERROR:', error.message);
    res.status(500).json({ 
      error: 'Mint Failed', 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
