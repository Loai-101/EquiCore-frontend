import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext.jsx';
import App from './App.jsx';
import './utils/i18n.js';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'ec-app-toast',
              }}
            />
            <App />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
