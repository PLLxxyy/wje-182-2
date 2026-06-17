import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getHistory, getFavorites, toggleFavorite, getMonthlyStats,
  getReservations, cancelReservation, refreshReservationStatuses
} from '../utils/storage';
import { mockStations } from '../utils/data';
import { ChargingSession, Reservation } from '../types';

type ProfileTab = 'history' | 'favorites' | 'stats' | 'reservations';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>('stats');
  const [history, setHistory] = useState<ChargingSession[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const refreshData = useCallback(() => {
    refreshReservationStatuses();
    setHistory(getHistory());
    setFavorites(getFavorites());
    setReservations(getReservations());
  }, []);

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 30000);
    return () => clearInterval(timer);
  }, [refreshData]);

  const monthlyStats = useMemo(() => getMonthlyStats(history), [history]);

  const totalCost = useMemo(() => history.reduce((sum, s) => sum + s.cost, 0), [history]);
  const totalEnergy = useMemo(() => history.reduce((sum, s) => sum + s.energyUsed, 0), [history]);
  const totalSessions = history.length;
  const activeReservationCount = reservations.filter(r => 
    r.status !== 'cancelled' && r.status !== 'completed' && r.status !== 'expired' && r.endTime >= Date.now()
  ).length;

  const favoriteStations = useMemo(
    () => mockStations.filter(s => favorites.includes(s.id)),
    [favorites]
  );

  const handleRemoveFavorite = (stationId: string) => {
    toggleFavorite(stationId);
    setFavorites(getFavorites());
  };

  const handleCancelReservation = (id: string) => {
    if (window.confirm('确定要取消这个预约吗？')) {
      cancelReservation(id);
      refreshData();
    }
  };

  const maxCost = Math.max(...monthlyStats.map(m => m.cost), 1);
  const maxCount = Math.max(...monthlyStats.map(m => m.count), 1);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}小时${m}分钟`;
    return `${m}分钟`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  };

  const formatFullDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${min}`;
  };

  const getReservationStatusLabel = (r: Reservation) => {
    if (r.status === 'cancelled') return { text: '已取消', color: 'grey' };
    if (r.status === 'completed') return { text: '已完成', color: 'green' };
    if (r.status === 'expired') return { text: '已过期', color: 'orange' };
    if (r.status === 'active') return { text: '预约中', color: 'blue' };
    return { text: '待生效', color: 'purple' };
  };

  const isReservationActive = (r: Reservation) => {
    return r.status !== 'cancelled' && r.status !== 'completed' && r.status !== 'expired' && r.endTime >= Date.now();
  };

  const canCancel = (r: Reservation) => {
    return isReservationActive(r) && r.startTime > Date.now();
  };

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => b.createdAt - a.createdAt);
  }, [reservations]);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">🚗</div>
        <div className="profile-name">电动车主</div>
        <div className="profile-join">绿色出行，从充电开始</div>
      </div>

      <div className="quick-stats">
        <div className="quick-stat-card">
          <div className="quick-stat-value">{totalSessions}</div>
          <div className="quick-stat-label">充电次数</div>
        </div>
        <div className="quick-stat-card">
          <div className="quick-stat-value orange">¥{totalCost.toFixed(0)}</div>
          <div className="quick-stat-label">累计花费</div>
        </div>
        <div className="quick-stat-card">
          <div className="quick-stat-value green">{totalEnergy.toFixed(1)}°</div>
          <div className="quick-stat-label">累计电量</div>
        </div>
        <div className="quick-stat-card" onClick={() => setTab('reservations')} style={{ cursor: 'pointer' }}>
          <div className="quick-stat-value purple">{activeReservationCount}</div>
          <div className="quick-stat-label">当前预约</div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div className="tab-bar">
          {[
            { key: 'stats' as ProfileTab, label: '月度统计' },
            { key: 'reservations' as ProfileTab, label: '我的预约' },
            { key: 'history' as ProfileTab, label: '充电记录' },
            { key: 'favorites' as ProfileTab, label: '我的收藏' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === 'reservations' && activeReservationCount > 0 && (
                <span className="tab-badge">{activeReservationCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'stats' && (
        <>
          <div className="chart-section">
            <div className="section-title">📊 月度充电花费趋势</div>
            <div className="chart-container">
              {monthlyStats.map((m, i) => (
                <div key={i} className="chart-bar-group">
                  <div
                    className="chart-bar cost"
                    style={{ height: `${Math.max((m.cost / maxCost) * 150, 4)}px` }}
                  >
                    {m.cost > 0 && (
                      <span className="chart-bar-value">¥{m.cost.toFixed(0)}</span>
                    )}
                  </div>
                  <div className="chart-label">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot cost" />
                <span>花费金额</span>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <div className="section-title">📈 月度充电频次</div>
            <div className="freq-chart">
              {monthlyStats.map((m, i) => (
                <div key={i} className="freq-bar-wrapper">
                  <div className="freq-value">{m.count}</div>
                  <div
                    className="freq-bar"
                    style={{ height: `${Math.max((m.count / maxCount) * 80, 4)}px` }}
                  />
                  <div className="freq-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-section">
            <div className="section-title">⚡ 月度充电量</div>
            <div className="chart-container">
              {monthlyStats.map((m, i) => {
                const maxEnergy = Math.max(...monthlyStats.map(s => s.energy), 1);
                return (
                  <div key={i} className="chart-bar-group">
                    <div
                      className="chart-bar count"
                      style={{ height: `${Math.max((m.energy / maxEnergy) * 150, 4)}px` }}
                    >
                      {m.energy > 0 && (
                        <span className="chart-bar-value">{m.energy.toFixed(1)}</span>
                      )}
                    </div>
                    <div className="chart-label">{m.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot count" />
                <span>充电量 (kWh)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'reservations' && (
        <div className="reservations-section">
          <div className="section-title">📅 我的预约</div>
          {sortedReservations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-text">暂无预约记录</div>
              <button 
                className="empty-action-btn" 
                onClick={() => navigate('/')}
              >
                去地图查找充电站预约
              </button>
            </div>
          ) : (
            sortedReservations.map(r => {
              const statusInfo = getReservationStatusLabel(r);
              const active = isReservationActive(r);
              return (
                <div key={r.id} className={`reservation-item ${active ? 'active' : ''}`}>
                  <div className={`reservation-icon ${statusInfo.color}`}>
                    {r.gunType === 'fast' ? '⚡' : '🔌'}
                  </div>
                  <div className="reservation-info">
                    <div className="reservation-station">
                      {r.stationName}
                      <span className={`status-tag status-${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="reservation-address">{r.stationAddress}</div>
                    <div className="reservation-detail">
                      <span>充电枪: {r.gunType === 'fast' ? '快充' : '慢充'} · {r.gunPower}kW</span>
                      <span className="detail-sep">|</span>
                      <span>编号: {r.gunId}</span>
                    </div>
                    <div className="reservation-time">
                      🕐 {formatFullDate(r.startTime)} ~ {formatDate(r.endTime)}
                    </div>
                    <div className="reservation-created">
                      创建于: {formatFullDate(r.createdAt)}
                    </div>
                  </div>
                  <div className="reservation-actions">
                    {active && canCancel(r) && (
                      <button
                        className="reservation-cancel"
                        onClick={() => handleCancelReservation(r.id)}
                      >
                        取消预约
                      </button>
                    )}
                    {active && (
                      <button
                        className="reservation-navigate"
                        onClick={() => navigate('/')}
                      >
                        查看地图
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="history-section">
          <div className="section-title">🕐 充电历史记录</div>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">暂无充电记录</div>
            </div>
          ) : (
            history.map(session => (
              <div key={session.id} className="history-item">
                <div className={`history-icon ${session.status === 'completed' ? 'completed' : 'stopped'}`}>
                  {session.status === 'completed' ? '✅' : '⏹️'}
                </div>
                <div className="history-info">
                  <div className="history-station">{session.stationName}</div>
                  <div className="history-time">{formatDate(session.startTime)}</div>
                </div>
                <div className="history-right">
                  <div className="history-amount">¥{session.cost.toFixed(2)}</div>
                  <div className="history-duration">{formatDuration(session.duration)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <div className="favorites-section">
          <div className="section-title">⭐ 收藏的充电站</div>
          {favoriteStations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-text">暂无收藏的充电站</div>
            </div>
          ) : (
            favoriteStations.map(station => (
              <div key={station.id} className="favorite-item">
                <div className="favorite-icon">⚡</div>
                <div className="favorite-info">
                  <div className="favorite-name">{station.name}</div>
                  <div className="favorite-address">{station.address}</div>
                </div>
                <button
                  className="favorite-remove"
                  onClick={() => handleRemoveFavorite(station.id)}
                >
                  取消收藏
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
