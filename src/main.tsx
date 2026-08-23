import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'next-themes';
import { store } from './store';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/crimson-text/400.css';
import '@fontsource/crimson-text/600.css';
import '@fontsource/crimson-text/400-italic.css';
import './index.css';
import App from './App.tsx';
import { registerAppUpdate } from './utils/registerAppUpdate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme='system' enableSystem>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);

registerAppUpdate();
