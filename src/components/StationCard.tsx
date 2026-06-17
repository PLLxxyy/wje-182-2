import { useState } from 'react';
import { ChargingStation } from '../types';
import ReservationModal from './ReservationModal';

interface Props {
  station: ChargingStation;
  isFav: boolean;
  onToggleFavorite: () => void;
  onStartCharge: () => void;
  onClose: () => void;
  hasActiveSession: boolean;
  hasReservation?: boolean;
  onReservationSuccess?: () => void;
}

export default function StationCard({ 
  station, isFav, onToggleFavorite, onStartCharge, 
  onClose, hasActiveSession, hasReservation, onReservationSuccess 
}: Props) {
  const [showReservation, setShowReservation] = useState(false);
  const canCharge = station.freeGuns > 0 && !hasActiveSession;
  const canReserve = !hasActiveSession;
  const chargeTypeLabel = station.chargerType === 'fast' ? '快充' : station.chargerType === 'slow' ? '慢充' : '快充/慢充';

  const handleReservationSuccess = () => {
    setShowReservation(false);
    if (onReservationSuccess) {
      onReservationSuccess();
    }
  };

  if (showReservation) {
    return (
      <ReservationModal
        station={station}
        onClose={() => setShowReservation(false)}
        onSuccess={handleReservationSuccess}
      />
    );
  }

  return (
    <div className="station-card">
      <div className="station-card-header">
        <div>
          <div className="station-name">
            {station.name}
            {hasReservation && <span className="badge badge-reservation">已预约</span>}
          </div>
          <div className="station-address">{station.address}</div>
        </div>
        <button className="favorite-btn" onClick={onToggleFavorite}>
          {isFav ? '⭐' : '☆'}
        </button>
      </div>

      <div className="station-info-grid">
        <div className="info-item">
          <div className="info-label">充电类型</div>
          <div className="info-value">{chargeTypeLabel}</div>
        </div>
        <div className="info-item">
          <div className="info-label">每度电价格</div>
          <div className="info-value price">¥{station.pricePerKwh.toFixed(2)}</div>
        </div>
        <div className="info-item">
          <div className="info-label">空闲枪数</div>
          <div className="info-value">{station.freeGuns} / {station.totalGuns}</div>
        </div>
        <div className="info-item">
          <div className="info-label">距离</div>
          <div className="info-value">{station.distance}km</div>
        </div>
      </div>

      <div className="station-guns">
        <div className="guns-title">充电枪状态</div>
        <div className="gun-list">
          {station.guns.map(gun => (
            <span
              key={gun.id}
              className={`gun-tag ${gun.status === 'free' ? 'free' : gun.status === 'in-use' ? 'in-use' : 'fault'}`}
            >
              {gun.type === 'fast' ? '快' : '慢'} · {gun.power}kW · {gun.status === 'free' ? '空闲' : gun.status === 'in-use' ? '使用中' : '故障'}
            </span>
          ))}
        </div>
      </div>

      <div className="card-action-buttons">
        <button
          className="reserve-btn"
          onClick={() => setShowReservation(true)}
          disabled={!canReserve}
        >
          {!canReserve && hasActiveSession ? '充电中无法预约' : '预约充电'}
        </button>
        <button
          className="start-charge-btn"
          onClick={onStartCharge}
          disabled={!canCharge}
        >
          {!canCharge && hasActiveSession
            ? '已有充电进行中'
            : station.freeGuns === 0
            ? '暂无空闲充电枪'
            : '开始充电'}
        </button>
      </div>
      <button className="close-card-btn" onClick={onClose}>
        关闭
      </button>
    </div>
  );
}
