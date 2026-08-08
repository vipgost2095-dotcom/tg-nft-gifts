require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' })); // Разрешаем запросы с фронтенда
app.use(express.json());

const API_KEY = process.env.GETGEMS_API_KEY;
const COLLECTION_ADDR = process.env.COLLECTION_ADDRESS;
const GETGEMS_API_URL = 'https://api.getgems.io/graphql'; // Используем GraphQL API GetGems

// Эндпоинт для минта
app.post('/api/mint', async (req, res) => {
  const { userAddress } = req.body;

  if (!userAddress || !API_KEY || !COLLECTION_ADDR) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    // Формируем GraphQL запрос на минт cNFT
    // Это стандартный мутация для создания элемента в коллекции через API
    const query = `
      mutation MintCnft($collectionAddress: String!, $ownerAddress: String!) {
        mintCnft(
          input: {
            collectionAddress: $collectionAddress
            ownerAddress: $ownerAddress
            metadata: {
              name: "TG Gift #${Math.floor(Math.random() * 1000)}"
              description: "Exclusive digital gift from TG Giftverse"
              image: "https://api.dicebear.com/9.x/glass/svg?seed=${userAddress}"
            }
          }
        ) {
          success
          nftAddress
        }
      }
    `;

    const response = await fetch(GETGEMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY // Иногда требуется дублировать в заголовке
      },
      body: JSON.stringify({
        query,
        variables: {
          collectionAddress: COLLECTION_ADDR,
          ownerAddress: userAddress
        }
      })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('GetGems API Error:', result.errors);
      return res.status(500).json({ error: 'Minting failed via API', details: result.errors });
    }

    res.json({ 
      success: true, 
      nftAddress: result.data?.mintCnft?.nftAddress 
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
