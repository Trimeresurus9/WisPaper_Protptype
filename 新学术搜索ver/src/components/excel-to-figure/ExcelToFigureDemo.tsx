import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const series = [
  { color: '#93a4ae', values: [28, 39, 57] },
  { color: '#4f91bd', values: [31, 44, 62] },
  { color: '#3d9d70', values: [36, 57, 78] },
];

function Cursor({ frame }: { frame: number }) {
  return (
    <svg
      width="30"
      height="34"
      viewBox="0 0 28 32"
      fill="none"
      style={{
        position: 'absolute',
        left: interpolate(frame, [8, 25, 49, 91, 132, 158], [116, 192, 294, 470, 750, 750], { ...clamp, easing: ease }),
        top: interpolate(frame, [8, 25, 49, 91, 132, 158], [165, 506, 506, 335, 185, 185], { ...clamp, easing: ease }),
        opacity: interpolate(frame, [2, 9, 158, 172], [0, 1, 1, 0], clamp),
        filter: 'drop-shadow(0 4px 5px rgba(34,38,44,0.2))',
        zIndex: 90,
      }}
      aria-hidden="true"
    >
      <path d="M3 2.5L23.5 17.5L14.8 19.2L19.7 28.2L15.2 30.4L10.4 21.2L4.3 27.3L3 2.5Z" fill="#22262c" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function DataParticle({ index }: { index: number }) {
  const frame = useCurrentFrame();
  const row = Math.floor(index / 3);
  const column = index % 3;
  const start = 50 + index * 1.5;
  const gather = 76 + index * 0.8;
  const arrive = 104 + index * 1.3;
  const sourceLeft = 160 + column * 65;
  const sourceTop = 254 + row * 51;
  const targetLeft = 548 + column * 105;
  const targetTop = 428 - series[row].values[column] * 3.35;

  return (
    <span
      style={{
        position: 'absolute',
        left: interpolate(frame, [start, gather, arrive], [sourceLeft, 432 + column * 9, targetLeft], { ...clamp, easing: ease }),
        top: interpolate(frame, [start, gather, arrive], [sourceTop, 332 + (row - 1) * 16, targetTop], { ...clamp, easing: ease }),
        width: interpolate(frame, [start, gather, arrive], [32, 10, 10], { ...clamp, easing: ease }),
        height: interpolate(frame, [start, gather, arrive], [18, 10, 10], { ...clamp, easing: ease }),
        borderRadius: interpolate(frame, [start, gather], [4, 99], clamp),
        background: series[row].color,
        border: '2px solid white',
        boxShadow: `0 ${interpolate(frame, [start, gather, arrive], [2, 16, 4], { ...clamp, easing: ease })}px ${interpolate(frame, [start, gather, arrive], [5, 28, 10], { ...clamp, easing: ease })}px rgba(61,92,126,0.2)`,
        opacity: interpolate(frame, [start - 3, start, arrive], [0, 1, 1], clamp),
        zIndex: 50 + index,
      }}
    />
  );
}

export function ExcelToFigureDemo() {
  const frame = useCurrentFrame();
  const sourceOpacity = interpolate(frame, [55, 92], [1, 0.2], { ...clamp, easing: ease });
  const chartOpacity = interpolate(frame, [46, 78], [0.38, 1], { ...clamp, easing: ease });
  const lineReveal = interpolate(frame, [108, 145], [0, 1], { ...clamp, easing: ease });

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: 'radial-gradient(circle at 54% 44%, #ffffff 0%, #f3f8fb 42%, #edf4f8 100%)',
        opacity: interpolate(frame, [0, 170, 179], [1, 1, 0], clamp),
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div style={{ position: 'absolute', left: 47, top: 86, width: 328, height: 492, borderRadius: 18, background: 'rgba(241,246,249,0.84)', border: '1px solid rgba(201,216,226,0.72)', rotate: '2.1deg', boxShadow: '0 14px 40px rgba(61,92,126,0.06)' }} />

      <div style={{ position: 'absolute', left: 35, top: 76, width: 328, height: 492, borderRadius: 18, border: '1px solid #ccdce6', background: 'rgba(255,255,255,0.98)', boxShadow: '0 26px 64px rgba(61,92,126,0.12)', opacity: sourceOpacity }}>
        <div style={{ height: 54, borderBottom: '1px solid #e3ebe7', display: 'flex', alignItems: 'center', gap: 11, padding: '0 18px' }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: '#3d9d70', display: 'grid', gridTemplateColumns: 'repeat(2, 4px)', gridTemplateRows: 'repeat(2, 4px)', placeContent: 'center', gap: 2 }}><i style={{ background: 'white', borderRadius: 1 }} /><i style={{ background: 'white', borderRadius: 1 }} /><i style={{ background: 'white', borderRadius: 1 }} /><i style={{ background: 'white', borderRadius: 1 }} /></span>
          <span style={{ width: 112, height: 7, borderRadius: 99, background: '#dce5ea' }} />
        </div>
        <div style={{ position: 'absolute', left: 22, right: 22, top: 92, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderLeft: '1px solid #dfe8e3', borderTop: '1px solid #dfe8e3' }}>
          {Array.from({ length: 16 }, (_, index) => {
            const rowIndex = Math.floor(index / 4);
            const columnIndex = index % 4;
            return <div key={index} style={{ height: 51, display: 'grid', placeItems: 'center', borderRight: '1px solid #dfe8e3', borderBottom: '1px solid #dfe8e3', background: rowIndex === 0 ? '#e9f6ef' : 'white' }}><span style={{ width: columnIndex === 0 ? 32 : 18 + ((rowIndex + columnIndex) % 3) * 4, height: rowIndex === 0 ? 6 : 5, borderRadius: 99, background: rowIndex === 0 ? '#8dbfa5' : columnIndex === 0 ? '#bdc9d0' : '#d8e1e6' }} /></div>;
          })}
        </div>
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 30, minHeight: 72, borderRadius: 12, background: '#f5f8fa', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '0 15px', boxShadow: `0 0 0 ${interpolate(frame, [24, 34, 44], [0, 4, 0], clamp)}px rgba(61,157,112,0.12)` }}><span style={{ width: '88%', height: 6, borderRadius: 99, background: '#dbe4e9' }} /><span style={{ width: '72%', height: 6, borderRadius: 99, background: '#e3eaee' }} /><span style={{ width: '46%', height: 6, borderRadius: 99, background: '#e3eaee' }} /></div>
      </div>

      <div style={{ position: 'absolute', left: 472, top: 64, width: 390, height: 518, borderRadius: 20, border: '1px solid #d1e0e9', background: 'rgba(255,255,255,0.98)', boxShadow: '0 28px 68px rgba(61,92,126,0.13)', opacity: chartOpacity }}>
        <div style={{ height: 62, borderBottom: '1px solid #e7edf1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <div><div style={{ width: 165, height: 8, borderRadius: 99, background: '#cfd9df' }} /><div style={{ marginTop: 8, width: 88, height: 5, borderRadius: 99, background: '#e3e9ed' }} /></div>
          <span style={{ width: 34, height: 18, borderRadius: 99, background: '#edf6ff' }} />
        </div>
        <div style={{ position: 'absolute', left: 24, right: 20, top: 81, display: 'flex', justifyContent: 'flex-end', gap: 13, color: '#7d8c96', fontSize: 7 }}>
          {series.map((item, index) => <span key={item.color} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 6, height: 6, borderRadius: 99, background: item.color }} /><i style={{ width: 24 + index * 5, height: 4, borderRadius: 99, background: '#dfe6ea' }} /></span>)}
        </div>
        <svg width="350" height="350" viewBox="0 0 350 350" style={{ position: 'absolute', left: 20, top: 122, overflow: 'visible' }}>
          {[32, 92, 152, 212, 272].map((y) => <line key={y} x1="45" y1={y} x2="330" y2={y} stroke="#e7edf1" />)}
          <line x1="45" y1="20" x2="45" y2="272" stroke="#aebbc4" strokeWidth="1.2" />
          <line x1="45" y1="272" x2="330" y2="272" stroke="#aebbc4" strokeWidth="1.2" />
          {series.map((item, row) => {
            const points = item.values.map((value, column) => `${78 + column * 112},${272 - value * 3}`).join(' ');
            return <g key={item.color} opacity={lineReveal}><polyline points={points} fill="none" stroke={item.color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - lineReveal} />{item.values.map((value, column) => <circle key={`${row}-${column}`} cx={78 + column * 112} cy={272 - value * 3} r={interpolate(frame, [115 + column * 4 + row * 2, 128 + column * 4 + row * 2], [0, 4.5], clamp)} fill={item.color} stroke="white" strokeWidth="2.5" />)}</g>;
          })}
        </svg>
        <div style={{ position: 'absolute', left: 25, bottom: 23, width: 150, height: 5, borderRadius: 99, background: '#e5eaee' }} />
        <div style={{ position: 'absolute', right: 24, bottom: 19, width: 84, height: 18, borderRadius: 6, background: '#eef7f2', opacity: interpolate(frame, [139, 151], [0, 1], clamp) }} />
      </div>

      {Array.from({ length: 9 }, (_, index) => <DataParticle key={index} index={index} />)}
      <Cursor frame={frame} />
    </AbsoluteFill>
  );
}
