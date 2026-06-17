# 充电桩查找与充电模拟平台

一个纯前端的充电桩查找和充电模拟平台，数据完全存储在浏览器本地 localStorage 中。

## 功能特性

### 地图页面
- 网格方块模拟城市地图，显示充电桩位置
- 三种颜色标识充电桩状态：绿色（空闲）、黄色（使用中）、红色（故障）
- 点击充电桩显示信息卡片：站点名称、地址、充电类型（快充/慢充）、空闲枪数、每度电价格
- 支持按空闲优先、快充、慢充筛选
- 支持按价格或距离排序
- 支持搜索充电站名称或地址
- 收藏的充电站在列表中置顶显示

### 充电监控页面
- 选择空闲充电桩点击"开始充电"进入监控页面
- 实时显示当前电量百分比，绿色进度条动画增长
- 显示已充电时长、预计充满时间、已充入电量、已消费金额
- 充满自动结算，显示本次充电详情（电量、时长、费用明细）
- 支持手动停止充电

### 个人中心
- 充电历史记录列表，按时间倒序展示
- 月度充电统计图表：花费趋势、充电频次、充电量
- 收藏的充电站管理
- 总充电次数、累计花费、累计电量快速统计

## 技术栈

- Vite 5
- React 18 + TypeScript
- React Router DOM 6
- 纯 CSS（样式在 index.html `<style>` 标签中）
- localStorage 数据持久化

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 项目结构

```
src/
├── main.tsx            # 入口文件
├── App.tsx             # 路由配置
├── types.ts            # TypeScript 类型定义
├── pages/
│   ├── MapPage.tsx     # 地图首页
│   ├── ChargingMonitorPage.tsx  # 充电监控
│   └── ProfilePage.tsx # 个人中心
├── components/
│   ├── BottomNav.tsx   # 底部导航
│   └── StationCard.tsx # 充电站信息卡片
└── utils/
    ├── data.ts         # Mock 充电站数据
    └── storage.ts      # localStorage 操作封装
```
