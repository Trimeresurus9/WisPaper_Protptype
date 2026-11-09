import React, { useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { MotionScene } from './onboarding-scenes';
import { ReaderOnboardingScene } from './ReaderOnboardingScene';
import type { OnboardingController } from './useOnboarding';

const chapters = { home: ['搜索', '搜索结果', '加入知识库'], agent: ['输入任务', '选择模型', '选择 Skill', '查看回答'], reader: ['对照翻译', 'AI 问答', '记录笔记'] };
function AnimationScene({ page }: { page: OnboardingController['page'] }) {
  return page === 'reader' ? <ReaderOnboardingScene /> : <MotionScene page={page} />;
}
export default function OnboardingAnimation({ controller: c }: { controller: OnboardingController }) {
  const player = useRef<PlayerRef>(null);
  const [chapter, setChapter] = useState(0);
  const duration = chapters[c.page].length * 150;
  useEffect(() => {
    const ref = player.current;
    if (!ref) return;
    const onFrame = (event: { detail: { frame: number } }) => setChapter(Math.min(chapters[c.page].length - 1, Math.floor(event.detail.frame / 150)));
    const onEnd = () => c.setPlaying(false);
    ref.addEventListener('frameupdate', onFrame);
    ref.addEventListener('ended', onEnd);
    return () => { ref.removeEventListener('frameupdate', onFrame); ref.removeEventListener('ended', onEnd); };
  }, [c.page, c.setPlaying]);
  useEffect(() => {
    if (!player.current) return;
    if (c.playing) {
      if (player.current.getCurrentFrame() >= duration - 1) player.current.seekTo(0);
      player.current.play();
    } else player.current.pause();
  }, [c.playing, duration]);
  return <div className="wp-ob-media">
    <Player ref={player} component={AnimationScene} inputProps={{ page: c.page }} durationInFrames={duration} compositionWidth={640} compositionHeight={320} fps={30} initialFrame={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 24 : 0} style={{ width: '100%', aspectRatio: '2 / 1' }} playbackRate={c.speed} autoPlay={c.playing} controls={false} clickToPlay={false} loop={false} moveToBeginningWhenEnded={false} />
    <div className="wp-ob-media-bar"><span data-onboarding-chapter>{chapters[c.page][chapter]}</span><span className="wp-ob-spacer" /><button aria-label={c.playing ? '暂停动画' : '播放动画'} onClick={() => c.setPlaying(!c.playing)}>{c.playing ? '暂停' : '播放'}</button><button aria-label="重播动画" onClick={c.replay}>重播</button></div>
  </div>;
}
