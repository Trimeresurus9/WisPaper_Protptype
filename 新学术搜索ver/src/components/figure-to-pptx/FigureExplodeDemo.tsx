import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { PptxDemoWindow } from './PptxDemoWindow';
import { DemoPointer } from './DemoPointer';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);

type MigratingElementProps = {
  delay: number;
  left: number;
  top: number;
  targetLeft: number;
  targetTop: number;
  width: number;
  height: number;
  borderRadius: number | string;
  background: string;
  border: string;
  children?: React.ReactNode;
};

function MigratingElement({
  delay,
  left,
  top,
  targetLeft,
  targetTop,
  width,
  height,
  borderRadius,
  background,
  border,
  children,
}: MigratingElementProps) {
  const frame = useCurrentFrame();
  const depart = 50 + delay;
  const arrive = 108 + delay;

  return (
    <div
      style={{
        position: 'absolute',
        left: interpolate(frame, [depart, arrive], [left, targetLeft], {
          ...clamp,
          easing: ease,
        }),
        top: interpolate(frame, [depart, arrive], [top, targetTop], {
          ...clamp,
          easing: ease,
        }),
        width,
        height,
        borderRadius,
        background,
        border,
        boxShadow: `0 ${interpolate(frame, [depart, depart + 18, arrive], [5, 20, 5], {
          ...clamp,
          easing: ease,
        })}px ${interpolate(frame, [depart, depart + 18, arrive], [14, 34, 14], {
          ...clamp,
          easing: ease,
        })}px rgba(55, 78, 101, ${interpolate(frame, [depart, depart + 18, arrive], [0.08, 0.2, 0.08], clamp)})`,
        scale: interpolate(frame, [depart, depart + 18, arrive], [1, 1.08, 1], {
          ...clamp,
          easing: ease,
          output: 'perceptual-scale',
        }),
        rotate: interpolate(frame, [depart, depart + 18, arrive], ['0deg', `${delay % 2 ? 2.2 : -2.2}deg`, '0deg'], {
          ...clamp,
          easing: ease,
        }),
        zIndex: 20 + delay,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

type MigratingLineProps = {
  delay: number;
  left: number;
  top: number;
  targetLeft: number;
  targetTop: number;
  width: number;
  rotate?: number;
};

function MigratingLine({ delay, left, top, targetLeft, targetTop, width, rotate = 0 }: MigratingLineProps) {
  const frame = useCurrentFrame();
  const depart = 56 + delay;
  const arrive = 114 + delay;

  return (
    <div
      style={{
        position: 'absolute',
        left: interpolate(frame, [depart, arrive], [left, targetLeft], { ...clamp, easing: ease }),
        top: interpolate(frame, [depart, arrive], [top, targetTop], { ...clamp, easing: ease }),
        width,
        height: 2,
        borderRadius: 99,
        background: '#9ab7d0',
        rotate: `${rotate}deg`,
        transformOrigin: 'left center',
        opacity: interpolate(frame, [depart - 8, depart, arrive], [0.55, 0.92, 1], clamp),
        boxShadow: '0 1px 3px rgba(93,126,157,0.16)',
        zIndex: 12,
      }}
    />
  );
}

function SelectionHandles({ left, top, width, height, opacity }: { left: number; top: number; width: number; height: number; opacity: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        border: '2px solid #5f8fbd',
        borderRadius: 8,
        opacity,
        boxShadow: '0 0 0 4px rgba(95,143,189,0.08)',
        zIndex: 40,
      }}
    >
      {[
        [-5, -5],
        [width - 5, -5],
        [-5, height - 5],
        [width - 5, height - 5],
      ].map(([handleLeft, handleTop], index) => (
        <span
          key={index}
          style={{
            position: 'absolute',
            left: handleLeft,
            top: handleTop,
            width: 10,
            height: 10,
            borderRadius: 3,
            background: '#5f8fbd',
            border: '2px solid white',
            boxShadow: '0 2px 5px rgba(55,78,101,0.14)',
          }}
        />
      ))}
    </div>
  );
}

function Cursor({ frame }: { frame: number }) {
  return (
    <DemoPointer
      left={interpolate(frame, [4, 12, 34, 124, 138, 151, 164, 176], [76, 96, 336, 526, 600, 742, 680, 680], { ...clamp, easing: ease })}
      top={interpolate(frame, [4, 12, 34, 124, 138, 151, 164, 176], [92, 126, 308, 120, 150, 150, 244, 244], { ...clamp, easing: ease })}
      opacity={interpolate(frame, [0, 5, 172, 179], [0, 1, 1, 0], clamp)}
    />
  );
}

export function FigureExplodeDemo() {
  const frame = useCurrentFrame();

  const firstEditOpacity = interpolate(frame, [130, 136, 144, 148], [0, 1, 1, 0], clamp);
  const secondEditOpacity = interpolate(frame, [145, 151, 158, 162], [0, 1, 1, 0], clamp);
  const lineEditOpacity = interpolate(frame, [158, 164, 172, 176], [0, 1, 1, 0], clamp);

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
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(166,190,211,0.17) 1px, transparent 1px), linear-gradient(90deg, rgba(166,190,211,0.17) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 88%)',
          opacity: 0.72,
        }}
      />

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
        <span style={{ position: 'absolute', left: 0, top: 24, width: 5, height: 28, borderRadius: '0 5px 5px 0', background: '#d76a61' }} />
        <div style={{ position: 'absolute', left: 24, top: 25, width: 154, height: 7, borderRadius: 99, background: '#d8e1e9' }} />
        <div style={{ position: 'absolute', left: 24, top: 41, width: 106, height: 5, borderRadius: 99, background: '#edf1f5' }} />
        <div style={{ position: 'absolute', left: 24, top: 57, display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((item) => <span key={item} style={{ width: 14, height: 14, borderRadius: 99, background: item === 0 ? '#dfe8ef' : '#edf2f5' }} />)}
        </div>
        <div style={{ position: 'absolute', left: 24, top: 82, width: 98, display: 'grid', gap: 7 }}>
          {[92, 72, 86, 66].map((width) => <span key={width} style={{ width, height: 4, borderRadius: 99, background: '#edf1f4' }} />)}
        </div>
        <div style={{ position: 'absolute', right: 24, top: 82, width: 98, display: 'grid', gap: 7 }}>
          {[82, 96, 70, 88].map((width) => <span key={width} style={{ width, height: 4, borderRadius: 99, background: '#edf1f4' }} />)}
        </div>
        <div style={{ position: 'absolute', left: 24, bottom: 36, width: 98, display: 'grid', gap: 7 }}>
          {[90, 76, 95].map((width) => <span key={width} style={{ width, height: 4, borderRadius: 99, background: '#edf1f4' }} />)}
        </div>
        <div style={{ position: 'absolute', right: 24, bottom: 36, width: 98, display: 'grid', gap: 7 }}>
          {[78, 96, 70].map((width) => <span key={width} style={{ width, height: 4, borderRadius: 99, background: '#edf1f4' }} />)}
        </div>
      </div>

      <PptxDemoWindow opacity={interpolate(frame, [0, 20, 92, 112], [0.62, 0.68, 0.82, 1], clamp)} />

      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 126,
          width: interpolate(frame, [12, 34], [0, 242], { ...clamp, easing: ease }),
          height: interpolate(frame, [12, 34], [0, 190], { ...clamp, easing: ease }),
          border: '2px solid #5f8fbd',
          borderRadius: 10,
          background: 'rgba(95,143,189,0.05)',
          boxShadow: '0 0 0 4px rgba(95,143,189,0.07)',
          opacity: interpolate(frame, [8, 12, 46, 58], [0, 1, 1, 0], clamp),
          zIndex: 35,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: interpolate(frame, [36, 50], [102, 330], { ...clamp, easing: Easing.inOut(Easing.quad) }),
          top: 132,
          width: 2,
          height: 178,
          borderRadius: 99,
          background: '#6e9bc5',
          boxShadow: '0 0 20px 6px rgba(110,155,197,0.24)',
          opacity: interpolate(frame, [32, 36, 50, 54], [0, 1, 1, 0], clamp),
          zIndex: 38,
        }}
      />

      <MigratingLine delay={0} left={184} top={177} targetLeft={660} targetTop={167} width={44} />
      <MigratingLine delay={3} left={144} top={218} targetLeft={620} targetTop={196} width={26} rotate={90} />
      <MigratingLine delay={6} left={260} top={218} targetLeft={744} targetTop={196} width={26} rotate={90} />
      <MigratingLine delay={9} left={184} top={279} targetLeft={660} targetTop={251} width={44} />

      <MigratingElement delay={0} left={104} top={148} targetLeft={580} targetTop={138} width={80} height={58} borderRadius={12} background="#5f83a4" border="1px solid rgba(255,255,255,0.72)">
        <div style={{ width: 40, display: 'grid', gap: 6 }}>
          <span style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.95)' }} />
          <span style={{ height: 5, width: 28, borderRadius: 99, background: 'rgba(255,255,255,0.68)' }} />
          <span style={{ height: 5, width: 34, borderRadius: 99, background: 'rgba(255,255,255,0.52)' }} />
        </div>
      </MigratingElement>

      <MigratingElement delay={4} left={220} top={148} targetLeft={704} targetTop={138} width={80} height={58} borderRadius="50%" background="#22262c" border="1px solid rgba(255,255,255,0.28)">
        <span style={{ width: 18, height: 18, borderRadius: 99, border: '4px solid rgba(255,255,255,0.72)', borderTopColor: 'rgba(255,255,255,0.22)' }} />
      </MigratingElement>

      <MigratingElement delay={8} left={104} top={250} targetLeft={580} targetTop={222} width={80} height={58} borderRadius={15} background="#d8edf0" border="1px solid #bddde1">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 8px)', gap: 5 }}>
          {[0, 1, 2, 3, 4, 5].map((item) => <span key={item} style={{ width: 8, height: 8, borderRadius: 3, background: item === 4 ? '#66939a' : '#91bdc3' }} />)}
        </div>
      </MigratingElement>

      <MigratingElement delay={12} left={220} top={250} targetLeft={704} targetTop={222} width={80} height={58} borderRadius={12} background="#eaf3fb" border="1px solid #c9dceb">
        <div style={{ display: 'flex', alignItems: 'end', gap: 6, height: 28 }}>
          {[14, 24, 18, 28].map((height, index) => <span key={index} style={{ width: 7, height, borderRadius: '4px 4px 2px 2px', background: index === 3 ? '#6089ad' : '#9bbbd5' }} />)}
        </div>
      </MigratingElement>

      <div
        style={{
          position: 'absolute',
          left: 560,
          top: 120,
          width: 244,
          height: 164,
          border: '1px dashed rgba(95,143,189,0.42)',
          borderRadius: 14,
          opacity: interpolate(frame, [84, 94, 116, 126], [0, 1, 1, 0], clamp),
          zIndex: 8,
        }}
      />

      <SelectionHandles left={575} top={133} width={90} height={68} opacity={firstEditOpacity} />
      <SelectionHandles left={699} top={133} width={90} height={68} opacity={secondEditOpacity} />
      <SelectionHandles left={656} top={242} width={52} height={18} opacity={lineEditOpacity} />

      <Cursor frame={frame} />
    </AbsoluteFill>
  );
}
