import React from 'react';
import { Copy, Play, RotateCcw, TerminalSquare, X } from 'lucide-react';
import { useBilling } from '../contexts/BillingContext';

interface Scenario { title: string; description: string; input: string; action: 'ask' | 'search' | 'agent' }

interface MockConsoleProps {
  onOpenBilling: () => void;
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
    { title: 'Search · 深度搜索', description: '测试复杂学术检索', input: '找 2023 年后关于多模态推理数据集的论文', action: 'search' },
    { title: 'Search · 快速搜索', description: '测试已知主题', input: 'Group Relative Policy Optimization GRPO', action: 'search' },
  ],
  'academic-agent': [
    { title: 'Agent · 灵感发现', description: '带上上下文创建云端任务', input: '围绕多模态 Agent 的长期记忆发现 3 个有价值的选题', action: 'agent' },
  ],
};

export function MockConsole({ currentView, userCredits, onUserCreditsChange, onAsk, onSearch, onAgent, onOpenBilling }: MockConsoleProps) {
  const { market, setMarket, outcome, setOutcome, scenario } = useBilling();
  const [open, setOpen] = React.useState(false);
  const pageScenarios = scenarios[currentView] ?? [];
  const isAgentPage = currentView === 'academic-agent';

  const run = (scenario: Scenario) => {
    if (scenario.action === 'ask') onAsk(scenario.input);
    else if (scenario.action === 'search') onSearch(scenario.input);
    else onAgent(scenario.input);
  };

  const retriggerTour = () => {
    try { localStorage.removeItem('wispaper-explore-tour-v1'); } catch {}
    window.dispatchEvent(new Event('wispaper:retrigger-tour'));
  };

  return <div className="fixed bottom-5 right-5 z-[13000]">
    {open && <div className="mb-3 flex max-h-[min(720px,80vh)] w-[min(390px,calc(100vw-40px))] flex-col overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock 控制台</div><button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
      <div className="border-b border-slate-800 px-4 py-3 text-xs text-slate-400">当前页面：<span className="font-semibold text-slate-200">{currentView}</span></div>
      <div className="space-y-3 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between"><span className="text-sm font-semibold">地区版本</span><button type="button" role="switch" aria-label="国内版" aria-checked={market === 'domestic'} onClick={() => setMarket(market === 'domestic' ? 'overseas' : 'domestic')} className={`relative h-6 w-11 rounded-full ${market === 'domestic' ? 'bg-blue-500' : 'bg-slate-600'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${market === 'domestic' ? 'left-6' : 'left-1'}`} /></button></div>
        <div className="grid grid-cols-2 gap-2">{(['domestic', 'overseas'] as const).map((value) => <button key={value} aria-pressed={market === value} onClick={() => setMarket(value)} className={`rounded-lg border px-3 py-2 text-xs ${market === value ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-slate-700 text-slate-400'}`}>{value === 'domestic' ? '国内版 · 支付宝' : '国外版 · Stripe'}</button>)}</div>
        <p className="text-[11px] leading-5 text-slate-400">独立于语言设置；地区选择刷新后保留，会员与订单仅保留在本次演示会话。</p>
        <button onClick={() => { setOpen(false); onOpenBilling(); }} className="w-full rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white">打开支付与订阅</button>
        {market === 'domestic' && <><div className="grid grid-cols-2 gap-2">{([
          ['new', '新用户'], ['active', '自动续费已开启'], ['cancelled', '已关闭 · 未到期'], ['failed', '续费失败'], ['expired', '会员已到期'], ['external-cancel', '模拟支付宝侧取消'],
        ] as const).map(([value, label]) => <button key={value} onClick={() => scenario(value)} className="rounded-lg border border-slate-700 px-2 py-2 text-xs text-slate-300 hover:bg-slate-800">{label}</button>)}</div>
        <label className="block text-xs text-slate-400">下次模拟支付结果<select value={outcome} onChange={(event) => setOutcome(event.target.value as typeof outcome)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200"><option value="success">支付与签约成功</option><option value="payment-failed">支付失败 · 不发放权益</option><option value="sign-failed">支付成功 · 签约失败</option></select></label></>}
      </div>
      {currentView === 'explore' && <div className="border-b border-slate-800 p-3"><button onClick={retriggerTour} className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300"><RotateCcw className="h-3.5 w-3.5" />重新触发首次打开引导</button></div>}
      {isAgentPage && <div className="border-b border-slate-800 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">当前积分</span><span className="font-mono text-xs text-emerald-400">{userCredits.toLocaleString()} credits</span></div><div className="grid grid-cols-3 gap-2"><button onClick={() => onUserCreditsChange(50000)} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${userCredits >= 10000 ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>充足<br/>50,000</button><button onClick={() => onUserCreditsChange(8000)} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${userCredits > 0 && userCredits < 10000 ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-slate-700 text-slate-400'}`}>余额较低<br/>8,000</button><button onClick={() => onUserCreditsChange(0)} className={`rounded-lg border px-2 py-2 text-[11px] font-semibold ${userCredits === 0 ? 'border-blue-500/60 bg-blue-500/15 text-blue-300' : 'border-slate-700 text-slate-400'}`}>无可用积分<br/>0</button></div><p className="mt-2 text-[11px] leading-5 text-slate-500">低余额仍可启动；0 积分进入工作区后保留任务，等待补充积分。</p></div>}
      <div className="space-y-2 overflow-y-auto p-3">
        {pageScenarios.length ? pageScenarios.map((scenario) => <div key={scenario.title} className="rounded-xl border border-slate-800 bg-slate-900 p-3"><div className="text-sm font-semibold text-slate-100">{scenario.title}</div><div className="mt-1 text-xs text-slate-500">{scenario.description}</div><div className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-400">{scenario.input}</div><div className="mt-3 flex justify-end gap-2"><button onClick={() => navigator.clipboard?.writeText(scenario.input)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"><Copy className="h-3.5 w-3.5" />复制</button><button onClick={() => run(scenario)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"><Play className="h-3.5 w-3.5" />运行</button></div></div>) : <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-5 text-slate-500">当前页面暂无专属 Mock 选项。</div>}
      </div>
    </div>}
    <button onClick={() => setOpen(!open)} className="ml-auto flex h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800"><TerminalSquare className="h-4 w-4 text-emerald-400" />Mock</button>
  </div>;
}
