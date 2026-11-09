import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AskAIPanel } from './AskAI';
import { RightPanel } from '../RightPanel';
import type { Paper } from '../../types';
export function SearchAskAI({ selectedPaper }: { selectedPaper: Paper | null }) {
  const [tab, setTab] = useState<'ask' | 'workflow'>('ask');
  const [collapsed, setCollapsed] = useState(() => window.innerWidth <= 1000);
  return <>
    {collapsed && <button className="wp-ai-mobile-search-toggle" onClick={() => setCollapsed(false)}><MessageCircle size={16} />Ask AI</button>}
    <aside className={`wp-ai-search-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="搜索辅助栏">
      <div className="wp-ai-search-tabs" role="tablist"><button role="tab" aria-selected={tab === 'ask'} onClick={() => setTab('ask')}>Ask AI</button><button role="tab" aria-selected={tab === 'workflow'} onClick={() => setTab('workflow')}>搜索过程</button><button className="wp-ai-icon" style={{ marginLeft: 'auto' }} aria-label="收起搜索辅助栏" onClick={() => setCollapsed(true)}><X size={15} /></button></div>
      {tab === 'ask' ? <AskAIPanel /> : <RightPanel selectedPaper={selectedPaper} />}
    </aside>
  </>;
}
