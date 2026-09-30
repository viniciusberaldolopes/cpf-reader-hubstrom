import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// As credenciais públicas ficam no .env para separar configuração e código.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

// A aplicação só é inicializada quando todas as variáveis necessárias existem.
const app = isFirebaseConfigured ? initializeApp(config) : null;
export const database = app ? getDatabase(app) : null;
