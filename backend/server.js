require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const API_KEY = process.env.GETGEMS_API_KEY;
const COLLECTION_ADDR = process.env.COLLECTION_ADDRESS;

// REST endpoint для создания элемента коллекции
const REST_API_URL = 'https://api.getgems.io/api/v2/collections'; 

app.post('/api/mint', async (req, res) => {
  const { userAddress } = req.body;

  if (!userAddress || !API_KEY || !COLLECTION_ADDR) {
    return res.status(400).json({ error: 'Missing config' });
  }

  try {
    // Используем REST API для создания NFT
    // Endpoint: POST /api/v2/collections/{address}/items
    const url = `${REST_API_URL}/${COLLECTION_ADDR}/items`;
    
    const payload = {
      owner_address: userAddress,
      metadata: {
        name: `TG Gift #${Math.floor(Math.random() * 10000)}`,
        description: "Exclusive digital gift from TG Giftverse",
        image: `https://api.dicebear.com/9.x/glass/svg?seed=${userAddress}`
      }
    };

    console.log(`Sending mint request to: ${url}`);
    console.log(`Payload:`, JSON.stringify(payload));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log(`API Response Status: ${response.status}`);
    console.log(`API Response Body:`, JSON.stringify(result));

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: result.message || result.error || 'API request failed',
        details: result
      });
    }

    // REST API обычно возвращает объект созданного NFT
    const nftAddress = result.address || result.nft_address || result.item?.address;
    
    if (!nftAddress) {
       return res.status(500).json({ error: 'No NFT address in response', raw: result });
    }

    res.json({ success: true, nftAddress });

  } catch (error) {
    console.error('Server Crash:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
