import React, { useEffect, useRef, useState } from 'react';
import { Library, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Globe, ChevronDown, Bookmark, Share2, ThumbsUp, PlusCircle, History, House, MessageSquare, StickyNote, Sparkles, Info, X, SendHorizontal, Upload, FileText, RefreshCw, ScanLine } from 'lucide-react';
import { Paper } from '../types';
import { TableOfContents } from './TableOfContents';
import { PageThumbnails } from './PageThumbnails';
import { BlogView } from './BlogView';
import { PaperView } from './PaperView';
import { TranslationView } from './TranslationView';
import { CommentsPanel, PaperComment } from './CommentsPanel';
import { UserPanel } from './UserPanel';
import { ParsingStatus } from './ParsingStatus';
import { useLanguage } from '../contexts/LanguageContext';

interface PaperDetailProps {
  paper: Paper | null;
  onBack: () => void;
  backLabel?: string;
  initialLocalFile?: File | null;
  onOpenFigureToPPTX?: () => void;
}

type TabType = 'blog' | 'paper' | 'translation';
type SidebarTab = 'preview' | 'structure';
type RightSidebarTab = 'home' | 'info' | 'chat' | 'history' | 'notes' | 'comments';
type ReaderTool = 'single-page' | 'double-page' | 'flip' | 'click' | 'grab' | 'marquee' | 'pen' | 'eraser';
type PaperHighlightTarget = {
  citationId: string;
  elementId: string;
  page: number;
  trigger: number;
};

const defaultShareCommentsZh = [
  '这篇文章很有启发，分享给大家一起看看。',
  '读完很有收获，推荐给关注这个话题的朋友。',
  '文章观点清晰，值得花几分钟阅读。',
  '这篇内容让我对这个问题有了新的理解。',
  '分享一篇不错的文章，欢迎一起讨论。',
];

const defaultShareCommentsEn = [
  'This article is insightful. Sharing it for everyone to read.',
  'I learned a lot from this article. Recommended for anyone interested in this topic.',
  'The article presents clear ideas and is worth a few minutes of your time.',
  'This piece gave me a new perspective on the issue.',
  'Sharing a good read. Feel free to join the discussion.',
];

export function PaperDetail({ paper, onBack, backLabel = 'Back to Library', initialLocalFile = null, onOpenFigureToPPTX }: PaperDetailProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const [activeTab, setActiveTab] = useState<TabType>('blog');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('preview');
  const [pdfScale, setPdfScale] = useState(0.75);
  const [currentPage, setCurrentPage] = useState(3);
  const totalPages = 15;
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false);
  const [blogLanguage, setBlogLanguage] = useState<'en' | 'zh' | 'ja' | 'ko' | 'id'>('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [blogScale, setBlogScale] = useState(0.75);
  const [translationLanguage, setTranslationLanguage] = useState<'zh-CN' | 'en' | 'ja' | 'ko' | 'id'>('zh-CN');
  const [translationViewMode, setTranslationViewMode] = useState<'dual-vertical' | 'translation-only' | 'dual-horizontal'>('dual-horizontal');
  const [showTranslationLanguageMenu, setShowTranslationLanguageMenu] = useState(false);
  const [showTranslationViewModeMenu, setShowTranslationViewModeMenu] = useState(false);
  const [isParsing, setIsParsing] = useState(true);
  const [isFirstBlogVisit, setIsFirstBlogVisit] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<RightSidebarTab>('home');
  const [readerTool, setReaderTool] = useState<ReaderTool>('click');
  const [paperHighlightTarget, setPaperHighlightTarget] = useState<PaperHighlightTarget | null>(null);
  const [selectedExcerpt, setSelectedExcerpt] = useState<string | null>(null);
  const [showBlogShareModal, setShowBlogShareModal] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [defaultShareComment, setDefaultShareComment] = useState('');
  const [shareToComments, setShareToComments] = useState(true);
  const [defaultShareCommentIndex, setDefaultShareCommentIndex] = useState(-1);
  const [shareToastVisible, setShareToastVisible] = useState(false);
  const [paperComments, setPaperComments] = useState<Record<string, PaperComment[]>>({});
  const [localPaper, setLocalPaper] = useState<Paper | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const localFileUrlRef = useRef<string | null>(null);
  const initialLocalFileRef = useRef<File | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const pendingRightSidebarWidthRef = useRef(rightSidebarWidth);

  const activePaper = localPaper ?? paper;
  const paperId = activePaper?.id ?? 'reader-empty';
  const hasPaper = Boolean(activePaper);
  const defaultShareComments = isZh ? defaultShareCommentsZh : defaultShareCommentsEn;

  // Simulate parsing process for 10 seconds on first load (only for Translation tab)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsParsing(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [paperId]); // Reset when paper changes
  
  // Track first visit to paper for Blog tab
  useEffect(() => {
    setIsFirstBlogVisit(true);
    setShowBlogShareModal(false);
    setShareComment('');
    setDefaultShareComment('');
    setShareToComments(true);
    setShareToastVisible(false);
  }, [paperId]);

  useEffect(() => {
    return () => {
      if (localFileUrlRef.current) {
        URL.revokeObjectURL(localFileUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!paper) {
      return;
    }

    if (localFileUrlRef.current) {
      URL.revokeObjectURL(localFileUrlRef.current);
      localFileUrlRef.current = null;
    }
    setLocalPaper(null);
  }, [paper?.id]);

  useEffect(() => {
    if (!paper && !localPaper) {
      setActiveTab('paper');
    }
  }, [paper, localPaper]);

  useEffect(() => {
    if (!shareToastVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShareToastVisible(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [shareToastVisible]);

  useEffect(() => {
    if (!isResizingRightSidebar) {
      return;
    }

    const updateRightSidebarWidth = (nextWidth: number) => {
      pendingRightSidebarWidthRef.current = nextWidth;

      if (resizeFrameRef.current !== null) {
        return;
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        setRightSidebarWidth(pendingRightSidebarWidthRef.current);
        resizeFrameRef.current = null;
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      const container = mainContentRef.current;

      if (!container) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const nextWidth = bounds.right - event.clientX;
      const minWidth = 280;
      const minContentWidth = 560;
      const leftPanelWidth = leftSidebarCollapsed ? 0 : 224;
      const maxWidth = Math.max(minWidth, bounds.width - leftPanelWidth - minContentWidth);

      updateRightSidebarWidth(Math.min(Math.max(nextWidth, minWidth), maxWidth));
    };

    const stopResizing = () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      setRightSidebarWidth(pendingRightSidebarWidthRef.current);
      setIsResizingRightSidebar(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResizing);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [isResizingRightSidebar, leftSidebarCollapsed]);

  const languageLabels = {
    'en': 'English',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'id': 'Indonesia'
  };

  const translationLanguageLabels = {
    'zh-CN': '简体中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'id': 'Bahasa Indonesia',
  };

  const translationViewModeLabels = {
    'dual-vertical': '上下对照',
    'translation-only': '仅显示译文',
    'dual-horizontal': '左右对照',
  };
  const handleSidebarTabToggle = (tab: SidebarTab) => {
    if (!leftSidebarCollapsed && sidebarTab === tab) {
      setLeftSidebarCollapsed(true);
      return;
    }

    setSidebarTab(tab);
    setLeftSidebarCollapsed(false);
  };

  const handleSummaryCitationSelect = ({
    citationId,
    elementId,
    page,
  }: {
    citationId: string;
    elementId: string;
    page: number;
  }) => {
    setActiveTab('paper');
    setCurrentPage(page);
    setPaperHighlightTarget({
      citationId,
      elementId,
      page,
      trigger: Date.now(),
    });
  };

  const handlePaperTextSelection = (selectedText: string | null) => {
    setSelectedExcerpt(selectedText);
    if (selectedText) {
      setRightSidebarCollapsed(false);
    }
  };

  const openLocalFile = (file: File) => {
    if (localFileUrlRef.current) {
      URL.revokeObjectURL(localFileUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    const fileTitle = file.name.replace(/\.[^/.]+$/, '') || file.name;
    localFileUrlRef.current = objectUrl;
    setLocalPaper({
      id: `local-reader-${Date.now()}`,
      title: fileTitle,
      authors: [isZh ? '本地文件' : 'Local file'],
      abstract: isZh
        ? '这是从本地上传并在阅读器中打开的文件。'
        : 'This file was uploaded locally and opened in the reader.',
      year: new Date().getFullYear(),
      publishedDate: new Date().toISOString().slice(0, 10),
      venue: isZh ? '本地上传' : 'Local Upload',
      citations: 0,
      categories: [isZh ? '本地文件' : 'Local File'],
      pdfUrl: objectUrl,
      type: 'paper',
    });
    setActiveTab('paper');
    setCurrentPage(1);
    setIsParsing(false);
    setIsFirstBlogVisit(false);
  };

  const handleLocalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    openLocalFile(file);
    event.target.value = '';
  };

  useEffect(() => {
    if (!initialLocalFile || initialLocalFileRef.current === initialLocalFile) {
      return;
    }

    initialLocalFileRef.current = initialLocalFile;
    openLocalFile(initialLocalFile);
  }, [initialLocalFile]);

  const handleOpenBlogShare = () => {
    if (activeTab !== 'blog' || !activePaper) {
      return;
    }

    const nextIndex = (defaultShareCommentIndex + 1) % defaultShareComments.length;
    const nextComment = defaultShareComments[nextIndex];
    setDefaultShareCommentIndex(nextIndex);
    setDefaultShareComment(nextComment);
    setShareComment(nextComment);
    setShareToComments(true);
    setShowBlogShareModal(true);
  };

  const handleRefreshShareComment = () => {
    const currentTemplateIndex = defaultShareComments.findIndex((comment) => comment === shareComment.trim());
    const baseIndex = currentTemplateIndex >= 0 ? currentTemplateIndex : defaultShareCommentIndex;
    const nextIndex = (baseIndex + 1) % defaultShareComments.length;
    const nextComment = defaultShareComments[nextIndex];

    setDefaultShareCommentIndex(nextIndex);
    setDefaultShareComment(nextComment);
    setShareComment(nextComment);
    setShareToComments(true);
  };

  const handleSubmitBlogShare = async (commentOverride?: string, templateIndex?: number) => {
    const content = (commentOverride ?? shareComment).trim();

    if (!content) {
      return;
    }

    const matchedTemplateIndex = templateIndex ?? defaultShareComments.findIndex((comment) => comment === content);

    if (matchedTemplateIndex >= 0) {
      setDefaultShareCommentIndex(matchedTemplateIndex);
    }

    if (shareToComments) {
      const nextComment: PaperComment = {
        id: `blog-share-${Date.now()}`,
        author: 'You',
        avatar: '你',
        content,
        timestamp: isZh ? '刚刚' : 'Just now',
        likes: 0,
      };

      setPaperComments((current) => ({
        ...current,
        [paperId]: [nextComment, ...(current[paperId] ?? [])],
      }));
      setRightSidebarCollapsed(false);
      setRightSidebarTab('comments');
    }

    setShareComment('');
    setDefaultShareComment('');
    setShareToComments(true);
    setShowBlogShareModal(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard may be unavailable in some browser contexts; keep the share flow non-blocking.
    }
    setShareToastVisible(true);
  };

  useEffect(() => {
    if (!selectedExcerpt) {
      return;
    }

    const handleSelectionChange = () => {
      const selectedText = window.getSelection()?.toString().trim() ?? '';

      if (!selectedText) {
        setSelectedExcerpt(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [selectedExcerpt]);

  const rightSidebarActions =
    rightSidebarTab === 'chat' || rightSidebarTab === 'history' ? (
      <>
        <button
          onClick={() => setRightSidebarTab('chat')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Chat</span>
        </button>
        <button
          onClick={() => setRightSidebarTab('history')}
          className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
            rightSidebarTab === 'history'
              ? 'text-blue-700'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </button>
      </>
    ) : rightSidebarTab === 'notes' ? (
      <button className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
        <PlusCircle className="h-4 w-4" />
        <span>New Note</span>
      </button>
    ) : rightSidebarTab === 'comments' ? (
      <button className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900">
        <PlusCircle className="h-4 w-4" />
        <span>Add Comment</span>
      </button>
    ) : rightSidebarTab === 'info' ? (
      <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        <Info className="h-4 w-4" />
        <span>Paper details</span>
      </div>
    ) : null;

  const leftSidebarWidth = leftSidebarCollapsed ? 0 : 224;
  const rightSidebarPanelWidth = rightSidebarCollapsed ? 0 : rightSidebarWidth;
  const headerRightColumnWidth = rightSidebarCollapsed ? 56 : rightSidebarWidth;
  const contentCenterOffset = (rightSidebarPanelWidth - leftSidebarWidth) / 2;
  const headerGridTemplate = `224px minmax(0, 1fr) ${headerRightColumnWidth}px`;
  const zoomOptions = [25, 50, 75, 100, 125, 150];
  const getZoomSelectValue = (scale: number) => String(Math.round(scale * 100));
  const getZoomMenuOptions = (scale: number) => {
    const currentPercent = Math.round(scale * 100);

    return zoomOptions.includes(currentPercent)
      ? zoomOptions
      : [currentPercent, ...zoomOptions].sort((a, b) => a - b);
  };

  const readerToolButtons: Array<{ key: ReaderTool; label: string; icon: React.ReactNode }> = [
    {
      key: 'single-page',
      label: 'Single Page',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="6" y="4" width="12" height="16" rx="1.5" />
        </svg>
      ),
    },
    {
      key: 'double-page',
      label: 'Double Page',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="4" width="7.5" height="16" rx="1.5" />
          <rect x="13" y="4" width="7.5" height="16" rx="1.5" />
        </svg>
      ),
    },
    {
      key: 'flip',
      label: 'Flip',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.68" />
          <path d="M20 4v4.68h-4.68" />
        </svg>
      ),
    },
    {
      key: 'click',
      label: 'Click',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 3l7.2 17 2.4-7.2L20.8 10 4 3z" />
        </svg>
      ),
    },
    {
      key: 'grab',
      label: 'Grab',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11V6a2 2 0 1 1 4 0v5" />
          <path d="M13 11V5a2 2 0 1 1 4 0v7" />
          <path d="M5 12V8a2 2 0 1 1 4 0v8" />
          <path d="M17 12V9a2 2 0 1 1 4 0v6a5 5 0 0 1-5 5h-3a6 6 0 0 1-6-6v-2" />
        </svg>
      ),
    },
    {
      key: 'pen',
      label: 'Pen',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20z" />
          <path d="M13.5 6.5l3.5 3.5" />
        </svg>
      ),
    },
    {
      key: 'eraser',
      label: 'Eraser',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16l7.5-7.5a2.5 2.5 0 0 1 3.5 0l1.5 1.5a2.5 2.5 0 0 1 0 3.5L14 19H9l-2-3z" />
          <path d="M9 19h10" />
        </svg>
      ),
    },
  ];

  const emptyReaderView = (
    <div className="flex h-full items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FileText className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-950">
          {isZh ? '打开本地文件开始阅读' : 'Open a local file to start reading'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {isZh
            ? '上传 PDF 后，你可以使用和从知识库打开文章一致的阅读器、工具栏、翻译、笔记和评论区体验。'
            : 'Upload a PDF to use the same reader, toolbar, translation, notes, and comments experience as papers opened from your library.'}
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Upload className="h-4 w-4" />
          <span>{isZh ? '上传本地 PDF' : 'Upload local PDF'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleLocalFileSelect}
      />
      {!rightSidebarCollapsed ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 z-20 w-px transition-colors ${
            isResizingRightSidebar ? 'bg-blue-500' : 'bg-gray-200'
          }`}
          style={{ right: rightSidebarWidth }}
        />
      ) : null}

      {/* Header Row 1 */}
      <div
        className="grid border-b border-gray-200 bg-white flex-shrink-0"
        style={{ gridTemplateColumns: headerGridTemplate }}
      >
        <div className="flex items-center justify-between border-r border-gray-200 px-4 py-3">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center rounded p-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title={backLabel}
            aria-label={backLabel}
          >
            <Library className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLeftSidebarCollapsed((prev) => !prev)}
            className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            title={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
          >
            {leftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 px-6">
          {[
            { key: 'blog' as const, label: 'Blog' },
            { key: 'paper' as const, label: 'Paper' },
            { key: 'translation' as const, label: 'Translation' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`inline-flex items-center border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === item.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className={rightSidebarCollapsed ? 'px-2' : 'px-3'}>
          <div className="relative flex h-full items-center">
            <button
              onClick={() => setRightSidebarCollapsed((prev) => !prev)}
              className={`z-10 rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 ${
                rightSidebarCollapsed ? '' : 'absolute left-0 top-1/2 -translate-y-1/2'
              }`}
              title={rightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
            >
              {rightSidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {!rightSidebarCollapsed ? (
              <div className="flex w-full items-center justify-center gap-3 px-10">
                {[
                  { key: 'home' as const, label: 'Home', icon: House },
                  { key: 'chat' as const, label: 'Chat', icon: Sparkles },
                  { key: 'notes' as const, label: 'Notes', icon: StickyNote },
                  { key: 'comments' as const, label: 'Comments', icon: MessageSquare },
                  { key: 'info' as const, label: 'Info', icon: Info },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setRightSidebarTab(item.key)}
                    title={item.label}
                    aria-label={item.label}
                    className={`inline-flex min-w-0 items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                      rightSidebarTab === item.key || (item.key === 'chat' && rightSidebarTab === 'history')
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Header Row 2 */}
      <div
        className="grid border-b border-gray-200 bg-gray-50/80 flex-shrink-0"
        style={{ gridTemplateColumns: headerGridTemplate }}
      >
        <div className={`${leftSidebarCollapsed ? '' : 'border-r border-gray-200'} px-3`}>
          {!leftSidebarCollapsed ? (
            <div className="flex items-center">
              <button
                onClick={() => handleSidebarTabToggle('preview')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  sidebarTab === 'preview'
                    ? 'border-b-2 border-blue-600 bg-white text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => handleSidebarTabToggle('structure')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  sidebarTab === 'structure'
                    ? 'border-b-2 border-blue-600 bg-white text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Structure
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-2.5">
          <div className="flex items-center gap-3">
            {activeTab === 'blog' ? (
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Globe className="w-4 h-4" />
                  <span>{languageLabels[blogLanguage]}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {showLanguageMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLanguageMenu(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded border border-gray-300 bg-white py-1 shadow-lg">
                      {(Object.keys(languageLabels) as Array<keyof typeof languageLabels>).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setBlogLanguage(lang);
                            setShowLanguageMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                            blogLanguage === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {languageLabels[lang]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'translation' ? (
              <>
                <div className="flex items-center gap-1">
                  {readerToolButtons.map((tool) => (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={() => setReaderTool(tool.key)}
                      title={tool.label}
                      aria-label={tool.label}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors ${
                        readerTool === tool.key
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {tool.icon}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {readerToolButtons.map((tool) => (
                  <button
                    key={tool.key}
                    type="button"
                    onClick={() => setReaderTool(tool.key)}
                    title={tool.label}
                    aria-label={tool.label}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded transition-colors ${
                      readerTool === tool.key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            {activeTab === 'blog' ? (
              <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1">
                <button onClick={() => setBlogScale(Math.max(0.25, blogScale - 0.1))} className="rounded p-0.5 hover:bg-gray-100">
                  <ZoomOut className="h-3 w-3 text-gray-700" />
                </button>
                <select
                  value={getZoomSelectValue(blogScale)}
                  onChange={(e) => setBlogScale(parseInt(e.target.value) / 100)}
                  className="cursor-pointer border-none bg-transparent px-1 text-xs outline-none"
                >
                  {getZoomMenuOptions(blogScale).map((option) => (
                    <option key={option} value={option}>
                      {option}%
                    </option>
                  ))}
                </select>
                <button onClick={() => setBlogScale(Math.min(2, blogScale + 0.1))} className="rounded p-0.5 hover:bg-gray-100">
                  <ZoomIn className="h-3 w-3 text-gray-700" />
                </button>
              </div>
            ) : activeTab === 'translation' ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowTranslationLanguageMenu(!showTranslationLanguageMenu)}
                    className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{translationLanguageLabels[translationLanguage]}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {showTranslationLanguageMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTranslationLanguageMenu(false)} />
                      <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded border border-gray-300 bg-white py-1 shadow-lg">
                        {Object.entries(translationLanguageLabels).map(([code, label]) => (
                          <button
                            key={code}
                            onClick={() => {
                              setTranslationLanguage(code as typeof translationLanguage);
                              setShowTranslationLanguageMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                              translationLanguage === code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1">
                  <button onClick={() => setPdfScale(Math.max(0.25, pdfScale - 0.1))} className="rounded p-0.5 hover:bg-gray-100">
                    <ZoomOut className="h-3 w-3 text-gray-700" />
                  </button>
                  <select
                    value={getZoomSelectValue(pdfScale)}
                    onChange={(e) => setPdfScale(parseInt(e.target.value) / 100)}
                    className="cursor-pointer border-none bg-transparent px-1 text-xs outline-none"
                  >
                    {getZoomMenuOptions(pdfScale).map((option) => (
                      <option key={option} value={option}>
                        {option}%
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setPdfScale(Math.min(2, pdfScale + 0.1))} className="rounded p-0.5 hover:bg-gray-100">
                    <ZoomIn className="h-3 w-3 text-gray-700" />
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowTranslationViewModeMenu(!showTranslationViewModeMenu)}
                    className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <span>{translationViewModeLabels[translationViewMode]}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {showTranslationViewModeMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTranslationViewModeMenu(false)} />
                      <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded border border-gray-300 bg-white py-1 shadow-lg">
                        {Object.entries(translationViewModeLabels).map(([mode, label]) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setTranslationViewMode(mode as typeof translationViewMode);
                              setShowTranslationViewModeMenu(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                              translationViewMode === mode ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded p-1 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-700" />
                  </button>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{currentPage}</span>
                    <span>/ {totalPages}</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded p-1 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  </button>
                </div>
                <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1">
                  <button onClick={() => setPdfScale(Math.max(0.25, pdfScale - 0.1))} className="rounded p-0.5 hover:bg-gray-100">
                    <ZoomOut className="h-3 w-3 text-gray-700" />
                  </button>
                  <select
                    value={getZoomSelectValue(pdfScale)}
                    onChange={(e) => setPdfScale(parseInt(e.target.value) / 100)}
                    className="cursor-pointer border-none bg-transparent px-1 text-xs outline-none"
                  >
                    {getZoomMenuOptions(pdfScale).map((option) => (
                      <option key={option} value={option}>
                        {option}%
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setPdfScale(Math.min(2, pdfScale + 0.1))} className="rounded p-0.5 hover:bg-gray-100">
                    <ZoomIn className="h-3 w-3 text-gray-700" />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              title={isZh ? '打开本地文件' : 'Open local file'}
              aria-label={isZh ? '打开本地文件' : 'Open local file'}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{isZh ? '打开本地文件' : 'Open local file'}</span>
            </button>
            {activeTab !== 'blog' ? (
              <button
                type="button"
                onClick={() => setReaderTool(readerTool === 'marquee' ? 'click' : 'marquee')}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                  readerTool === 'marquee'
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                    : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                }`}
                title={isZh ? '框选 PDF 内容' : 'Select an area in the PDF'}
                aria-label={isZh ? '框选' : 'Select area'}
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>{isZh ? '框选' : 'Select'}</span>
              </button>
            ) : null}
            <button className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>53</span>
            </button>
            <button className="text-gray-700 hover:text-gray-900"><Bookmark className="h-4 w-4" /></button>
            <button className="text-gray-700 hover:text-gray-900"><Download className="h-4 w-4" /></button>
            <button className="text-gray-700 hover:text-gray-900"><Maximize className="h-4 w-4" /></button>
            <button
              type="button"
              onClick={handleOpenBlogShare}
              className="text-gray-700 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeTab !== 'blog' || !hasPaper}
              title={activeTab === 'blog' ? (isZh ? '分享 Blog' : 'Share blog') : (isZh ? '切换到 Blog 后分享' : 'Switch to Blog to share')}
              aria-label={activeTab === 'blog' ? (isZh ? '分享 Blog' : 'Share blog') : (isZh ? '切换到 Blog 后分享' : 'Switch to Blog to share')}
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`flex items-center justify-end gap-4 py-2.5 ${rightSidebarCollapsed ? 'px-2' : 'px-5'}`}>
          {!rightSidebarCollapsed ? rightSidebarActions : null}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div ref={mainContentRef} className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Preview and Structure */}
        <div className={`w-56 border-r border-gray-200 bg-gray-50 flex min-h-0 flex-col flex-shrink-0 transition-all duration-300 ${leftSidebarCollapsed ? 'hidden' : ''}`}>
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {hasPaper && sidebarTab === 'preview' && (
              <PageThumbnails 
                currentPage={currentPage} 
                totalPages={totalPages}
                onPageClick={setCurrentPage}
              />
            )}
            {hasPaper && sidebarTab === 'structure' && (
              <TableOfContents elements={[]} paperId={paperId} />
            )}
            {!hasPaper ? (
              <div className="p-4 text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-3 py-6 text-center transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <Upload className="mb-2 h-5 w-5 text-gray-400" />
                  <span>{isZh ? '上传 PDF 后显示预览' : 'Upload a PDF to show preview'}</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* User Panel at Bottom */}
          <UserPanel />
        </div>

        {/* Middle Content Area */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-100">
          {/* Content Area */}
          <div
            className="h-full min-h-0 flex-1 overflow-hidden bg-gray-100"
            style={{ transform: `translateX(${contentCenterOffset}px)` }}
          >
            {!activePaper ? emptyReaderView : null}
            {activePaper && activeTab === 'blog' && <BlogView paper={activePaper} language={blogLanguage} scale={blogScale} isFirstVisit={isFirstBlogVisit} />}
            {activePaper && activeTab === 'paper' && (
              <PaperView
                paper={activePaper}
                currentPage={currentPage}
                pdfScale={pdfScale}
                selectionMode={readerTool === 'marquee'}
                highlightTarget={paperHighlightTarget}
                onClearHighlight={() => setPaperHighlightTarget(null)}
                onTextSelect={handlePaperTextSelection}
                onConvertSelection={() => onOpenFigureToPPTX?.()}
              />
            )}
            {activePaper && activeTab === 'translation' && (
              <TranslationView
                paper={activePaper}
                pdfScale={pdfScale}
                isParsing={isParsing}
                targetLanguage={translationLanguage}
                viewMode={translationViewMode}
                hideControlsBar
              />
            )}
          </div>
        </div>

        {!rightSidebarCollapsed ? (
          <div
            className="relative z-10 -ml-px w-0 flex-shrink-0"
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize right sidebar"
              onMouseDown={(event) => {
                event.preventDefault();
                setIsResizingRightSidebar(true);
              }}
              className={`group absolute inset-y-0 -left-1 w-2 cursor-col-resize ${
                isResizingRightSidebar ? 'bg-blue-50' : ''
              }`}
            />
          </div>
        ) : null}

        {/* Right Sidebar - Comments & Notes */}
        <div
          className={`bg-white flex-shrink-0 ${
            !isResizingRightSidebar && rightSidebarCollapsed ? 'hidden' : ''
          } ${isResizingRightSidebar ? '' : 'transition-all duration-300'}`}
          style={{ width: rightSidebarWidth }}
        >
          {activePaper ? (
            <CommentsPanel
              paperId={paperId}
              paperTitle={activePaper.title}
              paperCategories={activePaper.categories}
              activeTab={rightSidebarTab}
              comments={paperComments[paperId] ?? []}
              activeCitationId={paperHighlightTarget?.citationId ?? null}
              onSelectSummaryCitation={handleSummaryCitationSelect}
              selectedExcerpt={selectedExcerpt}
              onClearSelectedExcerpt={() => setSelectedExcerpt(null)}
              onChangeTab={setRightSidebarTab}
              onOpenFigureToPPTX={onOpenFigureToPPTX}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-gray-500">
              {isZh ? '上传文件后，这里会显示 AI 问答、笔记、评论和论文信息。' : 'After uploading a file, AI chat, notes, comments, and paper info will appear here.'}
            </div>
          )}
        </div>
      </div>

      {showBlogShareModal && activePaper ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{isZh ? '分享 Blog' : 'Share blog'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowBlogShareModal(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label={isZh ? '关闭分享弹窗' : 'Close share dialog'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-800">{activePaper.title}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-700">
                  {isZh ? '推荐语' : 'Recommendation'}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshShareComment}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{isZh ? 'AI 换一条' : 'Regenerate'}</span>
                </button>
              </div>
              <textarea
                value={shareComment}
                onChange={(event) => setShareComment(event.target.value)}
                placeholder={isZh ? '写下你的评论...' : 'Add your comment...'}
                rows={5}
                className="mt-2 block w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={shareToComments}
                  onChange={(event) => setShareToComments(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{isZh ? '分享到评论区' : 'Share to comments'}</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowBlogShareModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSubmitBlogShare}
                disabled={!shareComment.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <SendHorizontal className="h-4 w-4" />
                <span>{isZh ? '复制并分享' : 'Copy and share'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shareToastVisible ? (
        <div className="fixed right-5 top-5 z-[60] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-xl">
          {isZh ? '已复制到粘贴板' : 'Copied to clipboard'}
        </div>
      ) : null}
    </div>
  );
}
