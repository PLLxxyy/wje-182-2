export interface ChargingStation {
  id: string;
  name: string;
  address: string;
  x: number; // grid position 0-19
  y: number; // grid position 0-14
  chargerType: 'fast' | 'slow' | 'both';
  pricePerKwh: number;
  totalGuns: number;
  freeGuns: number;
  busyGuns: number;
  faultGuns: number;
  distance: number; // km from user
  status: 'free' | 'busy' | 'fault';
  guns: GunStatus[];
}

export interface GunStatus {
  id: string;
  type: 'fast' | 'slow';
  status: 'free' | 'in-use' | 'fault';
  power: number; // kW
}

export interface ChargingSession {
  id: string;
  stationId: string;
  stationName: string;
  startTime: number; // timestamp
  endTime: number | null;
  startBattery: number;
  endBattery: number;
  energyUsed: number; // kWh
  duration: number; // seconds
  cost: number;
  pricePerKwh: number;
  status: 'charging' | 'completed' | 'stopped';
}

export type GridCellType = 'empty' | 'road' | 'block' | 'park' | 'water';
