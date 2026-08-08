import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        title: "Exclusive Gift Generator",
        subtitle: "Create your unique digital collectible in Telegram style",
        connect_wallet: "Connect Wallet to Mint",
        mint_button: "Generate & Mint",
        generating: "Creating Magic...",
        powered_by_ton: "Powered by TON Blockchain",
        success_title: "Gift Generated!",
        success_desc: "Your NFT has been minted and will appear in GetGems shortly."
      }
    },
    ru: {
      translation: {
        title: "Генератор Эксклюзивных Подарков",
        subtitle: "Создай уникальный цифровой подарок в стиле Telegram",
        connect_wallet: "Подключить кошелек",
        mint_button: "Сгенерировать и Смнить",
        generating: "Создание магии...",
        powered_by_ton: "Работает на TON Blockchain",
        success_title: "Подарок создан!",
        success_desc: "Ваш NFT успешно создан и скоро появится в GetGems."
      }
    }
  },
  lng: 'en',
  fallbackLng: 'en',
});

export default i18n;
