import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChargingSession, ChargingStation } from '../types';
import { getCurrentSession, saveCurrentSession, addHistory } from '../utils/storage';
import { mockStations } from '../utils/data';

const BATTERY_CAPACITY = 60; // kWh - typical EV battery
const CHARGE_SPEED_FAST = 1.5; // percent per second (for simulation, ~60sec to full from 20%)
const CHARGE_SPEED_SLOW = 0.4;

interface LocationState {
  station?: ChargingStation;
}

export default function ChargingMonitorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [session, setSession] = useState<ChargingSession | null>(() => {
    // Check if we have an existing session or need to create a new one
    const existing = getCurrentSession();
    if (existing && existing.status === 'charging') {
      return existing;
    }
    if (state?.station) {
      const startBattery = Math.floor(Math.random() * 30) + 10; // 10-40%
      const newSession: ChargingSession = {
        id: `session-${Date.now()}`,
        stationId: state.station.id,
        stationName: state.station.name,
        startTime: Date.now(),
        endTime: null,
        startBattery,
        endBattery: startBattery,
        energyUsed: 0,
        duration: 0,
        cost: 0,
        pricePerKwh: state.station.pricePerKwh,
        status: 'charging',
      };
      saveCurrentSession(newSession);
      return newSession;
    }
    return existing;
  });

  const [showSettlement, setShowSettlement] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const [station, setStation] = useState<ChargingStation | null>(state?.station || null);

  // Find station data if we resumed a session
  useEffect(() => {
    if (session && !station) {
      const found = mockStations.find(s => s.id === session.stationId);
      if (found) setStation(found);
    }
  }, [session, station]);

  const chargeSpeed = station?.chargerType === 'slow' ? CHARGE_SPEED_SLOW : CHARGE_SPEED_FAST;

  const updateSession = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.status !== 'charging') return prev;

      const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
      const newBattery = Math.min(100, prev.startBattery + (chargeSpeed * elapsed));
      const addedEnergy = ((newBattery - prev.startBattery) / 100) * BATTERY_CAPACITY;
      const cost = addedEnergy * prev.pricePerKwh;

      const updated: ChargingSession = {
        ...prev,
        endBattery: Math.floor(newBattery),
        energyUsed: Math.round(addedEnergy * 100) / 100,
        duration: elapsed,
        cost: Math.round(cost * 100) / 100,
      };

      if (newBattery >= 100) {
        updated.status = 'completed';
        updated.endTime = Date.now();
        updated.endBattery = 100;
        saveCurrentSession(null);
        addHistory(updated);
        setShowSettlement(true);
      } else {
        saveCurrentSession(updated);
      }

      return updated;
    });
  }, [chargeSpeed]);

  useEffect(() => {
    if (session?.status === 'charging') {
      intervalRef.current = window.setInterval(updateSession, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session?.status, updateSession]);

  const handleStopCharge = () => {
    if (!session) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const finalized: ChargingSession = {
      ...session,
      status: 'stopped',
      endTime: Date.now(),
    };
    saveCurrentSession(null);
    addHistory(finalized);
    setSession(finalized);
    setShowSettlement(true);
  };

  const handleCloseSettlement = () => {
    setShowSettlement(false);
    navigate('/');
  };

  if (!session) {
    return (
      <div className="charging-page">
        <div className="charging-header">
          <h1>充电监控</h1>
          <button className="back-btn" onClick={() => navigate('/')}>返回地图</button>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <div style={{ fontSize: 16 }}>当前没有充电任务</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>请在地图页面选择一个充电站开始充电</div>
        </div>
      </div>
    );
  }

  const battery = session.endBattery;
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - battery / 100);
  const isCharging = session.status === 'charging';

  // Estimate time remaining
  const remainingPercent = 100 - battery;
  const secondsRemaining = isCharging ? Math.ceil(remainingPercent / chargeSpeed) : 0;
  const minutesRemaining = Math.floor(secondsRemaining / 60);
  const secsRemaining = secondsRemaining % 60;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}时${m}分${s}秒`;
    if (m > 0) return `${m}分${s}秒`;
    return `${s}秒`;
  };

  return (
    <div className="charging-page">
      <div className="charging-header">
        <div>
          <div className="charging-station-name">{session.stationName}</div>
          <h1>充电监控</h1>
        </div>
        <button className="back-btn" onClick={() => navigate('/')}>返回地图</button>
      </div>

      <div className="charging-main">
        <div className={`charging-status-badge ${isCharging ? 'charging' : 'completed'}`}>
          {isCharging && <span className="pulse-dot" />}
          {isCharging ? '充电中...' : session.status === 'completed' ? '充电完成' : '充电已停止'}
        </div>

        {/* Battery ring */}
        <div className="battery-ring-container">
          <svg className="battery-ring-svg" viewBox="0 0 200 200">
            <circle className="battery-ring-bg" cx="100" cy="100" r="90" />
            <circle
              className={`battery-ring-fill ${battery < 20 ? 'warning' : ''}`}
              cx="100" cy="100" r="90"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="battery-percent">
            <div className="battery-percent-num">
              {battery}<span className="battery-percent-sign">%</span>
            </div>
            <div className="battery-percent-label">
              {isCharging ? '充电中' : '已完成'}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="charging-stats">
          <div className="charging-stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{formatDuration(session.duration)}</div>
            <div className="stat-label">已充电时长</div>
          </div>
          <div className="charging-stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-value">
              {isCharging ? `${minutesRemaining}分${secsRemaining}秒` : '已完成'}
            </div>
            <div className="stat-label">预计充满时间</div>
          </div>
          <div className="charging-stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{session.energyUsed.toFixed(1)} kWh</div>
            <div className="stat-label">已充入电量</div>
          </div>
          <div className="charging-stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">¥{session.cost.toFixed(2)}</div>
            <div className="stat-label">已消费金额</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 300 }}>
          <div style={{
            height: 8,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${battery}%`,
              background: 'linear-gradient(90deg, #52c41a, #95de64)',
              borderRadius: 4,
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
          }}>
            <span>{session.startBattery}%</span>
            <span>100%</span>
          </div>
        </div>

        {isCharging && (
          <button className="stop-charge-btn" onClick={handleStopCharge}>
            停止充电
          </button>
        )}
      </div>

      {/* Settlement modal */}
      {showSettlement && (
        <div className="modal-overlay" onClick={e => e.preventDefault()}>
          <div className="settlement-modal">
            <div className="settlement-icon">
              {session.status === 'completed' ? '🎉' : '✅'}
            </div>
            <div className="settlement-title">
              {session.status === 'completed' ? '充电完成' : '充电结束'}
            </div>

            <div className="settlement-total">
              <div className="settlement-total-label">本次充电费用</div>
              <div className="settlement-total-value">
                <span>¥</span>{session.cost.toFixed(2)}
              </div>
            </div>

            <div className="settlement-detail">
              <div className="settlement-row">
                <span className="settlement-row-label">充电站</span>
                <span className="settlement-row-value">{session.stationName}</span>
              </div>
              <div className="settlement-row">
                <span className="settlement-row-label">充电电量</span>
                <span className="settlement-row-value">{session.energyUsed.toFixed(2)} 度</span>
              </div>
              <div className="settlement-row">
                <span className="settlement-row-label">充电时长</span>
                <span className="settlement-row-value">{formatDuration(session.duration)}</span>
              </div>
              <div className="settlement-row">
                <span className="settlement-row-label">起始电量</span>
                <span className="settlement-row-value">{session.startBattery}%</span>
              </div>
              <div className="settlement-row">
                <span className="settlement-row-label">结束电量</span>
                <span className="settlement-row-value">{session.endBattery}%</span>
              </div>
              <div className="settlement-row">
                <span className="settlement-row-label">电价</span>
                <span className="settlement-row-value">¥{session.pricePerKwh.toFixed(2)}/度</span>
              </div>
            </div>

            <button className="settlement-close-btn" onClick={handleCloseSettlement}>
              返回首页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
