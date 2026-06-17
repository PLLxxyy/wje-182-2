import { useState, useMemo } from 'react';
import { ChargingStation, GunStatus, Reservation } from '../types';
import { addReservation, isGunReserved, getActiveReservations } from '../utils/storage';

interface Props {
  station: ChargingStation;
  onClose: () => void;
  onSuccess: () => void;
}

const TIME_SLOT_DURATION = 30; // minutes

export default function ReservationModal({ station, onClose, onSuccess }: Props) {
  const [selectedGun, setSelectedGun] = useState<GunStatus | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartSlot, setSelectedStartSlot] = useState<number>(-1);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // minutes
  const [error, setError] = useState<string>('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const availableDates = useMemo(() => {
    const dates: { value: string; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const value = `${year}-${month}-${day}`;
      const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
      const label = i === 0 ? '今天' : i === 1 ? '明天' : `${month}/${day} ${weekday}`;
      dates.push({ value, label });
    }
    return dates;
  }, [today]);

  const timeSlots = useMemo(() => {
    const slots: { value: number; label: string }[] = [];
    for (let h = 6; h <= 23; h++) {
      for (let m = 0; m < 60; m += TIME_SLOT_DURATION) {
        const value = h * 60 + m;
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        slots.push({ value, label: `${hour}:${minute}` });
      }
    }
    return slots;
  }, []);

  const durations = [
    { value: 30, label: '30分钟' },
    { value: 60, label: '1小时' },
    { value: 90, label: '1.5小时' },
    { value: 120, label: '2小时' },
    { value: 180, label: '3小时' },
  ];

  const getSlotTimestamp = (dateStr: string, slotMinutes: number) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const hours = Math.floor(slotMinutes / 60);
    const minutes = slotMinutes % 60;
    return new Date(y, m - 1, d, hours, minutes, 0, 0).getTime();
  };

  const isSlotUnavailable = (gun: GunStatus, slotValue: number) => {
    if (!selectedDate) return false;
    const slotStart = getSlotTimestamp(selectedDate, slotValue);
    const slotEnd = slotStart + TIME_SLOT_DURATION * 60 * 1000;
    if (selectedDate === availableDates[0].value) {
      const now = Date.now();
      if (slotEnd <= now) return true;
    }
    return isGunReserved(station.id, gun.id, slotStart, slotEnd);
  };

  const handleSubmit = () => {
    setError('');
    if (!selectedGun) {
      setError('请选择充电枪');
      return;
    }
    if (!selectedDate) {
      setError('请选择预约日期');
      return;
    }
    if (selectedStartSlot < 0) {
      setError('请选择开始时间');
      return;
    }

    const startTime = getSlotTimestamp(selectedDate, selectedStartSlot);
    const endTime = startTime + selectedDuration * 60 * 1000;
    const now = Date.now();

    if (startTime < now) {
      setError('预约时间不能早于当前时间');
      return;
    }

    if (isGunReserved(station.id, selectedGun.id, startTime, endTime)) {
      setError('该充电枪在所选时段已被预约，请选择其他时段或充电枪');
      return;
    }

    const activeReservations = getActiveReservations();
    const overlapUser = activeReservations.find(r =>
      startTime < r.endTime && endTime > r.startTime
    );
    if (overlapUser) {
      setError(`您已有其他预约冲突：${overlapUser.stationName} ${formatTime(overlapUser.startTime)}-${formatTime(overlapUser.endTime)}`);
      return;
    }

    const reservation: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      gunId: selectedGun.id,
      gunType: selectedGun.type,
      gunPower: selectedGun.power,
      startTime,
      endTime,
      createdAt: now,
      status: startTime <= now ? 'active' : 'pending',
    };

    addReservation(reservation);
    onSuccess();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const availableGuns = station.guns.filter(g => g.status !== 'fault');

  return (
    <div className="reservation-modal">
      <div className="reservation-header">
        <div>
          <div className="reservation-title">预约充电</div>
          <div className="reservation-subtitle">{station.name}</div>
        </div>
        <button className="close-x-btn" onClick={onClose}>×</button>
      </div>

      <div className="reservation-section">
        <div className="section-label">选择充电枪</div>
        <div className="gun-selector">
          {availableGuns.length === 0 ? (
            <div className="empty-hint">暂无可用充电枪</div>
          ) : (
            availableGuns.map(gun => {
              const isSelected = selectedGun?.id === gun.id;
              return (
                <button
                  key={gun.id}
                  className={`gun-select-btn ${isSelected ? 'selected' : ''} ${gun.status === 'in-use' ? 'in-use' : ''}`}
                  onClick={() => setSelectedGun(gun)}
                >
                  <div className="gun-select-name">
                    {gun.type === 'fast' ? '⚡ 快充' : '🔌 慢充'} · {gun.power}kW
                  </div>
                  <div className="gun-select-id">编号: {gun.id}</div>
                  <div className={`gun-select-status ${gun.status}`}>
                    {gun.status === 'free' ? '空闲' : gun.status === 'in-use' ? '使用中' : '故障'}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="reservation-section">
        <div className="section-label">选择日期</div>
        <div className="date-selector">
          {availableDates.map(date => (
            <button
              key={date.value}
              className={`date-chip ${selectedDate === date.value ? 'selected' : ''}`}
              onClick={() => {
                setSelectedDate(date.value);
                setSelectedStartSlot(-1);
              }}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="reservation-section">
          <div className="section-label">选择开始时间（每30分钟一个时段）</div>
          <div className="time-slots-grid">
            {timeSlots.map(slot => {
              const unavailable = selectedGun ? isSlotUnavailable(selectedGun, slot.value) : false;
              const isSelected = selectedStartSlot === slot.value;
              return (
                <button
                  key={slot.value}
                  className={`time-slot-btn ${isSelected ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}
                  disabled={unavailable}
                  onClick={() => setSelectedStartSlot(slot.value)}
                  title={unavailable ? '该时段已被预约或已过期' : ''}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="reservation-section">
        <div className="section-label">预约时长</div>
        <div className="duration-selector">
          {durations.map(d => (
            <button
              key={d.value}
              className={`duration-chip ${selectedDuration === d.value ? 'selected' : ''}`}
              onClick={() => setSelectedDuration(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {selectedGun && selectedDate && selectedStartSlot >= 0 && (
        <div className="reservation-summary">
          <div className="summary-label">预约信息确认</div>
          <div className="summary-row">
            <span>充电站</span>
            <span>{station.name}</span>
          </div>
          <div className="summary-row">
            <span>充电枪</span>
            <span>{selectedGun.type === 'fast' ? '快充' : '慢充'} · {selectedGun.power}kW ({selectedGun.id})</span>
          </div>
          <div className="summary-row">
            <span>日期</span>
            <span>{availableDates.find(d => d.value === selectedDate)?.label}</span>
          </div>
          <div className="summary-row">
            <span>时段</span>
            <span>
              {formatTime(getSlotTimestamp(selectedDate, selectedStartSlot))} - 
              {formatTime(getSlotTimestamp(selectedDate, selectedStartSlot) + selectedDuration * 60 * 1000)}
            </span>
          </div>
          <div className="summary-row highlight">
            <span>价格</span>
            <span>¥{station.pricePerKwh.toFixed(2)}/度（按时段内优先充电）</span>
          </div>
        </div>
      )}

      {error && <div className="reservation-error">{error}</div>}

      <div className="reservation-tips">
        <div className="tips-title">📌 温馨提示</div>
        <ul className="tips-list">
          <li>请在预约时段内到达充电站，可优先使用预约的充电枪</li>
          <li>超过预约时段未到达，预约将自动过期</li>
          <li>如需取消预约，请在预约开始前操作</li>
        </ul>
      </div>

      <div className="reservation-actions">
        <button className="reservation-cancel-btn" onClick={onClose}>取消</button>
        <button className="reservation-submit-btn" onClick={handleSubmit}>确认预约</button>
      </div>
    </div>
  );
}
