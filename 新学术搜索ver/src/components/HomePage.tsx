import React from 'react';
import { ArrowRight, ChevronDown, Github, Linkedin, Search, Twitter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { HomeFaqSection } from './HomeFaqSection';
import { HomeSearchLanding } from './HomeSearchLanding';
import { LogoLoop } from './LogoLoop';
import { MarketingSeoPage } from './MarketingSeoPage';
import appLogo from '../assets/3ce02a66a6df7d8cd1f86de17846e94de4e9df61.png';
import { PricingPage } from './PricingPage';
import { ResearchLanding } from './ResearchLanding';
import { TranslationLandingPage } from './TranslationLandingPage';
import { cn } from './ui/utils';

const navItemClass = cn(
  "group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-2xl border border-transparent bg-white/70 px-4 text-sm font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-300",
  "hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
  "data-[state=open]:-translate-y-0.5 data-[state=open]:border-slate-200 data-[state=open]:bg-white data-[state=open]:text-slate-950 data-[state=open]:shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]",
);

export type ViewMode = 'list' | 'library' | 'scholar-qa' | 'paper-reproduction' | 'idea-discovery';

type MarketingPageKey =
  | 'home'
  | 'search'
  | 'pricing'
  | 'privacy-policy'
  | 'scholar-qa'
  | 'agent'
  | 'library'
  | 'paperclaw'
  | 'idea-discovery'
  | 'projects'
  | 'truecite'
  | 'ai-feeds'
  | 'ai-survey'
  | 'surveys'
  | 'blog'
  | 'terms-of-use'
  | 'translation'
  | 'faq';

interface HomePageProps {
  onNavigateToWorkspace: () => void;
  onNavigate?: (view: ViewMode) => void;
  onOpenPricing?: () => void;
  onOpenRecharge?: (language?: 'zh' | 'en') => void;
  onStartSearch?: (query?: string) => void;
  onOpenFigureToPPTX?: () => void;
}

interface PageConfig {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  titleTag: string;
  metaDescription: string;
  pills?: string[];
  overview: Array<{ title: string; body: string }>;
  highlights: Array<{ title: string; body: string }>;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
}

const featureMenuItems: Array<{ key: MarketingPageKey; label: string }> = [
  { key: 'scholar-qa', label: 'Scholar QA' },
  { key: 'agent', label: 'Agent' },
  { key: 'library', label: 'Library' },
  { key: 'paperclaw', label: 'PaperClaw' },
  { key: 'idea-discovery', label: 'Idea Discovery' },
  { key: 'projects', label: 'Projects' },
  { key: 'ai-survey', label: 'AI Survey' },
  { key: 'translation', label: 'Translation' },
  { key: 'ai-feeds', label: 'AI Feeds' },
];

const resourceMenuItems: Array<{ key: MarketingPageKey; label: string }> = [
  { key: 'surveys', label: 'Surveys' },
  { key: 'blog', label: 'Blog' },
  { key: 'faq', label: 'FAQ' },
];

const footerSections = {
  pricing: [{ key: 'pricing' as const, label: 'Pricing' }],
};

const marketingPageKeys: MarketingPageKey[] = [
  'home',
  'search',
  'pricing',
  'privacy-policy',
  'scholar-qa',
  'agent',
  'library',
  'paperclaw',
  'idea-discovery',
  'projects',
  'truecite',
  'ai-feeds',
  'ai-survey',
  'surveys',
  'blog',
  'terms-of-use',
  'translation',
  'faq',
];

const getInitialMarketingPage = (): MarketingPageKey => {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const hashPage = window.location.hash.replace('#', '') as MarketingPageKey;
  return marketingPageKeys.includes(hashPage) ? hashPage : 'home';
};

function HomeCtaBanner({
  isZh,
  onStartSearch,
}: {
  isZh: boolean;
  onStartSearch: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(120deg,rgba(209,245,255,0.94),rgba(239,249,255,0.95)_34%,rgba(222,236,255,0.94)_62%,rgba(247,250,255,0.96)_100%)] px-8 py-10 shadow-[0_30px_90px_-60px_rgba(59,130,246,0.22)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            {isZh ? '开始你的 AI 科研之旅。' : 'Start Your AI Research Journey.'}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            {isZh
              ? '从精准检索到结构化综述，把时间留给真正值得读和值得做的研究问题。'
              : 'Move from precise search to structured review workflows and spend time on the research that matters.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onStartSearch}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-slate-950 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.35)] transition hover:scale-[1.02]"
        >
          <span>{isZh ? '免费开始搜索论文' : 'Get Started'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

export function HomePage({ onNavigateToWorkspace, onNavigate, onOpenPricing, onOpenRecharge, onStartSearch, onOpenFigureToPPTX }: HomePageProps) {
  const [activePage, setActivePage] = React.useState<MarketingPageKey>(getInitialMarketingPage);
  const [language, setLanguage] = React.useState<'zh' | 'en'>('zh');
  const isZh = language === 'zh';
  const isHomePage = activePage === 'home';
  const isSearchPage = activePage === 'search';

  const handleStartSearch = (query?: string) => {
    if (onStartSearch) {
      onStartSearch(query);
      return;
    }

    onNavigate?.('list');
  };

  const renderPage = (page: MarketingPageKey) => {
    if (page === 'home') {
      return (
        <HomeSearchLanding
          language={language}
          mode="home"
          onStartSearch={handleStartSearch}
          onContinueToSurvey={onNavigateToWorkspace}
          onNavigateToMarketingPage={setActivePage}
          onOpenFigureToPPTX={onOpenFigureToPPTX}
        />
      );
    }

    if (page === 'search') {
      return (
        <HomeSearchLanding
          language={language}
          mode="search"
          onStartSearch={handleStartSearch}
          onContinueToSurvey={onNavigateToWorkspace}
          onNavigateToMarketingPage={setActivePage}
          onOpenFigureToPPTX={onOpenFigureToPPTX}
        />
      );
    }

    if (page === 'faq') {
      return (
        <div className="space-y-8">
          <HomeFaqSection language={language} />
        </div>
      );
    }

    if (page === 'translation') {
      return (
        <TranslationLandingPage
          language={language}
          onPrimaryAction={onNavigateToWorkspace}
        />
      );
    }

    if (page === 'pricing') {
      return <PricingPage language={language} onOpenRecharge={onOpenRecharge} />;
    }

    const configMap: Record<Exclude<MarketingPageKey, 'home'>, PageConfig> = {
      search: {
        badge: 'Search',
        title: isZh ? 'Scholar Search: AI 驱动的学术搜索引擎' : 'Scholar Search: AI-Powered Academic Search',
        subtitle: isZh
          ? '支持自然语言提问与 AI 深度语义理解，依托全文检索能力，从海量文献中精准锁定真正相关的核心论文。'
          : 'Ask in natural language and let AI deeply interpret your research intent. Powered by full-text retrieval, WisPaper pinpoints the most relevant core papers from massive literature collections.',
        description: isZh
          ? '面向学术搜索、全文检索与跨学科探索场景，帮助你更快完成文献初筛、源头文献定位与研究方向摸排。'
          : 'Built for scholar search, full-text retrieval, and cross-disciplinary exploration so you can screen literature, locate source papers, and enter new fields faster.',
        titleTag: isZh ? 'Scholar Search - AI 学术搜索与全文检索 | WisPaper' : 'Scholar Search - AI Academic Search and Full-Text Retrieval | WisPaper',
        metaDescription: isZh
          ? 'WisPaper Scholar Search 支持自然语言学术搜索、全文检索与高精度文献筛选，可在数分钟内从海量论文中提炼关键核心文献。'
          : 'WisPaper Scholar Search supports natural-language academic search, full-text retrieval, and high-precision literature screening to distill must-read papers from massive corpora in minutes.',
        pills: isZh ? ['学术搜索', '全文检索', '语义理解'] : ['Scholar Search', 'Full-text Retrieval', 'Semantic Understanding'],
        overview: [
          {
            title: isZh ? '海量文献极速初筛' : 'Rapid literature screening',
            body: isZh
              ? '围绕具体科研需求自动过滤海量结果，5 分钟内即可完成对 1000 篇文献的初筛，并提炼出最值得优先阅读的核心论文。'
              : 'Automatically filters large result sets around your research need, screening up to 1,000 papers in minutes and distilling the must-read core set.',
          },
          {
            title: isZh ? '精准文献定点寻踪' : 'Precision literature locating',
            body: isZh
              ? '即使只有模糊概念、问题线索或记忆片段，也能快速定位最相关的源头论文与关键工作。'
              : 'Quickly locates the most relevant source papers even when you only have fuzzy concepts, partial questions, or fragmented memories.',
          },
          {
            title: isZh ? '跨学科探索' : 'Cross-disciplinary exploration',
            body: isZh
              ? '进入全新领域时，直接用自然语言提问即可快速拿到奠基性论文、代表性综述与关键脉络。'
              : 'When entering a new field, ask directly in natural language to surface foundational papers, major reviews, and the field’s core trajectory.',
          },
        ],
        highlights: [
          {
            title: isZh ? '几乎 0 幻觉' : 'Near-zero hallucination',
            body: isZh ? '回答与检索结果严格基于真实文献，确保学术引用的真实性与严谨性。' : 'Outputs stay grounded in real literature so academic citations remain trustworthy and rigorous.',
          },
          {
            title: isZh ? '95% 准确率' : '95% accuracy rate',
            body: isZh ? '以高精度锁定核心论文，减少无效阅读和无关噪声。' : 'Industry-leading retrieval accuracy surfaces core papers with far less irrelevant noise.',
          },
          {
            title: isZh ? '5 亿篇论文索引' : '500 million papers indexed',
            body: isZh ? '覆盖超大规模论文数据库，支持从广度探索到深度定点检索。' : 'A massive academic index supports both broad discovery and precise paper locating.',
          },
          {
            title: isZh ? '1.2 亿开源全文' : '120 million OA PDFs',
            body: isZh ? '拥有丰富的开放获取全文资源，方便后续阅读、追问和综述生成。' : 'A large open-access full-text corpus makes follow-up reading, Q&A, and review generation much more efficient.',
          },
        ],
        primaryLabel: isZh ? '进入 Scholar Search' : 'Open Scholar Search',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: () => handleStartSearch(),
        onSecondaryAction: () => setActivePage('home'),
      },
      pricing: {
        badge: 'Pricing',
        title: 'WisPaper Pricing: 为不同使用深度设计的定价页面',
        subtitle: '将免费搜索、深度搜索和工作流能力拆开表达，帮助用户理解付费点和使用边界。',
        description: '这是 Pricing 一级菜单对应的 SEO 介绍页，主任务不是立刻售卖，而是让用户明白为什么要从免费检索升级到更复杂的研究工作流。',
        titleTag: 'WisPaper Pricing | Scholar Search Plans',
        metaDescription: '了解 WisPaper Scholar Search 的定价与能力分层，包含免费检索、复杂学术搜索与文献综述工作流入口。',
        pills: ['Quick Search', 'Deep Search', 'Workflow access'],
        overview: [
          { title: '免费入口明确', body: 'Quick Search 适合已知线索、标题和宽泛检索，降低首次尝试门槛。' },
          { title: '付费价值清晰', body: 'Deep Search 强调研究意图理解、复杂筛选和文献综述质量。' },
          { title: '升级路径自然', body: '用户先搜索，再看到为什么复杂任务值得付费，而不是直接遇到硬门槛。' },
        ],
        highlights: [
          { title: '适合首访用户理解产品层级', body: '先理解功能差异，再判断是否需要升级。' },
          { title: '连接搜索与转化', body: 'Pricing 页服务于 Search 主路径，不抢首页注意力。' },
          { title: '为后续实验和埋点留空间', body: '可以继续扩展 plan comparison、CTA 测试和激活路径。' },
          { title: '支持后续弹窗或真实套餐页', body: '当前 CTA 仍可接回实际 pricing modal 或正式结算页。' },
        ],
        primaryLabel: '查看套餐',
        secondaryLabel: '回到首页',
        onPrimaryAction: () => onOpenPricing?.(),
        onSecondaryAction: () => setActivePage('home'),
      },
      'privacy-policy': {
        badge: 'Legal',
        title: 'Privacy Policy',
        subtitle: '说明 WisPaper 如何处理、存储与保护用户数据及研究工作流信息。',
        description: '这是底部 footer 中的隐私政策介绍页入口，便于品牌站点在法律与信息架构层面完整闭环。',
        titleTag: 'Privacy Policy | WisPaper',
        metaDescription: '查看 WisPaper Privacy Policy，了解平台如何处理用户数据、使用日志与研究工作流信息。',
        pills: ['Privacy', 'Data handling', 'Legal'],
        overview: [
          { title: '数据处理说明', body: '说明平台会收集哪些必要信息，以及这些信息如何被用于改进产品体验。' },
          { title: '研究工作流相关数据', body: '解释搜索、问答、综述与项目相关数据的保存和访问边界。' },
          { title: '法律与品牌完整性', body: '为 footer 链接提供真实承接页，而不是占位入口。' },
        ],
        highlights: [
          { title: '支持对外展示与合规说明', body: '为正式上线前的法律内容预留清晰位置。' },
          { title: '适配品牌站结构', body: '与 Terms of Use 一起补齐 footer 所需的基础页面。' },
          { title: '便于后续替换正式内容', body: '当前可先作为营销站内的法律页容器。' },
          { title: '保留回首页路径', body: '用户可随时返回核心产品介绍页。' },
        ],
        primaryLabel: '回到首页',
        secondaryLabel: '进入 Search',
        onPrimaryAction: () => setActivePage('home'),
        onSecondaryAction: () => setActivePage('search'),
      },
      'scholar-qa': {
        badge: 'Feature',
        title: isZh ? 'Scholar Q&A: 面向公域文献与私有知识库的学术问答' : 'Scholar Q&A: Scholarly Q&A Across Public and Private Literature',
        subtitle: isZh
          ? '基于海量公域论文与个人知识库进行智能对话，无论是速读难论文，还是跨文献对比分析，都能给出带可追溯引用的专业回答。'
          : 'Run intelligent scholarly conversations over both global literature and your private library, with professional answers grounded in traceable citations.',
        description: isZh
          ? '适合在搜索与知识库基础上继续提问、归纳、比较与验证，把“找到论文”推进到“真正读懂和用起来”。'
          : 'Designed for follow-up questioning, synthesis, comparison, and validation after search so you can move from finding papers to actually understanding and using them.',
        titleTag: isZh ? 'Scholar Q&A - 学术问答与可追溯引用 | WisPaper' : 'Scholar Q&A - Academic Question Answering with Traceable Citations | WisPaper',
        metaDescription: isZh
          ? 'WisPaper Scholar Q&A 基于公域论文与私有知识库提供学术问答、复杂论文速读与跨文献对比分析，所有回答均带可追溯引用。'
          : 'WisPaper Scholar Q&A delivers academic question answering, rapid reading of complex papers, and cross-paper comparison over public literature and private libraries, with traceable citations.',
        pills: isZh ? ['学术问答', '私人知识库', '语义搜索'] : ['Scholar Q&A', 'Private Library', 'Semantic Search'],
        overview: [
          {
            title: isZh ? '复杂文献速读' : 'Rapid complex literature reading',
            body: isZh
              ? '面对晦涩冗长的论文，可直接追问公式推导、实验参数或核心结论，几分钟内快速掌握重点。'
              : 'Ask directly about derivations, experiment settings, or core findings in dense papers and grasp the essentials in minutes.',
          },
          {
            title: isZh ? '跨文献对比分析' : 'Cross-literature comparative analysis',
            body: isZh
              ? '在私有 Library 中选择多篇论文，让 AI 对比研究方法、数据集、评价指标与实验效果差异。'
              : 'Select multiple papers in your private Library and let AI compare methods, datasets, evaluation settings, and outcomes across them.',
          },
          {
            title: isZh ? '双源知识驱动' : 'Dual-source knowledge grounding',
            body: isZh
              ? '既能在 5 亿篇公域论文中做广度问答，也能在私有知识库中做深度研读与追问。'
              : 'Move seamlessly between broad Q&A over massive public corpora and deep reading over your own curated library.',
          },
        ],
        highlights: [
          {
            title: isZh ? '双源知识库驱动' : 'Dual-library intelligence',
            body: isZh ? '兼顾全域学术广度与个人私有知识深度。' : 'Combines global academic breadth with the depth of your private archive.',
          },
          {
            title: isZh ? '引用可追溯' : 'Traceable citations',
            body: isZh ? '所有回答都有真实文献支撑，避免凭空编造。' : 'Every answer is anchored to real references instead of unsupported claims.',
          },
          {
            title: isZh ? '深度读报助手' : 'Deep reading assistant',
            body: isZh ? '针对复杂学术概念、实验设计和论文局限性支持多轮追问。' : 'Supports iterative questioning on difficult concepts, experiment design, and paper limitations.',
          },
          {
            title: isZh ? '适合研究判断场景' : 'Built for research judgment',
            body: isZh ? '帮助你更快完成理解、比较、验证与引用整理。' : 'Helps you synthesize, compare, validate, and cite evidence faster.',
          },
        ],
        primaryLabel: isZh ? '打开 Scholar Q&A' : 'Open Scholar Q&A',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: () => onNavigate?.('scholar-qa'),
        onSecondaryAction: () => setActivePage('home'),
      },
      agent: {
        badge: 'Feature',
        title: isZh ? 'Scholar Agent: 端到端自动化的科研智能体' : 'Scholar Agent: End-to-End Autonomous Research Agent',
        subtitle: isZh
          ? '打通搜索、综述、趋势、知识库与问答等 WisPaper 核心能力，通过模块化自由编排，自动执行复杂科研工作流。'
          : 'Seamlessly integrates search, survey, trends, library, and Q&A into a modular agent workflow that can automate complex research tasks end to end.',
        description: isZh
          ? '适合处理灵感发现、选题推进、论文复现与多步研究执行，让复杂科研不再停留在零散工具切换。'
          : 'Built for inspiration discovery, topic exploration, paper reproduction, and multi-step research execution without constant tool switching.',
        titleTag: isZh ? 'Scholar Agent - 科研智能体与工作流自动化 | WisPaper' : 'Scholar Agent - Research Agent and Workflow Automation | WisPaper',
        metaDescription: isZh
          ? 'WisPaper Scholar Agent 融合搜索、综述、趋势、知识库与问答能力，支持模块化科研工作流编排与端到端自动执行。'
          : 'WisPaper Scholar Agent combines search, survey, trends, library, and Q&A into modular research workflows with end-to-end autonomous execution.',
        pills: isZh ? ['科研智能体', '工作流自动化', '端到端执行'] : ['Research Agent', 'Workflow Automation', 'End-to-End Execution'],
        overview: [
          {
            title: isZh ? '灵感发现' : 'Inspiration discovery',
            body: isZh
              ? '通过苏格拉底式启发对话激发学术思考，帮助你持续发现新的研究切口、问题与方向。'
              : 'Uses Socratic-style dialogue to stimulate academic thinking and uncover fresh research directions, questions, and opportunities.',
          },
          {
            title: isZh ? '论文复现' : 'Paper reproduction',
            body: isZh
              ? '支持一键推进环境配置、实验运行与结果复查，把“看懂论文”继续推进到“复现论文”。'
              : 'Extends understanding into reproduction by helping configure environments, run experiments, and verify results.',
          },
          {
            title: isZh ? '模块化工作流拼装' : 'Modular workflow composition',
            body: isZh
              ? '像搭积木一样自由组合搜索、综述、问答与实验步骤，形成适合你课题的专属流程。'
              : 'Compose search, survey, Q&A, and experiment steps like building blocks to fit your own research workflow.',
          },
        ],
        highlights: [
          {
            title: isZh ? '全功能精华融合' : 'Integrated core capabilities',
            body: isZh ? '一站式调动搜索、综述、趋势、知识库与问答工具。' : 'Brings together search, survey, trends, library, and Q&A in one orchestrated workflow.',
          },
          {
            title: isZh ? '自由组合工作流' : 'Customizable workflows',
            body: isZh ? '模块化设计让不同研究任务都能快速搭建适配流程。' : 'Modular design makes it easy to configure workflows for different research goals.',
          },
          {
            title: isZh ? '端到端自主执行' : 'End-to-end autonomy',
            body: isZh ? '从选题、调研到总结与实验准备，都可以大幅减少人工切换与重复操作。' : 'Cuts down manual switching across topic selection, literature review, synthesis, and experiment setup.',
          },
          {
            title: isZh ? '复杂任务更有优势' : 'Built for complex work',
            body: isZh ? '越是多步骤、多约束、多轮迭代的科研任务，Agent 的价值越明显。' : 'The more multi-step and iterative the research task, the more valuable the agent becomes.',
          },
        ],
        primaryLabel: isZh ? '进入 WisPaper' : 'Open WisPaper',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: onNavigateToWorkspace,
        onSecondaryAction: () => setActivePage('home'),
      },
      library: {
        badge: 'Feature',
        title: isZh ? 'Library: 私有化、智能化的学术知识库' : 'Library: A Private, Intelligent Academic Knowledge Base',
        subtitle: isZh
          ? '打造个人或团队专属文献中枢，支持本地论文上传、自动分类与跨文档 AI 全文检索，让知识沉淀真正可复用。'
          : 'Build a private research hub for yourself or your team with local paper upload, automated organization, and AI-powered cross-document full-text search.',
        description: isZh
          ? '面向文献管理、团队知识资产沉淀与跨文档检索场景，提供超越传统参考管理工具的下一代学术库体验。'
          : 'Designed for reference management, team knowledge accumulation, and cross-document retrieval beyond traditional literature management tools.',
        titleTag: isZh ? 'Library - 私有学术知识库与文献管理 | WisPaper' : 'Library - Private Academic Knowledge Base and Reference Management | WisPaper',
        metaDescription: isZh
          ? 'WisPaper Library 支持本地论文上传、自动分类、私有化检索与多端同步，帮助个人与团队沉淀长期可复用的学术知识资产。'
          : 'WisPaper Library supports local paper uploads, intelligent organization, private retrieval, and multi-device access for long-term academic knowledge management.',
        pills: isZh ? ['知识库', '文献管理工具', 'Zotero / Mendeley 替代'] : ['Library', 'Reference Management Tool', 'Zotero / Mendeley Alternative'],
        overview: [
          {
            title: isZh ? '个人电子藏书阁' : 'Personal reading archive',
            body: isZh
              ? '集中管理电脑里零散的 PDF 论文，借助自动分类与全文检索，彻底告别“记得看过但找不到”。'
              : 'Centralize scattered local PDFs and eliminate the “I know I read it, but I can’t find it” problem with smart organization and retrieval.',
          },
          {
            title: isZh ? '课题组知识资产沉淀' : 'Lab knowledge accumulation',
            body: isZh
              ? '为实验室或团队搭建共享文献库，让新成员快速接入历史积累与关键参考资料。'
              : 'Create a shared literature base for labs and teams so new members can quickly access accumulated references and prior knowledge.',
          },
          {
            title: isZh ? '跨文档智能检索' : 'Cross-document intelligent retrieval',
            body: isZh
              ? '不只保存论文，还能基于全文内容在整个私有库里进行深度检索、追问与知识复用。'
              : 'Go beyond storage with deep AI retrieval across the full text of your private collection.',
          },
        ],
        highlights: [
          {
            title: isZh ? '结构化管理' : 'Structured management',
            body: isZh ? '让文献不再散落各处，把核心资料沉淀成长期知识资产。' : 'Turns scattered literature into structured, reusable research assets.',
          },
          {
            title: isZh ? '私有化检索' : 'Private retrieval',
            body: isZh ? '为个人与团队提供安全可靠的私有学术搜索入口。' : 'Provides secure, private search over your own academic collection.',
          },
          {
            title: isZh ? '多端同步' : 'Multi-device synchronization',
            body: isZh ? '随时随地访问与复用你的论文资产和知识沉淀。' : 'Access your library and research assets wherever you work.',
          },
          {
            title: isZh ? '超越传统文献管理' : 'Beyond traditional reference managers',
            body: isZh ? '不仅管理论文，更支持深度检索、问答与知识协作。' : 'More than paper management, with retrieval, Q&A, and collaborative knowledge workflows built in.',
          },
        ],
        primaryLabel: isZh ? '打开 Library' : 'Open Library',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: () => onNavigate?.('library'),
        onSecondaryAction: () => setActivePage('home'),
      },
      paperclaw: {
        badge: 'Feature',
        title: isZh ? 'PaperClaw: 从论文阅读走向实验复现' : 'PaperClaw: From Paper Reading to Experiment Reproduction',
        subtitle: isZh
          ? '围绕论文复现与实验执行设计，帮助你自动推进环境配置、实验运行与结果验证，把研究执行真正落到实验台上。'
          : 'Built for paper reproduction and experiment execution, helping you move from reading a paper to setting up environments, running experiments, and validating outcomes.',
        description: isZh
          ? '适合在确定目标论文后继续推进复现实验，是 Scholar Agent 在研究执行层的关键能力落点。'
          : 'Designed for the stage after you have chosen a target paper, making it a core execution layer within the broader Scholar Agent workflow.',
        titleTag: isZh ? 'PaperClaw - 论文复现与实验执行 | WisPaper' : 'PaperClaw - Paper Reproduction and Experiment Execution | WisPaper',
        metaDescription: isZh
          ? 'WisPaper PaperClaw 支持论文复现、实验环境配置、实验执行与结果验证，帮助科研人员把阅读快速推进到可执行实验。'
          : 'WisPaper PaperClaw supports paper reproduction, environment setup, experiment execution, and result verification for turning reading into executable research.',
        pills: isZh ? ['论文复现', '实验支持', '研究执行'] : ['Paper Reproduction', 'Experiment Support', 'Research Execution'],
        overview: [
          {
            title: isZh ? '自动推进复现实验' : 'Automated reproduction workflow',
            body: isZh
              ? '从论文方法走向实验执行，自动串联环境准备、依赖配置、运行与结果检查。'
              : 'Move from method understanding to execution by automating environment setup, dependency handling, runs, and result checks.',
          },
          {
            title: isZh ? '服务方法验证阶段' : 'Built for validation phases',
            body: isZh
              ? '当你已经筛出值得深入的论文，PaperClaw 能把“是否可复现”快速变成可验证问题。'
              : 'Once you have shortlisted important papers, PaperClaw helps turn reproducibility into something you can quickly test.',
          },
          {
            title: isZh ? '与搜索和问答联动' : 'Connected to search and Q&A',
            body: isZh
              ? '先检索、再理解、再复现，形成自然连续的科研执行链路。'
              : 'Search, understand, then reproduce in one continuous workflow instead of jumping across disconnected tools.',
          },
        ],
        highlights: [
          {
            title: isZh ? '一键实验推进' : 'One-click experiment setup',
            body: isZh ? '减少从论文到代码、从阅读到实验的手工衔接成本。' : 'Cuts the manual overhead between understanding a paper and getting experiments running.',
          },
          {
            title: isZh ? '更适合工程型研究' : 'Great for engineering-heavy research',
            body: isZh ? '尤其适合需要快速验证模型、代码与实验条件的场景。' : 'Especially useful when validating implementations, environments, and empirical claims.',
          },
          {
            title: isZh ? '研究执行层能力' : 'Execution-layer capability',
            body: isZh ? '明确它不是搜索变体，而是科研工作流中负责落地执行的工具。' : 'Clarifies that it is not another search interface but an execution layer for research workflows.',
          },
          {
            title: isZh ? '可与 Agent 协同' : 'Works with Scholar Agent',
            body: isZh ? '和 Agent、Search、Library 配合时，复现链路会更完整。' : 'Becomes more powerful when paired with Agent, Search, and Library workflows.',
          },
        ],
        primaryLabel: isZh ? '打开 PaperClaw' : 'Open PaperClaw',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: () => onNavigate?.('paper-reproduction'),
        onSecondaryAction: () => setActivePage('home'),
      },
      'idea-discovery': {
        badge: 'Feature',
        title: isZh ? 'Idea Discovery: 激发科研灵感与选题发现' : 'Idea Discovery: Spark Research Ideas and Topic Discovery',
        subtitle: isZh
          ? '通过启发式对话与研究脉络分析，帮助你从已有文献中发现研究空白、潜在方向与下一步可做的问题。'
          : 'Uses heuristic dialogue and research-context analysis to uncover gaps, promising directions, and next-step questions from existing literature.',
        description: isZh
          ? '适合课题开题、方向摸排与早期研究探索，是 Scholar Agent 在选题与灵感发现阶段的重要入口。'
          : 'Built for early-stage topic exploration, proposal research, and idea generation as an upstream capability of the Scholar Agent workflow.',
        titleTag: isZh ? 'Idea Discovery - 科研灵感与选题发现 | WisPaper' : 'Idea Discovery - Research Ideas and Topic Discovery | WisPaper',
        metaDescription: isZh
          ? 'WisPaper Idea Discovery 通过启发式对话、研究空白识别与方向分析，帮助科研人员更快发现可研究的问题与选题机会。'
          : 'WisPaper Idea Discovery helps researchers uncover topic opportunities through heuristic dialogue, gap identification, and direction analysis.',
        pills: isZh ? ['研究灵感', '方向发现', '选题探索'] : ['Research Ideas', 'Direction Discovery', 'Topic Exploration'],
        overview: [
          {
            title: isZh ? '苏格拉底式启发对话' : 'Socratic-style exploration',
            body: isZh
              ? '通过连续追问与启发式交流，帮助你澄清问题意识、研究假设与潜在创新点。'
              : 'Guides you through iterative questioning to clarify research hypotheses, problem framing, and possible innovation angles.',
          },
          {
            title: isZh ? '研究空白识别' : 'Research gap discovery',
            body: isZh
              ? '从现有文献中抽取尚未被充分解决的问题，帮助你更快筛出值得切入的方向。'
              : 'Identifies underexplored questions from existing literature so you can surface worthwhile directions faster.',
          },
          {
            title: isZh ? '选题与路线形成' : 'Topic formation and planning',
            body: isZh
              ? '把零散想法组织成清晰的研究方向、方法路线与下一步行动。'
              : 'Turns scattered ideas into clearer topics, method paths, and concrete next steps.',
          },
        ],
        highlights: [
          {
            title: isZh ? '灵感发现更系统' : 'Systematic idea generation',
            body: isZh ? '把抽象灵感具体化成可继续验证和推进的问题。' : 'Turns vague inspiration into research questions you can actually validate and pursue.',
          },
          {
            title: isZh ? '适合课题前期' : 'Built for early-stage research',
            body: isZh ? '尤其适合博士生、研究助理和探索新方向的团队。' : 'Especially useful for PhD students, research assistants, and teams exploring new directions.',
          },
          {
            title: isZh ? '与搜索和综述衔接' : 'Connected to search and survey',
            body: isZh ? '搜索提供材料，综述提供结构，Idea Discovery 提供方向判断。' : 'Search gives you materials, Survey gives you structure, and Idea Discovery helps you decide where to go next.',
          },
          {
            title: isZh ? '帮助更快选题' : 'Faster topic selection',
            body: isZh ? '减少在早期方向判断上的反复试错。' : 'Cuts down the trial-and-error often spent choosing a research direction.',
          },
        ],
        primaryLabel: isZh ? '打开 Idea Discovery' : 'Open Idea Discovery',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: () => onNavigate?.('idea-discovery'),
        onSecondaryAction: () => setActivePage('home'),
      },
      projects: {
        badge: 'Feature',
        title: 'Projects: 以项目维度组织研究流程的介绍页',
        subtitle: '适合把搜索、筛选、阅读、问答和复现按课题或研究主题进行归档。',
        description: 'Projects 当前作为功能介绍页存在，用于说明它未来如何成为研究任务和多工具协作的容器。',
        titleTag: 'Projects | WisPaper Feature',
        metaDescription: '了解 WisPaper Projects：以研究项目为单位组织 Scholar Search、Library、QA 与复现工作流。',
        pills: ['Project workspace', 'Research organization', 'Workflow container'],
        overview: [
          { title: '以课题组织工作流', body: '比零散收藏和临时搜索更适合长期研究。' },
          { title: '适合协作与跟踪', body: '可以承接方法筛选、资料沉淀和阶段性整理。' },
          { title: '当前先作为 SEO 介绍页', body: '帮助用户理解未来产品线，而不打散首页主路径。' },
        ],
        highlights: [
          { title: '面向复杂研究项目', body: '尤其适合多轮搜索和长周期实验。' },
          { title: '与 Search 是上下游关系', body: '搜索提供材料，Projects 提供组织结构。' },
          { title: '服务品牌级信息架构', body: '把潜在功能提前放在可解释的位置。' },
          { title: '暂不直接跳真实工具', body: '当前重点是作为功能介绍页承接认知。' },
        ],
        primaryLabel: '回到首页',
        secondaryLabel: '进入 Search',
        onPrimaryAction: () => setActivePage('home'),
        onSecondaryAction: () => setActivePage('search'),
      },
      truecite: {
        badge: 'Feature',
        title: 'TrueCite: 强调引用可信度与证据回链的介绍页',
        subtitle: '当用户关心“这条结论到底从哪来”，TrueCite 就是解释引用可靠性的页面。',
        description: 'TrueCite 目前作为功能介绍页存在，帮助说明引用回链、证据溯源和结论验证的定位。',
        titleTag: 'TrueCite | WisPaper Feature',
        metaDescription: '了解 WisPaper TrueCite：围绕引用回链、证据溯源和研究结论验证设计的功能介绍页。',
        pills: ['Citation tracing', 'Evidence chain', 'Research verification'],
        overview: [
          { title: '面向证据敏感场景', body: '对综述、写作和验证性阅读尤其重要。' },
          { title: '让引用不止停在格式层面', body: '更强调结论能否回到具体论文和上下文。' },
          { title: '当前作为 SEO 解释页', body: '先讲清楚价值，再决定具体产品实现。' },
        ],
        highlights: [
          { title: '适合 long-tail SEO', body: '例如 citation verification、evidence tracing 等搜索需求。' },
          { title: '与 Search 天然关联', body: '找到论文之后，下一步是判断证据质量。' },
          { title: '帮助品牌扩展可信度叙事', body: '不让首页一次性承担全部说明。' },
          { title: '保持导航结构完整', body: '恢复旧结构同时让每个入口有清晰角色。' },
        ],
        primaryLabel: '回到首页',
        secondaryLabel: '进入 Search',
        onPrimaryAction: () => setActivePage('home'),
        onSecondaryAction: () => setActivePage('search'),
      },
      'ai-feeds': {
        badge: 'Resources',
        title: isZh ? 'AI Feeds & Trends: 个性化学术订阅与趋势追踪' : 'AI Feeds & Trends: Personalized Research Feeds and Trend Tracking',
        subtitle: isZh
          ? '围绕研究兴趣与检索历史，持续推送最新顶会顶刊论文、热点方向与爆款研究，让你始终紧跟学术前沿。'
          : 'Continuously tracks top papers, emerging directions, and trending studies around your interests so you can stay at the frontier of your field.',
        description: isZh
          ? '适合已经明确研究方向、需要长期跟踪学科热点与最新成果的科研用户。'
          : 'Built for researchers who already know their field and need ongoing monitoring of new papers, hot topics, and trend shifts.',
        titleTag: isZh ? 'AI Feeds & Trends - 学术订阅源与趋势追踪 | WisPaper' : 'AI Feeds & Trends - Academic Feeds and Trend Tracking | WisPaper',
        metaDescription: isZh
          ? 'WisPaper AI Feeds & Trends 支持个性化学术订阅、科研晨报、热点论文追踪与趋势分析，帮助你持续获取前沿动态。'
          : 'WisPaper AI Feeds & Trends provides personalized research feeds, morning briefs, hot-paper tracking, and trend analysis for continuous frontier awareness.',
        pills: isZh ? ['AI 订阅源', '学术趋势', '动态追踪'] : ['AI Feeds', 'Scholar Trends', 'Trend Tracking'],
        overview: [
          {
            title: isZh ? '专属科研晨报' : 'Personalized morning brief',
            body: isZh
              ? '每天自动汇总研究领域最新的顶会与顶刊论文，形成专属于你的学术信息流。'
              : 'Automatically compiles the newest top conference and journal papers into a daily brief tailored to your field.',
          },
          {
            title: isZh ? '爆款论文追踪' : 'Trending paper tracking',
            body: isZh
              ? '实时捕捉高热度、高引用潜力与学科突破型论文，避免错过重要前沿。'
              : 'Tracks breakout papers and fast-rising trends so important frontier work does not slip past you.',
          },
          {
            title: isZh ? '个性化推送' : 'Personalized delivery',
            body: isZh
              ? '结合你的研究兴趣与检索历史，持续推送最相关的新动态，而不是泛泛的学术资讯。'
              : 'Tailors research updates to your interests and search history instead of showing generic academic news.',
          },
        ],
        highlights: [
          {
            title: isZh ? '学科热点趋势' : 'Disciplinary trends and hot papers',
            body: isZh ? '敏锐捕捉不同学科的热点与前沿变化。' : 'Surfaces the most important disciplinary shifts and hot papers quickly.',
          },
          {
            title: isZh ? '个性化定制推送' : 'Personalized customization',
            body: isZh ? '千人千面的科研资讯流，更贴近你真正关心的方向。' : 'Delivers a research feed shaped around what actually matters to you.',
          },
          {
            title: isZh ? '即时获取前沿动态' : 'Instant frontier awareness',
            body: isZh ? '让你持续保持研究敏感度和方向判断力。' : 'Helps you maintain frontier awareness and stronger research judgment.',
          },
          {
            title: isZh ? '适合长期追踪' : 'Built for continuous discovery',
            body: isZh ? '不是一次性搜索结果，而是持续输入的研究观察窗口。' : 'Not a one-off search result, but an ongoing feed for long-term research tracking.',
          },
        ],
        primaryLabel: isZh ? '打开 AI Feeds' : 'Open AI Feeds',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: onNavigateToWorkspace,
        onSecondaryAction: () => setActivePage('home'),
      },
      'ai-survey': {
        badge: 'Feature',
        title: isZh ? 'AI Survey: 一键生成结构化学术综述' : 'AI Survey: One-Click Structured Literature Review',
        subtitle: isZh
          ? '自动梳理研究脉络、生成领域 Taxonomy，并通过可视化知识图谱帮助你快速建立全局视角。'
          : 'Automatically maps research trajectories, generates domain taxonomies, and visualizes knowledge structures so you can understand a field at a glance.',
        description: isZh
          ? '适合开题调研、技术脉络梳理与 related work 撰写，把分散论文继续推进成系统综述。'
          : 'Built for topic proposal research, trajectory mapping, and related-work synthesis so scattered papers become a coherent survey.',
        titleTag: isZh ? 'AI Survey - AI 文献综述与 Taxonomy 生成 | WisPaper' : 'AI Survey - AI Literature Review and Taxonomy Generation | WisPaper',
        metaDescription: isZh
          ? 'WisPaper AI Survey 支持一键生成深度文献综述、自动 Taxonomy 构建与可视化科研地图，帮助你快速掌握领域全貌。'
          : 'WisPaper AI Survey creates in-depth literature reviews, automated taxonomies, and visual research maps to help you quickly understand an academic field.',
        pills: isZh ? ['AI 综述', '分类体系', '科研脉络'] : ['AI Survey', 'Taxonomy', 'Research Context'],
        overview: [
          {
            title: isZh ? '课题开题调研' : 'Topic proposal research',
            body: isZh
              ? '在立项或开题阶段，一键生成全景式综述，快速掌握历史背景、研究现状与未来挑战。'
              : 'Generate a panoramic review at the proposal stage to quickly understand a field’s history, current landscape, and open challenges.',
          },
          {
            title: isZh ? '技术脉络梳理' : 'Technology trajectory mapping',
            body: isZh
              ? '面对海量文献时，用 Taxonomy 与知识图谱一目了然地看清技术分支与演进流派。'
              : 'Use taxonomy and knowledge maps to clarify technical branches and evolutionary schools across large bodies of literature.',
          },
          {
            title: isZh ? '可视化全局理解' : 'Visual big-picture understanding',
            body: isZh
              ? '把论文列表转成结构化图景，帮助你更快建立领域全貌和关键关联。'
              : 'Transforms paper lists into structured maps that reveal the overall shape of a field and its key connections.',
          },
        ],
        highlights: [
          {
            title: isZh ? '自动化文献综述' : 'Automated literature review',
            body: isZh ? '高效提炼核心观点、研究路线与领域分工。' : 'Efficiently extracts key ideas, method lines, and field structure.',
          },
          {
            title: isZh ? 'Taxonomy 自动生成' : 'Automated taxonomy generation',
            body: isZh ? '结构化呈现领域技术分支、主题簇与演进脉络。' : 'Builds structured taxonomies of branches, topic clusters, and evolution paths.',
          },
          {
            title: isZh ? '可视化科研地图' : 'Visual research map',
            body: isZh ? '用图谱直观呈现核心论文及其关系，降低理解复杂度。' : 'Visualizes core papers and their relationships for faster comprehension.',
          },
          {
            title: isZh ? '实时动态更新' : 'Real-time dynamic updates',
            body: isZh ? '帮助你持续追踪最新研究进展，而不只停留在一次性综述。' : 'Keeps surveys closer to the latest developments instead of leaving them static.',
          },
        ],
        primaryLabel: isZh ? '进入 AI Survey' : 'Open AI Survey',
        secondaryLabel: isZh ? '回到首页' : 'Back to Home',
        onPrimaryAction: onNavigateToWorkspace,
        onSecondaryAction: () => setActivePage('home'),
      },
      surveys: {
        badge: 'Resources',
        title: 'Surveys: 展示 AI Survey 生成案例与结构化综述示例',
        subtitle: '通过案例展示主题分组、方法图谱、数据集对比与研究空白分析，让用户更快理解 Survey 输出长什么样。',
        description: 'Surveys 放在 Resources 下，承担案例展示和 use case 说明，不与 Feature 中的 AI Survey 功能介绍混用。',
        titleTag: 'Surveys | WisPaper Resources',
        metaDescription: '查看 WisPaper Surveys：展示 AI Survey 的结构化综述案例、related work 组织方式与研究缺口分析示例。',
        pills: ['Survey cases', 'Use cases', 'Related work examples'],
        overview: [
          { title: '展示真实输出样式', body: '帮助用户快速理解 AI Survey 的结果呈现方式。' },
          { title: '适合案例与 use case 承接', body: '比功能说明更偏向结果展示和参考样例。' },
          { title: '服务内容与 SEO 承接', body: '适合沉淀 long-tail 搜索流量与案例入口。' },
        ],
        highlights: [
          { title: '与 Feature 中的 AI Survey 区分清楚', body: '一个讲功能，一个讲案例。' },
          { title: '便于扩展更多专题展示页', body: '后续可以持续增加不同领域的 Survey 示例。' },
          { title: '适合 comparison 与 blog 内链', body: '作为资源页承接更自然。' },
          { title: 'CTA 返回真实产品', body: '用户看完案例后仍可直接进入工作区。' },
        ],
        primaryLabel: '进入 AI Survey',
        secondaryLabel: '回到首页',
        onPrimaryAction: onNavigateToWorkspace,
        onSecondaryAction: () => setActivePage('home'),
      },
      blog: {
        badge: 'Resources',
        title: 'Blog: 承接研究工作流内容营销与 SEO 长尾的资源页',
        subtitle: '适合发布 use case、comparison、教程、研究方法文章和产品更新。',
        description: 'Blog 的 SEO 页面不是产品功能页，而是说明它在品牌增长和内容承接中的位置。',
        titleTag: 'Blog | WisPaper Resources',
        metaDescription: '了解 WisPaper Blog：用于承接 use case、comparison、research workflow 与内容 SEO 的资源页面。',
        pills: ['Content hub', 'Use cases', 'Comparison pages'],
        overview: [
          { title: '做内容型 SEO 承接', body: '适合 use case、comparison、教程和研究方法文章。' },
          { title: '服务搜索流量分层', body: '有些用户先读内容，再进入产品。' },
          { title: '支持品牌知识库建设', body: '让 Blog 成为资源而不是零散页面集合。' },
        ],
        highlights: [
          { title: '帮助搜索页减压', body: '把不适合放首页的内容放进资源型结构。' },
          { title: '适合长尾流量', body: '例如 Google Scholar alternative、how to do literature review 等。' },
          { title: '支持内容到产品的过渡', body: 'Blog 不只是阅读页，也应该有明确 CTA。' },
          { title: '当前作为 SEO 说明页', body: '可继续演进为完整内容中心。' },
        ],
        primaryLabel: '回到首页',
        secondaryLabel: '进入 Search',
        onPrimaryAction: () => setActivePage('home'),
        onSecondaryAction: () => setActivePage('search'),
      },
      translation: {
        badge: 'Resources',
        title: 'Translation: 面向学术阅读场景的辅助资源页',
        subtitle: '适合解释论文翻译、段落理解和跨语言研究阅读为什么应放在资源层而不是首页主路径。',
        description: 'Translation 当前作为资源型 SEO 介绍页存在，强调它服务的是阅读辅助，而不是 Scholar Search 的第一入口。',
        titleTag: 'Translation | WisPaper Resources',
        metaDescription: '了解 WisPaper Translation：面向学术阅读、论文翻译与跨语言理解的资源型页面。',
        pills: ['Paper translation', 'Reading support', 'Academic comprehension'],
        overview: [
          { title: '服务阅读环节', body: '用户先找到论文，再进入翻译和理解。' },
          { title: '不抢首页主路径', body: '更适合放在 Resources 菜单下。' },
          { title: '适合跨语言研究场景', body: '尤其适合中文用户阅读英文论文。' },
        ],
        highlights: [
          { title: '把辅助能力放在正确位置', body: '避免首页功能线过于分散。' },
          { title: '更容易组织 SEO 语义', body: '学术翻译和论文阅读支持本身就是独立搜索需求。' },
          { title: '和 Search 是前后关系', body: '先找，再读，再理解。' },
          { title: '可后续扩展真实页面', body: '当前先作为清晰的信息架构节点。' },
        ],
        primaryLabel: '回到首页',
        secondaryLabel: '进入 Search',
        onPrimaryAction: () => setActivePage('home'),
        onSecondaryAction: () => setActivePage('search'),
      },
      faq: {
        badge: 'Resources',
        title: 'FAQ: 面向长尾问句与转化阻力的资源页',
        subtitle: '集中回答 Deep Search、Quick Search、Google Scholar alternative 和文献综述相关问题。',
        description: 'FAQ 作为 Resources 下的 SEO 页，更适合承接长尾问句，而不是把所有问答都堆在首页主叙事里。',
        titleTag: 'FAQ | WisPaper Resources',
        metaDescription: '查看 WisPaper FAQ：包括 Deep Search、Quick Search、文献综述、结构化对比与 Google Scholar 差异等常见问题。',
        pills: ['FAQ', 'Long-tail SEO', 'Conversion support'],
        overview: [
          { title: '承接搜索问句', body: '例如 Deep Search 有什么区别、适合综述吗、能排除数据集吗。' },
          { title: '降低首次理解阻力', body: '让 FAQ 成为资源页，而不是首页信息过载来源。' },
          { title: '支持搜索转化', body: '用户在有疑问时仍能继续留在主路径上。' },
        ],
        highlights: [
          { title: '适合做长尾词聚合', body: '把高频问题集中管理，提升页面抓取与可理解性。' },
          { title: '让首页更聚焦', body: 'FAQ 保留，但不再挤占首屏与主叙事。' },
          { title: '适合与 comparison 页互链', body: '后续可以形成更完整的 SEO 内容网。' },
          { title: 'CTA 回到实际产品', body: '回答问题后继续进入 Search 或 Survey。' },
        ],
        primaryLabel: '进入 Search',
        secondaryLabel: '回到首页',
        onPrimaryAction: () => setActivePage('search'),
        onSecondaryAction: () => setActivePage('home'),
      },
      'terms-of-use': {
        badge: 'Legal',
        title: 'Terms of Use',
        subtitle: '说明 WisPaper 平台的使用边界、服务约束与产品访问规则。',
        description: '这是底部 footer 中的使用条款承接页，用于补齐营销站点的法律与信任结构。',
        titleTag: 'Terms of Use | WisPaper',
        metaDescription: '查看 WisPaper Terms of Use，了解平台访问、功能使用与服务边界。',
        pills: ['Terms', 'Usage rules', 'Legal'],
        overview: [
          { title: '平台使用规则', body: '对产品访问、账户行为与功能调用边界做出清晰说明。' },
          { title: '服务范围定义', body: '帮助用户理解哪些能力属于平台支持范围，哪些属于限制条件。' },
          { title: '为正式条款内容预留结构', body: '当前先提供可用页面入口，后续可替换成正式法务文案。' },
        ],
        highlights: [
          { title: '配合 Privacy Policy 使用', body: '一起构成底部 footer 的基础法律信息架构。' },
          { title: '帮助建立产品可信度', body: '让品牌站信息结构更完整。' },
          { title: '适合上线前持续迭代', body: '后续可以替换为正式条款内容而不改布局。' },
          { title: '保持 CTA 路径明确', body: '从法律页仍可回到产品主路径。' },
        ],
        primaryLabel: '回到首页',
        secondaryLabel: '进入 Search',
        onPrimaryAction: () => setActivePage('home'),
        onSecondaryAction: () => setActivePage('search'),
      },
    };

    const config = configMap[page];
    return <MarketingSeoPage language={language} {...config} />;
  };

  const isFeaturePage = featureMenuItems.some((item) => item.key === activePage);
  const isResourcePage = resourceMenuItems.some((item) => item.key === activePage);

  if (isHomePage) {
    return (
      <ResearchLanding
        language={language}
        onLanguageChange={setLanguage}
        onSearch={() => setActivePage('search')}
        onOpenWorkspace={onNavigateToWorkspace}
        onOpenLibrary={() => onNavigate?.('library')}
        onOpenAgent={() => onNavigate?.('idea-discovery')}
        onOpenPricing={() => setActivePage('pricing')}
      />
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen text-slate-950",
        activePage === 'pricing' && "pricing-marketing",
        isHomePage
          ? "bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,250,252,0.96))]"
          : "bg-[#f4f7fb]",
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-40 border-b backdrop-blur-xl",
          isHomePage
            ? "border-white/50 bg-white/30"
            : "border-white/70 bg-[#f4f7fb]/85",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setActivePage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3"
          >
            {activePage === 'pricing' ? (
              <><img className="pricing-brand-mark" src={appLogo} alt="" /><span className="pricing-brand-name">WisPaper</span></>
            ) : <>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-base font-bold text-white shadow-sm">
              W
            </div>
            <div className="text-left">
              <p className="text-base font-semibold text-slate-950">WisPaper</p>
              <p className="text-xs text-slate-500">{isZh ? '首页' : 'Home'}</p>
            </div>
            </>}
          </button>

          <nav className="hidden md:flex">
            <div className="relative flex items-center gap-2 rounded-[1.6rem] border border-slate-200/80 bg-white/75 p-1.5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              <button
                type="button"
                onClick={() => setActivePage('search')}
                className={cn(navItemClass, activePage === 'search' && "border-slate-200 bg-white text-slate-950 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]")}
              >
                Search
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(navItemClass, isFeaturePage && "border-slate-200 bg-white text-slate-950 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]")}
                  >
                    <span>Features</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 rounded-2xl border-slate-200/90 bg-white/95 p-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                  {featureMenuItems.map((item) => (
                    <DropdownMenuItem key={item.key} className="cursor-pointer" onSelect={() => setActivePage(item.key)}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(navItemClass, isResourcePage && "border-slate-200 bg-white text-slate-950 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]")}
                  >
                    <span>Resources</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-52 rounded-2xl border-slate-200/90 bg-white/95 p-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                  {resourceMenuItems.map((item) => (
                    <DropdownMenuItem key={item.key} className="cursor-pointer" onSelect={() => setActivePage(item.key)}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                onClick={() => setActivePage('pricing')}
                className={cn(navItemClass, activePage === 'pricing' && "border-slate-200 bg-white text-slate-950 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.45)]")}
              >
                Pricing
              </button>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleStartSearch()}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Search className="h-4 w-4" />
              <span>Workspace</span>
            </button>
            <div className="hidden items-center rounded-2xl border border-slate-200 bg-white p-1 md:inline-flex">
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={cn(
                  "rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition",
                  isZh ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950",
                )}
              >
                中
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  "rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition",
                  !isZh ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950",
                )}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex"
            >
              {isZh ? '登录' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      <main className={cn("pb-16 pt-8", isSearchPage ? "px-0" : "px-6")}>
        {isSearchPage ? renderPage(activePage) : <div className="mx-auto max-w-7xl">{renderPage(activePage)}</div>}
      </main>

      {isHomePage ? (
        <div className="px-6 pb-10">
          <div className="mx-auto max-w-7xl space-y-8">
            <HomeFaqSection language={language} onViewMore={() => setActivePage('faq')} />
            <LogoLoop language={language} />
            <HomeCtaBanner isZh={isZh} onStartSearch={() => handleStartSearch()} />
          </div>
        </div>
      ) : null}

      <footer
        className={cn(
          "border-t px-6 py-10",
          isHomePage
            ? "border-white/50 bg-white/30"
            : "border-slate-200 bg-white/70",
        )}
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-base font-semibold text-slate-950">WisPaper</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
              {isZh
                ? '助你一站式完成文献查找、精读分析与知识库搭建，将数天的调研工作量缩减至分钟级。'
                : 'Complete literature discovery, deep reading, analysis, and knowledge-base building in one place, reducing days of research work to minutes.'}
            </p>
            <button
              type="button"
              onClick={() => handleStartSearch()}
              className="mt-5 inline-flex items-center gap-1 font-medium text-slate-950"
            >
              {isZh ? '免费开始搜索论文' : 'Start Searching'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Feature</p>
              <div className="mt-4 space-y-3 text-sm text-slate-500">
                {[{ key: 'search' as const, label: 'Scholar Search' }, ...featureMenuItems].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActivePage(item.key)}
                    className="block transition hover:text-slate-950"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-950">Resources</p>
              <div className="mt-4 space-y-3 text-sm text-slate-500">
                {resourceMenuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActivePage(item.key)}
                    className="block transition hover:text-slate-950"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-950">Pricing</p>
              <div className="mt-4 space-y-3 text-sm text-slate-500">
                {footerSections.pricing.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActivePage(item.key)}
                    className="block transition hover:text-slate-950"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-950">Contact</p>
              <div className="mt-4 flex items-center gap-3 text-slate-500">
                {[
                  { label: 'GitHub', icon: Github },
                  { label: 'LinkedIn', icon: Linkedin },
                  { label: 'X', icon: Twitter },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      aria-label={item.label}
                      title={item.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-slate-200/70 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{isZh ? '© 2026 WisPaper. All rights reserved.' : '© 2026 WisPaper. All rights reserved.'}</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setActivePage('privacy-policy')} className="transition hover:text-slate-950">
              Privacy Policy
            </button>
            <button type="button" onClick={() => setActivePage('terms-of-use')} className="transition hover:text-slate-950">
              Terms of Use
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
