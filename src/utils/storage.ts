import { ChargingSession, ChargingStation, Reservation } from '../types';

const KEYS = {
  FAVORITES: 'charging_favorites',
  HISTORY: 'charging_history',
  CURRENT_SESSION: 'charging_current_session',
  RESERVATIONS: 'charging_reservations',
};

// ---- Favorites ----
export function getFavorites(): string[] {
  try {
    const data = localStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(stationId: string): string[] {
  const favs = getFavorites();
  const idx = favs.indexOf(stationId);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.push(stationId);
  }
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
  return favs;
}

export function isFavorite(stationId: string): boolean {
  return getFavorites().includes(stationId);
}

// ---- History ----
export function getHistory(): ChargingSession[] {
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addHistory(session: ChargingSession): void {
  const history = getHistory();
  history.unshift(session);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

// ---- Current Session ----
export function getCurrentSession(): ChargingSession | null {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveCurrentSession(session: ChargingSession | null): void {
  if (session) {
    localStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(KEYS.CURRENT_SESSION);
  }
}

// ---- Stats helpers ----
export function getMonthlyStats(history: ChargingSession[]) {
  const now = new Date();
  const months: { label: string; cost: number; count: number; energy: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = `${month + 1}月`;

    const sessions = history.filter(s => {
      const sd = new Date(s.startTime);
      return sd.getFullYear() === year && sd.getMonth() === month;
    });

    months.push({
      label,
      cost: sessions.reduce((sum, s) => sum + s.cost, 0),
      count: sessions.length,
      energy: sessions.reduce((sum, s) => sum + s.energyUsed, 0),
    });
  }

  return months;
}

// ---- Reservations ----
export function getReservations(): Reservation[] {
  try {
    const data = localStorage.getItem(KEYS.RESERVATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveReservations(reservations: Reservation[]): void {
  localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify(reservations));
}

export function addReservation(reservation: Reservation): void {
  const reservations = getReservations();
  reservations.unshift(reservation);
  saveReservations(reservations);
}

export function updateReservationStatus(id: string, status: Reservation['status']): void {
  const reservations = getReservations();
  const idx = reservations.findIndex(r => r.id === id);
  if (idx >= 0) {
    reservations[idx].status = status;
    saveReservations(reservations);
  }
}

export function cancelReservation(id: string): void {
  updateReservationStatus(id, 'cancelled');
}

export function getReservationsByStation(stationId: string): Reservation[] {
  return getReservations().filter(r => r.stationId === stationId);
}

export function getActiveReservations(): Reservation[] {
  const now = Date.now();
  return getReservations().filter(r => {
    if (r.status === 'cancelled' || r.status === 'completed' || r.status === 'expired') {
      return false;
    }
    if (r.endTime < now) {
      return false;
    }
    return true;
  });
}

export function isGunReserved(stationId: string, gunId: string, startTime: number, endTime: number): boolean {
  const reservations = getReservationsByStation(stationId);
  return reservations.some(r => {
    if (r.status === 'cancelled' || r.status === 'completed' || r.status === 'expired') {
      return false;
    }
    if (r.gunId !== gunId) return false;
    return startTime < r.endTime && endTime > r.startTime;
  });
}

export function hasReservationAtStation(stationId: string): boolean {
  return getActiveReservations().some(r => r.stationId === stationId);
}

export function refreshReservationStatuses(): void {
  const now = Date.now();
  const reservations = getReservations();
  let changed = false;
  reservations.forEach(r => {
    if (r.status === 'pending' && r.startTime <= now && r.endTime >= now) {
      r.status = 'active';
      changed = true;
    } else if ((r.status === 'pending' || r.status === 'active') && r.endTime < now) {
      r.status = 'expired';
      changed = true;
    }
  });
  if (changed) {
    saveReservations(reservations);
  }
}
