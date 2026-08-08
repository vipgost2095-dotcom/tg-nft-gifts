import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './i18n';

// Адрес коллекции (используется для ссылки на GetGems)
const COLLECTION_ADDRESS = import.meta.env.VITE_COLLECTION_ADDRESS || '';

export default function App() {
  const { t, i18n } = useTranslation();
  const userAddress = useTonAddress();
  
  // Состояния UI
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNft, setGeneratedNft] = useState<string | null>(null);
  const [refCode, setRefCode] = useState('default');
  const [error, setError] = useState<string | null>(null);

  // Получаем реферальный код при запуске
  useEffect(() => {
    const tgData = window.Telegram?.WebApp?.initDataUnsafe;
    const code = tgData?.start_param || 'default';
    if (code && code !== 'default') setRefCode(code);
  }, []);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en');
  };

  const handleMint = async () => {
    if (!userAddress) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error('Backend URL is not configured in Railway variables.');
      }

      // Отправляем запрос на наш бэкенд для минта через API GetGems
      const response = await fetch(`${backendUrl}/api/mint`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          userAddress,
          refCode 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Minting failed on server');
      }

      // Успех! Показываем экран успеха
      // Используем адрес NFT, который вернул бэкенд, или адрес коллекции как запасной вариант
      const nftLink = data.nftAddress 
        ? `https://getgems.io/nft/${data.nftAddress}`
        : `https://getgems.io/collection/${COLLECTION_ADDRESS}`;

      setTimeout(() => {
        setGeneratedNft(nftLink);
        setIsGenerating(false);
      }, 1500);

    } catch (e: any) {
      console.error('Mint error:', e);
      setError(e.message || 'Transaction failed. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative flex flex-col">
      {/* Фоновые градиенты */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="flex justify-between items-center p-6 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg tracking-tight">GiftGen</span>
        </div>
        <div className="flex gap-3">
          <button onClick={toggleLang} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
            <Globe className="w-5 h-5 text-gray-400" />
          </button>
          <TonConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 pb-10">
        <AnimatePresence mode="wait">
          {!generatedNft ? (
            <motion.div 
              key="mint-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              {/* Glass Card */}
              <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {t('title')}
                  </h1>
                  <p className="text-gray-400 text-sm">{t('subtitle')}</p>
                </div>

                {/* Preview Placeholder */}
                <div className="aspect-square w-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 mb-8 flex items-center justify-center relative overflow-hidden group">
                  {isGenerating ? (
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  ) : (
                    <Sparkles className="w-16 h-16 text-white/20 group-hover:text-blue-400 transition-colors duration-500" />
                  )}
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button 
                  onClick={handleMint}
                  disabled={!userAddress || isGenerating}
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                    !userAddress 
                      ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-[0.98]'
                  }`}
                >
                  {!userAddress 
                    ? t('connect_wallet') 
                    : isGenerating 
                      ? t('generating') 
                      : `${t('mint_button')} • 0.01 TON`}
                </button>

                {/* Referral Info */}
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                  <span>Ref: {refCode}</span>
                  <span>{t('powered_by_ton')}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            // Success State
            <motion.div 
              key="success-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full max-w-md"
            >
              <div className="w-64 h-64 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-400/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_50px_rgba(74,222,128,0.2)]">
                <Check className="w-24 h-24 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('success_title')}</h2>
              <p className="text-gray-400 mb-8">{t('success_desc')}</p>
              
              <a 
                href={generatedNft}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition shadow-lg"
              >
                View on GetGems
              </a>
              
              <button 
                onClick={() => setGeneratedNft(null)}
                className="block mx-auto mt-6 text-sm text-gray-500 hover:text-white transition"
              >
                Mint another one
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
