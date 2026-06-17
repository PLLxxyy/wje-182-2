import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/MapPage';
import ChargingMonitorPage from './pages/ChargingMonitorPage';
import ProfilePage from './pages/ProfilePage';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/charging" element={<ChargingMonitorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
