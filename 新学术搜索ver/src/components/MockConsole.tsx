import React from 'react';
import { ChevronDown, ChevronUp, Copy, Lock, Mail, Play, RotateCcw, Smartphone, TerminalSquare, UserRound, X } from 'lucide-react';
import { setPrototypeAuthenticated } from '../lib/usePrototypeAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useBilling } from '../contexts/BillingContext';

interface Scenario { title: string; description: string; input: string; action: 'ask' | 'search' | 'agent' | 'search-tool' }

interface MockConsoleProps {
  currentView: string;
  userCredits: number;
  onUserCreditsChange: (credits: number) => void;
  onAsk: (input: string) => void;
  onSearch: (input: string) => void;
  onAgent: (input: string) => void;
  onOpenBilling?: () => void;
}

const scenarios: Record<string, Scenario[]> = {
  explore: [
    { title: 'Ask · 普通问答', description: '进入 QA 并自动提交问题', input: 'Muon 优化器的核心思想是什么？', action: 'ask' },
    { title: 'Ask · Search 分流', description: '在 QA 正常回答后展示论文搜索引导', input: '请帮我查找关于多模态推理评测的论文', action: 'ask' },
    { title: 'Ask · Agent Skill 自陷', description: '以“灵感发现”触发 Agent 确认', input: '请围绕多模态 Agent 的长期记忆帮我进行灵感发现', action: 'ask' },
    { title: 'Search · 深度搜索', description: '测试复杂学术检索', input: '找 2023 年后关于多模态推理数据集的论文', action: 'search' },
    { title: 'Search · 快速搜索', description: '测试已知主题的快速检索', input: 'Group Relative Policy Optimization GRPO', action: 'search' },
    { title: 'Agent · 复杂任务', description: '携带上下文创建云端任务', input: '围绕多模态 Agent 的长期记忆，帮我发现 3 个有研究价值的选题', action: 'agent' },
  ],
  'scholar-qa': [
    { title: 'Ask · 普通问答', description: '正常 QA 回答', input: 'GRPO 与 PPO 有什么区别？', action: 'ask' },
    { title: 'Ask · 学术搜索', description: '回答末尾展示论文搜索引导', input: '请帮我查找关于多模态推理评测的论文', action: 'ask' },
    { title: 'Ask · Agent Skill 自陷', description: '以“灵感发现”触发 Agent 确认', input: '请围绕多模态 Agent 的长期记忆帮我进行灵感发现', action: 'ask' },
  ],
  list: [
    { title: 'Ask AI · Deep Search MCP', description: '在 Ask AI 中修改条件并继续搜索', input: '继续搜索并修改当前搜索条件，增加方法对比与评测证据', action: 'search-tool' },
    { title: 'Search · 深度搜索', description: '测试复杂学术检索', input: '找 2023 年后关于多模态推理数据集的论文', action: 'search' },
    { title: 'Search · 快速搜索', description: '测试已知主题', input: 'Group Relative Policy Optimization GRPO', action: 'search' },
  ],
  'academic-agent': [
    { title: 'Agent · 灵感发现', description: '带上上下文创建云端任务', input: '围绕多模态 Agent 的长期记忆发现 3 个有价值的选题', action: 'agent' },
  ],
};

export function MockConsole({ currentView, userCredits, onUserCreditsChange, onAsk, onSearch, onAgent, onOpenBilling }: MockConsoleProps) {
  const { language } = useLanguage();
  const { market, setMarket, outcome, setOutcome, scenario } = useBilling();
  const [open, setOpen] = React.useState(false);
  const [agentBlockEditing, setAgentBlockEditing] = React.useState(false);
  const [collaboratorBlockEditing, setCollaboratorBlockEditing] = React.useState(false);
  const [workflowDelay, setWorkflowDelay] = React.useState(1200);
  const [authenticated, setAuthenticatedState] = React.useState(() => {
    try { return localStorage.getItem('wispaper-prototype-auth-state') !== 'guest'; } catch { return true; }
  });
  const [agentLoginStyle, setAgentLoginStyle] = React.useState<'inline' | 'redirect'>(() => {
    try { return localStorage.getItem('wispaper-mock-agent-login-style') === 'inline' ? 'inline' : 'redirect'; } catch { return 'redirect'; }
  });
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const dragRef = React.useRef<{ offsetX: number; offsetY: number } | null>(null);
  const floatingDragRef = React.useRef<{ offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressFloatingClickRef = React.useRef(false);
  const [inviteIdentity, setInviteIdentity] = React.useState<'wispaper' | 'qiewen'>(() => {
    try { return localStorage.getItem('wispaper-mock-invite-identity') === 'qiewen' ? 'qiewen' : 'wispaper'; } catch { return 'wispaper'; }
  });
  const pageScenarios = scenarios[currentView] ?? [];
  const isAgentPage = currentView === 'academic-agent';
  const supportsAgentBlockMock = ['academic-agent', 'research-projects', 'research-canvas'].includes(currentView);
  const supportsCanvasWorkflowMock = ['research-projects', 'research-canvas'].includes(currentView);

  const run = (scenario: Scenario) => {
    if (scenario.action === 'ask') onAsk(scenario.input);
    else if (scenario.action === 'search') onSearch(scenario.input);
    else if (scenario.action === 'search-tool') {
      window.dispatchEvent(new CustomEvent('wispaper:mock-ask-ai-deep-search'));
      setOpen(false);
    } else onAgent(scenario.input);
  };

  const retriggerTour = () => {
    try { localStorage.removeItem('wispaper-explore-tour-v1'); } catch {}
    window.dispatchEvent(new Event('wispaper:retrigger-tour'));
  };

  const toggleAgentBlockEditing = () => {
    const active = !agentBlockEditing;
    setAgentBlockEditing(active);
    if (active) setCollaboratorBlockEditing(false);
    window.dispatchEvent(new CustomEvent('wispaper:mock-agent-block-editing', { detail: { active } }));
  };

  const toggleCollaboratorBlockEditing = () => {
    const active = !collaboratorBlockEditing;
    setCollaboratorBlockEditing(active);
    if (active) setAgentBlockEditing(false);
    window.dispatchEvent(new CustomEvent('wispaper:mock-collaborator-block-editing', { detail: { active } }));
  };

  const configureInviteIdentity = (identity: 'wispaper' | 'qiewen') => {
    setInviteIdentity(identity);
    try { localStorage.setItem('wispaper-mock-invite-identity', identity); } catch {}
    window.dispatchEvent(new CustomEvent('wispaper:mock-invite-identity', { detail: { identity } }));
  };

  const configureAgentLoginStyle = (style: 'inline' | 'redirect') => {
    setAgentLoginStyle(style);
    try { localStorage.setItem('wispaper-mock-agent-login-style', style); } catch {}
    window.dispatchEvent(new CustomEvent('wispaper:mock-agent-login-style', { detail: { style } }));
  };

  return <aside className={`fixed inset-x-0 bottom-0 z-[1800] flex w-full flex-col overflow-hidden border-t border-slate-700 bg-slate-950 text-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:z-[1400] sm:w-[360px] sm:border-l sm:border-t-0 ${open ? 'top-[8vh] max-h-[92dvh]' : 'h-12'} sm:h-auto sm:max-h-none`} aria-label="Mock 控制台">
    <button type="button" className="flex h-12 shrink-0 items-center justify-between px-4 text-xs font-semibold sm:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? '收起 Mock 控制台' : '展开 Mock 控制台'}><span className="flex items-center gap-2"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock 控制台<span className="font-normal text-slate-400">· {currentView}</span></span>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</button>
    <div className={`${open ? 'flex' : 'hidden'} min-h-0 flex-col overflow-y-auto sm:flex sm:h-full sm:overflow-hidden [&>*]:shrink-0`}>
      <div className="hidden items-center justify-between border-b border-slate-800 px-4 py-4 sm:flex"><div className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock 控制台</div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">常驻</span></div>
      <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">当前页面：<span className="font-semibold text-slate-200">{currentView}</span></div>
      <div className="border-b border-slate-800 p-3"><p className="mb-2 text-xs font-semibold text-slate-300">登录状态</p><div className="grid grid-cols-2 gap-2"><button onClick={() => { setAuthenticatedState(true); setPrototypeAuthenticated(true); }} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${authenticated ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'}`}><UserRound className="h-3.5 w-3.5" />已登录</button><button onClick={() => { setAuthenticatedState(false); setPrototypeAuthenticated(false); }} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${!authenticated ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-400'}`}><Lock className="h-3.5 w-3.5" />未登录</button></div></div>
      {currentView === 'explore' && <div className="border-b border-slate-800 p-3"><button onClick={retriggerTour} className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300"><RotateCcw className="h-3.5 w-3.5" />重新触发首次打开引导</button></div>}
      {isAgentPage && <div className="border-b border-slate-800 p-3"><button onClick={() => { setAuthenticatedState(false); setPrototypeAuthenticated(false); window.dispatchEvent(new Event('wispaper:retrigger-agent-onboarding')); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300"><RotateCcw className="h-3.5 w-3.5" />{language === 'zh' ? '重新触发新用户首次引导' : 'Replay first-time onboarding'}</button></div>}
      {isAgentPage && <div className="border-b border-slate-800 p-3"><p className="mb-2 text-xs font-semibold text-slate-300">{language === 'zh' ? 'Agent 登录卡片样式' : 'Agent sign-in card'}</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => configureAgentLoginStyle('inline')} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${agentLoginStyle === 'inline' ? 'border-sky-400/60 bg-sky-400/15 text-sky-300' : 'border-slate-700 text-slate-400'}`}>Inline · Logto</button><button type="button" onClick={() => configureAgentLoginStyle('redirect')} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${agentLoginStyle === 'redirect' ? 'border-sky-400/60 bg-sky-400/15 text-sky-300' : 'border-slate-700 text-slate-400'}`}>{language === 'zh' ? '跳转登录页' : 'Redirect page'}</button></div></div>}
      {isAgentPage && <div className="border-b border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">当前积分</span><span className="font-mono text-xs text-emerald-400">{userCredits.toLocaleString()} credits</span></div><div className="grid grid-cols-2 gap-2"><button onClick={() => { onUserCreditsChange(1500); window.dispatchEvent(new CustomEvent('wispaper:mock-agent-credit-gate', { detail: { kind: 'agent' } })); }} className="rounded-lg border border-amber-500/60 bg-amber-500/15 px-2 py-2 text-xs font-semibold text-amber-300">触发 Agent 不足 · 1,500</button><button onClick={() => { onUserCreditsChange(12000); window.dispatchEvent(new CustomEvent('wispaper:mock-agent-credit-gate', { detail: { kind: 'pro' } })); }} className="rounded-lg border border-violet-500/60 bg-violet-500/15 px-2 py-2 text-xs font-semibold text-violet-300">触发 Pro 不足 · 12,000</button><button onClick={() => onUserCreditsChange(50000)} className="col-span-2 rounded-lg border border-emerald-500/60 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300">恢复积分 · 50,000</button></div><p className="mt-2 text-[11px] text-slate-500">Agent ≥ 2,000 积分；Pro Agent ≥ 40,000 积分</p></div>}
      {supportsCanvasWorkflowMock && <div className="border-b border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">完整新项目流程</span><select value={workflowDelay} onChange={(event) => setWorkflowDelay(Number(event.target.value))} aria-label="画布流程每步延迟" className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none"><option value={600}>0.6 秒/步</option><option value={1200}>1.2 秒/步</option><option value={2000}>2 秒/步</option><option value={3000}>3 秒/步</option></select></div><div className="space-y-2"><button onClick={() => { window.dispatchEvent(new CustomEvent('wispaper:mock-full-research-usecase', { detail: { delayMs: workflowDelay } })); setOpen(false); }} className="w-full rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-left hover:bg-emerald-500/15"><span className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><Play className="h-3.5 w-3.5" />新建空白项目并自动推进</span><span className="mt-1.5 block text-[11px] leading-5 text-slate-500">自动创建“长上下文模型位置偏差研究”，依次演示研究问题、文献调研、方向 Agent、实验设计、数据集、失败分支、实验运行和结果分析。</span></button><button onClick={() => { window.dispatchEvent(new CustomEvent('wispaper:mock-canvas-workflow-demo', { detail: { delayMs: workflowDelay } })); setOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/15"><Play className="h-3.5 w-3.5" />仅演示当前画布流程</button></div></div>}
      {supportsAgentBlockMock && <div className="border-b border-slate-800 p-3"><p className="mb-2 text-xs font-semibold text-slate-300">邀请用户账号体系</p><div className="grid grid-cols-2 gap-2"><button onClick={() => configureInviteIdentity('wispaper')} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${inviteIdentity === 'wispaper' ? 'border-violet-500/60 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400'}`}><Mail className="h-3.5 w-3.5" />WisPaper · 邮箱</button><button onClick={() => configureInviteIdentity('qiewen')} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${inviteIdentity === 'qiewen' ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-400'}`}><Smartphone className="h-3.5 w-3.5" />切问 · 手机号</button></div></div>}
      <div className="space-y-2 p-3 sm:min-h-0 sm:flex-1 sm:overflow-y-auto">
        <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-3" aria-label="订阅与支付 Mock">
          <p className="text-xs font-semibold text-slate-200">{language === 'zh' ? '订阅与支付' : 'Billing and payment'}</p>
          <div className="grid grid-cols-2 gap-2">{(['domestic', 'overseas'] as const).map((value) => <button key={value} type="button" aria-pressed={market === value} onClick={() => setMarket(value)} className={`rounded-lg border px-2 py-2 text-xs ${market === value ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-slate-700 text-slate-400'}`}>{value === 'domestic' ? '国内版' : 'Overseas'}</button>)}</div>
          <div className="grid grid-cols-2 gap-2">{([['new', '新用户'], ['active', '订阅中'], ['failed', '续费失败'], ['expired', '已到期']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => scenario(value)} className="rounded-lg border border-slate-700 px-2 py-2 text-xs text-slate-300 hover:bg-slate-800">{label}</button>)}</div>
          <label className="block text-xs text-slate-400">{language === 'zh' ? '下次支付结果' : 'Next payment result'}<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200"><option value="success">Success</option><option value="payment-failed">Payment failed</option><option value="sign-failed">Agreement failed</option></select></label>
          {onOpenBilling && <button type="button" onClick={onOpenBilling} className="w-full rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white">{language === 'zh' ? '打开支付与订阅' : 'Open billing'}</button>}
        </section>
        {pageScenarios.length ? pageScenarios.map((scenario) => <div key={scenario.title} className="rounded-xl border border-slate-800 bg-slate-900 p-3"><div className="text-sm font-semibold text-slate-100">{scenario.title}</div><div className="mt-1 text-xs text-slate-500">{scenario.description}</div><div className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">{scenario.input}</div><div className="mt-3 flex justify-end gap-2"><button onClick={() => navigator.clipboard?.writeText(scenario.input)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"><Copy className="h-3.5 w-3.5" />复制</button><button onClick={() => run(scenario)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"><Play className="h-3.5 w-3.5" />运行</button></div></div>) : !supportsAgentBlockMock && <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-500">当前页面暂无专属 Mock 选项。</div>}
      </div>
    </div>
  </aside>;
}
