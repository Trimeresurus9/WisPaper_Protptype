import React, { useRef, useState } from 'react';
import {
  AlignLeft,
  AlertCircle,
  ArrowUp,
  ArrowDownUp,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  FolderInput,
  History,
  Info,
  LoaderCircle,
  MessageCircle,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { Paper } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { StorageUsagePanel } from './StorageUsagePanel';
import { usePrototypeAuth } from '../lib/usePrototypeAuth';
import { useGlobalAskAIHistory } from '../lib/useGlobalAskAIHistory';

interface MyLibraryProps {
  papers: Paper[];
  onPaperClick: (paper: Paper) => void;
  onOpenReader: (file?: File) => void;
}

type LibraryStatus = 'in-library' | 'error' | 'processing' | 'missing-pdf';
type AssistantMessage = { role: 'user' | 'assistant'; text: string };
type ChatSession = { id: string; title: string; time: string; messages: AssistantMessage[] };
type LibraryPanelTab = 'info' | 'notes' | 'comments' | 'chat';
type LibraryPanelMode = 'document' | 'chat';

const statusSequence: LibraryStatus[] = [
  'in-library',
  'in-library',
  'error',
  'processing',
  'processing',
  'processing',
  'missing-pdf',
  'processing',
  'processing',
  'in-library',
  'in-library',
  'in-library',
  'in-library',
  'in-library',
  'in-library',
];

export function MyLibrary({ papers, onPaperClick, onOpenReader }: MyLibraryProps) {
  const { isAuthenticated, setAuthenticated } = usePrototypeAuth();
  const { sessions: globalAskSessions, latestForScene, upsertSession } = useGlobalAskAIHistory('library');
  const historyInitialized = React.useRef(false);
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deletedPaperIds, setDeletedPaperIds] = useState<Set<string>>(new Set());
  const [batchActionFeedback, setBatchActionFeedback] = useState('');
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantScope, setAssistantScope] = useState(isZh ? '所选文件' : 'Selected files');
  const [answerLength, setAnswerLength] = useState(isZh ? '中' : 'Medium');
  const [showScopeMenu, setShowScopeMenu] = useState(false);
  const [showLengthMenu, setShowLengthMenu] = useState(false);
  const [assistantAttachment, setAssistantAttachment] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<LibraryPanelMode>('chat');
  const [activePanelTab, setActivePanelTab] = useState<LibraryPanelTab>('chat');
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const [selectedLibraryPaper, setSelectedLibraryPaper] = useState<Paper | null>(null);
  const [paperNotes, setPaperNotes] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [paperComments, setPaperComments] = useState([
    { author: isZh ? '林澄' : 'Lin Cheng', text: isZh ? '方法部分的消融实验值得重点复核。' : 'The ablation study in the methods section deserves a closer look.', time: isZh ? '今天 10:24' : 'Today 10:24' },
    { author: isZh ? '我' : 'Me', text: isZh ? '已加入下周组会的讨论清单。' : 'Added to next week’s lab meeting agenda.', time: isZh ? '昨天 18:10' : 'Yesterday 18:10' },
  ]);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantSessionId, setAssistantSessionId] = useState(() => `library-${Date.now()}`);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'session-methods',
      title: isZh ? '比较三篇论文的方法差异' : 'Compare methods across three papers',
      time: isZh ? '今天 09:42' : 'Today 09:42',
      messages: [
        { role: 'user', text: isZh ? '比较三篇论文的方法差异' : 'Compare the methods across these three papers.' },
        { role: 'assistant', text: isZh ? '三篇论文主要在模型结构、训练目标和评估数据上存在差异。' : 'The papers differ mainly in architecture, training objective, and evaluation data.' },
      ],
    },
    {
      id: 'session-evidence',
      title: isZh ? '整理实验结论与证据' : 'Organize findings and evidence',
      time: isZh ? '昨天 16:18' : 'Yesterday 16:18',
      messages: [
        { role: 'user', text: isZh ? '整理实验结论与证据' : 'Organize the experimental findings and evidence.' },
      ],
    },
  ]);
  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const assistantFileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setAssistantScope('Product Help');
      setShowScopeMenu(false);
      setShowChatHistory(false);
      setAssistantAttachment('');
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated || historyInitialized.current) return;
    historyInitialized.current = true;
    if (latestForScene) {
      setAssistantSessionId(latestForScene.id);
      setAssistantScope(latestForScene.source);
      setAssistantMessages(latestForScene.messages as AssistantMessage[]);
    }
  }, [isAuthenticated, latestForScene]);

  React.useEffect(() => {
    if (!isAuthenticated) { historyInitialized.current = false; return; }
    const firstQuestion = assistantMessages.find((message) => message.role === 'user')?.text;
    if (!firstQuestion) return;
    upsertSession({ id: assistantSessionId, scene: 'library', pageLabel: 'Library', title: firstQuestion, source: assistantScope, messages: assistantMessages });
  }, [assistantMessages, assistantScope, assistantSessionId, isAuthenticated, upsertSession]);

  const rows = papers
    .slice(0, 15)
    .map((paper, index) => ({
      paper,
      status: statusSequence[index] ?? 'in-library',
      date: '2026-05',
      author: index === 14 ? 'Gomez, R.' : 'Sokolov, A., et al.',
    }))
    .filter(({ paper }) => !deletedPaperIds.has(paper.id));
  const selectedPapers = rows.filter(({ paper }) => selectedRows.has(paper.id)).map(({ paper }) => paper);

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  const openLocalFilePicker = () => {
    localFileInputRef.current?.click();
  };

  const handleLocalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onOpenReader(file);
    }

    event.target.value = '';
  };

  const handleAssistantFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAssistantAttachment(file.name);
    }
    event.target.value = '';
  };

  const submitAssistantQuestion = () => {
    if (!isAuthenticated) return;
    const question = assistantQuestion.trim();
    if (!question || assistantThinking) return;
    const productHelpSelected = assistantScope === '产品帮助' || assistantScope === 'Product Help';
    const effectiveScope = !productHelpSelected && selectedPapers.length > 0
      ? (isZh ? `${selectedPapers.length} 篇选中文献` : `${selectedPapers.length} selected papers`)
      : assistantScope;
    console.info('Ask library assistant', {
      question,
      scope: effectiveScope,
      answerLength,
      attachment: assistantAttachment || null,
      paperIds: selectedPapers.map((paper) => paper.id),
    });
    setChatOpen(true);
    setPanelMode('chat');
    setActivePanelTab('chat');
    setAssistantMessages((messages) => [...messages, { role: 'user', text: question }]);
    setAssistantQuestion('');
    setAssistantThinking(true);
    window.setTimeout(() => {
      setAssistantMessages((messages) => [
        ...messages,
        {
          role: 'assistant',
          text: isZh
            ? productHelpSelected
              ? '我会基于 WisPaper 产品帮助回答。你可以询问搜索、Library、Agent、科研画布、Survey 或其他功能的使用方法。'
              : `我已在${effectiveScope}中检索相关内容。关键证据集中在方法设计、实验设置与结论边界三部分。你可以继续让我生成摘要、对比表或引用清单。`
            : `I searched the ${effectiveScope.toLowerCase()} for related material. The strongest evidence is concentrated in method design, experimental setup, and the limits of the conclusions. You can ask for a summary, comparison table, or citation list next.`,
        },
      ]);
      setAssistantThinking(false);
    }, 850);
  };

  const openPaperPanel = (paper: Paper) => {
    setSelectedLibraryPaper(paper);
    setPanelMode('document');
    setActivePanelTab('info');
    setChatOpen(true);
  };

  const startPanelResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidth;

    setIsResizingPanel(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(620, Math.max(320, startWidth + startX - moveEvent.clientX));
      setPanelWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsResizingPanel(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const submitComment = () => {
    const nextComment = commentDraft.trim();
    if (!nextComment) return;
    setPaperComments((comments) => [
      ...comments,
      { author: isZh ? '我' : 'Me', text: nextComment, time: isZh ? '刚刚' : 'Just now' },
    ]);
    setCommentDraft('');
  };

  const startNewConversation = () => {
    const firstQuestion = assistantMessages.find((message) => message.role === 'user')?.text;
    if (assistantMessages.length > 0) {
      setChatSessions((sessions) => [
        {
          id: `session-${Date.now()}`,
          title: firstQuestion || (isZh ? '未命名对话' : 'Untitled conversation'),
          time: isZh ? '刚刚' : 'Just now',
          messages: assistantMessages,
        },
        ...sessions,
      ]);
    }
    setAssistantMessages([]);
    setAssistantSessionId(`library-${Date.now()}`);
    setAssistantQuestion('');
    setAssistantAttachment('');
    setAssistantThinking(false);
    setShowChatHistory(false);
  };

  const restoreConversation = (session: ChatSession) => {
    setAssistantMessages(session.messages);
    setAssistantQuestion('');
    setShowChatHistory(false);
  };

  const runBatchAction = (action: 'survey' | 'export' | 'project' | 'delete') => {
    const paperIds = selectedPapers.map((paper) => paper.id);
    console.info('Run library batch action', { action, paperIds });

    if (action === 'delete') {
      setDeletedPaperIds((current) => new Set([...current, ...paperIds]));
      setSelectedRows(new Set());
      return;
    }

    const feedback = {
      survey: isZh ? '正在生成 Survey' : 'Creating Survey',
      export: isZh ? '正在导出所选文件' : 'Exporting selected files',
      project: isZh ? '已加入项目' : 'Added to project',
    }[action];
    setBatchActionFeedback(feedback);
    window.setTimeout(() => setBatchActionFeedback(''), 1600);
  };

  const renderSelectedPaperCards = (compact = false) => {
    if (selectedPapers.length === 0) return null;

    return (
      <div className={`flex gap-2 overflow-x-auto ${compact ? 'mb-2 px-1 pt-1' : 'mx-3 mb-2 pt-1'}`}>
        {selectedPapers.map((paper) => (
          <div
            key={paper.id}
            className={`relative flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 text-left ${
              compact ? 'w-56 px-3 py-2.5' : 'w-60 px-3.5 py-3'
            }`}
          >
            <FileText className="h-5 w-5 shrink-0 text-slate-700" />
            <div className="min-w-0 pr-4">
              <p className="truncate text-xs font-semibold text-slate-900">{paper.title}</p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                {paper.year} · {paper.authors[0] || (isZh ? '未知作者' : 'Unknown author')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleRow(paper.id)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 active:scale-95"
              aria-label={`${isZh ? '移除' : 'Remove '}${paper.title}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderStatus = (status: LibraryStatus) => {
    if (status === 'in-library') {
      return (
        <span className="inline-flex items-center gap-2 font-medium text-blue-600">
          <CheckCircle2 className="h-4 w-4 fill-blue-600 text-white" />
          {isZh ? '已入库' : 'In library'}
        </span>
      );
    }

    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-2 font-medium text-red-500">
            <AlertCircle className="h-4 w-4 fill-red-500 text-white" />
            {isZh ? '出错' : 'Error'}
          </span>
          <button className="rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600">
            {isZh ? '重试' : 'Retry'}
          </button>
        </span>
      );
    }

    if (status === 'missing-pdf') {
      return (
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-2 font-medium text-gray-500">
            <XCircle className="h-4 w-4 text-red-500" />
            {isZh ? '无PDF' : 'No PDF'}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openLocalFilePicker();
            }}
            className="rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            {isZh ? '上传' : 'Upload'}
          </button>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 font-medium text-gray-700">
        <span className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent" />
        {isZh ? '处理中' : 'Processing'}
      </span>
    );
  };

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#eef6ff] p-5 pr-0">
      <input
        ref={localFileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleLocalFileSelect}
      />
      <input
        ref={assistantFileInputRef}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={handleAssistantFileSelect}
      />
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.4rem] bg-white px-5 pb-40 pt-5 shadow-[0_20px_60px_-46px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            {isZh ? '我的知识库' : 'My Library'}
          </h1>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-red-50 text-sm font-bold text-red-500">Z</span>
              <span>{isZh ? '从Zotero导入' : 'Import from Zotero'}</span>
            </button>
            <button
              type="button"
              onClick={openLocalFilePicker}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <BookOpen className="h-4 w-4" />
              <span>{isZh ? '打开本地文件' : 'Open local file'}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              <span>{isZh ? '上传' : 'Upload'}</span>
            </button>
          </div>
        </div>

        <StorageUsagePanel
          language={isZh ? 'zh' : 'en'}
          className="mt-5 shrink-0"
        />

        <div className="mt-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <label className="flex h-10 w-[31rem] max-w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm shadow-sm">
              <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <input
                className="min-w-0 flex-1 bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
                placeholder={isZh ? 'Title、Creator、Year' : 'Title, Creator, Year'}
              />
            </label>
            <button className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900">
              <Plus className="h-4 w-4" />
              <span>{isZh ? '添加列' : 'Add column'}</span>
            </button>
            <button className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900">
              <ArrowDownUp className="h-4 w-4" />
              <span>{isZh ? '传输' : 'Transfer'}</span>
            </button>
          </div>

          <div className="flex items-center gap-5">
            <button className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900">
              <Filter className="h-4 w-4" />
              <span>{isZh ? '筛选' : 'Filter'}</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900">
              <Download className="h-4 w-4" />
              <span>{isZh ? '导出' : 'Export'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-[48px_minmax(28rem,1fr)_15rem_15.5rem_8.5rem_5rem] border-b border-gray-200 bg-gray-50/70 text-sm font-semibold text-gray-500">
            <div className="flex items-center justify-center border-r border-gray-200 py-4">
              <span className="h-5 w-5 rounded-md border border-gray-300 bg-white" />
            </div>
            <div className="border-r border-gray-200 px-5 py-4">{isZh ? '标题' : 'Title'}</div>
            <div className="border-r border-gray-200 px-5 py-4">{isZh ? '作者' : 'Author'}</div>
            <div className="border-r border-gray-200 px-5 py-4">{isZh ? '状态' : 'Status'}</div>
            <div className="border-r border-gray-200 px-5 py-4">{isZh ? '日期' : 'Date'}</div>
            <div className="flex items-center justify-center py-4">
              <Plus className="h-5 w-5" />
            </div>
          </div>

          <div className="h-full overflow-auto bg-white">
            {rows.map(({ paper, status, author, date }, index) => {
              const selected = selectedRows.has(paper.id);
              const activePaper = selectedLibraryPaper?.id === paper.id;

              return (
                <div
                  key={`${paper.id}-${index}`}
                  className={`grid grid-cols-[48px_minmax(28rem,1fr)_15rem_15.5rem_8.5rem_5rem] border-b border-gray-200 text-[1rem] text-gray-700 transition ${
                    selected || activePaper ? 'bg-[#eef6ff]' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center border-r border-gray-200 py-3">
                    <button
                      type="button"
                      onClick={() => toggleRow(paper.id)}
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                        selected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-transparent hover:border-blue-300'
                      }`}
                      aria-label={selected ? 'Deselect row' : 'Select row'}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPaperPanel(paper)}
                    className="truncate border-r border-gray-200 px-5 py-3 text-left text-gray-800 transition hover:text-blue-600"
                    title={paper.title}
                  >
                    {paper.title}
                  </button>
                  <div className="truncate border-r border-gray-200 px-5 py-3" title={author}>
                    {author}
                  </div>
                  <div className="border-r border-gray-200 px-5 py-3">
                    {renderStatus(status)}
                  </div>
                  <div className="border-r border-gray-200 px-5 py-3 text-gray-600">
                    {date}
                  </div>
                  <div className="py-3" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 text-sm text-gray-500">
          <button className="rounded-lg p-2 transition hover:bg-gray-100 hover:text-gray-900">
            <ChevronLeft className="h-5 w-5" />
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`h-10 w-10 rounded-lg border text-base transition ${
                page === 2
                  ? 'border-gray-200 bg-gray-100 font-semibold text-gray-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <span className="px-2 text-base">...</span>
          <button className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-base text-gray-600 transition hover:bg-gray-50">
            15
          </button>
          <button className="rounded-lg p-2 transition hover:bg-gray-100 hover:text-gray-900">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <div
        className={`pointer-events-none fixed bottom-8 left-[calc(16rem+2.5rem)] right-[4.5rem] z-30 flex flex-col items-center gap-3 transition-all duration-300 max-lg:left-10 ${
          chatOpen ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        aria-hidden={chatOpen}
      >
        {selectedPapers.length > 0 && (
          <div className={`pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_48px_-22px_rgba(15,23,42,0.38)] backdrop-blur-xl ${chatOpen ? 'pointer-events-none' : ''}`}>
            <button
              type="button"
              onClick={() => runBatchAction('survey')}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              {isZh ? '生成 Survey' : 'Create Survey'}
            </button>
            <button
              type="button"
              onClick={() => runBatchAction('export')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              {isZh ? '导出' : 'Export'}
            </button>
            <button
              type="button"
              onClick={() => runBatchAction('project')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              <FolderInput className="h-4 w-4" />
              {isZh ? '加入项目' : 'Add to project'}
            </button>
            <button
              type="button"
              onClick={() => runBatchAction('delete')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-red-500 transition hover:border-red-200 hover:bg-red-50 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              {isZh ? '删除' : 'Delete'}
            </button>
            {batchActionFeedback && (
              <span className="px-2 text-xs font-medium text-emerald-600">{batchActionFeedback}</span>
            )}
          </div>
        )}
        <div className="hidden">
          {renderSelectedPaperCards()}
          <textarea
            value={assistantQuestion}
            onChange={(event) => {
              setAssistantQuestion(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitAssistantQuestion();
              }
            }}
            placeholder={isZh ? '向知识助手提问，或试试「总结这篇文档」「翻译这段话…」' : 'Ask the knowledge assistant, or try “Summarize this document” or “Translate this passage…”'}
            aria-label={isZh ? '向知识助手提问' : 'Ask the knowledge assistant'}
            className="h-16 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
          />

          {assistantAttachment && (
            <div className="mx-3 mb-2 flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] text-slate-600">
              <FileText className="h-3.5 w-3.5" />
              <span className="max-w-60 truncate">{assistantAttachment}</span>
              <button
                type="button"
                onClick={() => setAssistantAttachment('')}
                className="text-slate-400 transition-colors hover:text-slate-700"
                aria-label={isZh ? '移除附件' : 'Remove attachment'}
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => assistantFileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                aria-label={isZh ? '添加附件' : 'Add attachment'}
              >
                <Plus className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowScopeMenu((current) => !current);
                    setShowLengthMenu(false);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 px-3.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  aria-expanded={showScopeMenu}
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>{assistantScope}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {showScopeMenu && (
                  <div className="absolute bottom-11 left-0 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {(isZh ? ['Product Help', '所选文件', '知识库', 'Web 资源'] : ['Product Help', 'Selected files', 'Library', 'Web resources']).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAssistantScope(option);
                          setShowScopeMenu(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          assistantScope === option ? 'bg-slate-100 font-medium text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowLengthMenu((current) => !current);
                    setShowScopeMenu(false);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 px-3.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  aria-expanded={showLengthMenu}
                >
                  <AlignLeft className="h-4 w-4 text-slate-500" />
                  <span>{answerLength}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {showLengthMenu && (
                  <div className="absolute bottom-11 left-0 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {(isZh ? ['简短', '中', '详细'] : ['Short', 'Medium', 'Detailed']).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAnswerLength(option);
                          setShowLengthMenu(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          answerLength === option ? 'bg-slate-100 font-medium text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <button
              type="button"
              onClick={submitAssistantQuestion}
              disabled={!assistantQuestion.trim() || assistantThinking}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-white"
              aria-label={isZh ? '发送问题' : 'Send question'}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {(!chatOpen || panelMode === 'document') && (
        <button
          type="button"
          onClick={() => {
            setPanelMode('chat');
            setActivePanelTab('chat');
            setChatOpen(true);
          }}
          className="fixed bottom-6 right-6 z-[45] flex h-14 items-center gap-2 rounded-full bg-[#1b87ff] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_-14px_rgba(27,135,255,.8)] transition hover:-translate-y-0.5 hover:bg-blue-600"
          aria-label={isZh ? '打开 Ask AI' : 'Open Ask AI'}
        >
          <Sparkles className="h-4 w-4" />
          Ask AI
        </button>
      )}

      {(panelMode === 'document' || chatOpen) && <aside
        style={{ width: panelMode === 'chat' ? 410 : chatOpen ? panelWidth : 56 }}
        className={`${panelMode === 'chat' ? 'fixed bottom-5 right-5 z-[46] h-[min(680px,calc(100vh-40px))] rounded-3xl border border-slate-200 shadow-[0_30px_90px_-24px_rgba(15,23,42,.45)]' : 'relative z-40 ml-3 h-full shrink-0 border-l border-slate-200'} flex flex-col overflow-hidden bg-white ${
          isResizingPanel ? '' : 'transition-[width] duration-300 ease-out'
        }`}
        aria-label={chatOpen ? (isZh ? '文献工作栏' : 'Paper workspace') : (isZh ? '已折叠的文献工作栏' : 'Collapsed paper workspace')}
      >
        {!chatOpen ? (
          <div className="flex h-full w-14 flex-col items-center border-r border-slate-100 py-3">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800"
              aria-label={isZh ? '展开文献工作栏' : 'Expand paper workspace'}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePanelTab('chat');
                setChatOpen(true);
              }}
              className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 active:scale-95"
              aria-label={isZh ? '打开 AI Chat' : 'Open AI Chat'}
              title="AI Chat"
            >
              <Bot className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            {panelMode === 'document' && <button
              type="button"
              onPointerDown={startPanelResize}
              className="group absolute inset-y-0 left-0 z-50 w-2 cursor-col-resize touch-none"
              aria-label={isZh ? '拖动调整侧栏宽度' : 'Drag to resize the side panel'}
            >
              <span className="absolute inset-y-0 left-0 w-px bg-slate-200 transition group-hover:w-0.5 group-hover:bg-blue-400" />
            </button>}

            <nav className="flex h-14 shrink-0 items-stretch border-b border-slate-100 pl-3 pr-2" aria-label={panelMode === 'chat' ? (isZh ? '问答工具' : 'Chat tools') : (isZh ? '文献工具' : 'Paper tools')}>
              <div className={`grid min-w-0 flex-1 ${panelMode === 'chat' ? 'grid-cols-1' : 'grid-cols-4'}`}>
                {(panelMode === 'chat'
                  ? [{ tab: 'chat' as const, label: 'Ask AI', icon: Bot }]
                  : [
                      { tab: 'info' as const, label: isZh ? '信息' : 'Info', icon: Info },
                      { tab: 'notes' as const, label: isZh ? '笔记' : 'Notes', icon: StickyNote },
                      { tab: 'comments' as const, label: isZh ? '评论' : 'Comments', icon: MessageCircle },
                      { tab: 'chat' as const, label: 'Ask AI', icon: Bot },
                    ]
                ).map(({ tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActivePanelTab(tab);
                      if (tab === 'chat') setPanelMode('chat');
                    }}
                    className={`relative flex min-w-0 items-center justify-center gap-1.5 text-xs font-medium transition ${
                      tab === 'chat' && panelMode === 'document' ? 'border-l border-slate-100' : ''
                    } ${
                      activePanelTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'
                    }`}
                    aria-pressed={activePanelTab === tab}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                    {activePanelTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="ml-2 flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={isZh ? '收起右侧组件栏' : 'Collapse side panel'}
              >
                {panelMode === 'chat' ? <X className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </nav>

            {activePanelTab === 'chat' && isAuthenticated && (
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-100 px-4">
                <button
                  type="button"
                  onClick={startNewConversation}
                  className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 active:scale-[0.98]"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                    <Plus className="h-3 w-3" />
                  </span>
                  {isZh ? '新对话' : 'New chat'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatHistory((visible) => !visible)}
                  className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition active:scale-[0.98] ${
                    showChatHistory ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                  aria-expanded={showChatHistory}
                >
                  <History className="h-4 w-4" />
                  {isZh ? '对话历史' : 'Chat history'}
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {activePanelTab === 'info' && (
                selectedLibraryPaper ? (
                  <div className="px-6 py-5">
                    <h3 className="text-lg font-semibold leading-7 text-slate-950">{selectedLibraryPaper.title}</h3>

                    <div className="mt-5 border-y border-slate-100 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                            <Paperclip className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900">{isZh ? '1 个附件' : '1 attachment'}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{selectedLibraryPaper.title}.pdf</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onPaperClick(selectedLibraryPaper)}
                          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          {isZh ? '打开阅读器' : 'Open reader'}
                        </button>
                      </div>
                    </div>

                    <dl className="mt-5 space-y-4 text-sm">
                      {[
                        [isZh ? '标题' : 'Title', selectedLibraryPaper.title],
                        [isZh ? '作者' : 'Authors', selectedLibraryPaper.authors.join('、')],
                        [isZh ? '发表年份' : 'Year', String(selectedLibraryPaper.year)],
                        [isZh ? '来源' : 'Venue', selectedLibraryPaper.venue],
                        ['ArXiv ID', selectedLibraryPaper.arxivId || '—'],
                        [isZh ? '分类' : 'Categories', selectedLibraryPaper.categories.join('、')],
                      ].map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
                          <dt className="text-xs text-slate-400">{label}</dt>
                          <dd className="break-words text-xs leading-5 text-slate-700">{value || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <div className="flex h-full min-h-72 flex-col items-center justify-center px-8 text-center">
                    <Info className="h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">{isZh ? '选择一篇文献查看信息' : 'Select a paper to view its information'}</p>
                  </div>
                )
              )}

              {activePanelTab === 'notes' && (
                selectedLibraryPaper ? (
                  <div className="flex h-full min-h-[28rem] flex-col p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{isZh ? '文献笔记' : 'Paper notes'}</p>
                      <span className="text-[10px] text-slate-400">{isZh ? '自动保存' : 'Autosaved'}</span>
                    </div>
                    <textarea
                      value={paperNotes}
                      onChange={(event) => setPaperNotes(event.target.value)}
                      placeholder={isZh ? '记录关键发现、方法和待验证的问题…' : 'Capture key findings, methods, and questions to verify…'}
                      aria-label={isZh ? '文献笔记' : 'Paper notes'}
                      className="min-h-80 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-72 flex-col items-center justify-center px-8 text-center">
                    <StickyNote className="h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">{isZh ? '选择文献后开始记录笔记' : 'Select a paper to start taking notes'}</p>
                  </div>
                )
              )}

              {activePanelTab === 'comments' && (
                selectedLibraryPaper ? (
                  <div className="flex h-full min-h-[28rem] flex-col">
                    <div className="flex-1 space-y-5 px-5 py-5">
                      {paperComments.map((comment, index) => (
                        <div key={`${comment.author}-${index}`} className="flex gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {comment.author.slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900">{comment.author}</p>
                              <span className="text-[10px] text-slate-400">{comment.time}</span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 p-4">
                      <textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder={isZh ? '添加评论…' : 'Add a comment…'}
                        aria-label={isZh ? '添加评论' : 'Add a comment'}
                        className="h-20 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-300"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={submitComment}
                          disabled={!commentDraft.trim()}
                          className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200"
                        >
                          {isZh ? '发布' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-72 flex-col items-center justify-center px-8 text-center">
                    <MessageCircle className="h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-700">{isZh ? '选择文献后查看评论' : 'Select a paper to view comments'}</p>
                  </div>
                )
              )}

              {activePanelTab === 'chat' && (
                <div className="flex h-full min-h-[28rem] flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                    {showChatHistory ? (
                      <div>
                        <p className="mb-3 text-[11px] font-medium text-slate-400">
                          {isZh ? `${globalAskSessions.length} 个全局历史对话` : `${globalAskSessions.length} global chats`}
                        </p>
                        <div className="divide-y divide-slate-100">
                          {globalAskSessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => { setAssistantSessionId(session.id); setAssistantMessages(session.messages as AssistantMessage[]); setAssistantScope(session.source); setShowChatHistory(false); }}
                              className="group flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-slate-50"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800 group-hover:text-slate-950">{session.title}</p>
                                <p className="mt-1 text-[10px] text-slate-400">{session.pageLabel} · {session.source} · {session.time}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {assistantMessages.length === 0 && (
                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-800">
                              {selectedPapers.length > 0
                                ? (isZh ? `向已选的 ${selectedPapers.length} 篇文献提问` : `Ask the ${selectedPapers.length} selected papers`)
                                : (isZh ? '向知识库开始提问' : 'Ask your library')}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {isZh ? '可以总结论文、解释方法，或对比知识库中的相关研究。' : 'Summarize the paper, explain its methods, or compare related work in your library.'}
                            </p>
                          </div>
                        )}
                        {assistantMessages.map((message, index) => (
                          <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2.5'}>
                            {message.role === 'assistant' && (
                              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                                <Bot className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <div
                              className={`max-w-[84%] px-3.5 py-2.5 text-sm leading-6 ${
                                message.role === 'user'
                                  ? 'rounded-2xl rounded-tr-md bg-blue-50 text-slate-800'
                                  : 'rounded-2xl rounded-tl-md bg-slate-100 text-slate-700'
                              }`}
                            >
                              {message.text}
                            </div>
                          </div>
                        ))}
                        {assistantThinking && (
                          <div className="flex items-center gap-2.5 text-xs text-slate-500">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white">
                              <Bot className="h-3.5 w-3.5" />
                            </span>
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            {isZh ? '正在检索知识库…' : 'Searching the library…'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-slate-100 bg-slate-50/70 p-3">
                    {!isAuthenticated && <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs leading-5 text-slate-600">请先登录后使用 Ask AI。登录后可使用知识库、文件和 Web 资源，并访问全局聊天历史。</p><button type="button" onClick={() => setAuthenticated(true)} className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">注册 / 登录</button></div>}
                    {assistantAttachment && (
                      <div className="mb-2 flex w-fit max-w-full items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[10px] text-slate-600 ring-1 ring-slate-200">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{assistantAttachment}</span>
                      </div>
                    )}
                    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-300">
                      {isAuthenticated && renderSelectedPaperCards(true)}
                      <textarea
                        value={assistantQuestion}
                        disabled={!isAuthenticated}
                        onChange={(event) => setAssistantQuestion(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            submitAssistantQuestion();
                          }
                        }}
                        placeholder={isZh ? '向 AI Chat 提问…' : 'Ask AI Chat…'}
                        aria-label={isZh ? '向 AI Chat 提问' : 'Ask AI Chat'}
                        className="h-16 w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                        {isAuthenticated && <button
                          type="button"
                          onClick={() => assistantFileInputRef.current?.click()}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                          aria-label={isZh ? '添加附件' : 'Add attachment'}
                        >
                          <Plus className="h-4 w-4" />
                        </button>}
                        <div className="relative">
                          <button type="button" disabled={!isAuthenticated} onClick={() => setShowScopeMenu((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-default"><FileText className="h-3.5 w-3.5" />{assistantScope}<ChevronDown className="h-3 w-3" /></button>
                          {showScopeMenu && isAuthenticated && <div className="absolute bottom-10 left-0 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{(isZh ? ['Product Help', '所选文件', '知识库', 'Web 资源'] : ['Product Help', 'Selected files', 'Library', 'Web resources']).map((option) => <button key={option} type="button" onClick={() => { setAssistantScope(option); setShowScopeMenu(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${assistantScope === option ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{option}</button>)}</div>}
                        </div>
                        </div>
                        <div className="flex items-center gap-2"><button
                          type="button"
                          onClick={submitAssistantQuestion}
                          disabled={!assistantQuestion.trim() || assistantThinking}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200"
                          aria-label={isZh ? '发送问题' : 'Send question'}
                        >
                          {assistantThinking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                        </button></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>}
    </div>
  );
}
