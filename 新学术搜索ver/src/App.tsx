import React, { useState, useMemo } from "react";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { SearchThinkingPanel } from "./components/SearchThinkingPanel";
import { LeftSidebar } from "./components/LeftSidebar";
import { AskAIProvider } from "./components/ask-ai/AskAI";
import { SearchAskAI } from "./components/ask-ai/SearchAskAI";
import { PaperDetail } from "./components/PaperDetail";
import { MyLibrary } from "./components/MyLibrary";
import { ScholarSearchHome, extractAcademicIdentifiers, type AcademicIdentifier } from "./components/ScholarSearchHome";
import { ExplorePage } from "./components/ExplorePage";
import { WorkspaceHome } from "./components/WorkspaceHome";
import { readHomeSession, HOME_SESSION_KEY } from "./components/home-task-config";
import { BrowserResearch } from "./components/browser-use/BrowserResearch";
import { HomePage } from "./components/HomePage";
import { ScholarQA } from "./components/ScholarQA";
import { PaperReproduction } from "./components/PaperReproduction";
import { IdeaDiscovery } from "./components/IdeaDiscovery";
import { AllFeedsWorkspace } from "./components/AllFeedsWorkspace";
import { FudanCollectionResults } from "./components/FudanCollectionResults";
import { AcademicAgent } from "./components/AcademicAgent";
import { ResearchProjects } from "./components/ResearchProjects";
import { ResearchCanvas } from "./components/ResearchCanvas";
import { InstitutionManagement } from "./components/InstitutionManagement";
import { FigureToPPTX } from "./components/FigureToPPTX";
import { ExcelToFigure } from "./components/ExcelToFigure";
import { ToolsPage } from "./components/ToolsPage";
import { MockConsole } from "./components/MockConsole";
import { useOnboarding } from "./components/onboarding/useOnboarding";
import { OnboardingExperience } from "./components/onboarding/OnboardingExperience";
import { BillingProvider } from './contexts/BillingContext';
import { QuickPaperPage } from "./components/QuickPaperPage";
import { SearchMoreButton } from "./components/SearchMoreButton";
import { InviteModal } from "./components/InviteModal";
import { PaywallModal } from "./components/PaywallModal";
import { RechargeModal } from "./components/RechargeModal";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { FeedbackModal } from "./components/FeedbackModal";
import { FeedbackTicketsProvider } from "./contexts/FeedbackTicketsContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { mockPapers } from "./data/mockPapers";
import { mockBooks } from "./data/mockBooks";
import { mockTheses } from "./data/mockTheses";
import { Paper, FilterOptions } from "./types";

const viewRoutes: Record<string, string> = {
  'workspace-home': '/app/home',
  'home-search-preview': '/app/home/search',
  'home-agent-preview': '/app/home/agent',
  'home-agent-case': '/app/home/case',
  home: '/landing',
  explore: '/',
  list: '/app/scholar-search',
  'scholar-qa': '/app/ask',
  'academic-agent': '/app/agent',
  library: '/app/library',
  'research-projects': '/app/projects',
  'research-canvas': '/app/research-canvas',
  'institution-admin': '/app/institution-admin',
  'all-feeds': '/app/explore',
  'paper-reproduction': '/app/paper-reproduction',
  'idea-discovery': '/app/idea-discovery',
  'fudan-collection-search': '/app/fudan-collection',
  reader: '/app/reader',
  detail: '/app/paper',
  'quick-paper': '/app/quick-paper',
  truecite: '/app/truecite',
  tools: '/app/tools',
  'figure-to-pptx': '/app/tools/figure-to-pptx',
  'figure-to-excel': '/app/tools/figure-to-excel',
  'excel-to-figure': '/app/tools/excel-to-figure',
};

const getViewFromPath = (pathname: string) => {
  if (pathname === '/') return 'explore';
  if (pathname === '/landing') return 'home';
  if (pathname === '/app/search' || pathname === '/app/explore' || pathname === '/app/ai-feeds') return 'explore';
  if (pathname === '/scholar-search' || pathname === '/app/scholar-search') return 'list';
  const match = Object.entries(viewRoutes).find(([, route]) => pathname === route || (route === '/app/paper' && pathname.startsWith('/app/paper/')) || (route === '/app/projects' && pathname.startsWith('/app/projects/')));
  return match?.[0] ?? 'home';
};

// A home-originated Agent task retains its handoff when this history entry reloads.
const readHomeAgentLaunch = (): { prompt: string; skill: string; requiresLogin?: boolean } | null => {
  const task = window.history.state?.unifiedHomeTask;
  return window.location.pathname === '/app/agent' && typeof task?.prompt === 'string' && typeof task?.skill === 'string'
    ? { prompt: task.prompt, skill: task.skill, requiresLogin: task.requiresLogin === true } : null;
};

// Keep the selected paper across refreshes and browser back/forward navigation.
const readSelectedPaper = (): Paper | null => {
  const paperId = new URLSearchParams(window.location.search).get('paper');
  const paper = mockPapers.find(item => item.id === paperId);
  if (paper) return paper;
  try {
    const cached = JSON.parse(sessionStorage.getItem('wispaper-quick-paper-v1') || 'null');
    if (cached && (!paperId || cached.id === paperId) && typeof cached.id === 'string' && typeof cached.title === 'string' && typeof cached.abstract === 'string' && Array.isArray(cached.authors) && Array.isArray(cached.categories)) return cached;
  } catch {}
  return null;
};

// Suppress Figma-specific prop warnings in development
if (typeof console !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('React does not recognize') &&
      (args[0].includes('_fg') || args[0].includes('data-fg'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// WisPaper Main Application
export default function App() {
  const defaultFilters: FilterOptions = {
    years: [],
    categories: [],
    sortBy: "relevance",
  };
  const [askSearchCache] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('wispaper-current-search-v1') || 'null');
      if (typeof cached?.id === 'string' && typeof cached?.query === 'string') return cached;
    } catch {}
    return { id: crypto.randomUUID(), query: '', hasSearched: false };
  });
  const [searchQuery, setSearchQuery] = useState(askSearchCache.query);
  const [askSearchSessionId, setAskSearchSessionId] = useState(askSearchCache.id);
  const [hasSearched, setHasSearched] = useState(askSearchCache.hasSearched === true);
  React.useEffect(() => { try { localStorage.setItem('wispaper-current-search-v1', JSON.stringify({ id: askSearchSessionId, query: searchQuery, hasSearched })); } catch {} }, [askSearchSessionId, searchQuery, hasSearched]);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [selectedPaper, setSelectedPaper] =
    useState<Paper | null>(readSelectedPaper);
  const initialView = typeof window !== 'undefined' ? (['tickets', 'feedback'].includes(new URLSearchParams(window.location.search).get('mock') ?? '') ? 'all-feeds' : getViewFromPath(window.location.pathname)) : 'home';
  const [viewMode, setViewMode] = useState<
    "home" | "workspace-home" | "home-search-preview" | "home-agent-preview" | "home-agent-case" | "explore" | "list" | "quick-paper" | "detail" | "reader" | "library" | "scholar-qa" | "all-feeds" | "paper-reproduction" | "idea-discovery" | "fudan-collection-search" | "academic-agent" | "research-projects" | "research-canvas" | "truecite" | "tools" | "figure-to-pptx" | "figure-to-excel" | "excel-to-figure" | "institution-admin"
  >(initialView as any);
  // Prototype role only; actual authorization must be enforced by the server.
  const [mockRole] = useState<'org_admin' | 'user'>(() =>
    new URLSearchParams(window.location.search).get('mockRole') === 'user' ? 'user' : 'org_admin'
  );
  const isInstitutionAdmin = mockRole === 'org_admin';
  const [homeSignedIn, setHomeSignedIn] = useState(() => readHomeSession().signedIn);
  const [homeLoginRequest, setHomeLoginRequest] = useState(0);
  const isHomeFlow = ['workspace-home', 'home-search-preview', 'home-agent-preview', 'home-agent-case'].includes(viewMode);
  const historyNavigationRef = React.useRef(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [pricingSource, setPricingSource] = useState<'general' | 'account-upgrade'>('general');
  const openPricing = (source: 'general' | 'account-upgrade' = 'general') => {
    setPricingSource(source);
    setShowPaywallModal(true);
  };
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showDeepSearchTooltip, setShowDeepSearchTooltip] = useState(false);
  const [scholarQAKey, setScholarQAKey] = useState(0);
  const [agentKey, setAgentKey] = useState(0);
  const [agentTaskActive, setAgentTaskActive] = useState(false);
  const onboarding = useOnboarding(viewMode, agentTaskActive, selectedPaper?.isOpenAccess === true);
  const [initialAskQuestion, setInitialAskQuestion] = useState('');
  const [initialAgentPrompt, setInitialAgentPrompt] = useState(() => readHomeAgentLaunch()?.prompt ?? '');
  const [homeAgentLaunch, setHomeAgentLaunch] = useState<{ prompt: string; skill: string; requiresLogin?: boolean } | null>(readHomeAgentLaunch);
  const isGuestAgent = viewMode === 'academic-agent' && !homeSignedIn && homeAgentLaunch?.requiresLogin === true && homeAgentLaunch.prompt === initialAgentPrompt;
  const finishGuestLogin = () => {
    const session = { ...readHomeSession(), signedIn: true };
    try { sessionStorage.setItem(HOME_SESSION_KEY, JSON.stringify(session)); } catch {}
    setHomeSignedIn(true);
  };
  const [mockUserCredits, setMockUserCredits] = useState(50000);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [readerInitialFile, setReaderInitialFile] = useState<File | null>(null);
  const [figureToPPTXFromReader, setFigureToPPTXFromReader] = useState(false);
  const [shortcutResults, setShortcutResults] = useState<Paper[] | null>(null);

  React.useEffect(() => {
    if (window.location.pathname === '/app/search' || window.location.pathname === '/app/ai-feeds' || window.location.pathname === '/app/explore') {
      const mockRoleParam = new URLSearchParams(window.location.search).get('mockRole');
      const roleQuery = mockRoleParam ? `?${new URLSearchParams({mockRole: mockRoleParam})}` : '';
      window.history.replaceState({ view: 'explore' }, '', `/${roleQuery}`);
    }

    const handlePopState = () => {
      historyNavigationRef.current = true;
      setSelectedPaper(readSelectedPaper());
      const homeTask = readHomeAgentLaunch();
      if (homeTask) { setHomeAgentLaunch(homeTask); setInitialAgentPrompt(homeTask.prompt); }
      setViewMode(getViewFromPath(window.location.pathname) as any);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    if (historyNavigationRef.current) {
      historyNavigationRef.current = false;
      return;
    }

    const paperRoute = viewMode === 'quick-paper' || viewMode === 'detail';
    const nextPath = viewRoutes[viewMode] ?? '/';
    const isProjectDetail = viewMode === 'research-projects' && /^\/app\/projects\/\d+$/.test(window.location.pathname);
    const query = new URLSearchParams(window.location.search);
    if (paperRoute && selectedPaper) query.set('paper', selectedPaper.id);
    else query.delete('paper');
    const nextUrl = nextPath + (query.size ? `?${query}` : '');
    const unifiedHomeTask = viewMode === 'academic-agent' && homeAgentLaunch?.prompt === initialAgentPrompt ? homeAgentLaunch : undefined;
    const nextState = { view: viewMode, ...(unifiedHomeTask ? { unifiedHomeTask } : {}) };
    if (window.location.pathname + window.location.search !== nextUrl && !isProjectDetail) {
      window.history.pushState(nextState, '', nextUrl);
    } else if (!isProjectDetail && JSON.stringify(window.history.state?.unifiedHomeTask) !== JSON.stringify(unifiedHomeTask)) {
      window.history.replaceState({ ...window.history.state, ...nextState, unifiedHomeTask }, '', nextUrl);
    }
  }, [viewMode, selectedPaper?.id, homeAgentLaunch, initialAgentPrompt]);

  React.useEffect(() => {
    if (selectedPaper) {
      try { sessionStorage.setItem('wispaper-quick-paper-v1', JSON.stringify(selectedPaper)); } catch {}
    }
  }, [selectedPaper]);

  const resolveShortcutPaper = (identifier: AcademicIdentifier): Paper => {
    const cleanValue = identifier.value.replace(/v\d+$/i, '');
    const arxivFromDoi = identifier.kind === 'DOI'
      ? cleanValue.match(/^10\.48550\/arxiv\.(.+)$/i)?.[1]
      : null;
    const matchedPaper = mockPapers.find((paper) => {
      if (identifier.kind === 'arXiv') {
        return paper.arxivId?.replace(/v\d+$/i, '').toLowerCase() === cleanValue.toLowerCase();
      }
      return paper.doi?.toLowerCase() === cleanValue.toLowerCase()
        || Boolean(arxivFromDoi && paper.arxivId?.toLowerCase() === arxivFromDoi.toLowerCase());
    });

    return matchedPaper ?? {
      id: `shortcut-${identifier.kind.toLowerCase()}-${cleanValue}`,
      title: identifier.kind === 'DOI' ? `DOI: ${identifier.value}` : `arXiv: ${identifier.value}`,
      authors: ['学术标识符解析'],
      abstract: `已识别 ${identifier.kind} 标识符。正式服务将从快速搜索接口加载该论文的元数据。`,
      year: 2026,
      publishedDate: '2026-08-05',
      venue: identifier.kind,
      citations: 0,
      categories: ['Quick Open'],
      pdfUrl: '#',
      arxivId: identifier.kind === 'arXiv' ? identifier.value : undefined,
      doi: identifier.kind === 'DOI' ? identifier.value : undefined,
      type: 'paper',
    };
  };

  const filteredPapers = useMemo(() => {
    let results = shortcutResults ?? mockPapers;

    // Search filter
    if (searchQuery && !shortcutResults) {
      const query = searchQuery.toLowerCase();
      const queryWords = query.split(/\s+/).filter(w => w.length > 1); // Filter out single characters
      
      console.log('Search query:', query);
      console.log('Query words:', queryWords);
      console.log('Total papers available:', mockPapers.length);
      
      // First try to find matches
      let matchedResults = results.filter(
        (paper) => {
          const searchText = `${paper.title} ${paper.abstract} ${paper.authors.join(' ')} ${paper.categories.join(' ')} ${paper.venue || ''}`.toLowerCase();
          
          // If any word in the query matches, include the paper
          return queryWords.some(word => searchText.includes(word)) ||
                 paper.title.toLowerCase().includes(query) ||
                 paper.abstract.toLowerCase().includes(query) ||
                 paper.authors.some((author) => author.toLowerCase().includes(query));
        }
      );
      
      console.log('Matched results:', matchedResults.length);
      
      // If search results are too few (less than 30), return the first 50 papers instead
      // This ensures that clicking example questions always shows results
      if (matchedResults.length < 30) {
        console.log('Less than 30 results, returning first 50 papers');
        results = mockPapers.slice(0, 50);
      } else {
        results = matchedResults;
      }
      
      console.log('Final results count:', results.length);
    }

    // Year filter
    if (filters.years.length > 0) {
      results = results.filter((paper) =>
        filters.years.includes(paper.year),
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      results = results.filter((paper) =>
        filters.categories.some((cat) =>
          paper.categories.includes(cat),
        ),
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "date":
        results = [...results].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return (
            new Date(b.publishedDate).getTime() -
            new Date(a.publishedDate).getTime()
          );
        });
        break;
      case "citations":
        results = [...results].sort(
          (a, b) => b.citations - a.citations,
        );
        break;
      case "relevance":
      default:
        break;
    }

    return results;
  }, [searchQuery, filters, shortcutResults]);

  const handleSelectPaper = (paper: Paper) => {
    setSelectedPaper(paper);
    setViewMode("quick-paper");
  };

  const openSelectedReader = () => {
    if (!selectedPaper?.isOpenAccess) return;
    if (onboarding.active && onboarding.page === 'reader') onboarding.end();
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode("list");
  };

  const handleResetScholarQA = () => {
    setScholarQAKey(prev => prev + 1);
  };

  const handleWorkspaceNavigate = (view: string) => {
    if (view === 'scholar-qa') {
      setInitialAskQuestion('');
      setScholarQAKey((value) => value + 1);
    }
    const target = view === 'scholar-search' ? 'list' : view === 'my-library' ? 'library' : view;
    setViewMode(target as any);
  };

  const handleSearch = (query: string) => {
    setAskSearchSessionId(crypto.randomUUID());
    const identifiers = extractAcademicIdentifiers(query);
    setShortcutResults(identifiers.length > 0 ? identifiers.map(resolveShortcutPaper) : null);
    setSearchQuery(query);
    setHasSearched(true);
  };

  const handleQuickOpen = (identifier: AcademicIdentifier) => {
    const shortcutPaper = resolveShortcutPaper(identifier);

    setSearchQuery(identifier.value);
    setShortcutResults(null);
    setSelectedPaper(shortcutPaper);
    setHasSearched(false);
    setViewMode('quick-paper');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setShortcutResults(null);
    if (!query.trim()) {
      setHasSearched(false);
    }
  };

  const handleSearchMore = () => {
    setIsLoadingMore(true);
    // Simulate loading more papers
    setTimeout(() => {
      setIsLoadingMore(false);
      console.log('Loading more papers...');
      // In a real app, you would fetch more papers from an API here
    }, 1500);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setFilters(defaultFilters);
    setShortcutResults(null);
  };

  const handleStartSearchFromHome = (query?: string) => {
    setAskSearchSessionId(crypto.randomUUID());
    setSelectedPaper(null);
    setFilters(defaultFilters);
    setShortcutResults(null);
    setViewMode("list");

    if (query?.trim()) {
      setSearchQuery(query.trim());
      setHasSearched(true);
      return;
    }

    setSearchQuery('');
    setHasSearched(false);
  };

  const isReaderView = isHomeFlow || viewMode === "explore" || viewMode === "detail" || viewMode === "reader" || viewMode === "academic-agent" || viewMode === "research-projects" || viewMode === "research-canvas";

  return (
    <LanguageProvider>
      <BillingProvider>
      <FeedbackTicketsProvider>
      <AskAIProvider view={viewMode} agentTaskActive={agentTaskActive} search={{ id: askSearchSessionId, query: searchQuery, mode: '学术搜索', count: hasSearched ? (shortcutResults || filteredPapers).length : 0 }} onboarding={onboarding}
        onResume={guide => { setViewMode(guide.page === 'home' ? 'explore' : guide.page === 'reader' ? 'quick-paper' : 'academic-agent'); onboarding.resume(guide); }}
        onSearch={handleStartSearchFromHome} onAgent={query => { setInitialAgentPrompt(query); setAgentKey(key => key + 1); setViewMode('academic-agent'); }}>

      <div className={`${isHomeFlow ? "wh-shell " : ""}${isReaderView ? "h-screen overflow-hidden bg-white flex" : "min-h-screen bg-white flex"}`}>
        {/* Left Sidebar - Only show in list view, library view, and scholar-qa view */}
        {(isHomeFlow || viewMode === "explore" || viewMode === "list" || viewMode === "reader" || viewMode === "library" || viewMode === "scholar-qa" || viewMode === "all-feeds" || viewMode === "paper-reproduction" || viewMode === "idea-discovery" || viewMode === "fudan-collection-search" || viewMode === "academic-agent" || viewMode === "research-projects" || viewMode === "research-canvas" || viewMode === "truecite" || viewMode === "tools" || viewMode === "figure-to-pptx" || viewMode === "figure-to-excel" || viewMode === "excel-to-figure" || viewMode === "institution-admin") && viewMode !== "home-agent-case" && !(viewMode === "academic-agent" && (agentTaskActive || isGuestAgent)) && (
          <LeftSidebar
            onNavigate={handleWorkspaceNavigate}
            onOpenInvite={() => setShowInviteModal(true)}
            onOpenPaywall={() => openPricing()}
            onOpenUpgradePricing={() => openPricing('account-upgrade')}
            onOpenRecharge={() => setShowRechargeModal(true)}
            onOpenNotifications={() => setShowNotificationDrawer(true)}
            onNewScholarQA={handleResetScholarQA}
            onResetSearch={handleResetSearch}
            currentView={isHomeFlow ? "workspace-home" : viewMode}
            guestAccount={isHomeFlow ? { signedIn: homeSignedIn, onLogin: () => setHomeLoginRequest(value => value + 1) } : undefined}
            isInstitutionAdmin={isInstitutionAdmin}
          />
        )}

        {/* Main Content */}
        <div className={isReaderView ? "flex-1 flex flex-col min-w-0 overflow-hidden" : "flex-1 flex flex-col min-w-0"}>
          {viewMode === "home" ? (
            <HomePage
              onNavigateToWorkspace={() => setViewMode("explore")}
              onNavigate={(view) => setViewMode(view as any)}
              onOpenPricing={() => openPricing()}
              onOpenRecharge={() => setShowRechargeModal(true)}
              onStartSearch={handleStartSearchFromHome}
            />
          ) : isHomeFlow ? (
            <WorkspaceHome
              stage={viewMode === "home-agent-case" ? "case" : viewMode === "home-search-preview" ? "search" : viewMode === "home-agent-preview" ? "agent" : "home"}
              loginRequest={homeLoginRequest}
              onAccountChange={setHomeSignedIn}
              papers={mockPapers}
              onSearch={handleStartSearchFromHome}
              onSearchExample={item => {
                setAskSearchSessionId(crypto.randomUUID());
                setSelectedPaper(null);
                setFilters(defaultFilters);
                setSearchQuery(item.prompt);
                setShortcutResults(item.papers);
                setHasSearched(true);
                setViewMode('list');
              }}
              onAgent={(query, skill, requiresLogin = false) => {
                setHomeAgentLaunch({ prompt: query, skill, requiresLogin });
                setInitialAgentPrompt(query);
                setAgentKey((value) => value + 1);
                setViewMode("academic-agent");
              }}
              onNavigate={handleWorkspaceNavigate}
            />
          ) : viewMode === "explore" ? (
            <ExplorePage
              embedded
              onboardingSearchActive={onboarding.active && onboarding.page === "home" && onboarding.flow.step === 0}
              onSearch={handleStartSearchFromHome}
              onAsk={(query) => {
                setInitialAskQuestion(query);
                setScholarQAKey((value) => value + 1);
                setViewMode("scholar-qa");
              }}
              onAgent={(query) => {
                setInitialAgentPrompt(query);
                setAgentKey((value) => value + 1);
                setViewMode("academic-agent");
              }}
              onLibrary={() => setViewMode("library")}
              onProjects={() => setViewMode("research-projects")}
              userCredits={mockUserCredits}
              onUserCreditsChange={setMockUserCredits}
            >
              <AllFeedsWorkspace
                showSearchHero={false}
                researchInterests={onboarding.state.interests}
                onResearchInterestsChange={onboarding.updateInterests}
                onSearch={(query) => {
                  setViewMode("list");
                  handleSearch(query);
                }}
                onQuickOpen={handleQuickOpen}
              />
            </ExplorePage>
          ) : viewMode === "fudan-collection-search" ? (
            !hasSearched ? (
              <ScholarSearchHome
                onSearch={handleSearch}
                onQuickOpen={handleQuickOpen}
                showDeepSearchTooltip={showDeepSearchTooltip}
                onTooltipDismiss={() => setShowDeepSearchTooltip(false)}
              />
            ) : (
              <FudanCollectionResults
                papers={filteredPapers}
                searchQuery={searchQuery}
                onSearchChange={(query) => {
                  setSearchQuery(query);
                  setHasSearched(Boolean(query.trim()));
                }}
              />
            )
          ) : viewMode === "list" ? (
            !hasSearched ? (
              // Show Scholar Search Home when no search has been performed
              <ScholarSearchHome 
                onSearch={handleSearch}
                onQuickOpen={handleQuickOpen}
                showDeepSearchTooltip={showDeepSearchTooltip}
                onTooltipDismiss={() => setShowDeepSearchTooltip(false)}
              />
            ) : (
              // Show search results
              <>
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={handleSearchChange}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>

                {shortcutResults?.some(paper => paper.isSearchExample) && <div className="wsp-case-results-note">深度搜索案例 · 论文列表与相关度为示例展示，可修改问题开始自己的搜索。</div>}
                {!shortcutResults && <SearchThinkingPanel query={searchQuery} />}

                <div className="flex-1 overflow-hidden">
                  <SearchResults
                    papers={filteredPapers}
                    books={mockBooks}
                    theses={mockTheses}
                    selectedPaper={selectedPaper}
                    onSelectPaper={handleSelectPaper}
                    searchQuery={searchQuery}
                  />
                </div>
              </>
            )
          ) : viewMode === "library" ? (
            <MyLibrary
              papers={mockPapers}
              onPaperClick={paper => { setSelectedPaper(paper); setViewMode('detail'); }}
              onOpenReader={(file) => {
                setReaderInitialFile(file ?? null);
                setViewMode("reader");
              }}
            />
          ) : viewMode === "reader" ? (
            <PaperDetail
              paper={null}
              initialLocalFile={readerInitialFile}
              onBack={() => setViewMode("explore")}
              onOpenFigureToPPTX={() => {
                setFigureToPPTXFromReader(true);
                setViewMode('figure-to-pptx');
              }}
            />
          ) : viewMode === "scholar-qa" ? (
            <ScholarQA
              key={scholarQAKey}
              initialQuestion={initialAskQuestion}
              papersCount={mockPapers.length}
              onReset={handleResetScholarQA}
              onOpenDeepSearch={(query) => {
                setViewMode("list");
                handleSearch(query);
              }}
              onStartAgent={(query) => {
                setInitialAgentPrompt(query);
                setAgentKey((value) => value + 1);
                setViewMode("academic-agent");
              }}
              userCredits={mockUserCredits}
              onUpgrade={() => openPricing()}
            />
          ) : viewMode === "all-feeds" ? (
            <AllFeedsWorkspace
              onSearch={(query) => {
                setViewMode("list");
                handleSearch(query);
              }}
              onQuickOpen={handleQuickOpen}
            />
          ) : viewMode === "quick-paper" ? (
            selectedPaper ? <QuickPaperPage
              key={selectedPaper.id}
              paper={selectedPaper}
              onBack={handleBackToList}
              onWorkspace={() => setViewMode('explore')}
              onOpenReader={openSelectedReader}
            /> : <div className="m-auto p-12 text-center"><h1 className="text-xl font-semibold">请先选择一篇论文</h1><button className="mt-5 text-blue-600" onClick={handleBackToList}>返回搜索</button></div>
          ) : viewMode === "paper-reproduction" ? (
            <PaperReproduction />
          ) : viewMode === "idea-discovery" ? (
            <IdeaDiscovery />
          ) : viewMode === "academic-agent" ? (
            isGuestAgent ? <BrowserResearch key={`guest-${agentKey}`} initialTask={initialAgentPrompt} initialSkill={homeAgentLaunch?.skill} guestLogin={{ onComplete: finishGuestLogin, onEdit: () => setViewMode("workspace-home") }} onBack={() => setViewMode("workspace-home")} onNavigate={handleWorkspaceNavigate}/> : <AcademicAgent
              key={agentKey}
              initialPrompt={initialAgentPrompt}
              initialSkill={homeAgentLaunch?.prompt === initialAgentPrompt ? homeAgentLaunch.skill : undefined}
              userCredits={mockUserCredits}
              onRecharge={() => setShowRechargeModal(true)}
              onUpgrade={() => openPricing()}
              onOpenProjects={() => setViewMode("research-projects")}
              onTaskActiveChange={setAgentTaskActive}
              onNavigate={handleWorkspaceNavigate}
            />
          ) : viewMode === "research-projects" ? (
            <ResearchProjects onOpenAgent={() => setViewMode("academic-agent")} />
          ) : viewMode === "research-canvas" ? (
            <ResearchCanvas onOpenAgent={() => setViewMode("academic-agent")} />
          ) : viewMode === "truecite" ? (
            <div className="flex min-h-screen flex-1 items-center justify-center bg-[#f7f9fc] p-8">
              <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">✓</div>
                <h1 className="mt-5 text-2xl font-bold text-slate-950">TrueCite</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">验证引用是否真正支持论文中的关键陈述，快速发现引用错配与证据缺口。</p>
                <button className="mt-6 rounded-xl bg-[#1b87ff] px-5 py-2.5 text-sm font-semibold text-white">新建引用验证</button>
              </div>
            </div>
          ) : viewMode === "tools" ? (
            <ToolsPage
              onOpenTrueCite={() => setViewMode('truecite')}
              onOpenFigureToPPTX={() => { setFigureToPPTXFromReader(false); setViewMode('figure-to-pptx'); }}
              onOpenFigureToExcel={() => { setFigureToPPTXFromReader(false); setViewMode('figure-to-excel'); }}
              onOpenExcelToFigure={() => setViewMode('excel-to-figure')}
            />
          ) : viewMode === "figure-to-pptx" ? (
            <FigureToPPTX
              fromReader={figureToPPTXFromReader}
              onBackToTools={() => { setFigureToPPTXFromReader(false); setViewMode('tools'); }}
              onBackToReader={() => { setFigureToPPTXFromReader(false); setViewMode('reader'); }}
            />
          ) : viewMode === "figure-to-excel" ? (
            <FigureToPPTX
              output="excel"
              onBackToTools={() => setViewMode('tools')}
            />
          ) : viewMode === "excel-to-figure" ? (
            <ExcelToFigure onBackToTools={() => setViewMode('tools')} />
          ) : viewMode === "institution-admin" ? (
            isInstitutionAdmin ? <InstitutionManagement /> : (
              <main className="flex min-h-screen flex-1 items-center justify-center bg-gray-50 p-8">
                <div role="alert" className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <h1 className="text-xl font-semibold text-gray-950">无权限访问机构管理</h1>
                  <p className="mt-3 text-sm text-gray-500">此功能仅对机构管理员开放。当前为普通用户 Mock 角色。</p>
                  <button onClick={() => setViewMode('explore')} className="mt-6 rounded-lg bg-gray-950 px-4 py-2 text-sm text-white">返回首页</button>
                </div>
              </main>
            )
          ) : (
            <PaperDetail
              paper={selectedPaper}
              initialLocalFile={null}
              onBack={() => setViewMode(selectedPaper ? 'quick-paper' : 'list')}
              backLabel={selectedPaper ? '返回快速结果页' : '返回搜索结果'}
              onOpenFigureToPPTX={() => { setFigureToPPTXFromReader(true); setViewMode('figure-to-pptx'); }}
            />
          )}
        </div>

        {/* Right Panel - Only show in list view with search results */}
        {viewMode === "list" && (
          <SearchAskAI selectedPaper={selectedPaper} />
        )}

        {/* Search More Button - Show only in list view with search results */}
        {viewMode === "list" && hasSearched && !shortcutResults && filteredPapers.length > 0 && (
          <SearchMoreButton onSearchMore={handleSearchMore} isLoading={isLoadingMore} />
        )}

        {/* Invite Modal */}
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />

        {/* Paywall Modal */}
        <PaywallModal
          isOpen={showPaywallModal}
          upgradeOnly={pricingSource === 'account-upgrade'}
          onClose={() => setShowPaywallModal(false)}
        />

        {/* Recharge Modal */}
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
        />

        {/* Notification Drawer */}
        <NotificationDrawer
          isOpen={showNotificationDrawer}
          onClose={() => setShowNotificationDrawer(false)}
        />

        {!isGuestAgent && <OnboardingExperience key={viewMode === 'quick-paper' ? selectedPaper?.id : viewMode} controller={onboarding} onOpenReader={openSelectedReader} />}

        {!isHomeFlow && !(viewMode === "academic-agent" && (agentTaskActive || isGuestAgent)) && <MockConsole
          onboarding={onboarding}
          onNavigateOnboarding={(page) => {
            if (page === 'reader') {
              if (!selectedPaper?.isOpenAccess) setSelectedPaper(mockPapers.find(paper => paper.isOpenAccess === true) || null);
              setViewMode('quick-paper');
            } else setViewMode(page === 'home' ? 'explore' : 'academic-agent');
          }}
          onOpenBilling={() => openPricing()}
          currentView={viewMode}
          userCredits={mockUserCredits}
          onUserCreditsChange={setMockUserCredits}
          onAsk={(input) => {
            setInitialAskQuestion(input);
            setScholarQAKey((value) => value + 1);
            setViewMode('scholar-qa');
          }}
          onSearch={(input) => handleStartSearchFromHome(input)}
          onAgent={(input) => {
            setInitialAgentPrompt(input);
            setAgentKey((value) => value + 1);
            setViewMode('academic-agent');
          }}
        />}
        {/* Feedback dialog (BBS-style issue list / form / thread), driven by FeedbackTicketsContext */}
        <FeedbackModal />
      </div>
      </AskAIProvider>
      </FeedbackTicketsProvider>
      </BillingProvider>
    </LanguageProvider>
  );
}
