import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BinsProvider } from './context/BinsContext';
import LoginScreen from './screens/LoginScreen';
import MainScreen from './screens/MainScreen';
import BinDetailScreen from './screens/BinDetailScreen';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  return (
    <BinsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<Navigate to="/login" replace />} />
          <Route path="/login"   element={<LoginScreen />} />
          <Route path="/main"    element={<MainScreen />} />
          <Route path="/bin/:id" element={<BinDetailScreen />} />
        </Routes>
        <Toast />
        <ConfirmDialog />
      </BrowserRouter>
    </BinsProvider>
  );
}
