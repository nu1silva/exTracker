// First, before anything defines a Zod schema. See the file for why.
import './zod-config.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
// The width axis too: the designs use font-stretch from 106% to 112%. Served from our own origin.
import '@fontsource-variable/archivo/wdth.css';
import './styles/theme.css';
import './styles/components.css';
import './styles/app.css';
import { App } from './App.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

const queryClient = new QueryClient();

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
