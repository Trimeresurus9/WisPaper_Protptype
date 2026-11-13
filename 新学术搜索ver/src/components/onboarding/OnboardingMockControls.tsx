import React from 'react';
import type { OnboardingController, OnboardingPage } from './useOnboarding';

export function OnboardingMockControls({ controller: c, onNavigate }: { controller: OnboardingController; onNavigate: (page: OnboardingPage) => void }) {
  const status = c.page === 'reader' && !c.available ? '暂无 PDF' : { idle: '未开始', active: '体验中', paused: '已关闭', done: '已结束' }[c.flow.status];
  return <div className="wp-ob-mock-content">
    <div className="wp-ob-segment">{(['home', 'agent', 'reader'] as const).map(page => <button key={page} aria-pressed={c.page === page} onClick={() => onNavigate(page)}>{{ home: '原首页 · 搜索', agent: 'Agent', reader: '阅读器' }[page]}</button>)}</div>
    <div className="wp-ob-status"><span>气泡 + 动画</span><span role="status" data-onboarding-status>{status}</span></div>
    {c.page === 'reader' ? <>
      <div className="wp-ob-reader-switch-row"><span>阅读器引导气泡</span><button type="button" role="switch" aria-label="阅读器引导气泡" aria-checked={c.active} disabled={!c.available} onClick={() => c.active ? c.dismiss() : c.start()} className="wp-ob-reader-switch"><span /></button></div>
      {!c.available && <div className="wp-ob-reader-unavailable">当前文献暂无 PDF。<button type="button" onClick={() => onNavigate('reader')}>使用可阅读示例</button></div>}
    </> : <div className="wp-ob-mock-actions"><button className="wp-ob-primary" onClick={c.start}>{c.flow.status === 'idle' ? '开始体验' : '重新开始'}</button><button onClick={c.end} disabled={!c.active}>结束体验</button></div>}
    {c.page === 'home' && <><label className="wp-ob-label">跳转到</label><div className="wp-ob-steps">{['搜索演示', '选择兴趣', '扫码登录'].map((label, step) => <button key={label} aria-pressed={c.active && c.flow.step === step} onClick={() => c.jump(step)}>{label}</button>)}</div><label className="wp-ob-field">模拟登录状态<select aria-label="模拟登录状态" value={c.state.signedIn ? 'member' : 'guest'} onChange={e => c.setSignedIn(e.target.value === 'member')}><option value="guest">未登录</option><option value="member">已登录</option></select></label></>}
    {c.active && c.flow.step === 0 && <div className="wp-ob-playback"><button onClick={() => c.setPlaying(!c.playing)}>{c.playing ? '暂停动画' : '播放动画'}</button><button onClick={c.replay}>重播</button><select aria-label="动画速度" value={c.speed} onChange={e => c.setSpeed(Number(e.target.value))}>{[0.5, 1, 1.5, 2].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></div>}
    <div className="wp-ob-mock-footer"><button onClick={c.reset}>重置引导</button><span>仅本地演示</span></div>
  </div>;
}
