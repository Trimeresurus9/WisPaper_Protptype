import React from 'react';
import {
  ArrowUp, Bot, ChevronDown, Compass, FolderKanban, Globe2, Library,
  MessageSquareText, Paperclip, Search, Sparkles, X,
  TerminalSquare, Play, Copy,
} from 'lucide-react';

type Mode = 'ask' | 'search' | 'agent';

interface ExplorePageProps {
  embedded?: boolean;
  children?: React.ReactNode;
  onSearch: (query?: string) => void;
  onAsk: (query: string) => void;
  onAgent: (query: string) => void;
  onLibrary: () => void;
  onProjects: () => void;
  userCredits: number;
  onUserCreditsChange: (credits: number) => void;
  showMockConsole?: boolean;
  onboardingSearchActive?: boolean;
  enableLegacyTour?: boolean;
}

const welcomes = [
  '今天想探索什么研究问题？',
  '从一个问题开始，让研究更进一步。',
  '有什么可以帮你加速的？',
];

const modeMeta = {
  ask: {
    label: '问答', icon: MessageSquareText,
    placeholder: '输入问题，Shift + Enter 换行，输入 @ 来指定文章',
  },
  search: {
    label: '搜索', icon: Search,
    placeholder: '例如：帮我找一下关于非线性多智能体系统最优编队控制的论文',
  },
  agent: {
    label: 'Agent', icon: Bot,
    placeholder: '创建一个云端 Agent，执行复杂任务，比如灵感发现、论文复现、科研绘图等',
  },
};

const tour = [
  { title: '日常提问', body: '快速获得科研问题的回答，也可指定论文作为来源。', mode: 'ask' as Mode },
  { title: '精确论文检索', body: '切换到 Search，用快速或深度搜索找到真正相关的文献。', mode: 'search' as Mode },
  { title: '复杂任务', body: '交给云端 Agent 处理灵感发现、文献综述与科研绘图。', mode: 'agent' as Mode },
  { title: '历史记录', body: '从顶部导航随时回到 Ask AI、Search 或 Agent 查看过往任务。' },
];

const mockScenarios: Array<{ id: string; mode: Mode; title: string; description: string; input: string }> = [
  { id: 'ask-basic', mode: 'ask', title: 'Ask · 普通问答', description: '进入 QA 并自动提交问题', input: 'Muon 优化器的核心思想是什么？' },
  { id: 'ask-search', mode: 'ask', title: 'Ask · Search 分流', description: '在 QA 中触发深度搜索工具', input: '请帮我查找关于多模态推理评测的论文' },
  { id: 'ask-agent', mode: 'ask', title: 'Ask · Agent 自陷', description: '以灵感发现触发 Agent 确认', input: '请围绕多模态 Agent 的长期记忆帮我进行灵感发现' },
  { id: 'search-deep', mode: 'search', title: 'Search · 深度搜索', description: '直接进入 Scholar Search 结果页', input: '找 2023 年后关于多模态推理数据集的论文' },
  { id: 'search-quick', mode: 'search', title: 'Search · 快速搜索', description: '测试已知主题的快速检索', input: 'Group Relative Policy Optimization GRPO' },
  { id: 'agent-task', mode: 'agent', title: 'Agent · 复杂任务', description: '携带上下文创建云端任务', input: '围绕多模态 Agent 的长期记忆，帮我发现 3 个有研究价值的选题' },
];

export function ExplorePage({ embedded = false, children, onSearch, onAsk, onAgent, onLibrary, onProjects, userCredits, onUserCreditsChange, showMockConsole = false, onboardingSearchActive = false, enableLegacyTour = false }: ExplorePageProps) {
  const [mode, setMode] = React.useState<Mode>('ask');
  const [query, setQuery] = React.useState('');
  const [thinking, setThinking] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [source, setSource] = React.useState<'academic' | 'web'>('academic');
  const [searchType, setSearchType] = React.useState<'quick' | 'deep'>('deep');
  const [agentModel, setAgentModel] = React.useState<'lite' | 'pro'>('lite');
  const [result, setResult] = React.useState<'none' | 'loading' | 'answer' | 'deep' | 'skill'>('none');
  const [tourStep, setTourStep] = React.useState(-1);
  const [mockConsoleOpen, setMockConsoleOpen] = React.useState(false);
  const welcome = React.useMemo(() => welcomes[Math.floor(Math.random() * welcomes.length)], []);

  React.useEffect(() => { if (onboardingSearchActive) setMode('search'); }, [onboardingSearchActive]);

  React.useEffect(() => {
    if (!enableLegacyTour) return;
    try { if (!localStorage.getItem('wispaper-explore-tour-v1')) setTourStep(0); } catch { setTourStep(0); }
    const retrigger = () => setTourStep(0);
    window.addEventListener('wispaper:retrigger-tour', retrigger);
    return () => window.removeEventListener('wispaper:retrigger-tour', retrigger);
  }, [enableLegacyTour]);

  React.useEffect(() => {
    if (tourStep >= 0 && tour[tourStep]?.mode) setMode(tour[tourStep].mode!);
  }, [tourStep]);

  const finishTour = () => {
    try { localStorage.setItem('wispaper-explore-tour-v1', 'done'); } catch {}
    setTourStep(-1);
  };

  const submit = () => {
    if (!query.trim()) return;
    if (mode === 'search') { onSearch(query); return; }
    if (mode === 'agent') { onAgent(query.trim()); return; }
    onAsk(query.trim());
  };

  const runScenario = (scenario: typeof mockScenarios[number]) => {
    setMode(scenario.mode);
    setQuery(scenario.input);
    if (scenario.mode === 'search') onSearch(scenario.input);
    else if (scenario.mode === 'agent') onAgent(scenario.input);
    else onAsk(scenario.input);
  };

  const nav = [
    { label: '首页', icon: Compass, active: true },
    { label: '问答', icon: MessageSquareText, action: () => onAsk('') },
    { label: '搜索', icon: Search, action: () => onSearch() },
    { label: 'Agent', icon: Bot, action: () => onAgent('') },
    { label: '知识库', icon: Library, action: onLibrary },
    { label: '项目', icon: FolderKanban, action: onProjects },
    { label: '工具', icon: Sparkles },
  ];

  return (
    <div className={`${embedded ? 'h-full flex-1 overflow-y-auto' : 'min-h-screen'} bg-[#f7f9fc] text-slate-900`}>
      {!embedded && <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center px-6">
          <button className="mr-9 flex items-center gap-2 text-lg font-bold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#1b87ff] text-white">W</span>WisPaper</button>
          <nav className="flex flex-1 items-center gap-1" data-tour="history">
            {nav.map(({ label, icon: Icon, action, active }) => <button key={label} onClick={action} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${active ? 'bg-blue-50 font-semibold text-[#1b87ff]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}><Icon className="h-4 w-4" />{label}</button>)}
          </nav>
          <div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">EN</button><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">Y</div></div>
        </div>
      </header>}

      <main className="mx-auto max-w-[1120px] px-6 pb-16 pt-20">
        <section className="text-center">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200"><Sparkles className="h-6 w-6" /></div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">{welcome}</h1>
          <p className="mt-3 text-base text-slate-500">Ask a question, find the right papers, or start a research Agent.</p>
        </section>

        <section className="relative mx-auto mt-10 max-w-[900px]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-32px_rgba(30,64,175,.35)]">
            <textarea data-onboarding-input="home" data-onboarding-anchor="home" aria-label="研究问题" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder={modeMeta[mode].placeholder} className="min-h-[132px] w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-4 text-[16px] leading-7 outline-none placeholder:text-slate-400" />
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-2 pt-3">
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(Object.keys(modeMeta) as Mode[]).map(key => { const Icon = modeMeta[key].icon; return <button key={key} data-tour={key} onClick={() => { setMode(key); setResult('none'); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${mode === key ? 'bg-white text-[#1b87ff] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Icon className="h-4 w-4" />{modeMeta[key].label}</button>; })}
              </div>
              <div className="mx-1 h-6 w-px bg-slate-200" />
              {mode === 'ask' && <><Option label={`思考强度 · ${thinking === 'low' ? '低' : thinking === 'medium' ? '中' : '高'}`} onClick={() => setThinking(thinking === 'low' ? 'medium' : thinking === 'medium' ? 'high' : 'low')} /><Option label={source === 'academic' ? '学术搜索' : '网页搜索'} icon={source === 'academic' ? Search : Globe2} onClick={() => setSource(source === 'academic' ? 'web' : 'academic')} /></>}
              {mode === 'search' && <div className="flex rounded-lg border border-slate-200 p-0.5"><button onClick={() => setSearchType('quick')} className={`rounded-md px-3 py-1.5 text-sm ${searchType === 'quick' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>快速搜索</button><button onClick={() => setSearchType('deep')} className={`rounded-md px-3 py-1.5 text-sm ${searchType === 'deep' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>深度搜索</button></div>}
              {mode === 'agent' && <><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Paperclip className="h-4 w-4" /></button><Option label={agentModel === 'lite' ? 'Lite x0.36' : 'Pro x3.4'} onClick={() => setAgentModel(agentModel === 'lite' ? 'pro' : 'lite')} /><Option label="默认项目" /></>}
              <button onClick={submit} className="ml-auto flex items-center gap-2 rounded-xl bg-[#1b87ff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600">{mode === 'agent' && <span>开启 Agent</span>}<ArrowUp className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        {result !== 'none' && <section className="mx-auto mt-6 max-w-[900px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {result === 'loading' && <div className="flex items-center gap-3 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />正在理解你的问题…</div>}
          {result === 'answer' && <div><div className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-blue-500" />Ask AI</div><p className="leading-7 text-slate-700">这是一个很好的研究切入点。我可以先帮你梳理核心概念、关键方法和后续值得验证的问题；如果需要文献证据，可继续让我启动深度搜索。</p></div>}
          {result === 'deep' && <div><div className="mb-3 flex items-center gap-2 font-semibold"><Search className="h-4 w-4 text-blue-500" />已识别为文献搜索请求</div><p className="text-sm leading-6 text-slate-600">深度搜索已找到 28 篇高相关论文，并按方法、数据集与实验设定完成初步聚类。</p><button onClick={() => onSearch(query)} className="mt-4 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100">在深度搜索中查看</button></div>}
          {result === 'skill' && <div><div className="mb-2 flex items-center gap-2 font-semibold"><Bot className="h-4 w-4 text-indigo-500" />是否开启云端 Agent 完成这项复杂任务？</div><p className="text-sm text-slate-500">将带上当前问题与对话上下文，启动一个独立的云端 Agent。</p><div className="mt-5 flex gap-3"><button onClick={() => onAgent(query)} className="rounded-xl bg-[#1b87ff] px-4 py-2 text-sm font-semibold text-white">开启 Agent</button><button onClick={() => setResult('answer')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">继续问答</button></div></div>}
        </section>}

        {children ? (
          <section className="mx-auto mt-12 max-w-[1120px] border-t border-slate-200 pt-8">
            {children}
          </section>
        ) : null}
      </main>

      {tourStep >= 0 && <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px]">
        <div className="absolute left-1/2 top-1/2 w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/70 bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.16em] text-blue-500">Explore 引导 · {tourStep + 1}/4</span><button onClick={finishTour} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>
          <h2 className="text-xl font-bold">{tour[tourStep].title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{tour[tourStep].body}</p>
          <div className="mt-6 flex items-center justify-between"><button onClick={finishTour} className="text-sm text-slate-400 hover:text-slate-700">跳过</button><button onClick={() => tourStep === 3 ? finishTour() : setTourStep(tourStep + 1)} className="rounded-xl bg-[#1b87ff] px-5 py-2.5 text-sm font-semibold text-white">{tourStep === 3 ? '完成' : '下一步'}</button></div>
        </div>
      </div>}

      {showMockConsole && <div className="fixed bottom-5 right-5 z-40">
        {mockConsoleOpen && <div className="mb-3 flex max-h-[min(620px,75vh)] w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock 控制台</div><button onClick={() => setMockConsoleOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
          <div className="border-b border-slate-800 px-4 py-3 text-xs leading-5 text-slate-400">仅用于原型测试。“填入”会保留在 Explore，“运行”会立即进入目标页面。</div>
          <div className="border-b border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">用户积分 Mock</span><span className="font-mono text-xs text-emerald-400">{userCredits.toLocaleString()} credits</span></div><div className="grid grid-cols-2 gap-2"><button onClick={() => onUserCreditsChange(50000)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${userCredits >= 15000 ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>积分充足 · 50,000</button><button onClick={() => onUserCreditsChange(12000)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${userCredits < 15000 ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-400'}`}>积分不足 · 12,000</button></div><p className="mt-2 text-[11px] leading-4 text-slate-500">Agent 启动门槛 = 任务最低预估 + 5,000 credits</p></div>
          <div className="space-y-2 overflow-y-auto p-3">
            {mockScenarios.map((scenario) => <div key={scenario.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold text-slate-100">{scenario.title}</div><div className="mt-1 text-xs text-slate-500">{scenario.description}</div></div><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${scenario.mode === 'ask' ? 'bg-blue-500/15 text-blue-300' : scenario.mode === 'search' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-violet-500/15 text-violet-300'}`}>{scenario.mode}</span></div><div className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">{scenario.input}</div><div className="mt-3 flex justify-end gap-2"><button onClick={() => { setMode(scenario.mode); setQuery(scenario.input); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"><Copy className="h-3.5 w-3.5" />填入</button><button onClick={() => runScenario(scenario)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"><Play className="h-3.5 w-3.5" />运行</button></div></div>)}
          </div>
        </div>}
        <button onClick={() => setMockConsoleOpen(!mockConsoleOpen)} className="ml-auto flex h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock</button>
      </div>}
    </div>
  );
}

function Option({ label, icon: Icon, onClick }: { label: string; icon?: React.ElementType; onClick?: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">{Icon && <Icon className="h-4 w-4" />}{label}<ChevronDown className="h-3.5 w-3.5 text-slate-400" /></button>;
}
