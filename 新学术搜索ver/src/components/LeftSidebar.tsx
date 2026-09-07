import React, { useState, useRef } from 'react';
import { Search, MessageSquare, Library, Rss, Clock, Plus, ChevronDown, ArrowRight, FlaskConical, GraduationCap, Lightbulb, PanelLeftClose, PanelLeftOpen, MoreHorizontal, Folder, Trash2, Bot, FolderKanban, Network, Compass, Wrench } from 'lucide-react';
import { UserPanel } from './UserPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { SettingsModal } from './SettingsModal';
import fudanLogo from 'figma:asset/fa745d526ea9ecf0301c6464b5897d1c96cb2f95.png';
import wisPaperLogo from 'figma:asset/3ce02a66a6df7d8cd1f86de17846e94de4e9df61.png';

interface LeftSidebarProps {
  onNavigate?: (view: string) => void;
  onOpenInvite?: () => void;
  onOpenPaywall?: () => void;
  onOpenRecharge?: () => void;
  onOpenNotifications?: () => void;
  onNewScholarQA?: () => void;
  onResetSearch?: () => void;
  currentView?: string;
}

interface NavItem {
  id: string;
  icon: React.ReactNode;
  labelKey: string;
  badge?: number;
}

const navItemsConfig: NavItem[] = [
  { id: 'all-feeds', icon: <Rss className="w-4 h-4" />, labelKey: 'nav.allFeeds' },
  { id: 'scholar-search', icon: <Search className="w-4 h-4" />, labelKey: 'nav.scholarSearch' },
  { id: 'scholar-qa', icon: <MessageSquare className="w-4 h-4" />, labelKey: 'nav.scholarQA' },
  { id: 'my-library', icon: <Library className="w-4 h-4" />, labelKey: 'nav.myLibrary' },
];

const latestWorkspaceNav = [
  { id: 'explore', label: '首页', icon: Compass },
  { id: 'scholar-qa', label: '问答', icon: MessageSquare },
  { id: 'scholar-search', label: '搜索', icon: Search },
  { id: 'academic-agent', label: 'Agent', icon: Bot },
  { id: 'my-library', label: '知识库', icon: Library },
  { id: 'research-projects', label: '项目', icon: FolderKanban },
  { id: 'research-canvas', label: '科研画布', icon: Network },
  { id: 'tools', label: '工具', icon: Wrench },
];

const historyByNav: Record<string, { title: string; items: string[] }> = {
  'scholar-qa': {
    title: '问答历史',
    items: ['GRPO 与 PPO 有什么区别？', 'Muon 优化器的核心思想', '如何评估 RAG 的可信度？'],
  },
  'scholar-search': {
    title: '搜索历史',
    items: ['非线性多智能体编队控制', 'Multimodal reasoning benchmarks', 'RAG vs. fine-tuning'],
  },
  'academic-agent': {
    title: 'Agent 历史',
    items: ['多模态 Agent 长期记忆选题', 'RAG 评测文献综述', '论文主图设计与优化'],
  },
};

interface RecentItem {
  id: string;
  title: string;
  truncated?: boolean;
}

const recentItems: RecentItem[] = [
  { id: '1', title: 'Unsupervised Medical Image Transl...', truncated: true },
  { id: '2', title: '{Three-Dimensional Medical Image...', truncated: true },
  { id: '3', title: 'Adversarial Diffusion ModelԠ...', truncated: true },
  { id: '4', title: 'Denoising Diffusion Probabilistic M...', truncated: true },
  { id: '5', title: 'Gamificationစ့...', truncated: true },
  { id: '6', title: 'circular economyစ့...', truncated: true },
];

interface LLMSItem {
  id: string;
  title: string;
}

const llmsItems: LLMSItem[] = [
  { id: 'dinosaur', title: 'Dinosaur Evaluation' },
  { id: 'satellite', title: 'Satellite Programing' },
];

export function LeftSidebar({ onNavigate, onOpenInvite, onOpenPaywall, onOpenRecharge, onOpenNotifications, onNewScholarQA, onResetSearch, currentView }: LeftSidebarProps = {}) {
  const [activeNav, setActiveNav] = useState('all-feeds');
  const [showMyLibrary, setShowMyLibrary] = useState(false);
  const [showLLMSSection, setShowLLMSSection] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [qaHistory, setQaHistory] = useState([
    { id: 'qa-1', title: 'GRPO 与 PPO 有什么区别？', pinned: true },
    { id: 'qa-2', title: 'Muon 优化器的核心思想', pinned: false },
    { id: 'qa-3', title: '如何评估 RAG 的可信度？', pinned: false },
  ]);
  const [draggedHistoryId, setDraggedHistoryId] = useState<string | null>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    if (currentView === 'explore') {
      setActiveNav('explore');
    } else if (currentView === 'library') {
      setActiveNav('my-library');
    } else if (currentView === 'scholar-qa') {
      setActiveNav('scholar-qa');
      setShowMoreMenu(true);
    } else if (currentView === 'all-feeds') {
      setActiveNav('all-feeds');
    } else if (currentView === 'paper-reproduction') {
      setActiveNav('paper-reproduction');
    } else if (currentView === 'idea-discovery') {
      setActiveNav('idea-discovery');
      setShowMoreMenu(true);
    } else if (currentView === 'fudan-collection-search') {
      setActiveNav('fudan-collection-search');
      setShowMoreMenu(true);
    } else if (currentView === 'academic-agent') {
      setActiveNav('academic-agent');
    } else if (currentView === 'research-projects') {
      setActiveNav('research-projects');
    } else if (currentView === 'research-canvas') {
      setActiveNav('research-canvas');
    } else if (currentView === 'truecite' || currentView === 'tools' || currentView === 'figure-to-pptx') {
      setActiveNav('tools');
    } else if (currentView === 'list') {
      setActiveNav('scholar-search');
      setShowMoreMenu(true);
    }
  }, [currentView]);

  // Close more menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Close history menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
        setShowHistoryMenu(false);
      }
    };
    if (showHistoryMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistoryMenu]);

  const handleNavClick = (itemId: string) => {
    setActiveNav(itemId);
    if (onNavigate) {
      if (itemId === 'explore') {
        onNavigate('explore');
      } else if (itemId === 'my-library') {
        onNavigate('library');
      } else if (itemId === 'scholar-search') {
        // Reset search state when clicking Scholar Search
        if (onResetSearch) {
          onResetSearch();
        }
        onNavigate('list');
      } else if (itemId === 'scholar-qa') {
        onNavigate('scholar-qa');
      } else if (itemId === 'all-feeds') {
        onNavigate('all-feeds');
      } else if (itemId === 'paper-reproduction') {
        onNavigate('paper-reproduction');
      } else if (itemId === 'idea-discovery') {
        onNavigate('idea-discovery');
      } else if (itemId === 'academic-agent') {
        onNavigate('academic-agent');
      } else if (itemId === 'research-projects') {
        onNavigate('research-projects');
      } else if (itemId === 'research-canvas') {
        onNavigate('research-canvas');
      } else if (itemId === 'truecite') {
        onNavigate('truecite');
      } else if (itemId === 'tools') {
        onNavigate('tools');
      } else if (itemId === 'fudan-collection-search') {
        if (onResetSearch) {
          onResetSearch();
        }
        onNavigate('fudan-collection-search');
      }
    }
  };

  const handleClearRecent = () => {
    // Handle clearing recent items
    console.log('Clear recent items');
  };

  const handleNewScholarSearch = () => {
    // Reset search state and navigate to new search page
    setActiveNav('scholar-search');
    if (onResetSearch) {
      onResetSearch();
    }
    if (onNavigate) {
      onNavigate('list');
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-14' : 'w-64'} sticky top-0 z-[1000] isolate h-screen shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${isCollapsed ? 'overflow-visible' : ''}`}>
      {/* Logo */}
      <div className={`${isCollapsed ? 'px-2' : 'px-3'} py-3 border-b border-gray-100 flex items-center justify-between`}>
        <button 
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
        >
          <img src={wisPaperLogo} alt="WisPaper" className="w-5 h-5 object-contain flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold text-base text-gray-900">WisPaper</span>}
        </button>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="收起侧边栏"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-2 py-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="展开侧边栏"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-1' : 'px-2'} py-2 ${isCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
        <div className="space-y-1" aria-label="Workspace 一级导航">
          {latestWorkspaceNav.map(({ id, label, icon: Icon }) => (
            <div key={id} className="relative group">
              <button
                type="button"
                onClick={() => handleNavClick(id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'} rounded-lg transition-colors text-sm ${
                  activeNav === id
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </button>
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{label}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-gray-100" />

        {activeNav === 'scholar-qa' ? (
          <section className={`${isCollapsed ? 'px-0' : 'px-1'} pb-3`} aria-label="问答历史">
            {!isCollapsed ? <h2 className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">问答历史</h2> : null}
            {!isCollapsed && qaHistory.some((item) => item.pinned) ? <div className="px-2 pb-1 text-[10px] font-medium text-gray-400">置顶</div> : null}
            <div className="space-y-0.5">
              {[...qaHistory].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((item) => (
                <div key={item.id} draggable={item.pinned} onDragStart={() => setDraggedHistoryId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggedHistoryId || draggedHistoryId === item.id) return; setQaHistory((current) => { const source = current.find((entry) => entry.id === draggedHistoryId); if (!source?.pinned || !item.pinned) return current; const next = current.filter((entry) => entry.id !== draggedHistoryId); const target = next.findIndex((entry) => entry.id === item.id); next.splice(target, 0, source); return next; }); setDraggedHistoryId(null); }} className="group flex items-center rounded-lg hover:bg-gray-50">
                  <button type="button" title={item.title} className={`min-w-0 flex-1 py-2 text-left text-xs text-gray-500 hover:text-gray-900 ${isCollapsed ? 'flex justify-center px-0' : 'truncate px-2.5'}`}>{isCollapsed ? <Clock className="h-4 w-4" /> : item.title}</button>
                  {!isCollapsed && <div className="flex pr-1 opacity-0 transition group-hover:opacity-100"><button title={item.pinned ? '取消置顶' : '置顶'} onClick={() => setQaHistory((current) => current.map((entry) => entry.id === item.id ? { ...entry, pinned: !entry.pinned } : entry))} className={`rounded p-1 text-[11px] ${item.pinned ? 'text-blue-500' : 'text-gray-400'}`}>●</button><button title="重命名" onClick={() => { const title = window.prompt('重命名', item.title); if (title?.trim()) setQaHistory((current) => current.map((entry) => entry.id === item.id ? { ...entry, title: title.trim() } : entry)); }} className="rounded p-1 text-[11px] text-gray-400">Edit</button><button title="删除" onClick={() => { if (window.confirm('确认删除对话？\n删除后将无法恢复。')) setQaHistory((current) => current.filter((entry) => entry.id !== item.id)); }} className="rounded p-1 text-[11px] text-gray-400">×</button></div>}
                </div>
              ))}
            </div>
          </section>
        ) : historyByNav[activeNav] ? (
          <section className={`${isCollapsed ? 'px-0' : 'px-1'} pb-3`} aria-label={historyByNav[activeNav].title}>
            {!isCollapsed ? <h2 className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">{historyByNav[activeNav].title}</h2> : null}
            <div className="space-y-0.5">
              {historyByNav[activeNav].items.map((item) => (
                <button key={item} type="button" title={item} className={`w-full rounded-lg py-2 text-left text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 ${isCollapsed ? 'flex justify-center px-0' : 'truncate px-2.5'}`}>
                  {isCollapsed ? <Clock className="h-4 w-4" /> : item}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {/* Primary Nav Items */}
        <div className="hidden" aria-hidden="true">
          <div className="relative group">
            <button
              onClick={() => handleNavClick('explore')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${activeNav === 'explore' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Compass className="w-4 h-4" />
              {!isCollapsed && <span>首页</span>}
            </button>
          </div>

          {/* New Research */}
          <div className="relative group">
            <button
              onClick={() => handleNavClick('all-feeds')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                activeNav === 'all-feeds'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Rss className="w-4 h-4" />
              {!isCollapsed && <span>{t('nav.allFeeds')}</span>}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.allFeeds')}</span>
              </div>
            )}
          </div>

          {/* My Library */}
          <div className="relative group">
            <button
              onClick={() => handleNavClick('my-library')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                activeNav === 'my-library'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Library className="w-4 h-4" />
              {!isCollapsed && <span>{t('nav.myLibrary')}</span>}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.myLibrary')}</span>
              </div>
            )}
          </div>

          {/* Paper (PaperClaw) */}
          <div className="relative group">
            <button
              onClick={() => handleNavClick('academic-agent')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                activeNav === 'academic-agent'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bot className="w-4 h-4" />
              {!isCollapsed && <><span>{t('nav.agents')}</span><span className="ml-auto rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">New</span></>}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.agents')}</span>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => handleNavClick('research-projects')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                activeNav === 'research-projects'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              {!isCollapsed && <span>{t('nav.projects')}</span>}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.projects')}</span>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => handleNavClick('research-canvas')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                activeNav === 'research-canvas'
                  ? 'bg-violet-50 text-violet-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Network className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>科研画布</span>
                  <span className="ml-auto rounded-md border border-violet-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-violet-600">实验</span>
                </>
              )}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">科研画布 · 实验</span>
              </div>
            )}
          </div>

          {/* Paper (PaperClaw) */}
          <div className="relative group">
            <button
              onClick={() => handleNavClick('paper-reproduction')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                activeNav === 'paper-reproduction'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              {!isCollapsed && <span>{t('nav.paperReproduction')}</span>}
            </button>
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.paperReproduction')}</span>
              </div>
            )}
          </div>

          {/* More - Collapsible / Popover */}
          <div 
            className="relative" 
            ref={moreMenuRef}
            onMouseEnter={() => { if (isCollapsed) setShowMoreMenu(true); }}
            onMouseLeave={() => { if (isCollapsed) setShowMoreMenu(false); }}
          >
            <button
              onClick={() => { if (!isCollapsed) setShowMoreMenu(!showMoreMenu); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                showMoreMenu || ['scholar-qa', 'idea-discovery', 'truecite', 'scholar-search', 'fudan-collection-search'].includes(activeNav)
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>{t('nav.more')}</span>
                  <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showMoreMenu ? '' : '-rotate-90'}`} />
                </>
              )}
            </button>

            {/* Expanded sidebar: inline sub-items */}
            {showMoreMenu && !isCollapsed && (
              <div className="ml-3 mt-0.5 pl-3.5 border-l border-gray-200 space-y-0.5">
                <button
                  onClick={() => { handleNavClick('scholar-qa'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                    activeNav === 'scholar-qa'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('nav.scholarQA')}</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium">Beta</span>
                </button>

                <button
                  onClick={() => { handleNavClick('idea-discovery'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                    activeNav === 'idea-discovery'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{t('nav.ideaDiscovery')}</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">New</span>
                </button>

                <button
                  onClick={() => { handleNavClick('truecite'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                    activeNav === 'truecite'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>TrueCite</span>
                </button>

                <button
                  onClick={() => { handleNavClick('scholar-search'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                    activeNav === 'scholar-search'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('nav.scholarSearch')}</span>
                </button>

                <button
                  onClick={() => { handleNavClick('fudan-collection-search'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                    activeNav === 'fudan-collection-search'
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{t('nav.fudanCollectionSearch')}</span>
                </button>
              </div>
            )}

            {/* Collapsed sidebar: tooltip label */}
            {showMoreMenu && isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.more')}</span>
              </div>
            )}

            {/* Collapsed sidebar: hover sub-menu card */}
            {showMoreMenu && isCollapsed && (
              <div className="absolute left-full top-0 ml-0 z-50 pl-3">
                <div className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 mt-8">
                      <button
                        onClick={() => { handleNavClick('scholar-qa'); setShowMoreMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          activeNav === 'scholar-qa'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{t('nav.scholarQA')}</span>
                        <span className="ml-auto px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded font-medium">Beta</span>
                      </button>

                      <button
                        onClick={() => { handleNavClick('idea-discovery'); setShowMoreMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          activeNav === 'idea-discovery'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span>{t('nav.ideaDiscovery')}</span>
                        <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">New</span>
                      </button>

                      <button
                        onClick={() => { handleNavClick('truecite'); setShowMoreMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          activeNav === 'truecite'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <FlaskConical className="w-4 h-4" />
                        <span>TrueCite</span>
                      </button>

                      <button
                        onClick={() => { handleNavClick('scholar-search'); setShowMoreMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          activeNav === 'scholar-search'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Search className="w-4 h-4" />
                        <span>{t('nav.scholarSearch')}</span>
                      </button>

                      <button
                        onClick={() => { handleNavClick('fudan-collection-search'); setShowMoreMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          activeNav === 'fudan-collection-search'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>{t('nav.fudanCollectionSearch')}</span>
                      </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeNav === 'my-library' && !isCollapsed ? (
          <div className="mt-8 space-y-1">
            <div className="mb-3 flex items-center justify-between px-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                <span>{t('nav.myLibrary')}</span>
              </div>
              <button className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-600 transition hover:bg-blue-100">
                <span>新建</span>
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {[
              { label: 'Folder 1', depth: 0, expanded: false },
              { label: 'Folder 2', depth: 0, expanded: false, chevron: true },
              { label: 'Folder 3', depth: 0, expanded: true, chevron: true },
              { label: 'Folder 3.1', depth: 1, expanded: true, chevron: true },
              { label: 'Folder 3.1.1', depth: 2, expanded: true, chevron: true },
              { label: 'Folder 3.1.1', depth: 3, expanded: true, chevron: true },
            ].map((folder) => (
              <button
                key={`${folder.label}-${folder.depth}`}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-white/80 hover:text-gray-900"
                style={{ paddingLeft: `${12 + folder.depth * 22}px` }}
              >
                {folder.chevron ? (
                  <ChevronDown className={`h-4 w-4 text-gray-500 ${folder.expanded ? '' : '-rotate-90'}`} />
                ) : (
                  <span className="h-4 w-4" />
                )}
                <Folder className="h-4 w-4 text-blue-500" />
                <span className="truncate">{folder.label}</span>
              </button>
            ))}

            <button className="mt-56 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-white/80 hover:text-gray-900">
              <Trash2 className="h-4 w-4" />
              <span>Trash</span>
            </button>
          </div>
        ) : null}

        {/* Divider + History Section */}
        {false ? (
          <>
        <div className={`my-2 ${isCollapsed ? 'mx-1' : 'mx-1'} border-t border-gray-200`} />
        <div className="space-y-0.5">
          <div
            className="relative"
            ref={historyMenuRef}
            onMouseEnter={() => { if (isCollapsed) setShowHistoryMenu(true); }}
            onMouseLeave={() => { if (isCollapsed) setShowHistoryMenu(false); }}
          >
            <button
              onClick={() => { if (!isCollapsed) setShowHistoryMenu(!showHistoryMenu); }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2'} rounded-md transition-colors text-sm ${
                showHistoryMenu
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              {!isCollapsed && (
                <>
                  <span>{t('nav.history')}</span>
                  <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showHistoryMenu ? '' : '-rotate-90'}`} />
                </>
              )}
            </button>

            {/* Expanded sidebar: inline sub-items */}
            {showHistoryMenu && !isCollapsed && (
              <div className="ml-3 mt-0.5 pl-3.5 border-l border-gray-200 space-y-0.5">
                {recentItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm text-gray-600 hover:bg-gray-50"
                    title={item.title}
                  >
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Collapsed sidebar: tooltip label */}
            {showHistoryMenu && isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60] pointer-events-none">
                <span className="inline-block px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap shadow-lg">{t('nav.history')}</span>
              </div>
            )}

            {/* Collapsed sidebar: hover sub-menu card */}
            {showHistoryMenu && isCollapsed && (
              <div className="absolute left-full top-0 ml-0 z-50 pl-3">
                <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 mt-8">
                  {recentItems.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setShowHistoryMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-gray-600 hover:bg-gray-50"
                      title={item.title}
                    >
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        ) : null}

        {/* LLMs Section - Only show when Scholar QA is active */}
        {activeNav === 'scholar-qa' && !isCollapsed && (
          null
        )}
      </nav>

      {/* User Panel */}
      <UserPanel 
        onOpenInvite={onOpenInvite} 
        onOpenPaywall={onOpenPaywall} 
        onOpenRecharge={onOpenRecharge} 
        onOpenNotifications={onOpenNotifications}
        onOpenSettings={() => setShowSettingsModal(true)}
        isCollapsed={isCollapsed}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        onOpenPricing={() => { setShowSettingsModal(false); onOpenPaywall?.(); }}
      />
    </aside>
  );
}
