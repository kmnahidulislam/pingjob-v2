/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_GOOGLE_ADSENSE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}