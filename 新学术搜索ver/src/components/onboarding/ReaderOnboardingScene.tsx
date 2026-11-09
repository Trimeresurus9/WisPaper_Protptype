import React from 'react';
import { BookOpen, Check, Languages, MessageCircle, StickyNote } from 'lucide-react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const tabs = [Languages, MessageCircle, StickyNote];
const labels = ['对照翻译', 'AI 问答', '笔记'];
const widths = [100, 96, 88, 100, 73, 94, 100, 83];

function Lines({ translated = false, progress = 1 }: { translated?: boolean; progress?: number }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
    {widths.map((width, index) => <div key={index} style={{ width: `${width * Math.max(0, Math.min(1, progress * 10 - index))}%`, height: 6, borderRadius: 3, background: translated ? '#b7cfea' : '#dce5ef' }} />)}
  </div>;
}

// Three deterministic five-second chapters, shared by the bubble and hover card.
export function ReaderOnboardingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chapter = Math.min(2, Math.floor(frame / (5 * fps)));
  const localFrame = frame - chapter * 5 * fps;
  const answered = localFrame > 1.8 * fps;
  const saved = localFrame > 3.2 * fps;
  return <div style={{ position: 'absolute', inset: 0, background: '#f2f7fd', padding: '24px 30px', fontFamily: '"PingFang SC","Helvetica Neue",Arial,sans-serif', color: '#334155' }}>
    <div style={{ height: '100%', background: 'white', border: '1px solid #dfe7f1', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ height: 41, borderBottom: '1px solid #e8edf4', display: 'flex', alignItems: 'center', gap: 8, padding: '0 17px' }}>
        <BookOpen size={15} color="#68819f" /><span style={{ fontSize: 11, color: '#7b8da4' }}>论文阅读器</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>{tabs.map((Icon, index) => <div key={labels[index]} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '5px 9px', borderRadius: 5, background: chapter === index ? '#edf5ff' : 'transparent', color: chapter === index ? '#0079ff' : '#8594a7' }}><Icon size={13} />{labels[index]}</div>)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 'calc(100% - 41px)' }}>
        <div style={{ padding: '21px 21px', borderRight: '1px solid #e8edf4', position: 'relative' }}>
          <div style={{ width: 178, height: 9, background: '#bbcde1', borderRadius: 4, marginBottom: 19 }} />
          <div style={{ position: 'absolute', left: 16, top: 96, width: interpolate(localFrame, [0.4 * fps, 1.2 * fps], [0, 234], clamp), height: 29, background: chapter === 2 ? '#fef2bf' : '#e8f2ff', opacity: chapter > 0 ? 1 : 0 }} />
          <div style={{ position: 'relative' }}><Lines /></div>
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#a0adbc' }}>1 / 12</div>
        </div>
        <div style={{ padding: '21px 19px', background: chapter === 0 ? '#fff' : '#fafcfe', position: 'relative' }}>
          {chapter === 0 ? <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5786b6', marginBottom: 17 }}><Languages size={14} />中文译文</div>
            <Lines translated progress={interpolate(localFrame, [0.6 * fps, 3 * fps], [0, 1], clamp)} />
          </> : chapter === 1 ? <>
            <div style={{ padding: '9px 11px', border: '1px solid #dce9f8', borderRadius: 7, fontSize: 12, background: '#f0f6ff' }}>这段方法的核心思路是什么？</div>
            <div style={{ marginTop: 17, opacity: interpolate(localFrame, [1.7 * fps, 2 * fps], [0, 1], clamp) }}>
              <div style={{ fontSize: 11, color: '#5786b6', marginBottom: 12 }}>AI · 结合论文回答</div>
              <Lines translated progress={interpolate(localFrame, [1.8 * fps, 3.7 * fps], [0, 0.55], clamp)} />
            </div>
            {answered && <span style={{ position: 'absolute', bottom: 18, fontSize: 10, color: '#0079ff', opacity: interpolate(localFrame, [3.8 * fps, 4.2 * fps], [0, 1], clamp) }}>查看原文 · 第 1 页 ↗</span>}
          </> : <>
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}><StickyNote size={14} color="#68819f" />阅读笔记</div>
            <div style={{ padding: 13, border: '1px solid #e4eaf2', borderRadius: 7, background: 'white', opacity: interpolate(localFrame, [0.7 * fps, 1.1 * fps], [0, 1], clamp) }}>
              <div style={{ borderLeft: '3px solid #efd98a', paddingLeft: 9, marginBottom: 14 }}><div style={{ width: '95%', height: 6, background: '#e4e9ef', marginBottom: 7, borderRadius: 3 }} /><div style={{ width: '72%', height: 6, background: '#e4e9ef', borderRadius: 3 }} /></div>
              <div style={{ fontSize: 12, lineHeight: 1.8, opacity: interpolate(localFrame, [1.4 * fps, 2 * fps], [0, 1], clamp) }}>记录关键方法，留待复现。</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, fontSize: 10, color: '#5786b6', opacity: saved ? 1 : 0 }}><Check size={12} />已保存 · 关联原文</div>
            </div>
          </>}
        </div>
      </div>
    </div>
  </div>;
}
