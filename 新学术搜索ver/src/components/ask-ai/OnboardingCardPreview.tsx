import React, { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { MotionScene } from '../onboarding/onboarding-scenes';
import { ReaderOnboardingScene } from '../onboarding/ReaderOnboardingScene';
import type { OnboardingPage } from '../onboarding/useOnboarding';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const interestLabels = ['大语言模型', '检索增强生成', 'AI for Science', '生物医学', '材料科学', '计算机视觉'];

// Preview only: opening these cards still resumes the interactive interest / login step.
function SettingsPreview({ step }: { step: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const saved = frame >= 3.5 * fps;
  return <div style={{ position: 'absolute', inset: 0, background: '#f2f7fd', padding: '35px 55px', fontFamily: '"PingFang SC",sans-serif', color: '#263343' }}>
    <div style={{ height: '100%', padding: 24, border: '1px solid #e3eaf4', borderRadius: 16, background: '#fff', position: 'relative' }}>
      {step === 1 ? <>
        <div style={{ width: 158, height: 10, borderRadius: 5, background: '#dce5ef', marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {interestLabels.map((label, index) => {
            const selected = (index === 0 && frame > 0.8 * fps) || (index === 1 && frame > 1.8 * fps);
            return <div key={label} style={{ padding: '12px 4px', textAlign: 'center', fontSize: 13, borderRadius: 8, border: `1px solid ${selected ? '#a8cfff' : '#e3eaf4'}`, background: selected ? '#eff7ff' : '#fff', color: selected ? '#0079ff' : '#6e7989' }}>{label}</div>;
          })}
        </div>
      </> : <div style={{ display: 'flex', alignItems: 'center', gap: 30, height: 162 }}>
        <div style={{ width: 126, height: 150, border: '2px solid #d9e4ef', borderRadius: 15, padding: '14px 12px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: 5, width: 28, margin: '0 auto 16px', background: '#dce5ef', borderRadius: 4 }} />
          <svg viewBox="0 0 100 100" width="98" height="98"><rect width="100" height="100" rx="7" fill="#f4f7fb" />{[[12,12],[57,12],[12,57]].map(([x,y]) => <g key={`${x}-${y}`} fill="#b2c5db"><rect x={x} y={y} width="28" height="28" rx="3" /><rect x={x+7} y={y+7} width="14" height="14" rx="2" fill="white" /></g>)}<path d="M57 57h12v12H57zm16 16h12v12H73zM57 77h8v8h-8zM77 57h8v8h-8z" fill="#b2c5db" /></svg>
          {!saved && <div style={{ position: 'absolute', left: 10, right: 10, height: 2, top: interpolate(frame, [0, 3 * fps], [43, 135], clamp), background: '#7fbbf7' }} />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}><div style={{ height: 11, width: 178, borderRadius: 5, background: '#ccd9e9' }} /><div style={{ height: 9, width: 142, borderRadius: 5, background: '#e1e8f1' }} /><div style={{ fontSize: 13, color: '#5786b6', opacity: interpolate(frame, [3 * fps, 3.5 * fps], [0, 1], clamp) }}>✓ 研究偏好已保存</div></div>
      </div>}
      <div style={{ position: 'absolute', bottom: 20, right: 24, padding: '8px 16px', borderRadius: 8, background: saved ? '#eef5fd' : '#263343', color: saved ? '#4380c5' : '#fff', fontSize: 12 }}>{saved ? '✓ 已保存' : step === 1 ? '保存兴趣' : '扫码登录'}</div>
    </div>
  </div>;
}
function CardScene({ page, step }: { page: OnboardingPage; step: number }) {
  return page === 'reader' ? <ReaderOnboardingScene /> : page === 'home' && step > 0 ? <SettingsPreview step={step} /> : <MotionScene page={page} />;
}
export default function OnboardingCardPreview({ page, step, playing }: { page: OnboardingPage; step: number; playing: boolean }) {
  const player = useRef<PlayerRef>(null);
  const hasPlayed = useRef(false);
  const duration = page === 'agent' ? 600 : step > 0 ? 150 : 450;
  useEffect(() => {
    const current = player.current;
    if (!current) return;
    if (playing) {
      if (!hasPlayed.current || current.getCurrentFrame() >= duration - 1) current.seekTo(0);
      hasPlayed.current = true;
      current.play();
    } else current.pause();
    return () => current.pause();
  }, [playing, duration]);

  return <Player ref={player} component={CardScene} inputProps={{ page, step }}
    compositionWidth={640} compositionHeight={320} durationInFrames={duration} fps={30}
    initialFrame={60} style={{ width: '100%', aspectRatio: '2 / 1' }}
    autoPlay={false} controls={false} clickToPlay={false} doubleClickToFullscreen={false}
    spaceKeyToPlayOrPause={false} loop={false} moveToBeginningWhenEnded={false} />;
}
