import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const rows = [
  ['Model', 'Acc.', 'F1', 'Latency'],
  ['Base', '78.4', '76.9', '42 ms'],
  ['Ours-S', '84.7', '83.6', '31 ms'],
  ['Ours-L', '89.2', '88.5', '38 ms'],
];

function Cursor({ frame }: { frame: number }) {
  return (
    <svg
      width="28"
      height="32"
      viewBox="0 0 28 32"
      fill="none"
      style={{
        position: 'absolute',
        left: interpolate(frame, [3, 14, 38, 118, 142, 166], [70, 102, 322, 548, 702, 702], { ...clamp, easing: ease }),
        top: interpolate(frame, [3, 14, 38, 118, 142, 166], [88, 148, 302, 126, 214, 214], { ...clamp, easing: ease }),
        opacity: interpolate(frame, [0, 5, 166, 176], [0, 1, 1, 0], clamp),
        filter: 'drop-shadow(0 3px 4px rgba(34,38,44,0.18))',
        zIndex: 80,
      }}
      aria-hidden="true"
    >
      <path d="M3 2.5L23.5 17.5L14.8 19.2L19.7 28.2L15.2 30.4L10.4 21.2L4.3 27.3L3 2.5Z" fill="#22262c" stroke="white" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function CellToken({ row, column, value }: { row: number; column: number; value: string }) {
  const frame = useCurrentFrame();
  const index = row * 4 + column;
  const depart = 52 + index * 2.2;
  const arrive = 105 + index * 2.2;
  const sourceLeft = 108 + column * 50;
  const sourceTop = 170 + row * 29;
  const targetLeft = 576 + column * 66;
  const targetTop = 144 + row * 34;

  return (
    <div
      style={{
        position: 'absolute',
        left: interpolate(frame, [depart, arrive], [sourceLeft, targetLeft], { ...clamp, easing: ease }),
        top: interpolate(frame, [depart, arrive], [sourceTop, targetTop], { ...clamp, easing: ease }),
        width: interpolate(frame, [depart, arrive], [48, 64], { ...clamp, easing: ease }),
        height: interpolate(frame, [depart, arrive], [27, 32], { ...clamp, easing: ease }),
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        border: row === 0 ? '1px solid #9bcbb5' : '1px solid #d6e2dc',
        borderRadius: interpolate(frame, [depart, arrive], [3, 0], clamp),
        background: row === 0 ? '#dff3e9' : row === 3 ? '#f0f8f4' : 'rgba(255,255,255,0.98)',
        color: row === 0 ? '#315d49' : '#53616b',
        fontSize: 8,
        fontWeight: row === 0 || column === 0 ? 650 : 500,
        boxShadow: `0 ${interpolate(frame, [depart, depart + 18, arrive], [1, 13, 0], { ...clamp, easing: ease })}px ${interpolate(frame, [depart, depart + 18, arrive], [3, 24, 0], { ...clamp, easing: ease })}px rgba(53,93,73,${interpolate(frame, [depart, depart + 18, arrive], [0.04, 0.2, 0], clamp)})`,
        scale: interpolate(frame, [depart, depart + 18, arrive], [1, 1.08, 1], { ...clamp, easing: ease, output: 'perceptual-scale' }),
        opacity: interpolate(frame, [depart - 5, depart, arrive], [0.55, 1, 1], clamp),
        zIndex: 30 + index,
      }}
    >
      {value}
    </div>
  );
}

export function FigureToExcelDemo() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: 'transparent',
        opacity: interpolate(frame, [0, 170, 179], [1, 1, 0], clamp),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 88,
          top: 24,
          width: 272,
          height: 360,
          borderRadius: 14,
          background: 'rgba(245,248,251,0.86)',
          border: '1px solid rgba(205,218,229,0.72)',
          rotate: '2.2deg',
          boxShadow: '0 12px 34px rgba(61,92,126,0.06)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 70,
          top: 34,
          width: 272,
          height: 360,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(201,216,229,0.9)',
          boxShadow: '0 22px 54px rgba(61,92,126,0.11)',
        }}
      >
        <span style={{ position: 'absolute', left: 0, top: 24, width: 5, height: 28, borderRadius: '0 5px 5px 0', background: '#4f9c76' }} />
        <div style={{ position: 'absolute', left: 24, top: 25, width: 154, height: 7, borderRadius: 99, background: '#d8e1e9' }} />
        <div style={{ position: 'absolute', left: 24, top: 41, width: 106, height: 5, borderRadius: 99, background: '#edf1f5' }} />
        <div style={{ position: 'absolute', left: 24, top: 72, width: 216, display: 'grid', gap: 7 }}>
          {[92, 100, 84, 96].map((width) => <span key={width} style={{ width: `${width}%`, height: 4, borderRadius: 99, background: '#edf1f4' }} />)}
        </div>
        <div style={{ position: 'absolute', left: 32, top: 124, color: '#52616c', fontSize: 8, fontWeight: 650 }}>Table 2. Model performance comparison</div>
        <div style={{ position: 'absolute', left: 38, top: 312, width: 198, display: 'grid', gap: 7 }}>
          {[100, 86, 94].map((width) => <span key={width} style={{ width: `${width}%`, height: 4, borderRadius: 99, background: '#edf1f4' }} />)}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 500,
          top: 70,
          width: 370,
          height: 280,
          borderRadius: 18,
          background: 'rgba(249,250,252,0.92)',
          border: '1px solid rgba(188,211,199,0.92)',
          boxShadow: '0 22px 54px rgba(61,92,126,0.09)',
          opacity: interpolate(frame, [0, 26, 94, 118], [0.58, 0.64, 0.82, 1], clamp),
        }}
      >
        <div style={{ position: 'absolute', inset: '0 0 auto', height: 34, borderBottom: '1px solid #e3ebe7', background: 'rgba(255,255,255,0.9)', borderRadius: '18px 18px 0 0' }}>
          <span style={{ position: 'absolute', left: 14, top: 9, width: 16, height: 16, borderRadius: 4, background: '#4f9c76', color: 'white', fontSize: 8, fontWeight: 800, display: 'grid', placeItems: 'center' }}>X</span>
          <div style={{ position: 'absolute', left: 42, top: 14, display: 'flex', gap: 8 }}>
            {[24, 18, 28, 20].map((width) => <span key={width} style={{ width, height: 5, borderRadius: 99, background: '#e2e9e5' }} />)}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 47, height: 22, border: '1px solid #dde6e1', borderRadius: 5, background: 'white' }}>
          <span style={{ position: 'absolute', left: 8, top: 6, color: '#7d8b83', fontSize: 8 }}>fx</span>
          <span style={{ position: 'absolute', left: 29, top: 6, width: 74, height: 6, borderRadius: 99, background: '#eef3f0', opacity: interpolate(frame, [136, 146], [0, 1], clamp) }} />
        </div>
        <div style={{ position: 'absolute', left: 42, top: 91, color: '#91a098', fontSize: 8, display: 'flex', gap: 55 }}>
          {['A', 'B', 'C', 'D'].map((letter) => <span key={letter}>{letter}</span>)}
        </div>
        <div style={{ position: 'absolute', left: 18, top: 119, color: '#91a098', fontSize: 8, display: 'grid', gap: 25 }}>
          {[1, 2, 3, 4].map((number) => <span key={number}>{number}</span>)}
        </div>
        <div style={{ position: 'absolute', left: 73, bottom: 18, height: 5, width: 90, borderRadius: 99, background: '#dfe7e3' }} />
        <span style={{ position: 'absolute', left: 18, bottom: 13, borderRadius: 4, background: '#e4f3eb', color: '#4f7f67', padding: '4px 9px', fontSize: 7, fontWeight: 650 }}>Table 2</span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 102,
          top: 158,
          width: interpolate(frame, [12, 36], [0, 212], { ...clamp, easing: ease }),
          height: interpolate(frame, [12, 36], [0, 130], { ...clamp, easing: ease }),
          border: '2px solid #4f9c76',
          borderRadius: 8,
          background: 'rgba(79,156,118,0.05)',
          boxShadow: '0 0 0 4px rgba(79,156,118,0.08)',
          opacity: interpolate(frame, [8, 12, 46, 60], [0, 1, 1, 0], clamp),
          zIndex: 65,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 108,
          top: interpolate(frame, [36, 52], [164, 286], { ...clamp, easing: Easing.inOut(Easing.quad) }),
          width: 200,
          height: 2,
          borderRadius: 99,
          background: '#4f9c76',
          boxShadow: '0 0 18px 5px rgba(79,156,118,0.24)',
          opacity: interpolate(frame, [32, 36, 52, 57], [0, 1, 1, 0], clamp),
          zIndex: 66,
        }}
      />

      {rows.flatMap((row, rowIndex) => row.map((value, columnIndex) => (
        <CellToken key={`${rowIndex}-${columnIndex}`} row={rowIndex} column={columnIndex} value={value} />
      )))}

      <div
        style={{
          position: 'absolute',
          left: 574,
          top: 142,
          width: 266,
          height: 138,
          border: '2px solid #4f9c76',
          boxShadow: '0 0 0 3px rgba(79,156,118,0.09)',
          opacity: interpolate(frame, [130, 138, 160, 168], [0, 1, 1, 0], clamp),
          zIndex: 70,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 702,
          top: 210,
          width: 66,
          height: 34,
          border: '2px solid #2f7d55',
          opacity: interpolate(frame, [142, 148, 164, 170], [0, 1, 1, 0], clamp),
          zIndex: 72,
        }}
      />

      <Cursor frame={frame} />
    </AbsoluteFill>
  );
}
