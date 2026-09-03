import React, { useState, useMemo } from "react";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { SearchThinkingPanel } from "./components/SearchThinkingPanel";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightPanel } from "./components/RightPanel";
import { PaperDetail } from "./components/PaperDetail";
import { MyLibrary } from "./components/MyLibrary";
import { ScholarSearchHome, extractAcademicIdentifiers, type AcademicIdentifier } from "./components/ScholarSearchHome";
import { ExplorePage } from "./components/ExplorePage";
import { HomePage } from "./components/HomePage";
import { ScholarQA } from "./components/ScholarQA";
import { PaperReproduction } from "./components/PaperReproduction";
import { IdeaDiscovery } from "./components/IdeaDiscovery";
import { AllFeedsWorkspace } from "./components/AllFeedsWorkspace";
import { FudanCollectionResults } from "./components/FudanCollectionResults";
import { AcademicAgent } from "./components/AcademicAgent";
import { ResearchProjects } from "./components/ResearchProjects";
import { ResearchCanvas } from "./components/ResearchCanvas";
import { FigureToPPTX } from "./components/FigureToPPTX";
import { ToolsPage } from "./components/ToolsPage";
import { MockConsole } from "./components/MockConsole";
import { QuickPaperPage } from "./components/QuickPaperPage";
import { SearchMoreButton } from "./components/SearchMoreButton";
import { InviteModal } from "./components/InviteModal";
import { PaywallModal } from "./components/PaywallModal";
import { RechargeModal } from "./components/RechargeModal";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { LanguageProvider } from "./contexts/LanguageContext";
import { mockPapers } from "./data/mockPapers";
import { mockBooks } from "./data/mockBooks";
import { mockTheses } from "./data/mockTheses";
import { Paper, FilterOptions } from "./types";

const viewRoutes: Record<string, string> = {
  home: '/landing',
  explore: '/',
  list: '/app/scholar-search',
  'scholar-qa': '/app/ask',
  'academic-agent': '/app/agent',
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
  'figure-to-pptx': '/app/tools/figure-to-pptx',
};

const getViewFromPath = (pathname: string) => {
  if (pathname === '/') return 'explore';
  if (pathname === '/landing') return 'home';
  if (pathname === '/app/search' || pathname === '/app/explore' || pathname === '/app/ai-feeds') return 'explore';
  if (pathname === '/scholar-search' || pathname === '/app/scholar-search') return 'list';
  const match = Object.entries(viewRoutes).find(([, route]) => pathname === route || (route === '/app/paper' && pathname.startsWith('/app/paper/')) || (route === '/app/projects' && pathname.startsWith('/app/projects/')));
  return match?.[0] ?? 'home';
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
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [selectedPaper, setSelectedPaper] =
    useState<Paper | null>(null);
  const initialView = typeof window !== 'undefined' ? getViewFromPath(window.location.pathname) : 'home';
  const [viewMode, setViewMode] = useState<
    "home" | "explore" | "list" | "quick-paper" | "detail" | "reader" | "library" | "scholar-qa" | "all-feeds" | "paper-reproduction" | "idea-discovery" | "fudan-collection-search" | "academic-agent" | "research-projects" | "research-canvas" | "truecite" | "tools" | "figure-to-pptx"
  >(initialView as any);
  const historyNavigationRef = React.useRef(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showDeepSearchTooltip, setShowDeepSearchTooltip] = useState(false);
  const [scholarQAKey, setScholarQAKey] = useState(0);
  const [agentKey, setAgentKey] = useState(0);
  const [initialAskQuestion, setInitialAskQuestion] = useState('');
  const [initialAgentPrompt, setInitialAgentPrompt] = useState('');
  const [mockUserCredits, setMockUserCredits] = useState(50000);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [readerInitialFile, setReaderInitialFile] = useState<File | null>(null);
  const [figureToPPTXFromReader, setFigureToPPTXFromReader] = useState(false);
  const [shortcutResults, setShortcutResults] = useState<Paper[] | null>(null);

  React.useEffect(() => {
    if (window.location.pathname === '/app/search' || window.location.pathname === '/app/ai-feeds' || window.location.pathname === '/app/explore') {
      window.history.replaceState({ view: 'explore' }, '', '/');
    }

    const handlePopState = () => {
      historyNavigationRef.current = true;
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

    const nextPath = viewRoutes[viewMode] ?? '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ view: viewMode }, '', nextPath);
    }
  }, [viewMode]);

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

  const handleSearch = (query: string) => {
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

  const isReaderView = viewMode === "explore" || viewMode === "detail" || viewMode === "reader" || viewMode === "academic-agent" || viewMode === "research-projects" || viewMode === "research-canvas";

  return (
    <LanguageProvider>
      <div className={isReaderView ? "h-screen overflow-hidden bg-white flex" : "min-h-screen bg-white flex"}>
        {/* Left Sidebar - Only show in list view, library view, and scholar-qa view */}
        {(viewMode === "explore" || viewMode === "list" || viewMode === "reader" || viewMode === "library" || viewMode === "scholar-qa" || viewMode === "all-feeds" || viewMode === "paper-reproduction" || viewMode === "idea-discovery" || viewMode === "fudan-collection-search" || viewMode === "academic-agent" || viewMode === "research-projects" || viewMode === "research-canvas" || viewMode === "truecite" || viewMode === "tools" || viewMode === "figure-to-pptx") && (
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
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={handleSearchChange}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>

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
              onPaperClick={handleSelectPaper}
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
              onOpenReader={() => setViewMode("detail")}
            />
          ) : viewMode === "paper-reproduction" ? (
            <PaperReproduction />
          ) : viewMode === "idea-discovery" ? (
            <IdeaDiscovery />
          ) : viewMode === "academic-agent" ? (
            <AcademicAgent key={agentKey} initialPrompt={initialAgentPrompt} onOpenProjects={() => setViewMode("research-projects")} />
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
            <ToolsPage onOpenTrueCite={() => setViewMode('truecite')} onOpenFigureToPPTX={() => { setFigureToPPTXFromReader(false); setViewMode('figure-to-pptx'); }} />
          ) : viewMode === "figure-to-pptx" ? (
            <FigureToPPTX
              fromReader={figureToPPTXFromReader}
              onBackToTools={() => { setFigureToPPTXFromReader(false); setViewMode('tools'); }}
              onBackToReader={() => { setFigureToPPTXFromReader(false); setViewMode('reader'); }}
            />
          ) : (
            <PaperDetail
              paper={selectedPaper}
              initialLocalFile={null}
              onBack={handleBackToList}
              onOpenFigureToPPTX={() => { setFigureToPPTXFromReader(true); setViewMode('figure-to-pptx'); }}
            />
          )}
        </div>

        {/* Right Panel - Only show in list view with search results */}
        {viewMode === "list" && hasSearched && !shortcutResults && (
          <RightPanel selectedPaper={selectedPaper} />
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

        <MockConsole
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
        />
      </div>
    </LanguageProvider>
  );
}
