/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      expand: () => void;
      ready: () => void;
      initDataUnsafe?: {
        start_param?: string;
        user?: {
          id: number;
          first_name: string;
          username?: string;
        };
      };
    };
  };
}
