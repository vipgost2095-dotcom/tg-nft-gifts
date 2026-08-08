require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const API_KEY = process.env.GETGEMS_API_KEY;
const COLLECTION_ADDR = process.env.COLLECTION_ADDRESS;

// Простой тестовый эндпоинт
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running!', apiKeySet: !!API_KEY });
});

// Эндпоинт минта
app.post('/api/mint', async (req, res) => {
  const { userAddress } = req.body;

  if (!userAddress) {
    return res.status(400).json({ error: 'Missing userAddress' });
  }
  
  if (!API_KEY || !COLLECTION_ADDR) {
    console.error('Missing API_KEY or COLLECTION_ADDRESS in env');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // ВАЖНО: Здесь должен быть реальный запрос к GetGems API.
    // Пока сделаем заглушку, чтобы проверить связь.
    // Когда убедимся, что связь есть — вернем настоящий API вызов.
    
    console.log(`Minting for ${userAddress} in collection ${COLLECTION_ADDR}`);
    
    // Имитация успешного минта (замените на реальный fetch к GetGems позже)
    setTimeout(() => {
        // В реальности здесь был бы ответ от API
    }, 1000);

    res.json({ 
      success: true, 
      nftAddress: COLLECTION_ADDR, // Пока возвращаем адрес коллекции как заглушку
      message: 'Mint request received (Mock mode)' 
    });

  } catch (error) {
    console.error('Mint Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
