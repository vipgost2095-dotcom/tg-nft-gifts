require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const API_KEY = process.env.GETGEMS_API_KEY;
const COLLECTION_ADDR = process.env.COLLECTION_ADDRESS;
// Используем основной GraphQL endpoint GetGems
const GRAPHQL_URL = 'https://api.getgems.io/graphql';

app.post('/api/mint', async (req, res) => {
  try {
    console.log('--- MINT REQUEST START ---');
    const { userAddress } = req.body;
    
    if (!userAddress || !API_KEY || !COLLECTION_ADDR) {
      throw new Error('Missing required fields');
    }

    // GraphQL мутация для создания элемента коллекции
    // Примечание: Точное имя мутации может отличаться. 
    // Часто используется 'mintNft' или 'createCollectionItem'.
    // Попробуем стандартную структуру.
    const query = `
      mutation MintNft($input: MintNftInput!) {
        mintNft(input: $input) {
          ok
          nftItem {
            address
          }
        }
      }
    `;

    const variables = {
      input: {
        collectionAddress: COLLECTION_ADDR,
        ownerAddress: userAddress,
        metadata: {
          name: `TG Gift #${Math.floor(Math.random() * 9999)}`,
          description: "Exclusive digital gift from TG Giftverse",
          image: `https://api.dicebear.com/9.x/glass/svg?seed=${userAddress}`
        }
      }
    };

    console.log('Sending to:', GRAPHQL_URL);
    
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
        'User-Agent': 'Mozilla/5.0 (compatible; TG-GiftBot/1.0)' // Добавляем UA, чтобы не блокировали
      },
      body: JSON.stringify({ query, variables })
    });

    console.log('Response Status:', response.status);
    const contentType = response.headers.get("content-type");
    console.log('Content-Type:', contentType);

    // КРИТИЧЕСКАЯ ПРОВЕРКА: Если ответ не JSON, читаем как текст и логируем
    if (!contentType || !contentType.includes("application/json")) {
      const textBody = await response.text();
      console.error('Received non-JSON response:', textBody.substring(0, 500)); // Логируем первые 500 символов
      throw new Error(`API returned HTML instead of JSON. Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('GraphQL Response:', JSON.stringify(result));

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      throw new Error(result.errors[0].message || 'GraphQL Error');
    }

    const nftAddress = result.data?.mintNft?.nftItem?.address;
    if (!nftAddress) {
      throw new Error('No NFT address in response data');
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
