import React, { useEffect, useState } from 'react';
import { Search, ArrowRight, ChevronRight, ChevronLeft, BookOpen, GraduationCap, Infinity, LockKeyhole, ChevronDown, Bot, Lightbulb, Presentation, Bookmark, ThumbsUp, ThumbsDown, SlidersHorizontal, Zap, CircleHelp, RefreshCw, Atom, Leaf, HeartPulse, Brain, ChartNoAxesCombined } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrototypeAuth } from '../lib/usePrototypeAuth';

interface ScholarSearchHomeProps {
  onSearch: (query: string, mode?: 'quick' | 'deep') => void;
  onQuickOpen: (identifier: AcademicIdentifier) => void;
  showDeepSearchTooltip?: boolean;
  onTooltipDismiss?: () => void;
  onOpenFigureToPPTX?: () => void;
}

export interface AcademicIdentifier {
  kind: 'DOI' | 'arXiv';
  value: string;
}

const normalizeDoi = (value: string) => value.replace(/[\s,，。；;]+$/g, '');
const normalizeArxiv = (value: string) => value.replace(/\.pdf$/i, '');

export const extractAcademicIdentifiers = (input: string): AcademicIdentifier[] => {
  const raw = input.trim();
  if (!raw) return [];

  const found: AcademicIdentifier[] = [];
  const seen = new Set<string>();
  const add = (identifier: AcademicIdentifier) => {
    const key = `${identifier.kind}:${identifier.value.toLowerCase()}`;
    if (!seen.has(key) && found.length < 10) {
      seen.add(key);
      found.push(identifier);
    }
  };

  const doiPattern = /(?:https?:\/\/(?:dx\.)?doi\.org\/|doi\s*:\s*)?(10\.\d{4,9}\/[\-._;()/:a-z0-9]+)/gi;
  for (const match of raw.matchAll(doiPattern)) {
    add({ kind: 'DOI', value: normalizeDoi(match[1]) });
  }

  const arxivUrlPattern = /https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\/([a-z-]+(?:\.[a-z]{2})?\/\d{7}(?:v\d+)?|\d{4}\.\d{4,5}(?:v\d+)?)(?:\.pdf)?/gi;
  for (const match of raw.matchAll(arxivUrlPattern)) {
    add({ kind: 'arXiv', value: normalizeArxiv(match[1]) });
  }

  const prefixedArxivPattern = /arxiv\s*:\s*([a-z-]+(?:\.[a-z]{2})?\/\d{7}(?:v\d+)?|\d{4}\.\d{4,5}(?:v\d+)?)/gi;
  for (const match of raw.matchAll(prefixedArxivPattern)) {
    add({ kind: 'arXiv', value: match[1] });
  }

  const modernArxivPattern = /(?<![.\d])\d{4}\.\d{4,5}(?:v\d+)?(?!\d)/gi;
  for (const match of raw.matchAll(modernArxivPattern)) {
    add({ kind: 'arXiv', value: match[0] });
  }

  const legacyArxivPattern = /(?<![a-z0-9.-])[a-z-]+(?:\.[a-z]{2})?\/\d{7}(?:v\d+)?(?!\d)/gi;
  for (const match of raw.matchAll(legacyArxivPattern)) {
    add({ kind: 'arXiv', value: match[0] });
  }

  const identifierCharacters = found.reduce((total, item) => total + item.value.length, 0);
  if (raw.length > 280 && identifierCharacters / raw.length < 0.35) return [];

  return found;
};

export const detectAcademicIdentifier = (input: string): AcademicIdentifier | null =>
  extractAcademicIdentifiers(input)[0] ?? null;

type SearchExample = {
  category: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

const searchExampleSets: SearchExample[][] = [
  [
    { category: 'Computer Science', query: 'Find a paper using a distillation method to train models', icon: Atom, tone: 'from-[#071c77] to-[#3157d5]' },
    { category: 'Environmental Science', query: 'Find papers on why public and stakeholder support is required for ecological restoration and rewilding', icon: Leaf, tone: 'from-[#b8edc4] to-[#5ec882]' },
    { category: 'Medicine', query: 'Impacts of Catch-Up Growth in Children with Congenital Heart Disease', icon: HeartPulse, tone: 'from-[#ffd1df] to-[#f399b8]' },
    { category: 'Neuroscience', query: 'Self evaluation and sleep memory consolidation', icon: Brain, tone: 'from-[#eac9ff] to-[#9c8ee9]' },
    { category: 'Finance', query: 'Can you point me to literature about Bayesian methods for time series forecasting?', icon: ChartNoAxesCombined, tone: 'from-[#ead8b8] to-[#c2a675]' },
  ],
  [
    { category: 'Artificial Intelligence', query: 'Find recent papers comparing retrieval-augmented generation evaluation methods', icon: Atom, tone: 'from-[#122181] to-[#4769e8]' },
    { category: 'Climate Science', query: 'Find evidence on how urban greening affects heat resilience', icon: Leaf, tone: 'from-[#c8efb8] to-[#6bc18b]' },
    { category: 'Public Health', query: 'What recent studies examine digital interventions for preventive care?', icon: HeartPulse, tone: 'from-[#ffd7c7] to-[#f28c99]' },
    { category: 'Cognitive Science', query: 'Find papers about attention, memory, and human decision making', icon: Brain, tone: 'from-[#d9d2ff] to-[#9a8fe7]' },
    { category: 'Economics', query: 'Show literature on causal inference methods for policy evaluation', icon: ChartNoAxesCombined, tone: 'from-[#ebd9b8] to-[#b99f70]' },
  ],
];

export function ScholarSearchHome({ onSearch, onQuickOpen }: ScholarSearchHomeProps) {
  const { isAuthenticated } = usePrototypeAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'quick' | 'deep'>('quick');
  const [exampleSetIndex, setExampleSetIndex] = useState(0);
  const detectedIdentifiers = extractAcademicIdentifiers(searchQuery);
  const currentExamples = searchExampleSets[exampleSetIndex];

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) onSearch(query, searchMode);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[#f3f8fd] p-3 sm:p-5">
      <section className="mx-auto flex min-h-full w-full max-w-[1480px] flex-col items-center rounded-[26px] bg-white px-5 pb-14 pt-[clamp(64px,12vh,180px)] sm:px-10 lg:px-16">
        <header className="w-full text-center">
          <h1 className="text-[clamp(28px,3vw,46px)] font-semibold leading-[1.15] tracking-[-0.025em] text-[#3293f6]">
            Hi, Yue. Which paper do you want to read today?
          </h1>
        </header>

        <div className="mt-16 w-full max-w-[1110px] sm:mt-20">
          <div className="overflow-hidden rounded-[26px] bg-[#f4f6f9]">
            <div className="rounded-[24px] border border-[#dce3eb] bg-white px-4 pb-4 pt-3 shadow-[0_2px_6px_rgba(31,41,55,0.03)] sm:px-5">
              <textarea
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="e.g., Find papers using Transformer for time-series forecasting..."
                aria-label="Search papers"
                className="block min-h-[108px] w-full resize-none bg-transparent px-1 py-2 text-[16px] leading-7 text-slate-800 outline-none placeholder:text-[#8895a8] sm:min-h-[122px] sm:text-[18px]"
              />

              {detectedIdentifiers.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 px-1" aria-label="Detected academic identifiers">
                  {detectedIdentifiers.map((identifier) => (
                    <button
                      key={`${identifier.kind}-${identifier.value}`}
                      type="button"
                      onClick={() => onQuickOpen(identifier)}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {identifier.kind} · {identifier.value}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex w-fit items-center rounded-full bg-[#f1f3f6] p-1">
                  <button
                    type="button"
                    onClick={() => setSearchMode('quick')}
                    aria-pressed={searchMode === 'quick'}
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${searchMode === 'quick' ? 'bg-white text-[#242b35] shadow-[0_1px_5px_rgba(15,23,42,0.12)]' : 'text-[#778397]'}`}
                  >
                    <Zap className={`h-4 w-4 ${searchMode === 'quick' ? 'text-[#2f9cff]' : ''}`} />
                    Quick Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMode('deep')}
                    aria-pressed={searchMode === 'deep'}
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${searchMode === 'deep' ? 'bg-white text-[#242b35] shadow-[0_1px_5px_rgba(15,23,42,0.12)]' : 'text-[#778397]'}`}
                  >
                    <Atom className={`h-4 w-4 ${searchMode === 'deep' ? 'text-[#2f9cff]' : ''}`} />
                    Deep Mode
                    {!isAuthenticated && <LockKeyhole className="h-3.5 w-3.5" aria-label="Sign in required" />}
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#f1f3f5] px-3 text-sm font-medium text-[#46505d]">
                    {searchMode === 'quick' ? <><Infinity className="h-4 w-4" /> Unmetered</> : !isAuthenticated ? <><LockKeyhole className="h-4 w-4" /> Sign in required</> : <><Atom className="h-4 w-4" /> Deep Search</>}
                  </span>
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    aria-label="Search"
                    className="grid h-12 w-12 place-items-center rounded-full bg-[#20262d] text-white transition hover:-translate-y-0.5 hover:bg-[#11161c] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Search className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
            <p className="px-5 py-3 text-center text-xs leading-5 text-[#95a0b1] sm:text-sm">
              {searchMode === 'quick'
                ? 'Based on keyword matching. Best suited for finding specific paper titles or performing broad searches, similar to Google Scholar.'
                : isAuthenticated
                  ? 'Understands research intent and relationships. Best suited for complex questions, comparisons, and evidence-driven discovery.'
                  : 'Sign in to run Deep Search. Your current question will be kept for you.'}
            </p>
          </div>
        </div>

        <section className="mt-24 w-full max-w-[1230px] sm:mt-28" aria-labelledby="search-examples-heading">
          <h2 id="search-examples-heading" className="text-center text-2xl font-semibold text-[#252b33]">Try Our Examples</h2>
          <div className="mt-14 flex flex-col gap-5">
            {currentExamples.map((example, index) => {
              const ExampleIcon = example.icon;
              const widths = ['w-[72%] self-center', 'w-[92%] self-start', 'w-[72%] self-end', 'w-[60%] self-center', 'w-[80%] self-center'];
              return (
                <button
                  key={`${example.category}-${exampleSetIndex}`}
                  type="button"
                  onClick={() => setSearchQuery(example.query)}
                  className={`group flex min-h-[68px] max-w-full items-center gap-3 rounded-[18px] border border-[#dfe5ec] bg-white p-2.5 pr-6 text-left shadow-[0_8px_20px_rgba(33,75,120,0.10)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(33,75,120,0.14)] max-md:!w-full ${widths[index]}`}
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${example.tone} text-white`}>
                    <ExampleIcon className="h-6 w-6" />
                  </span>
                  <span className="shrink-0 rounded-xl bg-[#e8f3ff] px-3 py-2 text-sm font-semibold text-[#1485f4]">
                    {example.category}
                  </span>
                  <span className="min-w-0 text-[15px] font-medium leading-6 text-[#718096] sm:text-[17px]">
                    {example.query}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setExampleSetIndex((value) => (value + 1) % searchExampleSets.length)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#7f8b9d] transition hover:bg-slate-50 hover:text-[#258ff5]"
            >
              <RefreshCw className="h-4 w-4" /> Change
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

// Category keys for translation
const categoryKeys = [
  'libraryCollections',
  'undergraduateTheses',
  'computerScience',
  'medicine',
  'biology',
  'chemistry',
  'finance',
  'environmentalScience',
  'math',
  'engineering',
  'physics',
  'psychology'
];

const bookCategoryKeys = ['literature', 'design', 'journalism'];
const thesesCategoryKeys = ['cs', 'socialScience', 'naturalScience'];

// Get example query keys for each category
const getCategoryExamples = (categoryKey: string): string[] => {
  const exampleMap: { [key: string]: string[] } = {
    'libraryCollections': ['example.library.1', 'example.library.2', 'example.library.3'],
    'undergraduateTheses': ['example.undergrad.1', 'example.undergrad.2', 'example.undergrad.3'],
    'computerScience': ['example.cs.1', 'example.cs.2', 'example.cs.3'],
    'medicine': ['example.medicine.1', 'example.medicine.2', 'example.medicine.3'],
    'biology': ['example.biology.1', 'example.biology.2', 'example.biology.3'],
    'chemistry': ['example.chemistry.1', 'example.chemistry.2', 'example.chemistry.3'],
    'finance': ['example.finance.1', 'example.finance.2', 'example.finance.3'],
    'environmentalScience': ['example.envScience.1', 'example.envScience.2', 'example.envScience.3'],
    'math': ['example.math.1', 'example.math.2', 'example.math.3'],
    'engineering': ['example.engineering.1', 'example.engineering.2', 'example.engineering.3'],
    'physics': ['example.physics.1', 'example.physics.2', 'example.physics.3'],
    'psychology': ['example.psychology.1', 'example.psychology.2', 'example.psychology.3'],
  };
  return exampleMap[categoryKey] || [];
};

const getBookCategoryExamples = (categoryKey: string): string[] => {
  const exampleMap: { [key: string]: string[] } = {
    'literature': ['example.book.literature.1', 'example.book.literature.2', 'example.book.literature.3'],
    'design': ['example.book.design.1', 'example.book.design.2', 'example.book.design.3'],
    'journalism': ['example.book.journalism.1', 'example.book.journalism.2', 'example.book.journalism.3'],
  };
  return exampleMap[categoryKey] || [];
};

const getThesesCategoryExamples = (categoryKey: string): string[] => {
  const exampleMap: { [key: string]: string[] } = {
    'cs': ['example.theses.cs.1', 'example.theses.cs.2', 'example.theses.cs.3'],
    'socialScience': ['example.theses.social.1', 'example.theses.social.2', 'example.theses.social.3'],
    'naturalScience': ['example.theses.natural.1', 'example.theses.natural.2', 'example.theses.natural.3'],
  };
  return exampleMap[categoryKey] || [];
};

function LegacyScholarSearchHome({ onSearch, onQuickOpen, showDeepSearchTooltip, onTooltipDismiss, onOpenFigureToPPTX }: ScholarSearchHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'quick' | 'deep' | 'books' | 'theses'>('deep');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedBookCategory, setSelectedBookCategory] = useState<string>('literature');
  const [selectedThesesCategory, setSelectedThesesCategory] = useState<string>('cs');
  const [selectedCategory, setSelectedCategory] = useState<string>('libraryCollections');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('public');
  const detectedIdentifiers = extractAcademicIdentifiers(searchQuery);
  const [verifiedIdentifiers, setVerifiedIdentifiers] = useState<AcademicIdentifier[]>([]);
  const [isVerifyingIdentifiers, setIsVerifyingIdentifiers] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<'trends' | 'latest' | 'feeds'>('trends');

  useEffect(() => {
    setVerifiedIdentifiers([]);
    if (detectedIdentifiers.length === 0) {
      setIsVerifyingIdentifiers(false);
      return;
    }

    setIsVerifyingIdentifiers(true);
    const timer = window.setTimeout(() => {
      setVerifiedIdentifiers(detectedIdentifiers);
      setIsVerifyingIdentifiers(false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const visibleCategories = 8;
  const canScrollLeft = currentCategoryIndex > 0;
  const canScrollRight = currentCategoryIndex < categoryKeys.length - visibleCategories;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleExampleClick = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (direction === 'left' && canScrollLeft) {
      setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1));
    } else if (direction === 'right' && canScrollRight) {
      setCurrentCategoryIndex(Math.min(categoryKeys.length - visibleCategories, currentCategoryIndex + 1));
    }
  };

  const { t } = useLanguage();

  return (
    <div className="scholar-search-landing flex-1 flex items-center justify-center px-6 py-12">
      <style>{`
        .scholar-search-landing {
          --primary: #23282f;
          --on-primary: #ffffff;
          --ink: #23282f;
          --body: #636c76;
          --mute: #999999;
          --accent: #0079ff;
          --accent-hover: #1b87ff;
          --accent-soft: rgba(0, 121, 255, 0.1);
          --accent-soft-strong: rgba(0, 121, 255, 0.12);
          --accent-deep: #111fa4;
          --canvas: #ffffff;
          --canvas-soft: #f1f2f3;
          --canvas-softer: #f3f9ff;
          --line: #e5e7eb;
          --line-blue: #e6ecf4;
          min-height: 100%;
          background: linear-gradient(180deg, #f7fbff 0%, #ffffff 34%);
          color: var(--ink);
          font-family: UberMoveText, system-ui, "Helvetica Neue", Arial, sans-serif;
        }

        .scholar-search-landing * { box-sizing: border-box; }

        .scholar-search-landing .search-page {
          width: 100%;
          max-width: 1120px;
        }

        .scholar-search-landing .search-hero {
          text-align: center;
          margin-bottom: 24px;
        }

        .scholar-search-landing .search-kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          margin-bottom: 14px;
          padding: 8px 16px;
          border-radius: 999px;
          background: var(--accent-soft-strong);
          color: var(--accent-deep);
          font-size: 14px;
          line-height: 16px;
          font-weight: 600;
        }

        .scholar-search-landing .search-title {
          max-width: 780px;
          margin: 0 auto;
          color: var(--accent);
          font-size: 36px;
          line-height: 46px;
          font-weight: 650;
          letter-spacing: 0;
        }

        .scholar-search-landing .search-title .accent {
          color: var(--accent);
        }

        .scholar-search-landing .search-shell {
          margin-bottom: 26px;
          padding: 20px;
          border: 1px solid var(--line-blue);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: rgba(35, 40, 47, 0.07) 0 14px 36px;
        }

        .scholar-search-landing .search-input-wrap {
          position: relative;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-radius: 14px;
          background: var(--canvas);
          border: 0;
        }

        .scholar-search-landing .search-textarea {
          width: 100%;
          min-height: 126px;
          padding: 18px 20px;
          border: 0;
          outline: 0;
          resize: none;
          background: transparent;
          color: var(--ink);
          font-size: 16px;
          line-height: 24px;
        }

        .scholar-search-landing .search-textarea::placeholder {
          color: var(--mute);
        }

        .scholar-search-landing .search-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-top: 2px;
        }

        .scholar-search-landing .identifier-results {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: -2px 14px 0;
          overflow-x: auto;
          padding: 2px 1px 3px;
          scrollbar-width: thin;
        }

        .scholar-search-landing .identifier-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          max-width: 420px;
          padding: 7px 11px;
          border: 1px solid rgba(0, 121, 255, 0.22);
          border-radius: 10px;
          background: rgba(0, 121, 255, 0.1);
          color: var(--accent-deep);
          cursor: pointer;
          font-size: 13px;
          line-height: 18px;
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
          animation: shortcut-in 0.16s ease-out;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }

        .scholar-search-landing .identifier-chip:hover {
          border-color: rgba(0, 121, 255, 0.4);
          background: rgba(0, 121, 255, 0.15);
          transform: translateY(-1px);
        }

        .scholar-search-landing .identifier-chip:focus-visible {
          outline: 3px solid rgba(0, 121, 255, 0.2);
          outline-offset: 2px;
        }

        .scholar-search-landing .identifier-chip-kind {
          flex-shrink: 0;
          padding-right: 8px;
          border-right: 1px solid rgba(17, 31, 164, 0.18);
          font-size: 11px;
          letter-spacing: 0.04em;
        }

        .scholar-search-landing .identifier-chip-value {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .scholar-search-landing .identifier-verifying {
          cursor: default;
          border-color: rgba(0, 121, 255, 0.12);
          background: rgba(0, 121, 255, 0.06);
          color: var(--body);
        }

        .scholar-search-landing .control-left,
        .scholar-search-landing .control-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scholar-search-landing .tool-card {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 15px;
          border: 1px solid var(--line-blue);
          border-radius: 999px;
          background: var(--canvas);
          color: var(--body);
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          transition: border-color .16s ease, color .16s ease, transform .16s ease;
        }

        .scholar-search-landing .tool-card:hover {
          border-color: rgba(0, 121, 255, .28);
          color: var(--accent-deep);
          transform: translateY(-1px);
        }

        .scholar-search-landing .feed-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .scholar-search-landing .feed-tabs {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          border-radius: 999px;
          background: #f0f3f7;
        }

        .scholar-search-landing .feed-tab {
          min-width: 84px;
          padding: 8px 18px;
          border-radius: 999px;
          color: #7b8798;
          font-size: 14px;
          font-weight: 600;
          transition: background .16s ease, color .16s ease;
        }

        .scholar-search-landing .feed-tab.active {
          background: #ffffff;
          color: var(--accent);
          box-shadow: 0 6px 18px rgba(35, 40, 47, .06);
        }

        .scholar-search-landing .personalize-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border: 1px solid rgba(0, 121, 255, .18);
          border-radius: 999px;
          background: rgba(0, 121, 255, .08);
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
        }

        .scholar-search-landing .paper-feed {
          display: grid;
          gap: 14px;
        }

        .scholar-search-landing .paper-feed-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 144px;
          gap: 22px;
          min-height: 194px;
          padding: 22px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 10px 28px rgba(35, 40, 47, .04);
          transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease;
        }

        .scholar-search-landing .paper-feed-card:hover {
          border-color: rgba(0, 121, 255, .22);
          transform: translateY(-1px);
          box-shadow: 0 16px 36px rgba(35, 40, 47, .07);
        }

        .scholar-search-landing .paper-feed-title {
          margin: 0;
          color: #202731;
          font-size: 19px;
          line-height: 26px;
          font-weight: 700;
        }

        .scholar-search-landing .paper-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin-top: 11px;
          color: #7b8798;
          font-size: 12px;
        }

        .scholar-search-landing .paper-rank {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(0, 121, 255, .08);
          color: var(--accent);
        }

        .scholar-search-landing .paper-abstract {
          margin: 14px 0 0;
          color: #687689;
          font-size: 13px;
          line-height: 22px;
        }

        .scholar-search-landing .paper-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
        }

        .scholar-search-landing .paper-action {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          padding: 7px 11px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          color: #687689;
          font-size: 12px;
          font-weight: 500;
        }

        .scholar-search-landing .paper-preview {
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #e4e9ef;
          border-radius: 12px;
          background: linear-gradient(150deg, #fbfdff, #edf4fb);
          padding: 14px;
        }

        .scholar-search-landing .paper-preview-kicker {
          color: #8793a4;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .scholar-search-landing .paper-preview-title {
          margin-top: 9px;
          color: #2a313b;
          font-size: 11px;
          line-height: 15px;
          font-weight: 700;
        }

        .scholar-search-landing .paper-preview-line {
          height: 5px;
          margin-top: 8px;
          border-radius: 999px;
          background: #dfe5ec;
        }

        .scholar-search-landing .mode-toggle {
          position: relative;
          display: inline-flex;
          gap: 8px;
          padding: 6px;
          border-radius: 999px;
          background: var(--line-blue);
        }

        .scholar-search-landing .mode-toggle-bg {
          position: absolute;
          inset-block: 6px;
          border-radius: 999px;
          background: var(--canvas);
          box-shadow: rgba(35, 40, 47, 0.08) 0 6px 18px;
          transition: left 0.2s ease, right 0.2s ease;
        }

        .scholar-search-landing .mode-toggle-bg.quick {
          left: 6px;
          right: calc(50% + 4px);
        }

        .scholar-search-landing .mode-toggle-bg.deep {
          left: calc(50% + 4px);
          right: 6px;
        }

        .scholar-search-landing .mode-button {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 38px;
          padding: 9px 16px;
          border-radius: 999px;
          border: 0;
          background: transparent;
          color: var(--body);
          font-size: 14px;
          line-height: 16px;
          font-weight: 500;
          white-space: nowrap;
          transition: color 0.16s ease;
        }

        .scholar-search-landing .mode-button.active {
          color: var(--accent-deep);
        }

        .scholar-search-landing .unmetered-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 14px;
          border: 0;
          border-radius: 999px;
          background: var(--canvas-soft);
          color: var(--body);
          font-size: 14px;
          line-height: 16px;
          font-weight: 500;
          transition: background 0.16s ease, color 0.16s ease;
        }

        .scholar-search-landing .unmetered-button:hover {
          background: var(--accent-soft);
          color: var(--accent-deep);
        }

        .scholar-search-landing .submit-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 0;
          border-radius: 999px;
          background: var(--accent);
          color: var(--on-primary);
          box-shadow: rgba(0, 121, 255, 0.22) 0 10px 24px;
          transition: background 0.16s ease, transform 0.16s ease;
        }

        .scholar-search-landing .submit-button:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .scholar-search-landing .quick-open-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 44px;
          padding: 10px 16px;
          border: 1px solid rgba(0, 121, 255, 0.2);
          border-radius: 999px;
          background: var(--accent-soft);
          color: var(--accent-deep);
          font-size: 14px;
          line-height: 16px;
          font-weight: 600;
          white-space: nowrap;
          animation: shortcut-in 0.16s ease-out;
          transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
        }

        .scholar-search-landing .quick-open-button:hover {
          border-color: rgba(0, 121, 255, 0.34);
          background: var(--accent-soft-strong);
          transform: translateY(-1px);
        }

        @keyframes shortcut-in {
          from { opacity: 0; transform: translateX(6px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .scholar-search-landing .examples-title {
          margin: 0 0 16px;
          text-align: center;
          color: var(--ink);
          font-size: 18px;
          line-height: 24px;
          font-weight: 700;
        }

        .scholar-search-landing .category-row {
          position: relative;
          margin-bottom: 18px;
        }

        .scholar-search-landing .category-inner {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .scholar-search-landing .category-scroll {
          flex: 1;
          overflow: hidden;
        }

        .scholar-search-landing .category-list {
          display: flex;
          gap: 8px;
        }

        .scholar-search-landing .category-list.center {
          justify-content: center;
        }

        .scholar-search-landing .category-pill {
          flex-shrink: 0;
          min-height: 38px;
          padding: 10px 14px;
          border: 0;
          border-radius: 999px;
          background: var(--line-blue);
          color: var(--body);
          font-size: 14px;
          line-height: 16px;
          font-weight: 500;
          white-space: nowrap;
          transition: background 0.16s ease, color 0.16s ease;
        }

        .scholar-search-landing .category-pill.active {
          background: var(--primary);
          color: var(--on-primary);
        }

        .scholar-search-landing .category-pill:not(.active):hover {
          background: var(--accent-soft-strong);
          color: var(--accent-deep);
        }

        .scholar-search-landing .category-arrow {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 999px;
          background: var(--canvas-soft);
          color: var(--body);
          transition: background 0.16s ease, color 0.16s ease;
        }

        .scholar-search-landing .category-arrow:hover {
          background: var(--accent-soft);
          color: var(--accent-deep);
        }

        .scholar-search-landing .example-list {
          display: grid;
          gap: 10px;
        }

        .scholar-search-landing .example-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 58px;
          padding: 15px 18px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.86);
          color: var(--body);
          transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease, background 0.16s ease;
        }

        .scholar-search-landing .example-row:hover {
          border-color: rgba(0, 121, 255, 0.28);
          background: var(--canvas);
          box-shadow: rgba(35, 40, 47, 0.08) 0 10px 28px;
          transform: translateY(-1px);
        }

        .scholar-search-landing .example-text {
          text-align: left;
          color: var(--body);
          font-size: 14px;
          line-height: 20px;
        }

        .scholar-search-landing .example-icon {
          flex-shrink: 0;
          color: var(--mute);
          transition: color 0.16s ease, transform 0.16s ease;
        }

        .scholar-search-landing .example-row:hover .example-icon {
          color: var(--accent);
          transform: translateX(3px);
        }

        @media (max-width: 760px) {
          .scholar-search-landing {
            align-items: flex-start;
            padding: 32px 16px;
          }

          .scholar-search-landing .search-title {
            font-size: 34px;
            line-height: 42px;
          }

          .scholar-search-landing .search-shell {
            padding: 14px;
          }

          .scholar-search-landing .search-controls {
            align-items: stretch;
            flex-direction: column;
          }

          .scholar-search-landing .control-left,
          .scholar-search-landing .control-right,
          .scholar-search-landing .mode-toggle {
            width: 100%;
          }

          .scholar-search-landing .mode-button {
            flex: 1;
            justify-content: center;
          }

          .scholar-search-landing .unmetered-button {
            flex: 1;
            justify-content: center;
          }

          .scholar-search-landing .paper-feed-card {
            grid-template-columns: 1fr;
          }

          .scholar-search-landing .paper-preview {
            min-height: 130px;
          }
        }
      `}</style>
      <div className="search-page">
        {/* Header */}
        <div className="search-hero">
          <h1 className="search-title">
            你好，今天想读哪篇论文？
          </h1>
        </div>

        {/* Search Box Container */}
        <div className="search-shell">
          {/* Search Input */}
          <div className="search-input-wrap">
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
              placeholder="例如：帮我找一下关于非线性多智能体系统最优编队控制的论文"
              rows={3}
              className="search-textarea"
            />
            {(isVerifyingIdentifiers || verifiedIdentifiers.length > 0) && (
              <div className="identifier-results" aria-label="已识别论文标识符">
                {isVerifyingIdentifiers && (
                  <span className="identifier-chip identifier-verifying" aria-live="polite">
                  <span className="h-3.5 w-3.5 animate-pulse rounded bg-blue-200" />
                    <span>正在识别论文</span>
                  </span>
                )}
                {!isVerifyingIdentifiers && verifiedIdentifiers.map((identifier) => (
                  <button
                    key={`${identifier.kind}-${identifier.value}`}
                    type="button"
                    onClick={() => onQuickOpen(identifier)}
                    className="identifier-chip"
                    aria-label={`打开 ${identifier.kind} ${identifier.value}`}
                    title={`点击查看 ${identifier.value}`}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span className="identifier-chip-kind">{identifier.kind}</span>
                    <span className="identifier-chip-value">{identifier.value}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Toggle and Options */}
          <div className="search-controls">
            <div className="control-left">
              {/* Slider Tab for Quick/Deep Mode */}
              <div className="mode-toggle">
                {/* Sliding Background */}
                <div 
                  className={`mode-toggle-bg ${searchMode === 'deep' ? 'deep' : 'quick'}`}
                />
                
                {/* Quick Mode */}
                <button
                  onClick={() => setSearchMode('quick')}
                  className={`mode-button ${searchMode === 'quick' ? 'active' : ''}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                  </svg>
                  <span>快速搜索</span>
                </button>

                {/* Deep Mode */}
                <button
                  onClick={() => setSearchMode('deep')}
                  className={`mode-button ${searchMode === 'deep' ? 'active' : ''}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
                  </svg>
                  <span>深度搜索</span>
                </button>
              </div>

              <button type="button" className="tool-card"><Bot className="h-4 w-4" />Agent</button>
              <button type="button" className="tool-card"><Lightbulb className="h-4 w-4" />{t('nav.ideaDiscovery') || '灵感发现'}</button>
              <button type="button" onClick={onOpenFigureToPPTX} className="tool-card"><Presentation className="h-4 w-4" />PDF 转 PPT</button>

              {/* Database Selector */}
              <div className="relative">
                
                
              </div>
            </div>

            <div className="control-right">
              {/* Unmetered */}
              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="submit-button"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {searchMode === 'deep' && (
            null
          )}
        </div>

        <div className="feed-toolbar">
          <div className="feed-tabs" aria-label="论文推荐分类">
            {[
              ['trends', '趋势'],
              ['latest', '最新'],
              ['feeds', 'AI 订阅'],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setActiveFeedTab(value as typeof activeFeedTab)} className={`feed-tab ${activeFeedTab === value ? 'active' : ''}`}>{label}</button>
            ))}
          </div>
          <button type="button" className="personalize-button"><SlidersHorizontal className="h-3.5 w-3.5" />个性化设置</button>
        </div>

        <div className="paper-feed">
          {[
            {
              title: 'Natural-Language Agent Harnesses',
              date: '2025-11J',
              author: 'Lin et al',
              venue: 'NeurIPS 2025',
              rank: 'JCR Q1',
              preview: 'NeurIPS 2025',
            },
            {
              title: 'OmniVoice: Towards Omnilingual Zero-Shot Text-to-Speech with Diffusion Language Models',
              date: '2025-11J',
              author: 'Lin et al',
              venue: 'NeurIPS 2025',
              rank: 'JCR Q1',
              preview: 'Agent Systems',
            },
            {
              title: 'Evaluating Traceable Reasoning in Research QA Systems',
              date: '2026-03',
              author: 'K. Zhou et al.',
              venue: 'ICLR 2026 Workshop',
              rank: 'JCR Q1',
              preview: 'ICLR 2026',
            },
          ].map((paper) => (
            <article key={paper.title} className="paper-feed-card">
              <div>
                <h2 className="paper-feed-title">{paper.title}</h2>
                <div className="paper-meta"><span>{paper.date}</span><span>{paper.author}</span><span>{paper.venue}</span><span className="paper-rank">{paper.rank}</span></div>
                <p className="paper-abstract">本文提出了一种面向复杂研究任务的模型框架，通过理解上下文与对象关系提升推理效率，并在多组实验中验证其有效性与可扩展性。</p>
                <div className="paper-actions">
                  <button type="button" className="paper-action"><Bookmark className="h-3.5 w-3.5" />加入图书馆</button>
                  <button type="button" className="paper-action"><ThumbsUp className="h-3.5 w-3.5" />161</button>
                  <button type="button" className="paper-action" aria-label="不感兴趣"><ThumbsDown className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="paper-preview">
                <span className="paper-preview-kicker">{paper.preview}</span>
                <span className="paper-preview-title">{paper.title}</span>
                <span className="paper-preview-line" />
                <span className="paper-preview-line" style={{ width: '86%' }} />
                <span className="paper-preview-line" style={{ width: '68%' }} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
