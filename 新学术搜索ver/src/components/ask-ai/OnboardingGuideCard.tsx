import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { SavedGuide } from '../onboarding/useOnboarding';

const Preview = lazy(() => import('./OnboardingCardPreview'));
const guideTitle = (guide: SavedGuide) => guide.page === 'agent'
  ? '把研究任务交给 Agent'
  : guide.page === 'reader' ? '读懂论文，留下思考' : ['从问题找到论文', '选择研究兴趣', '保存研究偏好'][guide.step];

export function OnboardingGuideCard({ guide, onResume }: { guide: SavedGuide; onResume: () => void }) {
  const card = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const title = guideTitle(guide);
  const playing = visible && (hovered || keyboardFocused);

  useEffect(() => {
    if (!card.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(card.current);
    return () => observer.disconnect();
  }, []);

  return <article ref={card} className="wp-ai-guide" data-preview-playing={playing}
    onPointerEnter={event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') setHovered(true); }}
    onPointerLeave={() => setHovered(false)}>
    <div className="wp-ai-guide-preview" aria-hidden="true">
      <Suspense fallback={<div className="wp-ai-guide-poster"><span /><span /><span /></div>}>
        <Preview page={guide.page} step={guide.step} playing={playing} />
      </Suspense>
    </div>
    <button type="button" className="wp-ai-guide-title" aria-label={`继续了解：${title}`}
      onFocus={event => setKeyboardFocused(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setKeyboardFocused(false)} onClick={onResume}>{title}</button>
  </article>;
}
