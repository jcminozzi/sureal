import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './interface.css';
import './product.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento principal não encontrado.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
