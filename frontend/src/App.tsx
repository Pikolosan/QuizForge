import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes'
import {ThemeProvider} from './components/Theme/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="quiz-ui-theme">
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
