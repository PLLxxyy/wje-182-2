import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { path: '/', icon: '🗺️', label: '地图' },
  { path: '/charging', icon: '⚡', label: '充电中' },
  { path: '/profile', icon: '👤', label: '我的' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.path}
          className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
