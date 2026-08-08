require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const API_KEY = process.env.GETGEMS_API_KEY;
const COLLECTION_ADDR = process.env.COLLECTION_ADDRESS;
const GRAPHQL_URL = 'https://api.getgems.io/graphql';

app.post('/api/mint', async (req, res) => {
  try {
    const { userAddress } = req.body;
    if (!userAddress || !API_KEY || !COLLECTION_ADDR) {
      return res.status(400).json({ error: 'Missing config' });
    }

    // Правильная мутация для cNFT (Compressed NFT)
    // Примечание: GetGems иногда меняет схему. Эта мутация стандартна для их API v2.
    const query = `
      mutation MintCnft($input: MintCnftInput!) {
        mintCnft(input: $input) {
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
          description: "Exclusive digital gift",
          image: `https://api.dicebear.com/9.x/glass/svg?seed=${userAddress}`
        }
      }
    };

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
        'User-Agent': 'Mozilla/5.0' // Важно, чтобы не блокировали как бота
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      // Частая ошибка: "Insufficient funds" - значит на вашем кошельке нет TON для газа
      return res.status(500).json({ error: 'API Error', details: result.errors[0].message });
    }

    const nftAddress = result.data?.mintCnft?.nftItem?.address;
    if (!nftAddress) {
      throw new Error('No NFT address returned');
    }

    res.json({ success: true, nftAddress });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
