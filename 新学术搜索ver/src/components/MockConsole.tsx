import React from 'react';
import { Copy, Lock, Mail, Play, RotateCcw, Smartphone, TerminalSquare, UserRound, X } from 'lucide-react';
import { setPrototypeAuthenticated } from '../lib/usePrototypeAuth';
import { useLanguage } from '../contexts/LanguageContext';

interface Scenario { title: string; description: string; input: string; action: 'ask' | 'search' | 'agent' | 'search-tool' }

interface MockConsoleProps {
  currentView: string;
  userCredits: number;
  onUserCreditsChange: (credits: number) => void;
  onAsk: (input: string) => void;
  onSearch: (input: string) => void;
  onAgent: (input: string) => void;
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

export function MockConsole({ currentView, userCredits, onUserCreditsChange, onAsk, onSearch, onAgent }: MockConsoleProps) {
  const { language } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const [agentBlockEditing, setAgentBlockEditing] = React.useState(false);
  const [collaboratorBlockEditing, setCollaboratorBlockEditing] = React.useState(false);
  const [workflowDelay, setWorkflowDelay] = React.useState(1200);
  const [authenticated, setAuthenticatedState] = React.useState(() => {
    try { return localStorage.getItem('wispaper-prototype-auth-state') !== 'guest'; } catch { return true; }
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

  return <aside className="fixed inset-y-0 right-0 z-[1400] flex w-[360px] flex-col overflow-hidden border-l border-slate-700 bg-slate-950 text-white shadow-2xl" aria-label="Mock 控制台">
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4"><div className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock 控制台</div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">常驻</span></div>
      <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">当前页面：<span className="font-semibold text-slate-200">{currentView}</span></div>
      <div className="border-b border-slate-800 p-3"><p className="mb-2 text-xs font-semibold text-slate-300">登录状态</p><div className="grid grid-cols-2 gap-2"><button onClick={() => { setAuthenticatedState(true); setPrototypeAuthenticated(true); }} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${authenticated ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'}`}><UserRound className="h-3.5 w-3.5" />已登录</button><button onClick={() => { setAuthenticatedState(false); setPrototypeAuthenticated(false); }} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${!authenticated ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-400'}`}><Lock className="h-3.5 w-3.5" />未登录</button></div></div>
      {currentView === 'explore' && <div className="border-b border-slate-800 p-3"><button onClick={retriggerTour} className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300"><RotateCcw className="h-3.5 w-3.5" />重新触发首次打开引导</button></div>}
      {isAgentPage && <div className="border-b border-slate-800 p-3"><button onClick={() => window.dispatchEvent(new Event('wispaper:retrigger-agent-onboarding'))} className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300"><RotateCcw className="h-3.5 w-3.5" />{language === 'zh' ? '重新触发新用户首次引导' : 'Replay first-time onboarding'}</button></div>}
      {isAgentPage && <div className="border-b border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">当前积分</span><span className="font-mono text-xs text-emerald-400">{userCredits.toLocaleString()} credits</span></div><div className="grid grid-cols-2 gap-2"><button onClick={() => onUserCreditsChange(50000)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${userCredits >= 15000 ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>积分充足 · 50,000</button><button onClick={() => onUserCreditsChange(12000)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${userCredits < 15000 ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-400'}`}>积分不足 · 12,000</button></div><p className="mt-2 text-[11px] text-slate-500">Agent 启动门槛 = 任务最低预估 + 5,000 credits</p></div>}
      {supportsCanvasWorkflowMock && <div className="border-b border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">完整新项目流程</span><select value={workflowDelay} onChange={(event) => setWorkflowDelay(Number(event.target.value))} aria-label="画布流程每步延迟" className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none"><option value={600}>0.6 秒/步</option><option value={1200}>1.2 秒/步</option><option value={2000}>2 秒/步</option><option value={3000}>3 秒/步</option></select></div><div className="space-y-2"><button onClick={() => { window.dispatchEvent(new CustomEvent('wispaper:mock-full-research-usecase', { detail: { delayMs: workflowDelay } })); setOpen(false); }} className="w-full rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-left hover:bg-emerald-500/15"><span className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><Play className="h-3.5 w-3.5" />新建空白项目并自动推进</span><span className="mt-1.5 block text-[11px] leading-5 text-slate-500">自动创建“长上下文模型位置偏差研究”，依次演示研究问题、文献调研、方向 Agent、实验设计、数据集、失败分支、实验运行和结果分析。</span></button><button onClick={() => { window.dispatchEvent(new CustomEvent('wispaper:mock-canvas-workflow-demo', { detail: { delayMs: workflowDelay } })); setOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/15"><Play className="h-3.5 w-3.5" />仅演示当前画布流程</button></div></div>}
      {supportsAgentBlockMock && <div className="border-b border-slate-800 p-3"><p className="mb-2 text-xs font-semibold text-slate-300">邀请用户账号体系</p><div className="grid grid-cols-2 gap-2"><button onClick={() => configureInviteIdentity('wispaper')} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${inviteIdentity === 'wispaper' ? 'border-violet-500/60 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400'}`}><Mail className="h-3.5 w-3.5" />WisPaper · 邮箱</button><button onClick={() => configureInviteIdentity('qiewen')} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold ${inviteIdentity === 'qiewen' ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-slate-700 text-slate-400'}`}><Smartphone className="h-3.5 w-3.5" />切问 · 手机号</button></div></div>}
      <div className="space-y-2 overflow-y-auto p-3">
        {pageScenarios.length ? pageScenarios.map((scenario) => <div key={scenario.title} className="rounded-xl border border-slate-800 bg-slate-900 p-3"><div className="text-sm font-semibold text-slate-100">{scenario.title}</div><div className="mt-1 text-xs text-slate-500">{scenario.description}</div><div className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">{scenario.input}</div><div className="mt-3 flex justify-end gap-2"><button onClick={() => navigator.clipboard?.writeText(scenario.input)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"><Copy className="h-3.5 w-3.5" />复制</button><button onClick={() => run(scenario)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"><Play className="h-3.5 w-3.5" />运行</button></div></div>) : !supportsAgentBlockMock && <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-500">当前页面暂无专属 Mock 选项。</div>}
      </div>
    </div>
  </aside>;
}
