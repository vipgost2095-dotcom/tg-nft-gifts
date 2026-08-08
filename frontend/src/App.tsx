const handleMint = async () => {
  if (!userAddress) return;
  
  setIsGenerating(true);
  setError(null);

  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!backendUrl) throw new Error('Backend URL not configured');

    // 1. Отправляем запрос на НАШ бэкенд
    // Бэкенд сам вызовет API GetGems и создаст NFT
    const response = await fetch(`${backendUrl}/api/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.details || 'Mint failed on server');
    }

    // 2. Успех! Показываем экран успеха
    setTimeout(() => {
      // Используем адрес NFT, который вернул бэкенд
      const nftLink = data.nftAddress 
        ? `https://getgems.io/nft/${data.nftAddress}`
        : `https://getgems.io/collection/${COLLECTION_ADDRESS}`;
      
      setGeneratedNft(nftLink);
      setIsGenerating(false);
    }, 1500);

  } catch (e: any) {
    console.error(e);
    setError(e.message || 'Mint failed. Check logs.');
    setIsGenerating(false);
  }
};
