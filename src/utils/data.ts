import { ChargingStation, GunStatus } from '../types';

function generateGuns(fastCount: number, slowCount: number): GunStatus[] {
  const guns: GunStatus[] = [];
  let idCounter = 1;
  for (let i = 0; i < fastCount; i++) {
    const r = Math.random();
    guns.push({
      id: `gun-${idCounter++}`,
      type: 'fast',
      status: r < 0.5 ? 'free' : r < 0.85 ? 'in-use' : 'fault',
      power: 120,
    });
  }
  for (let i = 0; i < slowCount; i++) {
    const r = Math.random();
    guns.push({
      id: `gun-${idCounter++}`,
      type: 'slow',
      status: r < 0.6 ? 'free' : r < 0.9 ? 'in-use' : 'fault',
      power: 7,
    });
  }
  return guns;
}

function computeStatus(guns: GunStatus[]): 'free' | 'busy' | 'fault' {
  const freeCount = guns.filter(g => g.status === 'free').length;
  const faultCount = guns.filter(g => g.status === 'fault').length;
  if (freeCount === 0 && faultCount === guns.length) return 'fault';
  if (freeCount === 0) return 'busy';
  return 'free';
}

export const mockStations: ChargingStation[] = (() => {
  const raw = [
    { id: 's1', name: '阳光城充电站', address: '阳光大道188号', x: 3, y: 2, chargerType: 'both' as const, pricePerKwh: 1.2, fast: 4, slow: 4, distance: 0.5 },
    { id: 's2', name: '翠湖公园站', address: '翠湖路66号', x: 7, y: 5, chargerType: 'fast' as const, pricePerKwh: 1.5, fast: 6, slow: 0, distance: 1.2 },
    { id: 's3', name: '科技园区充电站', address: '科创路200号', x: 14, y: 3, chargerType: 'both' as const, pricePerKwh: 1.0, fast: 3, slow: 6, distance: 2.3 },
    { id: 's4', name: '万达广场充电站', address: '万达广场B1停车场', x: 10, y: 8, chargerType: 'both' as const, pricePerKwh: 1.8, fast: 8, slow: 4, distance: 0.8 },
    { id: 's5', name: '人民医院充电站', address: '健康路1号', x: 5, y: 10, chargerType: 'slow' as const, pricePerKwh: 0.8, fast: 0, slow: 10, distance: 3.1 },
    { id: 's6', name: '高铁站东广场', address: '高铁站东侧P2停车场', x: 16, y: 11, chargerType: 'fast' as const, pricePerKwh: 1.6, fast: 10, slow: 0, distance: 5.0 },
    { id: 's7', name: '大学城充电站', address: '学府路88号', x: 2, y: 7, chargerType: 'both' as const, pricePerKwh: 0.9, fast: 2, slow: 8, distance: 4.2 },
    { id: 's8', name: '商业街充电站', address: '人民路步行街入口', x: 9, y: 4, chargerType: 'both' as const, pricePerKwh: 1.3, fast: 4, slow: 2, distance: 1.5 },
    { id: 's9', name: '体育中心站', address: '体育路555号', x: 13, y: 7, chargerType: 'fast' as const, pricePerKwh: 1.4, fast: 5, slow: 0, distance: 2.8 },
    { id: 's10', name: '滨江花园充电站', address: '滨江路128号', x: 1, y: 12, chargerType: 'both' as const, pricePerKwh: 1.1, fast: 3, slow: 5, distance: 3.5 },
    { id: 's11', name: '工业园区南站', address: '工业南路66号', x: 17, y: 6, chargerType: 'fast' as const, pricePerKwh: 1.0, fast: 8, slow: 0, distance: 6.1 },
    { id: 's12', name: '老城区充电站', address: '解放路32号', x: 6, y: 3, chargerType: 'slow' as const, pricePerKwh: 0.7, fast: 0, slow: 12, distance: 2.0 },
    { id: 's13', name: '中央公园站', address: '中央公园南门', x: 11, y: 12, chargerType: 'both' as const, pricePerKwh: 1.3, fast: 6, slow: 4, distance: 1.8 },
    { id: 's14', name: '欢乐谷充电站', address: '欢乐谷景区停车场', x: 15, y: 13, chargerType: 'fast' as const, pricePerKwh: 1.7, fast: 6, slow: 0, distance: 7.2 },
    { id: 's15', name: '金融中心站', address: '金融街1号', x: 8, y: 1, chargerType: 'both' as const, pricePerKwh: 1.5, fast: 4, slow: 2, distance: 1.0 },
    { id: 's16', name: '物流园区充电站', address: '物流大道888号', x: 18, y: 9, chargerType: 'fast' as const, pricePerKwh: 0.9, fast: 12, slow: 0, distance: 8.5 },
    { id: 's17', name: '文化宫充电站', address: '文化路18号', x: 4, y: 6, chargerType: 'both' as const, pricePerKwh: 1.1, fast: 2, slow: 4, distance: 2.5 },
    { id: 's18', name: '地铁站P+R', address: '地铁3号线换乘停车场', x: 12, y: 5, chargerType: 'both' as const, pricePerKwh: 1.2, fast: 4, slow: 6, distance: 1.6 },
  ];

  return raw.map(s => {
    const guns = generateGuns(s.fast, s.slow);
    const freeGuns = guns.filter(g => g.status === 'free').length;
    const busyGuns = guns.filter(g => g.status === 'in-use').length;
    const faultGuns = guns.filter(g => g.status === 'fault').length;
    return {
      id: s.id,
      name: s.name,
      address: s.address,
      x: s.x,
      y: s.y,
      chargerType: s.chargerType,
      pricePerKwh: s.pricePerKwh,
      totalGuns: guns.length,
      freeGuns,
      busyGuns,
      faultGuns,
      distance: s.distance,
      status: computeStatus(guns),
      guns,
    };
  });
})();

// Map grid layout: defines terrain types for visual variety
export function getCellType(col: number, row: number): string {
  // Roads (horizontal and vertical)
  if (row === 4 || row === 9) return 'road';
  if (col === 5 || col === 10 || col === 15) return 'road';

  // Water (river)
  if (row >= 12 && row <= 14 && (col + row) % 7 < 2) return 'water';

  // Parks
  if (col >= 8 && col <= 10 && row >= 1 && row <= 3) return 'park';
  if (col >= 3 && col <= 4 && row >= 11 && row <= 12) return 'park';

  // Buildings/blocks
  if ((col + row) % 5 === 0) return 'block';
  if ((col * 3 + row * 7) % 11 < 3) return 'block';

  return 'empty';
}
