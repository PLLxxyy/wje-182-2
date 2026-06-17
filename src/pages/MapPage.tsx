import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChargingStation } from '../types';
import { mockStations, getCellType } from '../utils/data';
import { getFavorites, toggleFavorite, isFavorite, getCurrentSession } from '../utils/storage';
import StationCard from '../components/StationCard';

type FilterType = 'all' | 'free' | 'fast' | 'slow';
type SortType = 'price' | 'distance';

export default function MapPage() {
  const navigate = useNavigate();
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('distance');
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState<string[]>(getFavorites());
  const currentSession = getCurrentSession();

  const handleToggleFavorite = useCallback((stationId: string) => {
    const newFavs = toggleFavorite(stationId);
    setFavorites([...newFavs]);
  }, []);

  const filteredStations = useMemo(() => {
    let stations = [...mockStations];

    // Search filter
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      stations = stations.filter(
        s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (filter === 'free') {
      stations = stations.filter(s => s.status === 'free');
    } else if (filter === 'fast') {
      stations = stations.filter(s => s.chargerType === 'fast' || s.chargerType === 'both');
    } else if (filter === 'slow') {
      stations = stations.filter(s => s.chargerType === 'slow' || s.chargerType === 'both');
    }

    // Sort
    stations.sort((a, b) => {
      if (sort === 'price') return a.pricePerKwh - b.pricePerKwh;
      return a.distance - b.distance;
    });

    // Favorites pinned to top
    const favStations = stations.filter(s => favorites.includes(s.id));
    const otherStations = stations.filter(s => !favorites.includes(s.id));
    return [...favStations, ...otherStations];
  }, [filter, sort, searchText, favorites]);

  const gridCells = useMemo(() => {
    const cells: { col: number; row: number; type: string }[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 20; col++) {
        cells.push({ col, row, type: getCellType(col, row) });
      }
    }
    return cells;
  }, []);

  const handleStartCharge = (station: ChargingStation) => {
    setSelectedStation(null);
    navigate('/charging', { state: { station } });
  };

  return (
    <div className="map-page">
      <div className="map-header">
        <div>
          <h1>充电桩查找</h1>
        </div>
        <div className="map-header-actions">
          <button
            className="header-btn"
            onClick={() => setSort(sort === 'price' ? 'distance' : 'price')}
          >
            {sort === 'price' ? '按距离' : '按价格'}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {[
          { key: 'all' as FilterType, label: '全部' },
          { key: 'free' as FilterType, label: '空闲优先' },
          { key: 'fast' as FilterType, label: '快充' },
          { key: 'slow' as FilterType, label: '慢充' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="map-container">
        <div className="grid-map">
          {gridCells.map(cell => (
            <div
              key={`${cell.col}-${cell.row}`}
              className={`grid-cell ${cell.type}`}
            />
          ))}
        </div>

        {/* Station markers */}
        {filteredStations.map(station => {
          const leftPct = ((station.x + 0.5) / 20) * 100;
          const topPct = ((station.y + 0.5) / 15) * 100;
          return (
            <div
              key={station.id}
              className={`station-marker ${station.status} ${favorites.includes(station.id) ? 'favorited' : ''}`}
              style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => setSelectedStation(station)}
              title={station.name}
            >
              ⚡
            </div>
          );
        })}

        {/* Map legend */}
        <div className="map-legend">
          <div className="legend-title">图例</div>
          <div className="legend-row">
            <div className="legend-dot-status free" />
            <span>空闲</span>
          </div>
          <div className="legend-row">
            <div className="legend-dot-status busy" />
            <span>使用中</span>
          </div>
          <div className="legend-row">
            <div className="legend-dot-status fault" />
            <span>故障</span>
          </div>
        </div>

        {/* Current charging indicator */}
        {currentSession && currentSession.status === 'charging' && (
          <div
            className="current-charging-indicator"
            onClick={() => navigate('/charging')}
          >
            <span className="charging-dot" />
            正在充电中 - {currentSession.stationName}
          </div>
        )}

        {/* Station list panel */}
        <div className="station-list-panel">
          <div className="list-handle" />
          <div className="search-bar" style={{ margin: '0 0 8px', boxShadow: 'none', padding: '8px 12px' }}>
            <span>🔍</span>
            <input
              className="search-input"
              placeholder="搜索充电站名称或地址..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <div className="list-title">
            附近充电站 ({filteredStations.length})
            {sort === 'price' ? ' · 按价格排序' : ' · 按距离排序'}
          </div>
          {filteredStations.map(station => (
            <div
              key={station.id}
              className="station-list-item"
              onClick={() => setSelectedStation(station)}
            >
              <div className={`station-list-icon ${station.status}`}>
                {favorites.includes(station.id) ? '⭐' : '⚡'}
              </div>
              <div className="station-list-info">
                <div className="station-list-name">{station.name}</div>
                <div className="station-list-detail">
                  {station.chargerType === 'fast' ? '快充' : station.chargerType === 'slow' ? '慢充' : '快充/慢充'}
                  {' · '}空闲 {station.freeGuns}/{station.totalGuns}
                </div>
              </div>
              <div className="station-list-right">
                <div className="station-list-price">
                  ¥{station.pricePerKwh.toFixed(2)} <span>/度</span>
                </div>
                <div className="station-list-distance">{station.distance}km</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Station card modal */}
      {selectedStation && (
        <div className="modal-overlay" onClick={() => setSelectedStation(null)}>
          <div onClick={e => e.stopPropagation()}>
            <StationCard
              station={selectedStation}
              isFav={isFavorite(selectedStation.id)}
              onToggleFavorite={() => handleToggleFavorite(selectedStation.id)}
              onStartCharge={() => handleStartCharge(selectedStation)}
              onClose={() => setSelectedStation(null)}
              hasActiveSession={currentSession?.status === 'charging'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
