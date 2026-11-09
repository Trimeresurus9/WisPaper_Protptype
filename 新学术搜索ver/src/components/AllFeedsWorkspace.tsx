import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Bot, Globe, Lightbulb, Presentation, RotateCcw, Search, Settings2, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Switch } from './ui/switch';
import { Tabs, TabsContent } from './ui/tabs';
import { CardNavTabs } from './ai-feeds/CardNavTabs';
import { RecommendedPapers, type FeedPaperItem } from './ai-feeds/RecommendedPapers';
import { type FeedPreferenceState } from './ai-feeds/PersonalizationPanel';
import { TrendDetailDrawer } from './ai-feeds/TrendDetailDrawer';
import { ManageFeedSetupDialog } from './ai-feeds/ManageFeedSetupDialog';
import { EmailVerificationSection } from './ai-feeds/EmailVerificationSection';
import { getAIFeedsDemoState, type SectionStatus } from './ai-feeds/feedState';
import { feedActionClassName, feedPanelClassName } from './ai-feeds/feedStyles';
import { aiFeedSubjects, feedSourceCatalog, feedSourceCategories, getOnboardingPreview, recommendedResearchProfileTopics } from './ai-feeds/onboardingHelpers';
import { cn } from './ui/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { isValidEmail } from '../utils/email';
import {
  extractAcademicIdentifiers,
  type AcademicIdentifier,
} from './ScholarSearchHome';
import {
  getAITrendDetail,
  aiFeedsAllTrends,
  aiFeedsFocusTags,
  aiFeedsLatestPapers,
  aiFeedsRecommendedPapers,
  type AITrendItem,
} from '../data/mockAiFeeds';

const defaultPreferences: FeedPreferenceState = {
  preferNewerPapers: true,
  preferBreakthroughs: true,
  preferBenchmarks: false,
  reduceRepeatedTopics: true,
  freshness: 'balanced',
  focusMode: 'papersAndTrends',
  researchStyle: 'breakthroughs',
  explorationMode: 'adjacent',
  sourceSelection: 'arxiv',
};

function UndoNotice({
  trendTitle,
  onUndo,
}: {
  trendTitle: string;
  onUndo: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Card className="border-border/70 bg-background shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{trendTitle}</span> {t('aiFeeds.removedFromList')}
        </p>
        <Button type="button" variant="ghost" size="sm" className="w-fit hover:bg-accent active:scale-[0.98]" onClick={onUndo}>
          <RotateCcw className="h-4 w-4" />
          {t('aiFeeds.undo')}
        </Button>
      </CardContent>
    </Card>
  );
}

function PreferenceNotice({ message }: { message: string }) {
  return (
    <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
      <CardContent className="p-4 text-sm text-emerald-800">{message}</CardContent>
    </Card>
  );
}

function AIFeedsSearchHero({
  onSearch,
  onQuickOpen,
  onOpenFigureToPPTX,
}: {
  onSearch: (query: string) => void;
  onQuickOpen: (identifier: AcademicIdentifier) => void;
  onOpenFigureToPPTX: () => void;
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<'search' | 'scholar-qa' | 'socratic'>('search');
  const [searchMode, setSearchMode] = useState<'deep' | 'quick'>('deep');
  const detectedIdentifiers = extractAcademicIdentifiers(query);
  const [verifiedIdentifiers, setVerifiedIdentifiers] = useState<AcademicIdentifier[]>([]);
  const [isVerifyingIdentifiers, setIsVerifyingIdentifiers] = useState(false);
  const heroTitle = '你好，今天想读哪篇论文？';

  const submitSearch = () => {
    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      onSearch(normalizedQuery);
    }
  };

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
  }, [query]);

  return (
    <section className="space-y-5">
      <div className="text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-[#2d8cff] sm:text-[34px]">
          {heroTitle}
        </h1>
      </div>
      <Card className="w-full rounded-[22px] border-[#e4eaf1] bg-white shadow-[0_16px_44px_-28px_rgba(35,40,47,0.38)]">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="rounded-[16px] border-0 bg-white transition-colors focus-within:ring-0">
            <textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitSearch();
                }
              }}
              rows={4}
              aria-label="Search papers, DOI, or arXiv ID"
              placeholder="例如：帮我找一下关于非线性多智能体系统最优编队控制的论文"
              className="min-h-[126px] w-full resize-none rounded-[16px] bg-transparent px-1 py-1 text-left text-[15px] text-foreground outline-none placeholder:text-[#98a3b2] sm:px-2"
            />
            {(isVerifyingIdentifiers || verifiedIdentifiers.length > 0) ? (
              <div className="flex gap-2 overflow-x-auto px-4 pb-3" aria-label="已识别论文标识符">
                {isVerifyingIdentifiers ? (
                  <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 text-xs font-medium text-sky-700" aria-live="polite">
                    <span className="h-3 w-3 animate-pulse rounded bg-sky-200" />
                    正在识别论文
                  </span>
                ) : null}
                {!isVerifyingIdentifiers && verifiedIdentifiers.map((identifier) => (
                  <button
                    key={`${identifier.kind}-${identifier.value}`}
                    type="button"
                    className="inline-flex h-9 max-w-[360px] shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-left text-xs font-semibold text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 active:scale-[0.98]"
                    aria-label={`打开 ${identifier.kind} ${identifier.value}`}
                    title={`点击查看 ${identifier.value}`}
                    onClick={() => onQuickOpen(identifier)}
                  >
                    <span className="border-r border-sky-200 pr-2 text-[11px] tracking-wide">{identifier.kind}</span>
                    <span className="truncate">{identifier.value}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full bg-[#f1f4f8] p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-9 rounded-full px-3.5 transition-all',
                    selectedSkill === 'search' && searchMode === 'deep'
                      ? 'bg-white text-[#202731] shadow-sm'
                      : 'px-2.5 text-muted-foreground hover:bg-muted/40',
                  )}
                  onClick={() => {
                    setSelectedSkill('search');
                    setSearchMode('deep');
                  }}
                >
                  <Sparkles className="h-4 w-4 text-[#1687ff]" />
                  <span>深度搜索</span>
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 rounded-full px-3.5',
                  selectedSkill === 'scholar-qa'
                    ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                    : 'border-border/70 bg-white text-muted-foreground',
                )}
                onClick={() => setSelectedSkill('scholar-qa')}
              >
                <Bot className="h-4 w-4" />
                Agent
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 rounded-full px-3.5',
                  selectedSkill === 'socratic'
                    ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                    : 'border-border/70 bg-white text-muted-foreground',
                )}
                onClick={() => setSelectedSkill('socratic')}
              >
                <Lightbulb className="h-4 w-4" />
                灵感发现
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-border/70 bg-white px-3.5 text-muted-foreground"
                onClick={onOpenFigureToPPTX}
              >
                <Presentation className="h-4 w-4" />
                PDF 转 PPT
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                type="button"
                size="icon"
                disabled={!query.trim()}
                aria-label={t('search')}
                className="h-11 w-11 rounded-full bg-[#202731] text-white hover:bg-[#111820] disabled:bg-[#202731] disabled:text-white"
                onClick={submitSearch}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function InlineFeedActivationCard({
  mode,
  pushEnabled,
  interests,
  selectedSources,
  email,
  frequency,
  pendingInterest,
  showPushToggle,
  onTogglePush,
  onApply,
}: {
  mode: 'latest' | 'for-you';
  pushEnabled: boolean;
  interests: string[];
  selectedSources: string[];
  email: string;
  frequency: 'daily' | 'none';
  pendingInterest: string | null;
  showPushToggle: boolean;
  onTogglePush: (checked: boolean) => void;
  onApply: (next: { interests: string[]; selectedSources: string[]; email: string; verifiedEmail: string; frequency: 'daily' | 'none' }) => void;
}) {
  const { t } = useLanguage();
  const [interestQuery, setInterestQuery] = useState('');
  const [sourceQuery, setSourceQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(feedSourceCategories[0]?.id ?? 'chemistry');
  const [sourcePage, setSourcePage] = useState(1);
  const [draftInterests, setDraftInterests] = useState<string[]>(interests);
  const [draftSources, setDraftSources] = useState<string[]>(selectedSources);
  const [draftEmail, setDraftEmail] = useState(email);
  const [verifiedDraftEmail, setVerifiedDraftEmail] = useState(email);
  const [draftFrequency, setDraftFrequency] = useState<'daily' | 'none'>(frequency);
  const sourcesPerPage = 7;

  useEffect(() => {
    setDraftInterests(interests);
    setDraftSources(selectedSources);
    setDraftEmail(email);
    setVerifiedDraftEmail(email);
    setDraftFrequency(frequency);
    setSelectedCategory(feedSourceCategories[0]?.id ?? 'chemistry');
  }, [email, frequency, interests, selectedSources]);

  useEffect(() => {
    if (!pendingInterest) {
      return;
    }
    setDraftInterests((current) => (current.includes(pendingInterest) ? current : [...current, pendingInterest]));
  }, [pendingInterest]);

  const filteredSources = useMemo(() => {
    const query = sourceQuery.trim().toLowerCase();
    return feedSourceCatalog.filter((source) => {
      if (!source.categories.includes(selectedCategory)) {
        return false;
      }
      const haystack = `${source.label} ${source.subtitle}`.toLowerCase();
      return !query || haystack.includes(query);
    });
  }, [selectedCategory, sourceQuery]);

  useEffect(() => {
    setSourcePage(1);
  }, [sourceQuery]);

  const sourcePageCount = Math.max(1, Math.ceil(filteredSources.length / sourcesPerPage));
  const paginatedSources = useMemo(() => {
    const startIndex = (sourcePage - 1) * sourcesPerPage;
    return filteredSources.slice(startIndex, startIndex + sourcesPerPage);
  }, [filteredSources, sourcePage]);
  const estimatedCredits = useMemo(() => {
    if (mode === 'latest' || !pushEnabled) {
      return 0;
    }

    const sourceCost = Math.max(1, draftSources.length) * 6;
    const interestCost = mode === 'for-you' ? Math.max(1, draftInterests.length) * 4 : 0;
    return sourceCost + interestCost;
  }, [draftInterests.length, draftSources.length, mode, pushEnabled]);

  const canApply =
    (mode === 'latest' || !showPushToggle || pushEnabled) &&
    draftSources.length > 0 &&
    (mode === 'latest' || draftInterests.length > 0) &&
    (mode === 'latest' ||
      !showPushToggle ||
      draftFrequency === 'none' ||
      (draftEmail.trim().length > 0 && isValidEmail(draftEmail) && verifiedDraftEmail === draftEmail.trim()));

  const handleAddInterest = () => {
    const nextInterest = interestQuery.trim();
    if (!nextInterest || draftInterests.includes(nextInterest)) {
      return;
    }
    setDraftInterests((current) => [...current, nextInterest]);
    setInterestQuery('');
  };

  const quickInterestTags = useMemo(
    () => Array.from(new Set(recommendedResearchProfileTopics)).filter((interest) => !draftInterests.includes(interest)).slice(0, 4),
    [draftInterests],
  );

  return (
    <Card className="border-border/70 bg-background shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        {showPushToggle ? (
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-foreground">{t('aiFeeds.manageSetup.push')}</div>
              <div className="text-sm text-muted-foreground">{t('aiFeeds.manageSetup.pushHint')}</div>
            </div>
            <div className="flex items-center gap-3">
              {pushEnabled ? (
                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  {t('aiFeeds.manageSetup.estimatedCredits', { count: String(estimatedCredits) })}
                </div>
              ) : null}
              <Switch checked={pushEnabled} onCheckedChange={onTogglePush} />
            </div>
          </div>
        ) : null}

        {(!showPushToggle || pushEnabled) ? (
          <>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-foreground">{t('aiFeeds.manageSetup.sourcesTitle')}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {feedSourceCategories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={category.id === selectedCategory ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {t(`aiFeeds.sourceCategory.${category.id}`)}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={sourceQuery}
                  onChange={(event) => setSourceQuery(event.target.value)}
                  placeholder={t('aiFeeds.manageSetup.sourcesSearch')}
                  className="pl-10"
                />
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {paginatedSources.map((source) => {
                  const selected = draftSources.includes(source.id);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() =>
                        setDraftSources((current) =>
                          current.includes(source.id)
                            ? current.filter((item) => item !== source.id)
                            : [...current, source.id],
                        )
                      }
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                        selected
                          ? 'border-foreground/25 bg-foreground/[0.03] shadow-sm'
                          : 'border-border/70 bg-muted/20 hover:border-foreground/15 hover:bg-muted/35'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-sm"
                          style={{ background: source.cover }}
                        >
                          {source.coverLabel}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="truncate text-sm font-semibold leading-5 text-foreground">{source.label}</div>
                              {source.id !== 'arxiv' ? (
                                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]">
                                  JCR Q1
                                </Badge>
                              ) : null}
                            </div>
                            {selected ? <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">{t('aiFeeds.manageSetup.sourceSelected')}</Badge> : null}
                          </div>
                          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            {t(source.type === 'preprint' ? 'aiFeeds.sourceType.preprint' : 'aiFeeds.sourceType.journalVenue')}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {sourcePageCount > 1 ? (
                <Pagination className="justify-end pt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className={sourcePage === 1 ? 'pointer-events-none opacity-50' : ''}
                        onClick={(event) => {
                          event.preventDefault();
                          setSourcePage((current) => Math.max(1, current - 1));
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: sourcePageCount }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === sourcePage}
                          onClick={(event) => {
                            event.preventDefault();
                            setSourcePage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className={sourcePage === sourcePageCount ? 'pointer-events-none opacity-50' : ''}
                        onClick={(event) => {
                          event.preventDefault();
                          setSourcePage((current) => Math.min(sourcePageCount, current + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </div>

            {mode === 'for-you' ? (
              <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-foreground">{t('aiFeeds.manageSetup.interestsTitle')}</div>
                </div>
                {draftInterests.length ? (
                  <div className="flex flex-wrap gap-2">
                    {draftInterests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                        <span>{interest}</span>
                        <button
                          type="button"
                          className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => setDraftInterests((current) => current.filter((item) => item !== interest))}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Input
                    value={interestQuery}
                    onChange={(event) => setInterestQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    placeholder={t('aiFeeds.manageSetup.interestsInputPlaceholder')}
                  />
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={handleAddInterest}>
                    {t('aiFeeds.manageSetup.addInterest')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickInterestTags.map((interest) => (
                    <Button
                      key={interest}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setDraftInterests((current) => [...current, interest])}
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {mode === 'for-you' ? (
                <EmailVerificationSection
                  enabled={draftFrequency === 'daily'}
                  onEnabledChange={(checked) => setDraftFrequency(checked ? 'daily' : 'none')}
                  email={draftEmail}
                  onEmailChange={setDraftEmail}
                  verifiedEmail={verifiedDraftEmail}
                  onVerifiedEmailChange={setVerifiedDraftEmail}
                  compact
                />
            ) : null}
          </>
        ) : null}

        {(!showPushToggle || pushEnabled) ? (
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!canApply}
              onClick={() =>
                onApply({
                  interests: mode === 'latest' ? interests : draftInterests,
                  selectedSources: draftSources,
                  email: mode === 'latest' ? '' : draftEmail.trim(),
                  verifiedEmail: mode === 'latest' ? '' : verifiedDraftEmail,
                  frequency: draftFrequency,
                })
              }
            >
              {t('aiFeeds.manageSetup.apply')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AllFeedsWorkspace({
  onSearch,
  onQuickOpen,
  onOpenFigureToPPTX = () => {},
  showSearchHero = true,
  researchInterests,
  onResearchInterestsChange,
}: {
  onSearch: (query: string) => void;
  onQuickOpen: (identifier: AcademicIdentifier) => void;
  onOpenFigureToPPTX?: () => void;
  showSearchHero?: boolean;
  researchInterests?: string[] | null;
  onResearchInterestsChange?: (interests: string[]) => void;
}) {
  const { t } = useLanguage();
  const resolveSourceSelection = (sourceIds: string[]): FeedPreferenceState['sourceSelection'] => {
    const hasArxiv = sourceIds.includes('arxiv');
    const hasJournal = sourceIds.some((item) => item !== 'arxiv');
    return hasArxiv && hasJournal ? 'both' : hasArxiv ? 'arxiv' : hasJournal ? 'journals' : 'both';
  };
  const demoState = useMemo(
    () => getAIFeedsDemoState(typeof window === 'undefined' ? '' : window.location.search),
    [],
  );
  const [trendStatus, setTrendStatus] = useState<SectionStatus>(demoState.trends === 'ready' ? 'loading' : demoState.trends);
  const [papersStatus, setPapersStatus] = useState<SectionStatus>(demoState.papers === 'ready' ? 'loading' : demoState.papers);
  const [trends, setTrends] = useState<AITrendItem[]>([]);
  const [recommendedPapers, setRecommendedPapers] = useState(aiFeedsRecommendedPapers);
  const [paperFilterSummary, setPaperFilterSummary] = useState({
    subject: null,
    interests: [] as string[],
    sources: ['arXiv', 'Journals'],
  });
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const [dismissedTrendIds, setDismissedTrendIds] = useState<Set<string>>(new Set());
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lastDismissedTrend, setLastDismissedTrend] = useState<{ trend: AITrendItem; index: number } | null>(null);
  const [focusTags, setFocusTags] = useState<string[]>(researchInterests ?? []);
  useEffect(() => {
    if (researchInterests) setFocusTags(researchInterests);
  }, [researchInterests]);
  const [preferences, setPreferences] = useState<FeedPreferenceState>({ ...defaultPreferences, sourceSelection: demoState.firstTime ? 'both' : defaultPreferences.sourceSelection });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(demoState.firstTime ? null : aiFeedSubjects[0]?.id ?? null);
  const [serviceStatus, setServiceStatus] = useState<'not-started' | 'running' | 'paused-user' | 'paused-system'>('not-started');
  const [activeTab, setActiveTab] = useState<'trends' | 'latest' | 'for-you'>('trends');
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(() => new Date(Date.now() - 2 * 60 * 1000));
  const [creditsUsedToday, setCreditsUsedToday] = useState(18);
  const [availableCredits, setAvailableCredits] = useState(demoState.lowCreditsPause ? 8 : demoState.lowCreditsWarning ? 22 : 124);
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(
    () => new Set(demoState.firstTime ? [] : aiFeedsRecommendedPapers.filter((paper) => paper.saved).map((paper) => paper.id)),
  );
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [manageSetupOpen, setManageSetupOpen] = useState(false);
  const [pendingInterest, setPendingInterest] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [latestSelectedSources, setLatestSelectedSources] = useState<string[]>([]);
  const [pushEmail, setPushEmail] = useState('');
  const [verifiedPushEmail, setVerifiedPushEmail] = useState('');
  const [pushFrequency, setPushFrequency] = useState<'daily' | 'none'>('daily');
  const [completedPushSetupTabs, setCompletedPushSetupTabs] = useState<Record<'latest' | 'for-you', boolean>>({
    latest: false,
    'for-you': false,
  });
  const [showInlineSetupCard, setShowInlineSetupCard] = useState(false);
  const [showInlinePushToggle, setShowInlinePushToggle] = useState(false);
  const [shouldRevealInlinePushToggleOnClose, setShouldRevealInlinePushToggleOnClose] = useState(false);

  const selectedSubject = useMemo(
    () => aiFeedSubjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedSubjectId],
  );
  const lowCreditsThreshold = 12;

  useEffect(() => {
    if ((activeTab === 'latest' || activeTab === 'for-you') && !completedPushSetupTabs[activeTab]) {
      setShowInlineSetupCard(true);
    }
  }, [activeTab, completedPushSetupTabs]);

  useEffect(() => {
    const initialTrends = demoState.firstTime
      ? aiFeedsAllTrends.map((trend) => ({ ...trend, followed: false }))
      : aiFeedsAllTrends;

    if (demoState.trends !== 'ready' || demoState.papers !== 'ready') {
      setTrends(initialTrends);
      if (demoState.trends === 'ready') {
        setTrendStatus(initialTrends.length ? 'ready' : 'empty');
      }
      if (demoState.papers === 'ready') {
        setPapersStatus(aiFeedsRecommendedPapers.length ? 'ready' : 'empty');
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setTrends(initialTrends);
      setTrendStatus(initialTrends.length ? 'ready' : 'empty');
      setPapersStatus(aiFeedsRecommendedPapers.length ? 'ready' : 'empty');
    }, 320);

    return () => window.clearTimeout(timer);
  }, [demoState.firstTime, demoState.papers, demoState.trends]);

  useEffect(() => {
    const previewSeed = getOnboardingPreview(focusTags, preferences, selectedSubjectId, selectedSources);
    const nextTrends = [
      ...previewSeed.trends,
      ...aiFeedsAllTrends.filter((trend) => !previewSeed.trends.some((candidate) => candidate.id === trend.id)),
    ];
    setTrends(nextTrends);
    setRecommendedPapers(previewSeed.papers);
    setPaperFilterSummary(previewSeed.filterSummary);
    setTrendStatus(nextTrends.length ? 'ready' : 'empty');
    setPapersStatus(previewSeed.papers.length ? 'ready' : 'empty');
  }, [focusTags, preferences, selectedSources, selectedSubjectId]);

  useEffect(() => {
    if (serviceStatus !== 'running') {
      return;
    }

    if (availableCredits > lowCreditsThreshold) {
      return;
    }

    setServiceStatus('paused-system');
    setPreferenceNotice(t('aiFeeds.notice.servicePausedLowCredits'));
  }, [availableCredits, lowCreditsThreshold, serviceStatus, t]);

  useEffect(() => {
    if (!preferenceNotice) {
      return;
    }

    const timer = window.setTimeout(() => setPreferenceNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [preferenceNotice]);

  const visibleTrends = useMemo(() => trends, [trends]);
  const forYouPaperCards = useMemo(
    () =>
      [
        ...recommendedPapers,
        ...aiFeedsRecommendedPapers.filter(
          (paper) => !recommendedPapers.some((candidate) => candidate.id === paper.id),
        ),
      ].slice(0, 5),
    [recommendedPapers],
  );
  const latestPaperCards = useMemo(() => aiFeedsLatestPapers.slice(0, 5), []);
  const trendPaperCards = useMemo<FeedPaperItem[]>(() => [
    {
      id: 'trend-natural-language-agent', previewId: 't1-p1', title: 'Natural-Language Agent Harnesses',
      summary: '本文提出一种面向复杂研究任务的智能体框架，通过理解上下文与对象关系提升推理效率，并验证其有效性与可扩展性。',
      source: 'NeurIPS 2025', venue: 'NeurIPS 2025', date: '2025-11J', authors: 'Lin et al', roleLabel: 'JCR Q1', badges: ['Agent', 'Reasoning'], relevanceReason: '', saved: false, likeCount: 161,
    },
    {
      id: 'trend-omnivoice', previewId: 't1-p2', title: 'OmniVoice: Towards Omnilingual Zero-Shot Text-to-Speech with Diffusion Language Models',
      summary: '本文提出一种面向多语言零样本语音合成的扩散语言模型，并通过多组实验验证其性能与泛化能力。',
      source: 'NeurIPS 2025', venue: 'NeurIPS 2025', date: '2025-11J', authors: 'Lin et al', roleLabel: 'JCR Q1', badges: ['Speech', 'Diffusion'], relevanceReason: '', saved: false, likeCount: 161,
    },
    {
      id: 'trend-traceable-qa', previewId: 't3-p1', title: 'Evaluating Traceable Reasoning in Research QA Systems',
      summary: '本文研究学术问答系统中的可追溯推理，以真实文献证据提升答案的可靠性与可验证性。',
      source: 'ICLR 2026 Workshop', venue: 'ICLR 2026 Workshop', date: '2026-03', authors: 'K. Zhou et al.', roleLabel: 'JCR Q1', badges: ['QA', 'Evidence'], relevanceReason: '', saved: false, likeCount: 96,
    },
  ], []);
  const selectedTrend = useMemo(
    () => visibleTrends.find((trend) => trend.id === selectedTrendId) ?? null,
    [selectedTrendId, visibleTrends],
  );
  const handleOpenTrend = (trend: AITrendItem) => {
    setSelectedTrendId(trend.id);
    setDetailOpen(true);
  };

  const handleToggleFollow = (trendId: string) => {
    setTrends((current) =>
      current.map((trend) =>
        trend.id === trendId ? { ...trend, followed: !trend.followed } : trend,
      ),
    );
  };

  const handleDismissTrend = (trendId: string) => {
    const targetIndex = trends.findIndex((trend) => trend.id === trendId);
    const target = trends[targetIndex];
    if (!target) {
      return;
    }
    const shouldCloseDetail = selectedTrendId === trendId;

    setDismissingIds((current) => new Set(current).add(trendId));

    window.setTimeout(() => {
      setTrends((current) => {
        const next = current.filter((trend) => trend.id !== trendId);
        setTrendStatus(next.length ? 'ready' : 'empty');
        return next;
      });
      setDismissingIds((current) => {
        const next = new Set(current);
        next.delete(trendId);
        return next;
      });
      setDismissedTrendIds((current) => new Set(current).add(trendId));
      setLastDismissedTrend({ trend: target, index: targetIndex });
      if (shouldCloseDetail) {
        setSelectedTrendId(null);
        setDetailOpen(false);
      }
    }, 220);
  };

  const handleUndoDismiss = () => {
    if (!lastDismissedTrend) {
      return;
    }

    setTrends((current) => {
      const next = [...current];
      next.splice(Math.min(lastDismissedTrend.index, next.length), 0, lastDismissedTrend.trend);
      return next;
    });
    setDismissedTrendIds((current) => {
      const next = new Set(current);
      next.delete(lastDismissedTrend.trend.id);
      return next;
    });
    setTrendStatus('ready');
    setLastDismissedTrend(null);
  };

  const handleRefresh = () => {
    setTrendStatus('loading');
    setPapersStatus('loading');
    setLastDismissedTrend(null);
    window.setTimeout(() => {
      const seededPreview = getOnboardingPreview(focusTags, preferences, selectedSubjectId, selectedSources);
      const sortedTrends = [
        ...seededPreview.trends,
        ...aiFeedsAllTrends.filter((trend) => !seededPreview.trends.some((candidate) => candidate.id === trend.id)),
      ];
      const nextTrends = demoState.firstTime
        ? sortedTrends.map((trend) => ({ ...trend, followed: false }))
        : sortedTrends;
      const nextPapers = seededPreview.papers;
      setTrends(nextTrends);
      setRecommendedPapers(nextPapers);
      setPaperFilterSummary(seededPreview.filterSummary);
      setLastUpdatedAt(new Date());
      setTrendStatus(nextTrends.length ? 'ready' : 'empty');
      setPapersStatus(nextPapers.length ? 'ready' : 'empty');
    }, 320);
  };

  const handleRemoveTag = (tag: string) => {
    const nextInterests = focusTags.filter((item) => item !== tag);
    setFocusTags(nextInterests);
    onResearchInterestsChange?.(nextInterests);
    setPreferenceNotice(t('aiFeeds.notice.interestRemoved', { interest: tag }));
  };

  const handlePreferenceChange = (key: keyof FeedPreferenceState, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setPreferenceNotice(t('aiFeeds.preferenceUpdated'));
  };

  const handleResetPreferences = () => {
    const resetInterests = demoState.firstTime ? [] : aiFeedsFocusTags;
    setFocusTags(resetInterests);
    onResearchInterestsChange?.(resetInterests);
    setPreferences({
      ...defaultPreferences,
      sourceSelection: demoState.firstTime ? 'both' : defaultPreferences.sourceSelection,
    });
    setSelectedSources([]);
    setPreferenceNotice(t('aiFeeds.notice.reset'));
  };

  const handleToggleSavedPaper = (paperId: string) => {
    setSavedPaperIds((current) => {
      const next = new Set(current);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const handleOpenManageSetup = (interest?: string) => {
    setPendingInterest(interest ?? null);
    setManageSetupOpen(true);
  };

  const startService = (frequency: 'daily' | 'none') => {
    setServiceStatus(
      pushEnabled && frequency === 'daily'
        ? demoState.lowCreditsPause
          ? 'paused-system'
          : 'running'
        : 'not-started',
    );
    setLastUpdatedAt(new Date());
    setCreditsUsedToday(18);
    setAvailableCredits(demoState.lowCreditsPause ? 8 : demoState.lowCreditsWarning ? 22 : 124);
    setPreferenceNotice(demoState.lowCreditsPause ? t('aiFeeds.notice.servicePausedLowCredits') : t('aiFeeds.notice.serviceStarted'));
  };

  const applySettings = (next: {
    subjectId: string | null;
    interests: string[];
    selectedSources: string[];
    email: string;
    verifiedEmail: string;
    frequency: 'daily' | 'none';
  }) => {
    setSelectedSubjectId(next.subjectId);
    setFocusTags(next.interests);
    onResearchInterestsChange?.(next.interests);
    setSelectedSources(next.selectedSources);
    setPushEmail(next.email);
    setVerifiedPushEmail(next.verifiedEmail);
    setPushFrequency(next.frequency);
    setPreferences((current) => ({
      ...current,
      sourceSelection: resolveSourceSelection(next.selectedSources),
    }));
    setCompletedPushSetupTabs((current) => ({
      ...current,
      [activeTab]: true,
    }));
    setShowInlineSetupCard(false);
    if (activeTab === 'latest') {
      setActiveTab('latest');
    } else if (next.interests.length > 0 && next.selectedSources.length > 0) {
      setActiveTab('for-you');
    }
    setServiceStatus(
      pushEnabled && next.frequency === 'daily'
        ? demoState.lowCreditsPause
          ? 'paused-system'
          : 'running'
        : 'not-started',
    );
    setLastUpdatedAt(new Date());
    setCreditsUsedToday(18);
    setAvailableCredits(demoState.lowCreditsPause ? 8 : demoState.lowCreditsWarning ? 22 : 124);
    setPreferenceNotice(t('aiFeeds.notice.personalizationApplied'));
  };

  const handleToggleServiceFromDialog = () => {
    if (serviceStatus === 'running') {
      setPauseConfirmOpen(true);
      return;
    }

    startService(pushFrequency);
  };

  const sharedNotice = (
    <>
      {preferenceNotice ? <PreferenceNotice message={preferenceNotice} /> : null}
      {lastDismissedTrend ? (
        <UndoNotice trendTitle={lastDismissedTrend.trend.title} onUndo={handleUndoDismiss} />
      ) : null}
    </>
  );

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-7 lg:px-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'trends' | 'latest' | 'for-you')} className="gap-6">
            {showSearchHero ? <AIFeedsSearchHero onSearch={onSearch} onQuickOpen={onQuickOpen} onOpenFigureToPPTX={onOpenFigureToPPTX} /> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardNavTabs
                items={[
                  { value: 'trends', label: t('aiFeeds.tab.trends') },
                  { value: 'latest', label: t('aiFeeds.tab.latest') },
                  { value: 'for-you', label: t('aiFeeds.tab.forYou') },
                ]}
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'trends' | 'latest' | 'for-you')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn('bg-background', feedActionClassName)}
                data-onboarding-anchor="interests"
                onClick={() => handleOpenManageSetup()}
              >
                <Settings2 className="h-4 w-4" />
                个性化设置
              </Button>
            </div>

            <TabsContent value="for-you" className="mt-0">
              <div className="space-y-6">
                {sharedNotice}
                {showInlineSetupCard && !completedPushSetupTabs['for-you'] ? (
                  <InlineFeedActivationCard
                    pushEnabled={pushEnabled}
                    interests={focusTags}
                    selectedSources={selectedSources}
                    pendingInterest={pendingInterest}
                    showPushToggle={showInlinePushToggle}
                    onTogglePush={(checked) => {
                      setPushEnabled(checked);
                      if (!checked) {
                        setCompletedPushSetupTabs((current) => ({ ...current, 'for-you': false }));
                      }
                    }}
                    onApply={(next) => {
                      applySettings({
                        subjectId: selectedSubjectId,
                        interests: next.interests,
                        selectedSources: next.selectedSources,
                        email: next.email,
                        verifiedEmail: next.verifiedEmail,
                        frequency: next.frequency,
                      });
                      setPendingInterest(null);
                    }}
                    mode="for-you"
                    email={pushEmail}
                    frequency={pushFrequency}
                  />
                ) : null}
                {!showInlineSetupCard && (serviceStatus === 'paused-user' || serviceStatus === 'paused-system') ? (
                  <Card className="border-slate-200 bg-slate-50 shadow-sm">
                    <CardContent className="p-4 text-sm text-slate-700">
                      {serviceStatus === 'paused-system' ? t('aiFeeds.systemPaused.resultsHint') : t('aiFeeds.paused.resultsHint')}
                    </CardContent>
                  </Card>
                ) : null}
                {!showInlineSetupCard ? (
                  <RecommendedPapers
                    papers={forYouPaperCards}
                    dailyCreditsUsed={creditsUsedToday}
                    showCreditsInDateDivider
                    filterSummary={paperFilterSummary}
                    savedPaperIds={savedPaperIds}
                    selectedInterests={focusTags}
                    showHeader={false}
                    showFilterSummary={false}
                    onToggleSave={handleToggleSavedPaper}
                    onAddInterest={(interest) => {
                      handleOpenManageSetup(interest);
                    }}
                    status={papersStatus}
                    onRefresh={handleRefresh}
                    onManageInterests={() => handleOpenManageSetup()}
                    onResetFilters={handleResetPreferences}
                  />
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="latest" className="mt-0">
              <div className="space-y-6">
                {sharedNotice}
                {showInlineSetupCard && !completedPushSetupTabs.latest ? (
                  <InlineFeedActivationCard
                    pushEnabled={pushEnabled}
                    interests={focusTags}
                    selectedSources={latestSelectedSources}
                    pendingInterest={pendingInterest}
                    showPushToggle={showInlinePushToggle}
                    onTogglePush={(checked) => {
                      setPushEnabled(checked);
                      if (!checked) {
                        setCompletedPushSetupTabs((current) => ({ ...current, latest: false }));
                      }
                    }}
                    onApply={(next) => {
                      applySettings({
                        subjectId: selectedSubjectId,
                        interests: next.interests,
                        selectedSources: next.selectedSources,
                        email: next.email,
                        verifiedEmail: next.verifiedEmail,
                        frequency: next.frequency,
                      });
                      setPendingInterest(null);
                    }}
                    mode="latest"
                    email={pushEmail}
                    frequency={pushFrequency}
                  />
                ) : null}
                {!showInlineSetupCard && (serviceStatus === 'paused-user' || serviceStatus === 'paused-system') ? (
                  <Card className="border-slate-200 bg-slate-50 shadow-sm">
                    <CardContent className="p-4 text-sm text-slate-700">
                      {serviceStatus === 'paused-system' ? t('aiFeeds.systemPaused.resultsHint') : t('aiFeeds.paused.resultsHint')}
                    </CardContent>
                  </Card>
                ) : null}
                {!showInlineSetupCard ? (
                  <RecommendedPapers
                    papers={latestPaperCards}
                    dailyCreditsUsed={creditsUsedToday}
                    showCreditsInDateDivider={false}
                    title={t('aiFeeds.latestPapers.title')}
                    description={t('aiFeeds.latestPapers.description')}
                    showHeader={false}
                    filterSummary={paperFilterSummary}
                    savedPaperIds={savedPaperIds}
                    selectedInterests={focusTags}
                    onToggleSave={handleToggleSavedPaper}
                    onAddInterest={(interest) => {
                      handleOpenManageSetup(interest);
                    }}
                    showFilterSummary={false}
                    status="ready"
                    onRefresh={handleRefresh}
                    onManageInterests={() => handleOpenManageSetup()}
                    onResetFilters={handleResetPreferences}
                  />
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="mt-0">
              <div className="space-y-6">
                {sharedNotice}
                {serviceStatus === 'paused-user' || serviceStatus === 'paused-system' ? (
                  <Card className="border-slate-200 bg-slate-50 shadow-sm">
                    <CardContent className="p-4 text-sm text-slate-700">
                      {serviceStatus === 'paused-system' ? t('aiFeeds.systemPaused.resultsHint') : t('aiFeeds.paused.resultsHint')}
                    </CardContent>
                  </Card>
                ) : null}
                <RecommendedPapers
                  papers={trendPaperCards}
                  dailyCreditsUsed={creditsUsedToday}
                  showDateDividers={false}
                  title={t('aiFeeds.trendExplorer.title')}
                  description={t('aiFeeds.trendExplorer.description')}
                  showHeader={false}
                  filterSummary={paperFilterSummary}
                  savedPaperIds={savedPaperIds}
                  selectedInterests={focusTags}
                  onToggleSave={handleToggleSavedPaper}
                  onAddInterest={(interest) => {
                    handleOpenManageSetup(interest);
                  }}
                  showFilterSummary={false}
                  status={trendStatus}
                  onRefresh={handleRefresh}
                  onManageInterests={() => handleOpenManageSetup()}
                  onResetFilters={handleResetPreferences}
                />
              </div>
            </TabsContent>
          </Tabs>
      </div>

      <TrendDetailDrawer
        trend={selectedTrend}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onToggleFollow={() => {
          if (selectedTrend) {
            handleToggleFollow(selectedTrend.id);
          }
        }}
        onDismiss={() => {
          if (selectedTrend) {
            handleDismissTrend(selectedTrend.id);
          }
        }}
        status={demoState.trendDetail}
        onRetry={handleRefresh}
        onManageInterests={() => handleOpenManageSetup()}
        paperPreviewStatus={demoState.paperPreview}
      />

      <ManageFeedSetupDialog
        open={manageSetupOpen}
        onOpenChange={(open) => {
          setManageSetupOpen(open);
          if (!open) {
            setPendingInterest(null);
            if (shouldRevealInlinePushToggleOnClose) {
              setShowInlinePushToggle(true);
              setShouldRevealInlinePushToggleOnClose(false);
            }
          }
        }}
        initialTab={activeTab === 'latest' ? 'latest' : 'ai-subscription'}
        latestSelectedSources={latestSelectedSources}
        subscriptionInterests={focusTags}
        subscriptionSelectedSources={selectedSources}
        serviceStatus={serviceStatus}
        pushEnabled={pushEnabled}
        email={pushEmail}
        verifiedEmail={verifiedPushEmail}
        frequency={pushFrequency}
        pendingInterest={pendingInterest}
        onTogglePush={(checked) => {
          setPushEnabled(checked);
          if (!checked) {
            setCompletedPushSetupTabs({ latest: false, 'for-you': false });
            setShowInlineSetupCard(true);
            setShouldRevealInlinePushToggleOnClose(true);
          } else {
            setShouldRevealInlinePushToggleOnClose(false);
          }
          setPreferenceNotice(checked ? 'Push enabled.' : 'Push paused.');
        }}
        onToggleService={handleToggleServiceFromDialog}
        onApplyLatest={(next) => {
          setLatestSelectedSources(next.selectedSources);
          setManageSetupOpen(false);
          setPendingInterest(null);
          setPreferenceNotice(t('aiFeeds.notice.personalizationApplied'));
        }}
        onApplySubscription={(next) => {
          applySettings({
            subjectId: selectedSubjectId,
            interests: next.interests,
            selectedSources: next.selectedSources,
            email: next.email,
            verifiedEmail: next.verifiedEmail,
            frequency: next.frequency,
          });
          setManageSetupOpen(false);
          setPendingInterest(null);
        }}
      />

      <Dialog open={pauseConfirmOpen} onOpenChange={setPauseConfirmOpen}>
        <DialogContent className="max-w-lg rounded-[24px] border-border/70">
          <DialogHeader className="text-left">
            <DialogTitle>{t('aiFeeds.pauseConfirm.title')}</DialogTitle>
            <DialogDescription className="leading-6">
              {t('aiFeeds.pauseConfirm.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {[
              t('aiFeeds.pauseConfirm.point.keepBrowsing'),
              t('aiFeeds.pauseConfirm.point.noUpdates'),
              t('aiFeeds.pauseConfirm.point.noCredits'),
            ].map((point) => (
              <div key={point} className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6 text-foreground/88">
                {point}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPauseConfirmOpen(false)}>
              {t('aiFeeds.pauseConfirm.keepRunning')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setPauseConfirmOpen(false);
                setServiceStatus('paused-user');
                setPreferenceNotice(t('aiFeeds.notice.servicePaused'));
              }}
            >
              {t('aiFeeds.pauseConfirm.pauseNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
