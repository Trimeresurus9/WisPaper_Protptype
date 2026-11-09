import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import logo from './logo.svg';
import type { OnboardingController } from './useOnboarding';
import './onboarding.css';

const Animation = lazy(() => import('./OnboardingAnimation'));
const interests = ['大语言模型', '检索增强生成', 'AI for Science', '生物医学', '材料科学', '计算机视觉'];
const qrModules = Array.from({ length: 625 }, (_, i) => ({ x: i % 25, y: Math.floor(i / 25) })).filter(({ x, y }) => !((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) && (x * 13 + y * 17 + x * y * 7) % 11 < 5);
function DemoQr() {
  return <svg className="wp-ob-qr" viewBox="-2 -2 29 29" role="img" aria-label="演示二维码，不用于真实登录">
    <rect x={-2} y={-2} width={29} height={29} fill="white" /><g fill="#26313e">{qrModules.map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />)}{[[0, 0], [18, 0], [0, 18]].map(([x, y]) => <g key={`${x}-${y}`}><rect x={x} y={y} width={7} height={7} /><rect x={x + 1} y={y + 1} width={5} height={5} fill="white" /><rect x={x + 2} y={y + 2} width={3} height={3} /></g>)}</g><rect x={9} y={9} width={7} height={7} rx={1} fill="white" /><image href={logo} x={10} y={10} width={5} height={5} />
  </svg>;
}

export function OnboardingExperience({ controller: c, onOpenReader }: { controller: OnboardingController; onOpenReader?: () => void }) {
  const bubble = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number; side: string; arrowX: number; arrowY: number }>({ x: 280, y: 100, side: 'left', arrowX: 32, arrowY: 32 });
  const heading = c.page === 'agent' ? '把研究任务交给 Agent' : c.page === 'reader' ? '读懂论文，留下思考' : ['从问题找到论文', '选择研究兴趣', '保存研究偏好'][c.flow.step];

  useEffect(() => { document.body.classList.toggle('wp-ob-is-active', c.active); return () => document.body.classList.remove('wp-ob-is-active'); }, [c.active]);
  useEffect(() => {
    if (!c.active) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [c.active]);
  useEffect(() => { if (c.active) title.current?.focus({ preventScroll: true }); }, [c.active, c.page, c.flow.step]);
  useEffect(() => {
    if (!c.active) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); c.dismiss(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [c.active, c.dismiss]);

  useLayoutEffect(() => {
    if (!c.active) return;
    const anchorName = c.page === 'home' && c.flow.step > 0 ? (c.flow.step === 1 ? 'interests' : 'home') : c.page;
    const anchor = document.querySelector<HTMLElement>(`[data-onboarding-anchor="${anchorName}"]`) ?? document.querySelector<HTMLElement>('[data-onboarding-mock-toggle]');
    if (!anchor || !bubble.current) return;
    const initialRect = anchor.getBoundingClientRect();
    if (initialRect.top < 12 || initialRect.bottom > innerHeight - 12) anchor.scrollIntoView({ block: 'center', behavior: 'instant' });
    // Bring the real composer high enough to leave room below it for the guide.
    if (anchor.matches('[data-onboarding-input]')) {
      let scrollParent = anchor.parentElement;
      while (scrollParent && !(/auto|scroll/.test(getComputedStyle(scrollParent).overflowY) && scrollParent.scrollHeight > scrollParent.clientHeight)) scrollParent = scrollParent.parentElement;
      if (scrollParent) {
        const required = anchor.getBoundingClientRect().bottom + bubble.current.offsetHeight + 32 - innerHeight;
        if (required > 0) scrollParent.scrollTop += required;
      }
    }
    anchor.classList.add('wp-ob-anchor-active');
    let scheduled = 0;
    const update = () => {
      if (!bubble.current) return;
      const r = anchor.getBoundingClientRect(), b = bubble.current.getBoundingClientRect();
      const mock = document.querySelector<HTMLElement>('[data-prototype-mock]')?.getBoundingClientRect();
      const gap = 16, pad = 16, clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
      let x = clamp(anchor.matches('[data-onboarding-input]') ? r.left + (r.width - b.width) / 2 : r.right - b.width, pad, innerWidth - b.width - pad), y: number, side: string;
      if (c.page === 'reader' && r.top - gap - b.height >= 80) { x = clamp(r.left, pad, innerWidth - b.width - pad); y = r.top - gap - b.height; side = 'bottom'; }
      else if (c.page === 'reader' && r.bottom + gap + b.height <= innerHeight - pad) { x = clamp(r.left, pad, innerWidth - b.width - pad); y = r.bottom + gap; side = 'top'; }
      else if (innerWidth >= 760 && r.right + gap + b.width <= innerWidth - pad) { x = r.right + gap; y = clamp(r.top - 18, pad, innerHeight - b.height - pad); side = 'left'; }
      else if (r.bottom + gap + b.height <= innerHeight - pad) { y = r.bottom + gap; side = 'top'; }
      else if (r.top - gap - b.height >= pad) { y = r.top - gap - b.height; side = 'bottom'; }
      else { x = innerWidth < 760 ? (innerWidth - b.width) / 2 : clamp(r.left - gap - b.width, pad, innerWidth - b.width - pad); y = clamp(r.top - 18, pad, innerHeight - b.height - pad); side = innerWidth < 760 ? 'none' : 'right'; }
      if (mock && x < mock.right && x + b.width > mock.left && y < mock.bottom && y + b.height > mock.top) {
        if (r.top - gap - b.height >= pad && r.top - gap <= mock.top) { y = r.top - gap - b.height; side = 'bottom'; }
        else if (mock.left - gap - b.width >= pad) { x = mock.left - gap - b.width; side = 'right'; }
        else { y = Math.max(pad, mock.top - gap - b.height); side = 'none'; }
      }
      setPosition({ x, y, side, arrowX: clamp(r.left + r.width / 2 - x, 24, b.width - 24), arrowY: clamp(r.top + r.height / 2 - y, 24, b.height - 24) });
    };
    const schedule = () => { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(bubble.current);
    const mock = document.querySelector('[data-prototype-mock]');
    if (mock) observer.observe(mock);
    window.addEventListener('resize', schedule);
    window.addEventListener('wispaper:onboarding-mock-move', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => { cancelAnimationFrame(scheduled); observer.disconnect(); window.removeEventListener('resize', schedule); window.removeEventListener('wispaper:onboarding-mock-move', schedule); window.removeEventListener('scroll', schedule, true); anchor.classList.remove('wp-ob-anchor-active'); };
  }, [c.active, c.page, c.flow.step]);

  if (!c.active) return null;
  const finishAgent = () => { c.end(); requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>('[data-onboarding-input="agent"]')?.focus()); };
  const continueGuide = () => {
    if (c.page === 'home') c.jump(1);
    else if (c.page === 'reader') { c.end(); onOpenReader?.(); }
    else finishAgent();
  };
  return createPortal(<section ref={bubble} className="wp-ob-bubble" role="dialog" aria-labelledby="wp-ob-title" data-side={position.side} style={{ left: position.x, top: position.y, '--arrow-x': `${position.arrowX}px`, '--arrow-y': `${position.arrowY}px` } as React.CSSProperties}>
    <header className="wp-ob-header"><h2 id="wp-ob-title" ref={title} tabIndex={-1}>{heading}</h2><button onClick={c.dismiss} aria-label="关闭引导" className="wp-ob-close"><X size={18} /></button></header>
    {c.flow.step === 0 ? <><Suspense fallback={<div className="wp-ob-animation-loading" role="status">正在载入演示…</div>}><Animation key={`${c.page}-${c.animationVersion}`} controller={c} /></Suspense><div className="wp-ob-body"><p>{{ home: '找到相关论文，收藏到知识库。', agent: '输入任务，选择模型和 Skill，查看回答。', reader: '对照翻译、AI 问答，随手记录阅读笔记。' }[c.page]}</p><footer className="wp-ob-footer"><button className="wp-ob-secondary" onClick={c.dismiss}>稍后再说</button><button className="wp-ob-primary" onClick={continueGuide}>{{ home: '选择兴趣', agent: '开始使用', reader: '打开阅读器' }[c.page]}</button></footer></div></> : c.flow.step === 1 ? <div className="wp-ob-body"><p>选择你长期关注的方向。</p><div className="wp-ob-interests">{Array.from(new Set([...interests, ...c.state.draftInterests])).map(interest => <button key={interest} aria-pressed={c.state.draftInterests.includes(interest)} onClick={() => c.toggleInterest(interest)}>{c.state.draftInterests.includes(interest) ? '✓ ' : ''}{interest}</button>)}</div><footer className="wp-ob-footer"><span className="wp-ob-hint">可随时调整</span><button className="wp-ob-primary" disabled={!c.state.draftInterests.length} onClick={c.saveInterests}>保存并继续</button></footer></div> : <div className="wp-ob-body wp-ob-login"><p>微信扫码，保存刚才的研究兴趣。</p><DemoQr /><span className="wp-ob-hint">演示二维码</span><footer className="wp-ob-footer"><button className="wp-ob-secondary" onClick={c.dismiss}>稍后再说</button><button className="wp-ob-primary" onClick={c.completeLogin}>模拟扫码成功</button></footer></div>}
  </section>, document.body);
}
