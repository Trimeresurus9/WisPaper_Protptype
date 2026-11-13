import React from 'react';
import { ArrowLeft, ArrowUp, BookOpen, Bot, CheckCircle2, Network, Sparkles } from 'lucide-react';

interface SurveyPageProps {
  query: string;
  onBack: () => void;
  onOpenAgent: (prompt: string) => void;
}

const taxonomy = ['策略优化基础', '组相对优化', '奖励与稳定性', '评测与泛化'];

const sections = [
  { id: 'abstract', title: 'Abstract', body: '本文系统梳理 Group Relative Policy Optimization（GRPO）及其相关研究，从策略优化基础、组相对目标、奖励建模与训练稳定性，到下游评测和泛化能力，归纳现有方法的关键假设、实证结论与待解决问题。' },
  { id: 'introduction', title: '1. Introduction', body: 'GRPO 通过组内相对优势估计减少对独立价值模型的依赖，已成为推理模型强化学习的重要路线。为组织快速增长的相关工作，本文构建如下 Taxonomy，并沿每条研究脉络展开综述。' },
  { id: 'foundations', title: '2. Policy Optimization Foundations', body: '这一脉络从 PPO、KL 约束和优势估计出发，讨论组相对优化的理论基础。研究重点是如何在减少价值网络开销的同时，维持更新幅度、样本效率和策略稳定性之间的平衡。' },
  { id: 'group-relative', title: '3. Group-Relative Optimization', body: '该方向研究组内采样、相对奖励归一化和重要性采样修正。不同方法主要在组规模、参考策略和多轮更新机制上存在差异，并直接影响推理任务中的探索能力。' },
  { id: 'reward-stability', title: '4. Reward Modeling and Stability', body: '相关工作关注奖励稀疏、长度偏差、错误奖励和梯度方差。过程级反馈、规则奖励与自适应 KL 控制逐渐结合，用于缓解训练坍塌和奖励投机。' },
  { id: 'evaluation', title: '5. Evaluation and Generalization', body: '主流研究在数学推理、代码生成和指令跟随任务上评测 GRPO，但跨模型规模、跨领域迁移和长链推理稳定性仍缺少统一基准。' },
  { id: 'future', title: '6. Research Gaps and Future Directions', body: '未来值得研究的问题包括组内样本多样性、离线经验复用、奖励可信度、训练效率，以及优化目标与真实泛化能力之间的关系。' },
];

export function SurveyPage({ query, onBack, onOpenAgent }: SurveyPageProps) {
  const [agentModel, setAgentModel] = React.useState('WisResearch Pro');
  const [project, setProject] = React.useState('长上下文推理优化研究');
  const [agentPrompt, setAgentPrompt] = React.useState('补充最新研究，并根据证据重新组织方法比较与研究空白。');

  return (
    <main className="h-full flex-1 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-5xl px-8 py-8">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />返回搜索结果
        </button>

        <article className="mt-5 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 px-10 py-9">
            <header className="border-b border-slate-200 pb-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-600"><Sparkles className="h-4 w-4" />AI Survey</div>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{query}：研究进展、方法谱系与未来方向</h1>
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500"><span>基于 50 篇核心论文</span><span>·</span><span>刚刚生成</span></div>
            </header>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-500"><BookOpen className="h-4 w-4" />结构化综述</div>
            <div className="mt-6 space-y-8">
              {sections.map((section) => (
                <section id={section.id} key={section.id}>
                  <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
                  {section.id === 'introduction' && (
                    <div className="mt-5 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Network className="h-4 w-4 text-violet-600" />Taxonomy</div>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {taxonomy.map((item, index) => <div key={item} className="rounded-lg border border-white bg-white/80 px-2 py-3 text-center text-xs text-slate-600 shadow-sm"><span className="mx-auto mb-2 grid h-5 w-5 place-items-center rounded bg-violet-100 text-[10px] font-semibold text-violet-700">{index + 1}</span>{item}</div>)}
                      </div>
                    </div>
                  )}
                </section>
              ))}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" />证据检查完成</div><p className="mt-2 text-emerald-700">关键结论均已关联来源论文。</p></div>
            </div>
          </div>

          <aside className="border-l border-slate-200 bg-slate-50/70 p-4">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-xl border border-violet-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Bot className="h-4 w-4 text-violet-600" />使用 Agent 继续修改</div>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-violet-400 focus-within:bg-white">
                  <textarea value={agentPrompt} onChange={(event) => setAgentPrompt(event.target.value)} rows={3} placeholder="告诉 Agent 如何修改当前 Survey…" className="w-full resize-none bg-transparent px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-400" />
                  <div className="flex items-center gap-1.5 border-t border-slate-200 px-2 py-1.5">
                    <select aria-label="Agent 模型" value={agentModel} onChange={(event) => setAgentModel(event.target.value)} className="max-w-[94px] rounded-md border-0 bg-white px-1.5 py-1 text-[10px] text-slate-600 outline-none">
                      <option>WisResearch Pro</option>
                      <option>WisResearch Max</option>
                      <option>Deep Scholar</option>
                    </select>
                    <select aria-label="关联 Project" value={project} onChange={(event) => setProject(event.target.value)} className="min-w-0 flex-1 rounded-md border-0 bg-white px-1.5 py-1 text-[10px] text-slate-600 outline-none">
                      <option>长上下文推理优化研究</option>
                      <option>强化学习方法调研</option>
                      <option>不关联 Project</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onOpenAgent(`使用 ${agentModel} 在 Project“${project}”中继续修改 Survey“${query}”：${agentPrompt}`)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                      aria-label="提交给 Agent"
                      title="提交给 Agent"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">目录</div>
                <nav className="mt-3 space-y-1">
                  {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block rounded-lg px-2.5 py-1.5 text-xs leading-5 text-slate-600 hover:bg-slate-50 hover:text-blue-600">{section.title}</a>)}
                </nav>
              </div>
            </div>
          </aside>
        </article>
      </div>
    </main>
  );
}
