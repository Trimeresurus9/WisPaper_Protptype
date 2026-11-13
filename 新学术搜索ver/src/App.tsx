import React, { useState, useMemo } from "react";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { SearchThinkingPanel } from "./components/SearchThinkingPanel";
import { SearchContextSidebar } from "./components/SearchContextSidebar";
import { SurveyPage } from "./components/SurveyPage";
import { LeftSidebar } from "./components/LeftSidebar";
import { PaperDetail } from "./components/PaperDetail";
import { MyLibrary } from "./components/MyLibrary";
import { ScholarSearchHome, extractAcademicIdentifiers, type AcademicIdentifier } from "./components/ScholarSearchHome";
import { ExplorePage } from "./components/ExplorePage";
import { WorkspaceHome } from "./components/WorkspaceHome";
import { readHomeSession } from "./components/home-task-config";
import { AskAIProvider } from "./components/ask-ai/AskAI";
import { useOnboarding } from "./components/onboarding/useOnboarding";
import { BillingProvider } from "./contexts/BillingContext";
import { FeedbackTicketsProvider } from "./contexts/FeedbackTicketsContext";
import { setPrototypeAuthenticated } from "./lib/usePrototypeAuth";
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
import { GlobalAskAIDrawer } from "./components/GlobalAskAIDrawer";
import { QuickPaperPage } from "./components/QuickPaperPage";
import { SearchMoreButton } from "./components/SearchMoreButton";
import { InviteModal } from "./components/InviteModal";
import { PaywallModal } from "./components/PaywallModal";
import { RechargeModal } from "./components/RechargeModal";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { FeedbackModal } from "./components/FeedbackModal";
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
  explore: '/app/explore',
  list: '/app/search',
  'scholar-qa': '/app/ask',
  'academic-agent': '/',
  library: '/app/library',
  'research-projects': '/app/projects',
  'research-canvas': '/app/research-canvas',
  'all-feeds': '/app/explore',
  'paper-reproduction': '/app/paper-reproduction',
  'idea-discovery': '/app/idea-discovery',
  'fudan-collection-search': '/app/fudan-collection',
  reader: '/app/reader',
  detail: '/app/paper',
  'quick-paper': '/app/quick-paper',
  truecite: '/app/truecite',
  tools: '/app/tools',
  survey: '/app/survey',
  'figure-to-pptx': '/app/tools/figure-to-pptx',
  'figure-to-excel': '/app/tools/figure-to-excel',
  'excel-to-figure': '/app/tools/excel-to-figure',
  'institution-admin': '/app/institution-admin',
};

const getViewFromPath = (pathname: string) => {
  if (pathname === '/') return 'academic-agent';
  if (pathname === '/app/home') return 'workspace-home';
  if (pathname === '/app/agent' || /^\/app\/agent\/[0-9a-f-]+\/?$/i.test(pathname)) return 'academic-agent';
  if (pathname === '/landing') return 'home';
  if (pathname === '/app/explore' || pathname === '/app/ai-feeds') return 'explore';
  if (pathname === '/app/search' || pathname.startsWith('/app/search/') || pathname === '/scholar-search' || pathname === '/app/scholar-search') return 'list';
  const match = Object.entries(viewRoutes).find(([, route]) => pathname === route || (route === '/app/paper' && pathname.startsWith('/app/paper/')) || (route === '/app/projects' && pathname.startsWith('/app/projects/')));
  return match?.[0] ?? 'home';
};

const getSearchSessionId = (pathname: string) => {
  const match = pathname.match(/^\/app\/search\/([0-9a-f-]+)\/?$/i);
  return match?.[1] ?? null;
};

const createSearchSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const getStoredSearchQuery = (sessionId: string | null) => {
  if (!sessionId || typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(`wispaper-search:${sessionId}`) ?? '大语言模型长上下文的位置偏差';
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
  const initialSearchSessionId = typeof window !== 'undefined' ? getSearchSessionId(window.location.pathname) : null;
  const [searchSessionId, setSearchSessionId] = useState<string | null>(initialSearchSessionId);
  const [searchQuery, setSearchQuery] = useState(() => getStoredSearchQuery(initialSearchSessionId));
  const [hasSearched, setHasSearched] = useState(Boolean(initialSearchSessionId));
  const [searchMode, setSearchMode] = useState<'quick' | 'deep'>('quick');
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [selectedPaper, setSelectedPaper] =
    useState<Paper | null>(null);
  const initialView = typeof window !== 'undefined' ? getViewFromPath(window.location.pathname) : 'academic-agent';
  const embeddedAgent = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embedded') === '1';
  const [viewMode, setViewMode] = useState<
    "home" | "workspace-home" | "home-search-preview" | "home-agent-preview" | "home-agent-case" | "explore" | "list" | "quick-paper" | "detail" | "reader" | "library" | "scholar-qa" | "all-feeds" | "paper-reproduction" | "idea-discovery" | "fudan-collection-search" | "academic-agent" | "research-projects" | "research-canvas" | "truecite" | "tools" | "figure-to-pptx" | "survey" | "figure-to-excel" | "excel-to-figure" | "institution-admin"
  >(initialView as any);
  const historyNavigationRef = React.useRef(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showDeepSearchTooltip, setShowDeepSearchTooltip] = useState(false);
  const [scholarQAKey, setScholarQAKey] = useState(0);
  const [agentKey, setAgentKey] = useState(0);
  const [homeLoginRequest, setHomeLoginRequest] = useState(0);
  const [homeSignedIn, setHomeSignedIn] = useState(() => readHomeSession().signedIn);
  const [agentTaskActive] = useState(false);
  const isHomeFlow = ['workspace-home', 'home-search-preview', 'home-agent-preview', 'home-agent-case'].includes(viewMode);
  const onboarding = useOnboarding(viewMode, agentTaskActive, selectedPaper?.isOpenAccess === true);
  const [initialAskQuestion, setInitialAskQuestion] = useState('');
  const [initialAgentPrompt, setInitialAgentPrompt] = useState('');
  const [mockUserCredits, setMockUserCredits] = useState(50000);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [mockRole] = useState<'org_admin' | 'user'>(() => new URLSearchParams(window.location.search).get('mockRole') === 'user' ? 'user' : 'org_admin');
  const [readerInitialFile, setReaderInitialFile] = useState<File | null>(null);
  const [figureToPPTXFromReader, setFigureToPPTXFromReader] = useState(false);
  const [shortcutResults, setShortcutResults] = useState<Paper[] | null>(null);
  const [surveyQuery, setSurveyQuery] = useState(() => getStoredSearchQuery(initialSearchSessionId) || 'Group Relative Policy Optimization GRPO');

  React.useEffect(() => {
    if (window.location.pathname === '/app/ai-feeds') {
      window.history.replaceState({ view: 'explore' }, '', '/app/explore');
    } else if (window.location.pathname === '/app/agent') {
      window.history.replaceState({ view: 'academic-agent' }, '', '/');
    } else if (window.location.pathname === '/scholar-search' || window.location.pathname === '/app/scholar-search') {
      window.history.replaceState({ view: 'list' }, '', '/app/search');
    }

    const handlePopState = () => {
      const nextView = getViewFromPath(window.location.pathname);
      const nextSearchSessionId = getSearchSessionId(window.location.pathname);
      historyNavigationRef.current = true;
      setViewMode(nextView as any);
      if (nextView === 'academic-agent') { setInitialAgentPrompt(''); setAgentKey((value) => value + 1); }
      setSearchSessionId(nextSearchSessionId);
      setHasSearched(nextView === 'list' && Boolean(nextSearchSessionId));
      if (nextSearchSessionId) {
        setSearchQuery(getStoredSearchQuery(nextSearchSessionId));
      } else if (nextView === 'list') {
        setSearchQuery('');
        setShortcutResults(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    if (historyNavigationRef.current) {
      historyNavigationRef.current = false;
      return;
    }

    const nextPath = viewMode === 'academic-agent' && /^\/app\/agent\/[0-9a-f-]+\/?$/i.test(window.location.pathname)
      ? window.location.pathname
      : viewMode === 'list' && hasSearched && searchSessionId
      ? `/app/search/${searchSessionId}`
      : viewRoutes[viewMode] ?? '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: viewMode }, '', nextPath);
    }
  }, [viewMode, hasSearched, searchSessionId]);

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
    setViewMode("detail");
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
    setViewMode(view as any);
  };

  const handleSearch = (query: string, mode: 'quick' | 'deep' = 'quick') => {
    const sessionId = createSearchSessionId();
    const identifiers = extractAcademicIdentifiers(query);
    setShortcutResults(identifiers.length > 0 ? identifiers.map(resolveShortcutPaper) : null);
    setSearchQuery(query);
    setSearchMode(mode);
    setSearchSessionId(sessionId);
    window.sessionStorage.setItem(`wispaper-search:${sessionId}`, query);
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
      setSearchSessionId(null);
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
    setSearchSessionId(null);
    setFilters(defaultFilters);
    setShortcutResults(null);
  };

  const handleStartSearchFromHome = (query?: string) => {
    setSelectedPaper(null);
    setFilters(defaultFilters);
    setShortcutResults(null);
    setViewMode("list");

    if (query?.trim()) {
      handleSearch(query.trim());
      return;
    }

    setSearchQuery('');
    setHasSearched(false);
    setSearchSessionId(null);
  };

  const isReaderView = isHomeFlow || viewMode === "explore" || viewMode === "list" || viewMode === "detail" || viewMode === "reader" || viewMode === "academic-agent" || viewMode === "research-projects" || viewMode === "research-canvas" || viewMode === "survey";

  return (
    <LanguageProvider>
      <BillingProvider>
      <FeedbackTicketsProvider>
      <div className={`${isReaderView ? "h-screen overflow-hidden bg-white flex" : "min-h-screen bg-white flex"} ${!embeddedAgent ? "pr-[360px]" : ""}`}>
        {/* Left Sidebar - Only show in list view, library view, and scholar-qa view */}
        {!embeddedAgent && (isHomeFlow || viewMode === "explore" || viewMode === "list" || viewMode === "reader" || viewMode === "library" || viewMode === "scholar-qa" || viewMode === "all-feeds" || viewMode === "paper-reproduction" || viewMode === "idea-discovery" || viewMode === "fudan-collection-search" || viewMode === "academic-agent" || viewMode === "research-projects" || viewMode === "research-canvas" || viewMode === "truecite" || viewMode === "tools" || viewMode === "figure-to-pptx" || viewMode === "figure-to-excel" || viewMode === "excel-to-figure" || viewMode === "institution-admin" || viewMode === "survey") && (
          <LeftSidebar
            onNavigate={handleWorkspaceNavigate}
            onOpenInvite={() => setShowInviteModal(true)}
            onOpenPaywall={() => setShowPaywallModal(true)}
            onOpenRecharge={() => setShowRechargeModal(true)}
            onOpenNotifications={() => setShowNotificationDrawer(true)}
            onNewScholarQA={handleResetScholarQA}
            onResetSearch={handleResetSearch}
            currentView={viewMode}
          />
        )}

        {/* Main Content */}
        <div className={isReaderView ? "flex-1 flex flex-col min-w-0 overflow-hidden" : "flex-1 flex flex-col min-w-0"}>
          {viewMode === "home" ? (
            <HomePage
              onNavigateToWorkspace={() => setViewMode("explore")}
              onNavigate={(view) => setViewMode(view as any)}
              onOpenPricing={() => setShowPaywallModal(true)}
              onOpenRecharge={() => setShowRechargeModal(true)}
              onStartSearch={handleStartSearchFromHome}
            />
          ) : isHomeFlow ? (
            <AskAIProvider view={viewMode} agentTaskActive={agentTaskActive} search={{ id: searchSessionId ?? 'home', query: searchQuery, mode: '学术搜索', count: hasSearched ? filteredPapers.length : 0 }} onboarding={onboarding} overlayRightOffset={embeddedAgent ? 0 : 360}
              onResume={() => {}} onSearch={handleStartSearchFromHome} onAgent={(query) => { setInitialAgentPrompt(query); setAgentKey((value) => value + 1); setViewMode('academic-agent'); }}>
              <WorkspaceHome
                stage={viewMode === 'home-agent-case' ? 'case' : viewMode === 'home-search-preview' ? 'search' : viewMode === 'home-agent-preview' ? 'agent' : 'home'}
                loginRequest={homeLoginRequest}
                onAccountChange={(signedIn) => { setHomeSignedIn(signedIn); if (signedIn) setPrototypeAuthenticated(true); }}
                papers={mockPapers}
                onSearch={handleStartSearchFromHome}
                onSearchExample={(item) => { handleSearch(item.prompt, 'deep'); setShortcutResults(item.papers); setViewMode('list'); }}
                onAgent={(query) => { setInitialAgentPrompt(query); setAgentKey((value) => value + 1); setViewMode('academic-agent'); }}
                onNavigate={handleWorkspaceNavigate}
              />
            </AskAIProvider>
          ) : viewMode === "explore" ? (
            <ExplorePage
              embedded
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
                <div className="flex-1 overflow-hidden bg-slate-50/60 px-6 py-4">
                  <div className="mx-auto flex h-full w-full max-w-[1360px] gap-4">
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 px-6 py-4">
                        <SearchBar
                          value={searchQuery}
                          onChange={handleSearchChange}
                          filters={filters}
                          onFiltersChange={setFilters}
                        />
                      </div>
                      {!shortcutResults && <SearchThinkingPanel query={searchQuery} />}
                      <div className="min-h-0 flex-1 overflow-hidden">
                        <SearchResults
                          papers={filteredPapers}
                          books={mockBooks}
                          theses={mockTheses}
                          selectedPaper={selectedPaper}
                          onSelectPaper={handleSelectPaper}
                          searchQuery={searchQuery}
                        />
                      </div>
                    </div>
                    <SearchContextSidebar
                      key={searchSessionId ?? 'search-draft'}
                      query={searchQuery}
                      resultCount={filteredPapers.length}
                      sessionId={searchSessionId ?? 'search-draft'}
                      mode={searchMode}
                      onStartDeepSearch={() => setSearchMode('deep')}
                      onOpenAgent={(prompt) => {
                        setInitialAgentPrompt(prompt);
                        setAgentKey((value) => value + 1);
                        setViewMode('academic-agent');
                      }}
                      onOpenSurvey={() => {
                        setSurveyQuery(searchQuery);
                        setViewMode('survey');
                      }}
                    />
                  </div>
                </div>
              </>
            )
          ) : viewMode === "library" ? (
            <MyLibrary
              papers={mockPapers}
              onPaperClick={handleSelectPaper}
              onOpenReader={(file) => {
                setReaderInitialFile(file ?? null);
                setViewMode("reader");
              }}
            />
          ) : viewMode === "survey" ? (
            <SurveyPage
              query={surveyQuery}
              onBack={() => setViewMode('list')}
              onOpenAgent={(prompt) => {
                setInitialAgentPrompt(prompt);
                setAgentKey((value) => value + 1);
                setViewMode('academic-agent');
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
              onUpgrade={() => setShowPaywallModal(true)}
            />
          ) : viewMode === "all-feeds" ? (
            <AllFeedsWorkspace
              onSearch={(query) => {
                setViewMode("list");
                handleSearch(query);
              }}
              onQuickOpen={handleQuickOpen}
            />
          ) : viewMode === "quick-paper" && selectedPaper ? (
            <QuickPaperPage
              paper={selectedPaper}
              onBack={() => setViewMode("explore")}
              onWorkspace={() => setViewMode('academic-agent')}
              onOpenReader={() => setViewMode("detail")}
            />
          ) : viewMode === "paper-reproduction" ? (
            <PaperReproduction />
          ) : viewMode === "idea-discovery" ? (
            <IdeaDiscovery />
          ) : viewMode === "academic-agent" ? (
            <AcademicAgent key={agentKey} initialPrompt={initialAgentPrompt} onLogin={() => setShowPaywallModal(true)} onOpenSearch={(query) => {
              setViewMode("list");
              handleSearch(query);
            }} onOpenProjects={() => {
              if (embeddedAgent && window.parent !== window) {
                window.parent.postMessage({ type: 'wispaper:close-agent-dialog', destination: 'research-canvas' }, window.location.origin);
                return;
              }
              setViewMode("research-projects");
            }} />
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
            <ToolsPage onOpenTrueCite={() => setViewMode('truecite')} onOpenFigureToPPTX={() => { setFigureToPPTXFromReader(false); setViewMode('figure-to-pptx'); }} onOpenFigureToExcel={() => setViewMode('figure-to-excel')} onOpenExcelToFigure={() => setViewMode('excel-to-figure')} />
          ) : viewMode === "figure-to-pptx" ? (
            <FigureToPPTX
              fromReader={figureToPPTXFromReader}
              onBackToTools={() => { setFigureToPPTXFromReader(false); setViewMode('tools'); }}
              onBackToReader={() => { setFigureToPPTXFromReader(false); setViewMode('reader'); }}
            />
          ) : viewMode === "figure-to-excel" ? (
            <FigureToPPTX output="excel" onBackToTools={() => setViewMode('tools')} />
          ) : viewMode === "excel-to-figure" ? (
            <ExcelToFigure onBackToTools={() => setViewMode('tools')} />
          ) : viewMode === "institution-admin" ? (
            mockRole === 'org_admin' ? <InstitutionManagement /> : <main className="m-auto p-8 text-center">当前账号无机构管理权限</main>
          ) : (
            <PaperDetail
              paper={selectedPaper}
              initialLocalFile={null}
              onBack={handleBackToList}
              onOpenFigureToPPTX={() => { setFigureToPPTXFromReader(true); setViewMode('figure-to-pptx'); }}
            />
          )}
        </div>

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
        <FeedbackModal />

        {!embeddedAgent && !isHomeFlow && !['explore', 'library', 'academic-agent', 'research-projects'].includes(viewMode) && !(viewMode === 'list' && hasSearched) && (
          <GlobalAskAIDrawer key={viewMode} page={viewMode} />
        )}

        {!embeddedAgent && <MockConsole
          currentView={viewMode}
          onOpenBilling={() => setShowPaywallModal(true)}
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
      </div>
      </FeedbackTicketsProvider>
      </BillingProvider>
    </LanguageProvider>
  );
}
