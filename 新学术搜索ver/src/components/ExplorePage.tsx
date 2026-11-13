import React from 'react';
import {
  ArrowUp, Bot, ChevronDown, Compass, FileText, FolderKanban, History, Library,
  MessageSquareText, Plus, Search, Sparkles, X,
  TerminalSquare, Play, Copy,
} from 'lucide-react';
import { usePrototypeAuth } from '../lib/usePrototypeAuth';
import { useGlobalAskAIHistory } from '../lib/useGlobalAskAIHistory';

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
}

const welcomes = [
  '今天想探索什么研究问题？',
  '从一个问题开始，让研究更进一步。',
  '有什么可以帮你加速的？',
];

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

export function ExplorePage({ embedded = false, children, onSearch, onAsk, onAgent, onLibrary, onProjects, userCredits, onUserCreditsChange, showMockConsole = false }: ExplorePageProps) {
  const { isAuthenticated, setAuthenticated } = usePrototypeAuth();
  const { sessions: globalAskSessions, latestForScene, upsertSession } = useGlobalAskAIHistory('home');
  const historyInitialized = React.useRef(false);
  const [mode, setMode] = React.useState<Mode>('search');
  const [query, setQuery] = React.useState('');
  const [searchType, setSearchType] = React.useState<'quick' | 'deep'>('deep');
  const [result, setResult] = React.useState<'none' | 'loading' | 'answer' | 'deep' | 'skill'>('none');
  const [tourStep, setTourStep] = React.useState(-1);
  const [mockConsoleOpen, setMockConsoleOpen] = React.useState(false);
  const [askDrawerOpen, setAskDrawerOpen] = React.useState(false);
  const [askInput, setAskInput] = React.useState('');
  const [askSource, setAskSource] = React.useState('Product Help');
  const [askSourceOpen, setAskSourceOpen] = React.useState(false);
  const [askHistoryOpen, setAskHistoryOpen] = React.useState(false);
  const [askMessages, setAskMessages] = React.useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: '你好，我是 WisPaper Ask AI。你可以问我产品功能、操作方法，也可以直接提出科研问题。' },
  ]);
  const [askSessionId, setAskSessionId] = React.useState(() => `home-ask-${Date.now()}`);
  const [askSessions, setAskSessions] = React.useState<Array<{ id: string; title: string; time: string; source: string; messages: Array<{ role: 'user' | 'assistant'; text: string }> }>>([
    { id: 'search-guide', title: '如何使用深度搜索？', time: '今天 10:18', source: 'Product Help', messages: [{ role: 'user', text: '如何使用深度搜索？' }, { role: 'assistant', text: '在首页输入研究主题并选择深度搜索，系统会理解问题、调整检索条件并整理高相关结果。' }] },
    { id: 'canvas-guide', title: '科研画布如何组织项目？', time: '昨天 16:42', source: 'Product Help', messages: [{ role: 'user', text: '科研画布如何组织项目？' }, { role: 'assistant', text: '可以使用节点组织研究问题、方向、文献、实验和结果，并为不同研究线启动 Agent。' }] },
  ]);
  const welcome = React.useMemo(() => welcomes[Math.floor(Math.random() * welcomes.length)], []);

  React.useEffect(() => {
    try { if (!localStorage.getItem('wispaper-explore-tour-v1')) setTourStep(0); } catch { setTourStep(0); }
    const retrigger = () => setTourStep(0);
    window.addEventListener('wispaper:retrigger-tour', retrigger);
    return () => window.removeEventListener('wispaper:retrigger-tour', retrigger);
  }, []);

  React.useEffect(() => {
    if (tourStep >= 0 && tour[tourStep]?.mode) setMode(tour[tourStep].mode!);
  }, [tourStep]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setAskSource('Product Help');
      setAskSourceOpen(false);
      setAskHistoryOpen(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated || historyInitialized.current) return;
    historyInitialized.current = true;
    if (latestForScene) {
      setAskSessionId(latestForScene.id);
      setAskSource(latestForScene.source);
      setAskMessages(latestForScene.messages as Array<{ role: 'user' | 'assistant'; text: string }>);
    }
  }, [isAuthenticated, latestForScene]);

  React.useEffect(() => {
    if (!isAuthenticated) { historyInitialized.current = false; return; }
    const firstQuestion = askMessages.find((message) => message.role === 'user')?.text;
    if (!firstQuestion) return;
    upsertSession({ id: askSessionId, scene: 'home', pageLabel: '首页', title: firstQuestion, source: askSource, messages: askMessages });
  }, [askMessages, askSessionId, askSource, isAuthenticated, upsertSession]);

  const finishTour = () => {
    try { localStorage.setItem('wispaper-explore-tour-v1', 'done'); } catch {}
    setTourStep(-1);
  };

  const submit = () => {
    if (!query.trim()) return;
    onSearch(query);
  };

  const runScenario = (scenario: typeof mockScenarios[number]) => {
    setMode(scenario.mode);
    setQuery(scenario.input);
    if (scenario.mode === 'search') onSearch(scenario.input);
    else if (scenario.mode === 'agent') onAgent(scenario.input);
    else onAsk(scenario.input);
  };

  const answerProductQuestion = (question: string) => {
    if (/搜索|检索|论文/.test(question)) return '你可以在首页输入研究主题，选择快速搜索或深度搜索。快速搜索适合明确关键词，深度搜索会进一步理解问题、调整检索条件并整理结果。';
    if (/Agent|agent|复杂任务|进度/.test(question)) return 'Agent 适合文献综述、论文复现、灵感发现等复杂任务。启动后可在右侧查看执行计划，也能通过 Ask AI 单独询问进度，不会打断主任务。';
    if (/项目|画布|节点/.test(question)) return '进入“项目”后可以创建科研画布，用节点组织研究问题、方向、文献、实验与结果。点击节点可在右侧查看笔记或关联 Agent。';
    if (/笔记|附件|文件/.test(question)) return '科研笔记支持 Block 编辑、自动保存和拖入文件。附件会以卡片形式出现在笔记中，并可单独全屏预览。';
    if (/Survey|survey|综述/.test(question)) return '你可以从深度搜索结果生成 Survey。生成过程中会展示进度，完成后进入包含摘要、引言、Taxonomy 和分主题正文的 Survey 页面。';
    if (/Library|library|知识库/.test(question)) return 'Library 用于同步、导入、检索和管理论文资料。你可以把检索结果与阅读材料沉淀到 Library，再用于问答或 Agent 任务。';
    if (/GPU|gpu|算力/.test(question)) return '在 Agent 的“常用功能”中选择“配置 GPU”，即可查看并申请不同型号的 GPU 运行环境。';
    return '我可以帮助你了解 WisPaper 的搜索、Ask AI、Agent、科研项目、科研画布、笔记、Survey 和 Library。你也可以直接描述想完成的任务，我会告诉你从哪里开始。';
  };

  const submitAskDrawer = (preset?: string) => {
    if (!isAuthenticated) return;
    const question = (preset ?? askInput).trim();
    if (!question) return;
    setAskMessages((items) => [...items, { role: 'user', text: question }, { role: 'assistant', text: answerProductQuestion(question) }]);
    setAskInput('');
  };

  const startNewAskConversation = () => {
    setAskSessionId(`home-ask-${Date.now()}`);
    setAskMessages([{ role: 'assistant', text: `已开启新对话。当前知识来源为“${askSource}”，你想了解什么？` }]);
    setAskInput('');
    setAskHistoryOpen(false);
  };

  const restoreAskConversation = (session: typeof askSessions[number]) => {
    setAskMessages(session.messages);
    setAskSource(session.source);
    setAskHistoryOpen(false);
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

      <main className="mx-auto max-w-[1120px] px-6 pb-16 pt-10">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">{welcome}</h1>
        </section>

        <section className="relative mx-auto mt-6 max-w-[900px]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-32px_rgba(30,64,175,.35)]">
            <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="例如：帮我找一下关于非线性多智能体系统最优编队控制的论文" className="min-h-[88px] w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-3 text-[16px] leading-7 outline-none placeholder:text-slate-400" />
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-2 pt-3">
              <div className="flex rounded-lg border border-slate-200 p-0.5" data-tour="search">
                <button onClick={() => setSearchType('quick')} className={`rounded-md px-3 py-1.5 text-sm ${searchType === 'quick' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>快速搜索</button>
                <button onClick={() => setSearchType('deep')} className={`rounded-md px-3 py-1.5 text-sm ${searchType === 'deep' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>深度搜索</button>
              </div>
              <button data-tour="agent" onClick={() => onAgent(query.trim())} className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"><Bot className="h-4 w-4" />Agent</button>
              <button onClick={submit} className="ml-auto flex items-center gap-2 rounded-xl bg-[#1b87ff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"><Search className="h-4 w-4" /><span>搜索</span></button>
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

      {askDrawerOpen && <div className="fixed bottom-5 right-5 z-[45] flex h-[min(680px,calc(100vh-40px))] w-[min(410px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_-24px_rgba(15,23,42,.45)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Sparkles className="h-4 w-4" /></span><div><div className="text-sm font-semibold text-slate-950">Ask AI</div><div className="text-[11px] text-slate-400">产品问答与使用引导</div></div></div>
          <button type="button" onClick={() => setAskDrawerOpen(false)} aria-label="关闭 Ask AI" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        {isAuthenticated && <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <button type="button" onClick={startNewAskConversation} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><span className="grid h-5 w-5 place-items-center rounded-full border border-current"><Plus className="h-3 w-3" /></span>新对话</button>
          <button type="button" onClick={() => setAskHistoryOpen((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition ${askHistoryOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><History className="h-4 w-4" />历史对话</button>
        </div>}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-5">
          {askHistoryOpen ? <div><p className="mb-2 text-[11px] font-medium text-slate-400">{globalAskSessions.length} 个全局历史对话</p><div className="divide-y divide-slate-200">{globalAskSessions.map((session) => <button key={session.id} type="button" onClick={() => { setAskSessionId(session.id); setAskMessages(session.messages as Array<{ role: 'user' | 'assistant'; text: string }>); setAskSource(session.source); setAskHistoryOpen(false); }} className="w-full py-3 text-left transition hover:bg-white"><span className="block truncate text-sm font-medium text-slate-800">{session.title}</span><span className="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span>{session.pageLabel} · {session.source}</span><span>{session.time}</span></span></button>)}</div></div> : <>
          {askMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-[#1b87ff] text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>{message.text}</div>)}
          {askMessages.length === 1 && <div className="flex flex-wrap gap-2 pt-1">
            {['如何开始搜索？', 'Agent 能做什么？', '如何使用科研画布？'].map((prompt) => <button key={prompt} type="button" onClick={() => submitAskDrawer(prompt)} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-600 transition hover:bg-blue-50">{prompt}</button>)}
          </div>}</>}
        </div>
        <div className="border-t border-slate-100 bg-white p-3">
          {!isAuthenticated && <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-xs leading-5 text-slate-600">请先登录后使用 Ask AI。登录后可使用知识库、Web 资源和学术搜索，并访问全局聊天历史。</p><button type="button" onClick={() => setAuthenticated(true)} className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">注册 / 登录</button></div>}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-blue-300">
            <textarea value={askInput} disabled={!isAuthenticated} onChange={(event) => setAskInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitAskDrawer(); } }} rows={2} placeholder="询问产品功能或使用方法…" className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-slate-400" />
            <div className="flex items-center justify-between"><div className="relative"><button type="button" disabled={!isAuthenticated} onClick={() => setAskSourceOpen((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-default"><FileText className="h-3.5 w-3.5" />{askSource}<ChevronDown className="h-3 w-3" /></button>{askSourceOpen && isAuthenticated && <div className="absolute bottom-10 left-0 z-10 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{['Product Help', '我的知识库', 'Web 资源'].map((source) => <button key={source} type="button" onClick={() => { setAskSource(source); setAskSourceOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${askSource === source ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{source}</button>)}</div>}</div><div className="flex items-center gap-2"><button type="button" onClick={() => submitAskDrawer()} disabled={!askInput.trim()} aria-label="发送问题" className="grid h-8 w-8 place-items-center rounded-xl bg-[#1b87ff] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button></div></div>
          </div>
        </div>
      </div>}

      {!askDrawerOpen && <button type="button" onClick={() => setAskDrawerOpen(true)} className={`fixed bottom-5 z-[45] flex h-14 items-center gap-2 rounded-full bg-[#1b87ff] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_-14px_rgba(27,135,255,.8)] transition hover:-translate-y-0.5 hover:bg-blue-600 ${showMockConsole ? 'right-36' : 'right-5'}`} aria-label="打开 Ask AI">
        <Sparkles className="h-4 w-4" />Ask AI
      </button>}

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
