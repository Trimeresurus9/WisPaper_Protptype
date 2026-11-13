import React, { useRef } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, CircleDashed, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { homeSearchCases, type HomeSearchCase } from './home-search-cases';
import './search-case-preview.css';

export function SearchExampleCard({ item, index, onOpen }: { item: HomeSearchCase; index: number; onOpen: () => void }) {
  return <button className="wh-visual-case wsp-example-card" style={{ '--case-order': index } as React.CSSProperties} aria-label={`预览搜索案例：${item.title}`} onClick={onOpen}>
    <span className="wh-case-visual"><img src={item.image} alt="" loading="lazy"/><span className="wh-case-preview-action">查看案例<ArrowUpRight size={14}/></span></span>
    <span className="wh-case-caption"><span><strong>{item.title}</strong><small>{item.caption}</small></span><span className="wh-case-open"><ArrowUpRight size={18}/></span></span>
  </button>;
}

export function SearchCasePreview({ item, onClose, onChangeCase, onViewResults, onUsePrompt, onReturnFocus }: {
  item: HomeSearchCase | null;
  onClose: () => void;
  onChangeCase: (item: HomeSearchCase) => void;
  onViewResults: (item: HomeSearchCase) => void;
  onUsePrompt: (item: HomeSearchCase) => void;
  onReturnFocus: () => void;
}) {
  const lastCase = useRef(homeSearchCases[0]);
  if (item) lastCase.current = item;
  const active = item ?? lastCase.current;
  const index = homeSearchCases.findIndex(example => example.id === active.id);
  const perfect = active.papers.filter(paper => paper.relevance === 'Perfect').length;
  return <Dialog open={!!item} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="wsp-case-dialog" onCloseAutoFocus={event => { event.preventDefault(); onReturnFocus(); }}>
      <section className="wsp-preview-panel" aria-label="论文列表预览">
        <div className="wsp-preview-image" key={active.id}>
          <img src={active.image} alt={`${active.title}论文列表，${perfect} 篇 Perfect，${active.papers.length-perfect} 篇 Partial。完整标题与相关度见下方可访问列表。`}/>
          <ol className="sr-only">{active.papers.map(paper => <li key={paper.id}>{paper.title}。{paper.relevance}。{paper.relevanceReason}</li>)}</ol>
        </div>
        <div className="wsp-preview-foot"><span><Search size={13}/>深度搜索 · 案例预览</span><span>{active.papers.length} 篇代表性论文</span></div>
      </section>
      <aside className="wsp-case-info">
        <div className="wsp-info-scroll">
          <span className="wsp-eyebrow">论文搜索</span>
          <DialogTitle>{active.title}</DialogTitle>
          <div className="wsp-keywords" aria-label="搜索关键词">{active.keywords.map(keyword => <span key={keyword}>{keyword}</span>)}</div>
          <DialogDescription>{active.description}</DialogDescription>
          <section className="wsp-prompt" aria-label="示例 Prompt"><span>Prompt</span><p>{active.prompt}</p></section>
          <div className="wsp-relevance-legend" aria-label="相关度说明"><span className="wsp-perfect"><Check size={13}/>Perfect <small>直接相关</small></span><span className="wsp-partial"><CircleDashed size={13}/>Partial <small>部分相关</small></span></div>
          <p className="wsp-example-note">相关度为此示例问题下的匹配展示。</p>
        </div>
        <div className="wsp-case-bottom">
          <nav className="wsp-case-pagination" aria-label="切换搜索案例"><span>案例 <b>{String(index+1).padStart(2,'0')}</b> / {String(homeSearchCases.length).padStart(2,'0')}</span><div><button type="button" aria-label="上一个搜索案例" disabled={index===0} onClick={()=>onChangeCase(homeSearchCases[index-1])}><ChevronLeft size={16}/></button><button type="button" aria-label="下一个搜索案例" disabled={index===homeSearchCases.length-1} onClick={()=>onChangeCase(homeSearchCases[index+1])}><ChevronRight size={16}/></button></div></nav>
          <button type="button" className="wsp-view-results" onClick={()=>onViewResults(active)}>查看结果页<ArrowUpRight size={16}/></button>
          <button type="button" className="wsp-use-prompt" onClick={()=>onUsePrompt(active)}>像这样搜索一次<ArrowRight size={16}/></button>
        </div>
      </aside>
    </DialogContent>
  </Dialog>;
}
