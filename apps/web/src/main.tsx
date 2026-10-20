import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import RemoteApp from './RemoteApp';
import './styles.css';

const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const Root = hasSupabaseConfig ? RemoteApp : App;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
