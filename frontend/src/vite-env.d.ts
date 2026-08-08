/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_COLLECTION_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
