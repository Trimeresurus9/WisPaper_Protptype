import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  BookmarkPlus,
  Check,
  ChevronDown,
  Clipboard,
  ExternalLink,
  FileCheck2,
  Home,
  Languages,
  Menu,
  Quote,
} from 'lucide-react';
import wisPaperLogo from 'figma:asset/3ce02a66a6df7d8cd1f86de17846e94de4e9df61.png';
import type { Paper } from '../types';

interface QuickPaperPageProps {
  paper: Paper;
  onBack: () => void;
  onOpenReader: () => void;
  onWorkspace: () => void;
}

const referencePapers = [
  {
    title: 'Long Short-Term Memory-Networks for Machine Reading',
    meta: 'Jianpeng Cheng, Li Dong, Mirella Lapata · EMNLP, 2016',
  },
  {
    title: 'Neural Machine Translation of Rare Words with Subword Units',
    meta: 'Rico Sennrich, Barry Haddow, Alexandra Birch · ACL, 2016',
  },
  {
    title: 'Adam: A Method for Stochastic Optimization',
    meta: 'Diederik P. Kingma, Jimmy Ba · ICLR, 2015',
  },
];

export function QuickPaperPage({ paper, onBack, onOpenReader, onWorkspace }: QuickPaperPageProps) {
  const [activeTab, setActiveTab] = useState<'references' | 'citations'>('references');
  const [citationCopied, setCitationCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wispaper-workspace-home-v1') || '{}').bookmarks?.includes(paper.id) === true; } catch { return false; }
  });
  const isOpenAccess = paper.isOpenAccess === true;
  const originalUrl = paper.doi
    ? `https://doi.org/${paper.doi}`
    : paper.arxivId
      ? `https://arxiv.org/abs/${paper.arxivId}`
      : null;
  const compactAuthors = useMemo(() => paper.authors.join(', '), [paper.authors]);

  const copyCitation = async () => {
    const citation = `${compactAuthors}. ${paper.title}. ${paper.venue}, ${paper.year}.`;
    try {
      await navigator.clipboard.writeText(citation);
      setCitationCopied(true);
      setActionMessage('引用已复制');
    } catch { setActionMessage('暂时无法复制，请允许浏览器访问剪贴板。'); }
  };
  const savePaper = () => {
    try {
      const state = JSON.parse(localStorage.getItem('wispaper-workspace-home-v1') || '{}');
      const bookmarks = Array.isArray(state.bookmarks) ? state.bookmarks : [];
      localStorage.setItem('wispaper-workspace-home-v1', JSON.stringify({ ...state, bookmarks: [...new Set([...bookmarks, paper.id])] }));
      setSaved(true);
      setActionMessage('已加入知识库');
    } catch { setActionMessage('暂时无法保存，请检查浏览器存储空间。'); }
  };

  return (
    <div className="min-h-screen bg-[#f3f8fd] text-[#23282f]" data-quick-paper-page>
      <header className="border-b border-transparent">
        <div className="mx-auto flex h-[78px] max-w-[1760px] items-center justify-between px-5 sm:px-8">
          <button type="button" className="flex items-center gap-2" onClick={onWorkspace} aria-label="WisPaper home">
            <img src={wisPaperLogo} alt="WisPaper" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-[20px] font-semibold tracking-tight">WisPaper</span>
          </button>
          <nav className="hidden items-center gap-10 text-[14px] font-medium md:flex" aria-label="Primary">
            <button type="button" onClick={onBack}>学术搜索</button>
            <button type="button">功能</button>
            <button type="button">资源</button>
            <button type="button">价格</button>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" className="hidden h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 sm:flex" aria-label="语言">
              <Languages className="h-4 w-4" />
            </button>
            <button type="button" onClick={onWorkspace} className="inline-flex rounded-full bg-[#22282f] px-5 py-2 text-sm font-medium text-white">
              工作空间 <ArrowRight className="ml-1 h-4 w-4 -rotate-45" />
            </button>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1192px] px-5 py-8 sm:px-8 sm:py-12">
        <nav className="mb-9 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <Home className="h-4 w-4" />
          <button type="button" onClick={onWorkspace} className="hover:text-slate-900">WisPaper</button>
          <span>&gt;</span>
          <button type="button" onClick={onBack} className="shrink-0 hover:text-slate-900" aria-label="返回搜索结果">Search</button>
          <span>&gt;</span>
          <span className="min-w-0 max-w-[600px] truncate text-slate-700">{paper.title}</span>
        </nav>

        <section>
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]">{paper.title}</h1>
          <p className="mt-3 text-[14px] leading-6 text-[#456b4d]">
            {compactAuthors} – {paper.venue}, {paper.year}
            {paper.doi ? ` – ${paper.doi}` : ''}
          </p>

          <div className="mt-6 rounded-lg bg-[#f5f7f8] px-4 py-3">
            <div className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                <Clipboard className="h-4 w-4" />
              </span>
              TL;DR
            </div>
            <p className="mt-2 text-[14px] leading-7 text-slate-700">
              {paper.title === 'Attention Is All You Need'
                ? '本文提出了基于纯注意力机制的 Transformer 架构，完全摆脱传统循环和卷积神经网络。该模型在机器翻译任务中展现出卓越性能，同时训练速度更快、可并行性更高，成为后续研究的基础。'
                : `该研究围绕 ${paper.categories.slice(0, 2).join('、') || '当前主题'} 展开，提出关键方法并通过实验验证其有效性。下方保留原始摘要、验证条件和引用关系，便于在进入全文阅读前快速判断相关性。`}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenReader}
                data-onboarding-anchor={isOpenAccess ? 'reader' : undefined}
                disabled={!isOpenAccess}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#22282f] px-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <BookOpen className="h-4 w-4" />
                打开 PDF
              </button>
            <button type="button" onClick={savePaper} disabled={saved} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-white disabled:border-blue-200 disabled:text-blue-600">
              {saved ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}{saved ? '已加入知识库' : '加入知识库'}
            </button>
            <button
              type="button"
              onClick={copyCitation}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-white/70"
            >
              {citationCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Quote className="h-4 w-4" />}
              {citationCopied ? '已复制' : '引用'}
            </button>
            {originalUrl && <a href={originalUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-white/70"><ExternalLink className="h-4 w-4" />原网页</a>}
            {!isOpenAccess ? (
              <span className="text-xs text-slate-500">暂无可用的开放获取全文</span>
            ) : null}
          </div>
          {actionMessage && <p role="status" className="mt-2 text-xs text-slate-500">{actionMessage}</p>}
        </section>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-lg bg-[#f5f7f8] p-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-4 font-semibold">
              <Clipboard className="h-4 w-4" />
              摘要
            </div>
            <p className="pt-5 text-[15px] leading-7 text-slate-700">{paper.abstract}</p>
          </section>

          <section className="rounded-lg bg-[#f5f7f8] p-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-4 font-semibold">
              <FileCheck2 className="h-4 w-4" />
              验证条件
            </div>
            <div className="space-y-4 pt-5 text-[14px] leading-6 text-slate-700">
              {[
                `The paper introduces, analyzes, or applies ${paper.categories[0] || 'the proposed method'}.`,
                `The paper discusses or proposes methods related to ${paper.categories[1] || paper.venue}.`,
              ].map((item, index) => (
                <div key={item} className="grid grid-cols-[24px_1fr_18px] gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium">{index + 1}</span>
                  <span>{item}</span>
                  <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"><Check className="h-3 w-3" /></span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-9 pb-12">
          <div className="flex justify-center gap-16 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('references')}
              aria-pressed={activeTab === 'references'}
              className={`pb-4 text-sm font-medium ${activeTab === 'references' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-500'}`}
            >
              参考文献 <span className="ml-1 text-xs text-slate-400">{referencePapers.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('citations')}
              aria-pressed={activeTab === 'citations'}
              className={`pb-4 text-sm font-medium ${activeTab === 'citations' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-500'}`}
            >
              引用 <span className="ml-1 text-xs text-slate-400">{paper.citations.toLocaleString()}</span>
            </button>
          </div>
          {activeTab === 'references' ? (
            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
              {referencePapers.map((item) => (
                <button key={item.title} type="button" className="flex w-full items-center justify-between gap-4 py-4 text-left">
                  <span>
                    <span className="block text-[15px] font-medium text-[#111fa4]">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.meta}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              引用文献列表正在构建中，稍后可在这里继续追踪后续研究。
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
