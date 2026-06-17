import { ChargingStation } from '../types';

interface Props {
  station: ChargingStation;
  isFav: boolean;
  onToggleFavorite: () => void;
  onStartCharge: () => void;
  onClose: () => void;
  hasActiveSession: boolean;
}

export default function StationCard({ station, isFav, onToggleFavorite, onStartCharge, onClose, hasActiveSession }: Props) {
  const canCharge = station.freeGuns > 0 && !hasActiveSession;
  const chargeTypeLabel = station.chargerType === 'fast' ? '快充' : station.chargerType === 'slow' ? '慢充' : '快充/慢充';

  return (
    <div className="station-card">
      <div className="station-card-header">
        <div>
          <div className="station-name">
            {station.name}
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
      <button className="close-card-btn" onClick={onClose}>
        关闭
      </button>
    </div>
  );
}
