import React, { useEffect, useState } from "react";
import inspirationDiscoveryImage from "../assets/agent-cases/inspiration-discovery.jpg";
import literatureReviewImage from "../assets/agent-cases/literature-review.jpg";
import paperReproductionImage from "../assets/agent-cases/paper-reproduction.jpg";
import {
  ArrowUp,
  Ban,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleGauge,
  Clock3,
  Code2,
  Cpu,
  Dna,
  FileText,
  FlaskConical,
  FolderKanban,
  GraduationCap,
  Image,
  Library,
  LoaderCircle,
  MessageSquareText,
  Minus,
  Moon,
  MoreHorizontal,
  Orbit,
  Paperclip,
  PanelRight,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Share2,
  SkipForward,
  Sparkles,
  TriangleAlert,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

type WorkbenchTab = "files" | "search" | "plan" | "gpu" | "bio";
type AgentTierId = "fast" | "balanced" | "primary" | "deep";
type AgentTodoStatus = "pending" | "active" | "waiting" | "blocked" | "done" | "skipped" | "failed";
type AgentTodoType = "agent" | "approval" | "user";

type GpuModelId = "rtx-4090" | "rtx-5090" | "rtx-pro-6000" | "a800" | "rtx-4080";

const gpuModels: Array<{ id: GpuModelId; name: string; memory: string; stock: number }> = [
  { id: "rtx-4090", name: "RTX 4090", memory: "48 GB", stock: 7 },
  { id: "rtx-5090", name: "RTX 5090", memory: "32 GB", stock: 4 },
  { id: "rtx-pro-6000", name: "RTX PRO 6000", memory: "96 GB", stock: 37 },
  { id: "a800", name: "A800 NVLink", memory: "80 GB", stock: 33 },
  { id: "rtx-4080", name: "RTX 4080 Super", memory: "16 GB", stock: 1 },
];

interface AgentTodo {
  id: string;
  title: string;
  detail: string;
  type: AgentTodoType;
  status: AgentTodoStatus;
}

const agentTiers: {
  id: AgentTierId;
  label: string;
  description: string;
  multiplier: string | null;
  icon: React.ElementType;
}[] = [
  { id: "fast", label: "Fast", description: "快速响应", multiplier: null, icon: Zap },
  { id: "balanced", label: "Balanced", description: "速度与深度平衡", multiplier: "1.35x", icon: CircleGauge },
  { id: "primary", label: "Primary", description: "复杂研究任务", multiplier: "2.00x", icon: WandSparkles },
  { id: "deep", label: "Deep", description: "长程深度研究", multiplier: "3.50x", icon: Orbit },
];

interface QuickTask {
  title: string;
  prompt: string;
  icon: React.ElementType;
}

interface AgentSamplePrompt {
  title: string;
  summary: string;
  prompt: string;
  credits: string;
}

interface AgentCaseStudy {
  title: string;
  field: string;
  summary: string;
  outcome: string;
  prompt: string;
  credits: string;
}

const quickTasks: QuickTask[] = [
  {
    title: "灵感发现",
    prompt: "基于我的研究兴趣和已有材料，帮我发现值得进一步探索的问题、方向与机会。",
    icon: Sparkles,
  },
  {
    title: "论文复现",
    prompt: "帮我拆解一项研究的复现路径，梳理所需材料、关键步骤、潜在风险与验收标准。",
    icon: Code2,
  },
  {
    title: "文献综述",
    prompt: "围绕我关心的研究方向，系统检索并整理相关文献，归纳主要观点、方法、证据与研究空白。",
    icon: BookOpen,
  },
];

const quickTaskSamplePrompts: Record<string, AgentSamplePrompt[]> = {
  灵感发现: [
    {
      title: "从已有材料提炼研究机会",
      summary: "梳理笔记、论文与阶段性想法，识别值得验证的矛盾、缺口和下一步方向。",
      prompt: "分析我已有的研究材料，归纳关键线索，并提出若干值得继续验证的问题与探索路径。",
      credits: "8K",
    },
    {
      title: "比较相邻方向寻找突破口",
      summary: "对照相关研究方向的目标、方法与证据，发现可迁移思路和潜在创新空间。",
      prompt: "比较几个相邻研究方向的核心问题与常用方法，帮我识别可能的交叉机会和突破口。",
      credits: "10K",
    },
    {
      title: "把零散想法变成候选问题",
      summary: "聚合日常记录中的反复线索，评估新颖性、可验证性与潜在影响，形成候选问题池。",
      prompt: "整理我提供的零散想法，归纳反复出现的线索，并生成一组可比较、可验证的候选研究问题。",
      credits: "9K",
    },
  ],
  论文复现: [
    {
      title: "从论文到可执行复现清单",
      summary: "拆解环境、数据、实现步骤、关键假设与验收指标，形成可跟进的执行计划。",
      prompt: "根据我提供的论文，生成一份可执行的复现清单，并标注依赖、风险和验收标准。",
      credits: "12K",
    },
    {
      title: "定位复现差异与失败原因",
      summary: "对照原论文和当前结果，系统排查数据、配置、实现与评估环节的偏差。",
      prompt: "对照论文描述与我的复现过程，帮助定位结果差异的可能来源，并给出优先排查顺序。",
      credits: "15K",
    },
    {
      title: "评估复现任务的可行性",
      summary: "在投入执行前检查代码、数据、算力、时间与评估条件，提前识别关键阻塞点。",
      prompt: "评估我准备复现的研究是否具备执行条件，并列出资源缺口、风险和替代方案。",
      credits: "8K",
    },
  ],
  文献综述: [
    {
      title: "快速建立主题证据地图",
      summary: "按研究问题、方法、数据与结论组织文献，形成结构清晰、可追溯的证据框架。",
      prompt: "围绕我关心的研究方向检索并整理文献，建立包含问题、方法、证据和结论的主题地图。",
      credits: "10K",
    },
    {
      title: "从研究脉络识别空白",
      summary: "追踪代表性工作的演进关系，归纳共识、争议、局限与尚未解决的问题。",
      prompt: "梳理一个研究方向的发展脉络，归纳主要共识与争议，并指出值得继续研究的空白。",
      credits: "14K",
    },
    {
      title: "设计综述检索与纳入标准",
      summary: "把研究目标转成可执行的检索式、筛选条件和质量评估框架，降低遗漏与偏差。",
      prompt: "根据我的综述目标，设计检索策略、文献纳入排除标准和质量评估框架。",
      credits: "9K",
    },
  ],
};

const quickTaskCaseStudies: Record<string, AgentCaseStudy[]> = {
  灵感发现: [
    {
      title: "从冲突证据中找到新的研究切口",
      field: "跨领域探索",
      summary: "Agent 对照多组结论不一致的研究，追踪差异来自样本、方法还是假设，形成可验证的新问题。",
      outcome: "产出 3 个候选问题与优先验证路径",
      prompt: "参考这个案例，分析我提供的材料中有哪些冲突证据，并把它们转化为可验证的研究问题。",
      credits: "10K",
    },
    {
      title: "把相邻领域的方法迁移为新假设",
      field: "方法创新",
      summary: "Agent 比较相邻方向的目标与工具，识别可迁移方法，并评估迁移后的适用条件和潜在价值。",
      outcome: "形成方法迁移矩阵与验证建议",
      prompt: "参考这个案例，比较与我的方向相邻的研究方法，提出可迁移的新假设和最小验证方案。",
      credits: "15K",
    },
    {
      title: "从长期记录中发现隐藏模式",
      field: "研究洞察",
      summary: "Agent 聚合跨阶段的笔记与阅读记录，识别反复出现但尚未被明确表达的研究线索。",
      outcome: "得到线索聚类、候选解释与验证顺序",
      prompt: "参考这个案例，分析我的长期研究记录，找出隐藏模式，并生成可验证的解释与下一步。",
      credits: "12K",
    },
  ],
  论文复现: [
    {
      title: "从论文描述搭建最小可验证实验",
      field: "复现规划",
      summary: "Agent 将零散的方法描述转成环境、数据、实现与评估清单，优先复现决定结论的关键环节。",
      outcome: "获得分阶段复现计划与验收标准",
      prompt: "参考这个案例，把我提供的论文拆成最小可验证实验，并生成分阶段执行与验收清单。",
      credits: "12K",
    },
    {
      title: "系统定位复现结果偏差",
      field: "实验诊断",
      summary: "Agent 对照原始设置与当前日志，按数据、环境、实现和指标逐层缩小结果差异的来源。",
      outcome: "输出偏差假设、证据与排查优先级",
      prompt: "参考这个案例，对照论文与我的复现记录，定位结果偏差，并给出按优先级排序的排查步骤。",
      credits: "18K",
    },
    {
      title: "在资源受限条件下完成核心复现",
      field: "资源规划",
      summary: "Agent 识别最能支撑论文结论的核心实验，并根据现有算力和时间压缩复现范围。",
      outcome: "获得低成本实验组合与取舍说明",
      prompt: "参考这个案例，根据我的资源限制，设计能够验证论文核心结论的最小复现方案。",
      credits: "14K",
    },
  ],
  文献综述: [
    {
      title: "建立可追溯的主题证据地图",
      field: "证据综述",
      summary: "Agent 按问题、方法、数据和结论组织代表性研究，让每个综述判断都能追溯到原始证据。",
      outcome: "形成主题结构、证据表与引用线索",
      prompt: "参考这个案例，为我的研究方向建立可追溯的证据地图，并给出综述结构和文献纳入标准。",
      credits: "14K",
    },
    {
      title: "解释文献中的冲突结论",
      field: "比较综述",
      summary: "Agent 聚类相互矛盾的研究结论，比较研究设计与适用边界，避免把差异简单归结为方法优劣。",
      outcome: "输出争议地图与条件化结论",
      prompt: "参考这个案例，找出我提供文献中的冲突结论，并解释差异可能来自哪些研究条件。",
      credits: "16K",
    },
    {
      title: "把大规模检索转成清晰综述结构",
      field: "知识组织",
      summary: "Agent 对大量文献做主题聚类与证据分层，避免综述停留在逐篇摘要和简单罗列。",
      outcome: "形成章节结构、主题关系与证据优先级",
      prompt: "参考这个案例，把我检索到的大量文献组织成清晰的主题结构和可追溯的综述框架。",
      credits: "20K",
    },
  ],
};

const quickTaskCaseImages: Record<string, string> = {
  灵感发现: inspirationDiscoveryImage,
  论文复现: paperReproductionImage,
  文献综述: literatureReviewImage,
};

const moreTools = [
  { label: "配置 GPU", icon: Cpu },
  { label: "论文主图", icon: Image },
  { label: "论文评审", icon: MessageSquareText },
  { label: "Idea 升华", icon: WandSparkles },
  { label: "LaTeX 写作", icon: FileText },
  { label: "实验设计", icon: FlaskConical },
  { label: "Library 管理", icon: Library },
];

const tabs: { id: WorkbenchTab; label: string; icon: React.ElementType }[] = [
  { id: "plan", label: "执行计划", icon: Sparkles },
  { id: "files", label: "任务文件", icon: FolderKanban },
  { id: "search", label: "检索结果", icon: Search },
  { id: "bio", label: "生信", icon: Dna },
  { id: "gpu", label: "运行环境", icon: Cpu },
];

const bioSkills = [
  { id: "method", name: "统计方法快速验证", detail: "根据样本量、变量数、数据类型和实验设计检查方法选择", tags: ["场景判断", "统计设计"], icon: FlaskConical },
  { id: "de", name: "差异表达分析", detail: "RNA-seq、单细胞与蛋白组差异检验及多重校正", tags: ["DESeq2", "limma", "Wilcoxon"], icon: BarChart3 },
  { id: "survival", name: "生存分析", detail: "Kaplan–Meier、Log-rank、Cox 回归与比例风险检验", tags: ["生存结局", "Cox"], icon: Clock3 },
  { id: "dimension", name: "降维与可视化", detail: "PCA、UMAP、t-SNE 的选择、参数检查与解释", tags: ["PCA", "UMAP", "t-SNE"], icon: Orbit },
  { id: "cluster", name: "聚类分析", detail: "层次聚类、K-means、图聚类与稳定性评估", tags: ["无监督", "稳定性"], icon: CircleGauge },
  { id: "enrichment", name: "功能富集分析", detail: "ORA、GSEA、通路数据库选择与背景集校验", tags: ["GO", "KEGG", "GSEA"], icon: Library },
  { id: "batch", name: "批次效应校正", detail: "ComBat、Harmony、混合模型及校正前后诊断", tags: ["ComBat", "Harmony"], icon: WandSparkles },
  { id: "tests", name: "常用统计检验", detail: "参数与非参数检验、效应量、置信区间和功效分析", tags: ["假设检验", "效应量"], icon: GraduationCap },
];

const initialAgentTodos: AgentTodo[] = [
  {
    id: "scope",
    title: "明确问题与检索范围",
    detail: "确认研究对象、时间范围与核心概念。",
    type: "agent",
    status: "pending",
  },
  {
    id: "search",
    title: "检索并筛选相关论文",
    detail: "搜索高相关文献，并按主题与证据质量完成初筛。",
    type: "agent",
    status: "pending",
  },
  {
    id: "criteria",
    title: "确认论文纳入标准",
    detail: "需要你确认是否只纳入近五年的英文全文论文。",
    type: "approval",
    status: "pending",
  },
  {
    id: "evidence",
    title: "建立证据表与方法分类",
    detail: "提取方法、数据、指标与主要结论，形成结构化证据表。",
    type: "agent",
    status: "pending",
  },
  {
    id: "output",
    title: "提炼研究空白并输出方案",
    detail: "综合证据与冲突，输出可继续推进的研究计划。",
    type: "agent",
    status: "pending",
  },
];

function AgentComposer({
  prompt,
  setPrompt,
  onSubmit,
  selectedAgent,
  onAgentChange,
  selectedSkill,
  onSelectSkill,
  onClearSkill,
  disabled = false,
  compact = false,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  selectedAgent: AgentTierId;
  onAgentChange: (value: AgentTierId) => void;
  selectedSkill: string | null;
  onSelectSkill: (task: QuickTask, includePrompt: boolean) => void;
  onClearSkill: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [showTools, setShowTools] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const currentAgent = agentTiers.find((tier) => tier.id === selectedAgent) ?? agentTiers[1];
  const CurrentAgentIcon = currentAgent.icon;
  const selectedTask = quickTasks.find((task) => task.title === selectedSkill);
  const SelectedSkillIcon = selectedTask?.icon;

  return (
    <div className="relative">
      {(showTools || showMore) && (
        <div className="absolute bottom-[calc(100%+12px)] left-0 z-30 flex items-end gap-2">
          {showTools && (
            <div className="w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.42)]">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100">
                <Paperclip className="h-4 w-4 text-slate-500" />
                上传附件
              </button>
              <div className="my-1 border-t border-slate-100" />
              {quickTasks.slice(0, 3).map((task) => {
                const Icon = task.icon;
                return (
                  <button
                    key={task.title}
                    type="button"
                    onClick={() => {
                      onSelectSkill(task, false);
                      setShowTools(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                    aria-label={`添加 ${task.title} Skill`}
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    {task.title}
                  </button>
                );
              })}
              <button
                onClick={() => setShowMore((value) => !value)}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  showMore ? "bg-slate-100 text-slate-950" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                更多
                <ChevronRight className="ml-auto h-4 w-4" />
              </button>
            </div>
          )}
          {showMore && (
            <div className="w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.42)]">
              {moreTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.label}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    {tool.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showAgents && (
        <div className="absolute bottom-[calc(100%+12px)] left-11 z-40 w-[300px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.42)]">
          {agentTiers.map((tier) => {
            const Icon = tier.icon;
            const active = tier.id === selectedAgent;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  onAgentChange(tier.id);
                  setShowAgents(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
                aria-pressed={active}
                aria-label={`${tier.label} ${tier.description}${tier.multiplier ? ` ${tier.multiplier}` : ""}`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-slate-950" : "text-slate-500"}`} />
                <p className="min-w-0 flex-1 text-sm font-medium text-slate-800">{tier.label}</p>
                {tier.multiplier && (
                  <span className="tabular-nums text-xs text-slate-500">{tier.multiplier}</span>
                )}
                {active && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
              </button>
            );
          })}
          <div className="mx-3 mt-1 border-t border-slate-100" />
          <p className="px-3 pb-1 pt-2 text-[10px] leading-4 text-slate-400">倍率代表 Credits 消耗系数</p>
        </div>
      )}

      <div
        className={`rounded-[22px] border border-slate-200 bg-white text-left shadow-[0_18px_55px_-30px_rgba(15,23,42,0.38)] transition focus-within:border-slate-300 focus-within:shadow-[0_22px_65px_-28px_rgba(15,23,42,0.44)] ${
          compact ? "p-2.5" : "p-3.5"
        }`}
      >
        <div className="flex items-start gap-2 px-2">
          {selectedTask && SelectedSkillIcon && (
            <button
              type="button"
              onClick={onClearSkill}
              className="group mt-1.5 inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-200"
              aria-label={`移除 ${selectedTask.title} Skill`}
              title="点击移除 Skill"
            >
              <SelectedSkillIcon className="h-4 w-4 text-blue-400" />
              {selectedTask.title}
              <X className="hidden h-3 w-3 text-slate-400 group-hover:block" />
            </button>
          )}
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="描述你的研究目标，或输入 / 选择工具"
            className={`min-w-0 flex-1 resize-none bg-transparent text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 ${
              compact ? "h-16 py-1.5" : "h-28 py-2"
            }`}
          />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowTools((value) => !value);
                if (showTools) setShowMore(false);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
                showTools
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              aria-label="添加附件或选择工具"
              aria-expanded={showTools}
            >
              <Plus className={`h-5 w-5 transition-transform ${showTools ? "rotate-45" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAgents((value) => !value);
                setShowTools(false);
                setShowMore(false);
              }}
              className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition active:scale-[0.98] ${
                showAgents
                  ? "border-slate-300 bg-slate-100 text-slate-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              aria-label="切换 Agent"
              aria-expanded={showAgents}
            >
              <CurrentAgentIcon className="h-4 w-4" />
              {currentAgent.label}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAgents ? "rotate-180" : ""}`} />
            </button>
          </div>
          <button
            onClick={onSubmit}
            disabled={!prompt.trim() || disabled}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200"
            aria-label="发送"
          >
            {disabled ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function GpuConfigPanel() {
  const [selectedGpu, setSelectedGpu] = useState<GpuModelId>("rtx-4090");
  const [region, setRegion] = useState("新加坡 A");
  const [imageVersion, setImageVersion] = useState("PyTorch 2.8 · CUDA 12.8 · Ubuntu 24.04");
  const [quantity, setQuantity] = useState(1);
  const [launchState, setLaunchState] = useState<"idle" | "launching" | "ready">("idle");

  const selectedModel = gpuModels.find((model) => model.id === selectedGpu) ?? gpuModels[0];
  const updateQuantity = (next: number) => setQuantity(Math.min(selectedModel.stock, Math.max(1, next)));

  const launchInstance = () => {
    if (launchState !== "idle") return;
    setLaunchState("launching");
    window.setTimeout(() => setLaunchState("ready"), 1200);
  };

  return (
    <section className="flex min-h-full flex-col">
      <div className="flex-1 px-1 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Agent 工作台</p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em]">GPU 配置</h3>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${launchState === "ready" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
            {launchState === "ready" ? "运行中" : "按需启动"}
          </span>
        </div>

        {launchState === "ready" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Check className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">GPU 实例已启动</p>
                <p className="mt-0.5 text-xs text-slate-500">环境已连接到当前 Agent 会话</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/80 p-3">
                <dt className="text-slate-400">GPU</dt>
                <dd className="mt-1 font-medium text-slate-800">{quantity} × {selectedModel.name}</dd>
              </div>
              <div className="rounded-xl bg-white/80 p-3">
                <dt className="text-slate-400">区域</dt>
                <dd className="mt-1 font-medium text-slate-800">{region}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setLaunchState("idle")}
              className="mt-4 w-full rounded-xl border border-emerald-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-slate-950"
            >
              重新配置
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">GPU 型号</label>
                <span className="text-[11px] text-slate-400">选择适合任务的计算资源</span>
              </div>
              <div className="space-y-2">
                {gpuModels.map((model) => {
                  const selected = selectedGpu === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedGpu(model.id);
                        setQuantity((value) => Math.min(value, model.stock));
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition active:scale-[0.995] ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>
                        <span className="text-sm font-semibold">{model.name}</span>
                        <span className={`ml-2 text-xs ${selected ? "text-white/55" : "text-slate-400"}`}>{model.memory}</span>
                      </span>
                      <span className={`text-xs font-medium ${selected ? "text-white/65" : model.stock <= 1 ? "text-amber-600" : "text-emerald-600"}`}>
                        库存 {model.stock}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">区域</span>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="mt-2 h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option>新加坡 A</option>
                  <option>中国香港 A</option>
                  <option>美国西部 A</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">实例数量</span>
                <span className="mt-2 flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:text-slate-200"
                    aria-label="减少实例数量"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(quantity + 1)}
                    disabled={quantity >= selectedModel.stock}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:text-slate-200"
                    aria-label="增加实例数量"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </span>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-slate-600">镜像版本</span>
              <select
                value={imageVersion}
                onChange={(event) => setImageVersion(event.target.value)}
                className="mt-2 h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option>PyTorch 2.8 · CUDA 12.8 · Ubuntu 24.04</option>
                <option>PyTorch 2.6 · CUDA 12.4 · Ubuntu 22.04</option>
                <option>TensorFlow 2.18 · CUDA 12.5 · Ubuntu 22.04</option>
              </select>
            </label>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">本次配置</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{quantity} × {selectedModel.name} · {region}</p>
                </div>
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">确认后系统将自动开机，并把 GPU 环境连接到当前 Agent 会话。</p>
            </div>
          </>
        )}
      </div>

      {launchState !== "ready" && (
        <div className="sticky bottom-0 border-t border-slate-200 bg-[#f7f9fc]/95 px-1 pb-1 pt-4 backdrop-blur">
          <button
            type="button"
            onClick={launchInstance}
            disabled={launchState === "launching"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-500"
          >
            {launchState === "launching" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
            {launchState === "launching" ? "正在启动环境" : "确认并启动"}
          </button>
        </div>
      )}
    </section>
  );
}

function WorkbenchPanel({
  activeTab,
  running,
  planReady,
  planAccepted,
  todos,
  onAcceptPlan,
  onToggleRunning,
  onTodoStatusChange,
  onAddTodo,
  onStartBioSkill,
}: {
  activeTab: WorkbenchTab;
  running: boolean;
  planReady: boolean;
  planAccepted: boolean;
  todos: AgentTodo[];
  onAcceptPlan: () => void;
  onToggleRunning: () => void;
  onTodoStatusChange: (id: string, status: AgentTodoStatus) => void;
  onAddTodo: (title: string) => void;
  onStartBioSkill: (prompt: string) => void;
}) {
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
  const [menuTodoId, setMenuTodoId] = useState<string | null>(null);
  const [addingTodo, setAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [activeBioSkill, setActiveBioSkill] = useState("method");
  const [bioScenario, setBioScenario] = useState({
    sampleSize: "medium",
    variables: "few",
    dataType: "continuous",
    groups: "two",
    design: "independent",
    distribution: "unknown",
  });
  const completedCount = todos.filter((todo) => todo.status === "done" || todo.status === "skipped").length;
  const attentionCount = todos.filter((todo) => todo.status === "waiting" || todo.status === "blocked" || todo.status === "failed").length;
  const bioRecommendation = (() => {
    const { sampleSize, variables, dataType, groups, design, distribution } = bioScenario;
    if (dataType === "survival") return {
      primary: groups === "two" ? "Kaplan–Meier + Log-rank 检验" : "Cox 比例风险回归",
      alternative: "若比例风险假设不成立，使用分层 Cox、时间依赖 Cox 或 RMST 比较",
      checks: ["检查删失是否独立", "报告 HR 与 95% CI", "使用 Schoenfeld 残差检验比例风险假设"],
    };
    if (dataType === "count") return {
      primary: variables === "high" ? "DESeq2 / edgeR 负二项模型" : "负二项回归或 Poisson 回归",
      alternative: "过度离散明显时避免普通 Poisson；零值过多可评估零膨胀模型",
      checks: ["使用原始 count 而非 TPM 做差异检验", "校正测序深度与批次", "高维比较执行 BH-FDR 校正"],
    };
    if (dataType === "categorical") return {
      primary: sampleSize === "small" ? "Fisher 精确检验" : "卡方检验",
      alternative: design === "paired" ? "McNemar 检验" : "Logistic 回归（需要协变量校正时）",
      checks: ["检查期望频数", "同时报告风险比或优势比", "多分类结局考虑多项 Logistic 回归"],
    };
    if (design === "repeated") return {
      primary: "线性混合效应模型",
      alternative: "分布明显偏态时使用广义线性混合模型或稳健标准误",
      checks: ["个体作为随机效应", "显式建模时间与组别交互", "避免把重复测量当独立样本"],
    };
    if (design === "paired") return {
      primary: distribution === "normal" ? "配对 t 检验" : "Wilcoxon 符号秩检验",
      alternative: "存在协变量或多个时间点时使用混合效应模型",
      checks: ["检验配对差值的分布", "报告配对效应量与置信区间", "缺失配对样本需说明处理策略"],
    };
    if (groups === "multiple") return {
      primary: distribution === "normal" ? "单因素 ANOVA + Tukey 事后检验" : "Kruskal–Wallis + Dunn 事后检验",
      alternative: "存在协变量时使用 ANCOVA 或多元回归",
      checks: ["检查方差齐性", "总体检验显著后再做组间比较", "事后比较执行多重校正"],
    };
    return {
      primary: distribution === "normal" && sampleSize !== "small" ? "独立样本 t 检验" : "Mann–Whitney U 检验",
      alternative: "需要调整年龄、性别或批次时使用线性/广义线性回归",
      checks: [variables === "high" ? "变量数量高，必须控制 FDR 并考虑降维" : "同时报告效应量和 95% CI", sampleSize === "small" ? "小样本优先展示原始点并谨慎解释 P 值" : "检查异常值与方差齐性", "在分析前明确主要终点"],
    };
  })();

  const statusMeta: Record<AgentTodoStatus, { label: string; icon: React.ElementType; color: string }> = {
    pending: { label: "待执行", icon: Clock3, color: "text-slate-400" },
    active: { label: running ? "进行中" : "已暂停", icon: running ? LoaderCircle : Pause, color: "text-blue-600" },
    waiting: { label: "等待确认", icon: CircleGauge, color: "text-amber-600" },
    blocked: { label: "已阻塞", icon: Ban, color: "text-amber-700" },
    done: { label: "已完成", icon: CheckCircle2, color: "text-emerald-600" },
    skipped: { label: "已跳过", icon: SkipForward, color: "text-slate-400" },
    failed: { label: "执行失败", icon: TriangleAlert, color: "text-red-600" },
  };

  const submitNewTodo = () => {
    const title = newTodoTitle.trim();
    if (!title) return;
    onAddTodo(title);
    setNewTodoTitle("");
    setAddingTodo(false);
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      {activeTab === "plan" && (
        <section>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Agent 工作台</p>
              <h3 className="mt-1 text-base font-semibold">执行计划</h3>
            </div>
            {planAccepted && completedCount < todos.length && attentionCount === 0 && (
              <button
                type="button"
                onClick={onToggleRunning}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 active:scale-[0.98]"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? "暂停" : "继续"}
              </button>
            )}
          </div>

          {!planReady ? (
            <div className="mt-6 space-y-3" aria-label="正在生成执行计划">
              {[88, 72, 80, 64].map((width, index) => (
                <div key={width} className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3.5">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 animate-pulse rounded-full bg-slate-200" style={{ width: `${width}%`, animationDelay: `${index * 80}ms` }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{completedCount}/{todos.length} 已完成</span>
                  {attentionCount > 0 ? (
                    <span className="text-amber-700">{attentionCount} 项需要处理</span>
                  ) : (
                    <span className="text-slate-400">计划已同步</span>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {todos.map((todo, index) => {
                  const meta = statusMeta[todo.status];
                  const StatusIcon = meta.icon;
                  const expanded = expandedTodoId === todo.id;
                  const menuOpen = menuTodoId === todo.id;
                  const muted = todo.status === "done" || todo.status === "skipped";

                  return (
                    <article
                      key={todo.id}
                      className={`relative rounded-xl border transition ${
                        todo.status === "active"
                          ? "border-blue-200 bg-blue-50/75"
                          : todo.status === "waiting" || todo.status === "blocked"
                            ? "border-amber-200 bg-amber-50/70"
                            : todo.status === "failed"
                              ? "border-red-200 bg-red-50/70"
                              : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3 px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedTodoId(expanded ? null : todo.id)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          aria-expanded={expanded}
                        >
                          <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color} ${todo.status === "active" && running ? "animate-spin" : ""}`} />
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-medium leading-5 ${muted ? "text-slate-400 line-through" : "text-slate-800"}`}>
                              {index + 1}. {todo.title}
                            </span>
                            <span className={`mt-1 block text-[11px] ${meta.color}`}>{meta.label}</span>
                          </span>
                          <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                        </button>
                        {todo.status !== "done" && todo.status !== "skipped" && (
                          <button
                            type="button"
                            onClick={() => setMenuTodoId(menuOpen ? null : todo.id)}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                            aria-label={`管理 ${todo.title}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {expanded && (
                        <div className="border-t border-slate-200/70 px-10 pb-3 pt-2.5">
                          <p className="text-xs leading-5 text-slate-500">{todo.detail}</p>
                          <p className="mt-2 text-[10px] text-slate-400">
                            {todo.type === "approval" ? "需要用户确认" : todo.type === "user" ? "由你完成" : "由 Agent 执行"}
                          </p>
                        </div>
                      )}

                      {menuOpen && (
                        <div className="absolute right-2 top-11 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-[0_18px_42px_-22px_rgba(15,23,42,0.42)]">
                          {todo.status === "active" && (
                            <>
                              <button onClick={() => { onTodoStatusChange(todo.id, "done"); setMenuTodoId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                                <CheckCircle2 className="h-3.5 w-3.5" />标记完成
                              </button>
                              <button onClick={() => { onTodoStatusChange(todo.id, "blocked"); setMenuTodoId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                                <Ban className="h-3.5 w-3.5" />设为阻塞
                              </button>
                            </>
                          )}
                          {todo.status === "waiting" && (
                            <button onClick={() => { onTodoStatusChange(todo.id, "done"); setMenuTodoId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                              <Check className="h-3.5 w-3.5" />确认并继续
                            </button>
                          )}
                          {(todo.status === "blocked" || todo.status === "failed") && (
                            <button onClick={() => { onTodoStatusChange(todo.id, "active"); setMenuTodoId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                              <RotateCcw className="h-3.5 w-3.5" />重试
                            </button>
                          )}
                          {todo.status === "pending" && (
                            <button onClick={() => { onTodoStatusChange(todo.id, todo.type === "approval" ? "waiting" : "active"); setMenuTodoId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50">
                              <Play className="h-3.5 w-3.5" />设为下一项
                            </button>
                          )}
                          <button onClick={() => { onTodoStatusChange(todo.id, "skipped"); setMenuTodoId(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-500 hover:bg-slate-50">
                            <SkipForward className="h-3.5 w-3.5" />跳过
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {addingTodo ? (
                <div className="mt-3 rounded-xl border border-blue-200 bg-white p-2.5">
                  <input
                    autoFocus
                    value={newTodoTitle}
                    onChange={(event) => setNewTodoTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submitNewTodo();
                      if (event.key === "Escape") setAddingTodo(false);
                    }}
                    placeholder="输入新的执行步骤"
                    className="w-full bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
                  />
                  <div className="mt-2 flex justify-end gap-1.5">
                    <button onClick={() => setAddingTodo(false)} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50">取消</button>
                    <button onClick={submitNewTodo} disabled={!newTodoTitle.trim()} className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white disabled:bg-slate-200">添加</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTodo(true)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/50 py-2.5 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:bg-white hover:text-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />添加步骤
                </button>
              )}

              {!planAccepted && (
                <div className="mt-4 rounded-2xl bg-slate-950 p-3.5 text-white">
                  <p className="text-xs font-medium">确认后 Agent 将按此计划执行</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/55">开始前可以调整步骤，执行中仍可暂停或处理阻塞项。</p>
                  <button
                    type="button"
                    onClick={onAcceptPlan}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50 active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4" />确认并开始
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeTab === "files" && (
        <section>
          <p className="text-xs font-medium text-slate-500">Agent 工作台</p>
          <h3 className="mt-1 text-base font-semibold">任务文件</h3>
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
            <FileText className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm font-medium">产物将在这里生成</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">支持 PDF、Markdown、代码和数据文件</p>
          </div>
        </section>
      )}
      {activeTab === "search" && (
        <section>
          <p className="text-xs font-medium text-slate-500">Agent 工作台</p>
          <h3 className="mt-1 text-base font-semibold">检索结果</h3>
          <p className="mt-2 text-xs text-slate-500">已找到 24 篇高相关论文</p>
          <div className="mt-4 space-y-3">
            {[
              "MemoryBank: Enhancing Large Language Models with Long-Term Memory",
              "Generative Agents: Interactive Simulacra of Human Behavior",
              "A Survey on the Memory Mechanism of LLM-based Agents",
            ].map((paper) => (
              <article key={paper} className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200">
                <p className="text-sm font-medium leading-5">{paper}</p>
                <p className="mt-2 text-xs text-slate-500">高相关 · 2024</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {activeTab === "bio" && (
        <section>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-emerald-700">Agent Skills</p>
              <h3 className="mt-1 text-lg font-semibold">生信分析</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">选择常用 Skill，或先验证实验场景与统计方法是否匹配。</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">8 Skills</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {bioSkills.map((skill) => {
              const SkillIcon = skill.icon;
              const active = activeBioSkill === skill.id;
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    setActiveBioSkill(skill.id);
                    if (skill.id === "method") {
                      onStartBioSkill(`请使用「统计方法快速验证」Skill 帮我确认分析方案。当前场景：样本量=${bioScenario.sampleSize}，变量规模=${bioScenario.variables}，数据类型=${bioScenario.dataType}，组数=${bioScenario.groups}，实验设计=${bioScenario.design}，分布假设=${bioScenario.distribution}。当前初步推荐为「${bioRecommendation.primary}」。请先核对关键前提，再通过对话补充缺失信息。`);
                    } else {
                      onStartBioSkill(`请使用「${skill.name}」生信 Skill 帮我开展分析。${skill.detail}。请先询问我的数据类型、样本信息、实验设计和预期产出，再给出可执行的分析流程。`);
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition ${active ? "border-emerald-300 bg-emerald-50/80 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}><SkillIcon className="h-4 w-4" /></span>
                    <span className="text-xs font-semibold leading-4 text-slate-800">{skill.name}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">{skill.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{skill.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{tag}</span>)}</div>
                </button>
              );
            })}
          </div>

          {activeBioSkill === "method" ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white"><FlaskConical className="h-4.5 w-4.5" /></span>
                <div><h4 className="text-sm font-semibold">统计方法快速验证</h4><p className="mt-0.5 text-[11px] text-slate-500">填写实验条件，即时检查推荐方法</p></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["sampleSize", "样本数量", [["small", "少于 20"], ["medium", "20–100"], ["large", "大于 100"]]],
                  ["variables", "变量数量", [["one", "单变量"], ["few", "2–10 个"], ["high", "高维（>100）"]]],
                  ["dataType", "数据类型", [["continuous", "连续型"], ["count", "计数 / 组学"], ["categorical", "分类变量"], ["survival", "生存结局"]]],
                  ["groups", "比较组数", [["two", "两组"], ["multiple", "三组及以上"]]],
                  ["design", "实验设计", [["independent", "独立样本"], ["paired", "配对样本"], ["repeated", "重复测量"]]],
                  ["distribution", "分布假设", [["normal", "近似正态"], ["non-normal", "明显偏态"], ["unknown", "暂不确定"]]],
                ].map(([key, label, options]) => (
                  <label key={key as string} className="block">
                    <span className="mb-1.5 block text-[10px] font-medium text-slate-500">{label as string}</span>
                    <select
                      value={bioScenario[key as keyof typeof bioScenario]}
                      onChange={(event) => setBioScenario((value) => ({ ...value, [key as string]: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                    >
                      {(options as string[][]).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-slate-950 p-4 text-white">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">推荐方法</p>
                <p className="mt-1.5 text-sm font-semibold">{bioRecommendation.primary}</p>
                <p className="mt-2 text-[11px] leading-5 text-white/65">{bioRecommendation.alternative}</p>
                <div className="mt-3 border-t border-white/10 pt-3">
                  {bioRecommendation.checks.map((check) => <p key={check} className="mt-1.5 flex gap-2 text-[10px] leading-4 text-white/70"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />{check}</p>)}
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-slate-400">建议仅用于快速验证分析方向；正式分析仍需结合抽样机制、缺失数据、混杂因素与预注册方案。</p>
            </div>
          ) : (() => {
            const skill = bioSkills.find((item) => item.id === activeBioSkill)!;
            const SkillIcon = skill.icon;
            return <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><SkillIcon className="h-5 w-5" /></span>
              <h4 className="mt-3 text-base font-semibold">{skill.name}</h4>
              <p className="mt-2 text-xs leading-5 text-slate-500">{skill.detail}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{skill.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">{tag}</span>)}</div>
              <button type="button" onClick={() => onStartBioSkill(`请使用「${skill.name}」生信 Skill 帮我开展分析。请通过对话收集样本量、变量数量、数据类型和实验设计。`)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"><Sparkles className="h-3.5 w-3.5" />进入对话使用 Skill</button>
            </div>;
          })()}
        </section>
      )}
      {activeTab === "gpu" && (
        <GpuConfigPanel />
      )}
    </div>
  );
}

export function AcademicAgent({ onOpenProjects, initialPrompt = "" }: { onOpenProjects: () => void; initialPrompt?: string }) {
  const [prompt, setPrompt] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [planAccepted, setPlanAccepted] = useState(false);
  const [todos, setTodos] = useState<AgentTodo[]>(initialAgentTodos);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("plan");
  const [panelOpen, setPanelOpen] = useState(true);
  const [taskTitle, setTaskTitle] = useState("新研究任务");
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentTierId>("balanced");
  const [activeCaseTab, setActiveCaseTab] = useState(quickTasks[0].title);
  const [canvasContextCount, setCanvasContextCount] = useState(0);
  const taskCompleted = planAccepted && todos.every((todo) => todo.status === "done" || todo.status === "skipped");
  const taskNeedsAttention = planAccepted && todos.some((todo) => todo.status === "waiting" || todo.status === "blocked" || todo.status === "failed");
  const activeSamplePrompts = quickTaskSamplePrompts[activeCaseTab] ?? [];
  const activeCaseStudies = quickTaskCaseStudies[activeCaseTab] ?? [];
  const activeCaseTask = quickTasks.find((task) => task.title === activeCaseTab) ?? quickTasks[0];
  const activeCaseImage = quickTaskCaseImages[activeCaseTab] ?? inspirationDiscoveryImage;

  const selectQuickTask = (task: QuickTask, includePrompt: boolean) => {
    setSelectedSkill(task.title);
    if (includePrompt) setPrompt(task.prompt);
  };

  const clearSkill = () => setSelectedSkill(null);

  useEffect(() => {
    if (!planAccepted) return;
    const waitingForUser = todos.some((todo) => todo.status === "waiting" || todo.status === "blocked" || todo.status === "failed");
    const hasActiveTodo = todos.some((todo) => todo.status === "active");
    if (taskCompleted || (waitingForUser && !hasActiveTodo)) setRunning(false);
  }, [planAccepted, taskCompleted, todos]);

  const accessCanvasContext = (action: "访问中" | "修改中") => {
    try {
      const canvasNodes = JSON.parse(window.localStorage.getItem("wispaper-research-canvas-nodes") || "[]") as Array<{ id: string; title: string }>;
      setCanvasContextCount(canvasNodes.length);
      if (canvasNodes.length) {
        const current = JSON.parse(window.localStorage.getItem("wispaper-canvas-agent-activity") || "{}");
        const agentName = `切问学术 ${agentTiers.find((tier) => tier.id === selectedAgent)?.label || "Agent"}`;
        const activeNodeIds = canvasNodes.slice(0, action === "修改中" ? 1 : 2).map((node) => node.id);
        const activityTimestamp = Date.now();
        activeNodeIds.forEach((nodeId) => { current[nodeId] = { agentName, action, updatedAt: activityTimestamp }; });
        window.localStorage.setItem("wispaper-canvas-agent-activity", JSON.stringify(current));
        window.dispatchEvent(new Event("wispaper-canvas-agent-activity"));
        window.setTimeout(() => {
          try {
            const latest = JSON.parse(window.localStorage.getItem("wispaper-canvas-agent-activity") || "{}");
            activeNodeIds.forEach((nodeId) => { if (latest[nodeId]?.updatedAt === activityTimestamp) delete latest[nodeId]; });
            window.localStorage.setItem("wispaper-canvas-agent-activity", JSON.stringify(latest));
            window.dispatchEvent(new Event("wispaper-canvas-agent-activity"));
          } catch { /* mock activity cleanup */ }
        }, 12000);
      }
      return canvasNodes.length;
    } catch { return 0; }
  };

  const submit = (text = prompt) => {
    const value = text.trim();
    if (!value || running) return;
    const modifiesCanvas = /修改|更新|改写|调整/.test(value) && /科研画布|节点|卡片/.test(value);
    const canvasNodesRead = accessCanvasContext(modifiesCanvas ? "修改中" : "访问中");
    const startingTask = !started;
    if (startingTask) {
      setTaskTitle(value.length > 32 ? `${value.slice(0, 32)}…` : value);
      setPlanReady(false);
      setPlanAccepted(false);
      setTodos(initialAgentTodos.map((todo) => ({ ...todo })));
    }
    setStarted(true);
    setPrompt("");
    setSelectedSkill(null);
    setRunning(true);
    setActiveTab("plan");
    setMessages((items) => [...items, { role: "user", text: value }]);
    window.setTimeout(() => {
      setMessages((items) => [
        ...items,
        {
          role: "agent",
          text: startingTask
            ? `任务已拆解为 5 个步骤。${canvasNodesRead ? `已读取科研画布中的 ${canvasNodesRead} 个节点作为项目上下文。` : ""}你可以在右侧调整执行计划，确认后我会开始检索与分析。`
            : "已收到补充说明。我会基于当前计划继续处理，并在需要改变执行范围时请你确认。",
        },
      ]);
      if (startingTask) {
        setPlanReady(true);
        setRunning(false);
      } else {
        setRunning(false);
      }
    }, 900);
  };

  useEffect(() => {
    if (initialPrompt.trim()) submit(initialPrompt);
  }, [initialPrompt]);

  const activateNextTodo = (items: AgentTodo[], afterId?: string) => {
    const startIndex = afterId ? items.findIndex((todo) => todo.id === afterId) + 1 : 0;
    const nextIndex = items.findIndex((todo, index) => index >= Math.max(startIndex, 0) && todo.status === "pending");
    if (nextIndex < 0) return items;
    return items.map((todo, index) =>
      index === nextIndex
        ? { ...todo, status: todo.type === "approval" ? "waiting" : "active" }
        : todo,
    );
  };

  const handleAcceptPlan = () => {
    setPlanAccepted(true);
    setRunning(true);
    setTodos((items) => activateNextTodo(items));
    setMessages((items) => [...items, { role: "agent", text: "计划已确认。我会从明确检索范围开始，并持续更新右侧 Todo List。" }]);
  };

  const handleTodoStatusChange = (id: string, status: AgentTodoStatus) => {
    setTodos((items) => {
      let nextItems = items.map((todo) => {
        if (todo.id === id) return { ...todo, status };
        if (status === "active" && todo.status === "active") return { ...todo, status: "pending" as AgentTodoStatus };
        return todo;
      });

      if (status === "done" || status === "skipped") {
        nextItems = activateNextTodo(nextItems, id);
      }
      return nextItems;
    });
    if (status === "blocked" || status === "failed") setRunning(false);
    if (status === "active" || status === "done") setRunning(true);
  };

  const handleAddTodo = (title: string) => {
    setTodos((items) => [
      ...items,
      {
        id: `custom-${Date.now()}`,
        title,
        detail: "由用户补充的执行步骤，Agent 将在执行前检查依赖关系。",
        type: "user",
        status: "pending",
      },
    ]);
  };

  const handleStartBioSkill = (skillPrompt: string) => {
    const canvasNodesRead = accessCanvasContext("访问中");
    setPanelOpen(false);
    setRunning(false);
    setMessages((items) => [...items, { role: "user", text: skillPrompt }]);
    window.setTimeout(() => {
      setMessages((items) => [...items, {
        role: "agent",
        text: `已进入生信 Skill 对话流程。${canvasNodesRead ? `已读取科研画布中的 ${canvasNodesRead} 个节点。` : ""}我会先确认研究目的、样本与变量结构、实验设计、缺失值和混杂因素，再与你一起确定统计方法、检验前提与结果报告方式。请先介绍你的实验场景或上传数据说明。`,
      }]);
    }, 500);
  };

  if (!started) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f7f9fc] text-slate-950">
        <header className="flex h-16 shrink-0 items-center justify-between px-7">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Bot className="h-4 w-4" />
            </span>
            学术 Agent
          </div>
          <button
            onClick={onOpenProjects}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
          >
            <FolderKanban className="h-4 w-4" />
            研究项目
          </button>
        </header>

        <main className="flex flex-1 items-start overflow-y-auto px-6 pb-14 pt-12">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-slate-500">从一个研究问题开始</p>
              <h1 className="mt-3 text-[42px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950">
                今天想推进哪项研究？
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-slate-500">
                描述目标，Agent 会拆解步骤、调用研究工具，并把论文、计划与实验产物集中保存。
              </p>
              <div className="mt-9">
                <AgentComposer
                  prompt={prompt}
                  setPrompt={setPrompt}
                  onSubmit={() => submit()}
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  selectedSkill={selectedSkill}
                  onSelectSkill={selectQuickTask}
                  onClearSkill={clearSkill}
                />
              </div>
            </div>

            <section className="mx-auto mt-8 max-w-3xl" aria-label="Skill 案例">
              <div className="flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Skill 案例分类">
                {quickTasks.map((task) => {
                  const Icon = task.icon;
                  const isActiveCaseTab = activeCaseTab === task.title;
                  return (
                    <button
                      key={task.title}
                      type="button"
                      role="tab"
                      id={`agent-case-tab-${task.title}`}
                      aria-controls={`agent-case-panel-${task.title}`}
                      onClick={() => {
                        setActiveCaseTab(task.title);
                        selectQuickTask(task, true);
                      }}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${
                        isActiveCaseTab
                          ? "border-slate-300 bg-white text-slate-950 shadow-sm"
                          : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-950"
                      }`}
                      aria-selected={isActiveCaseTab}
                    >
                      <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
                      {task.title}
                    </button>
                  );
                })}
              </div>

              <div
                id={`agent-case-panel-${activeCaseTab}`}
                role="tabpanel"
                aria-labelledby={`agent-case-tab-${activeCaseTab}`}
                className="mt-6"
              >
                <h2 className="text-sm font-semibold text-slate-900">Sample Prompts</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {activeSamplePrompts.map((item) => {
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          setSelectedSkill(activeCaseTask.title);
                          setPrompt(item.prompt);
                        }}
                        className="group rounded-2xl border border-slate-200 bg-white/75 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] active:translate-y-0"
                      >
                        <h3 className="text-[15px] font-semibold leading-6 text-slate-900">{item.title}</h3>
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.summary}</p>
                      </button>
                    );
                  })}
                </div>

                <h2 className="mt-8 text-sm font-semibold text-slate-900">案例</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {activeCaseStudies.map((item, index) => {
                    const StudyIcon = activeCaseTask.icon;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          setSelectedSkill(activeCaseTask.title);
                          setPrompt(item.prompt);
                        }}
                        className="group flex min-h-[410px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_55px_-30px_rgba(15,23,42,0.4)] active:translate-y-0"
                      >
                        <div className="relative h-40 overflow-hidden bg-slate-100">
                          <img
                            src={activeCaseImage}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            style={{ objectPosition: index === 0 ? "left center" : index === 2 ? "right center" : "center" }}
                          />
                          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/90 text-white shadow-sm backdrop-blur">
                            <StudyIcon className="h-4 w-4" />
                          </span>
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs tabular-nums text-slate-600 shadow-sm backdrop-blur">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {item.credits}
                          </span>
                        </div>
                        <div className="px-4 pb-3 pt-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                            {item.field}
                          </span>
                        </div>
                        <div className="flex-1 px-4 pb-4">
                          <h3 className="text-base font-semibold leading-6 text-slate-900">{item.title}</h3>
                          <p className="mt-3 text-xs leading-5 text-slate-500">{item.summary}</p>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
                          <p className="text-xs font-medium leading-5 text-slate-600">{item.outcome}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-w-0 flex-1 bg-[#f7f9fc] text-slate-950">
      <main className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
          <h1 className="min-w-0 truncate pr-6 text-[15px] font-semibold">{taskTitle}</h1>
          <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
            {canvasContextCount > 0 && <span className="hidden items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-violet-700 sm:inline-flex"><FolderKanban className="h-3.5 w-3.5" />科研画布 · {canvasContextCount} 节点</span>}
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <span className={`h-2 w-2 rounded-full ${taskCompleted ? "bg-blue-500" : taskNeedsAttention ? "bg-amber-500" : running ? "bg-emerald-500" : "bg-slate-400"}`} />
              {!planReady ? "制定计划" : !planAccepted ? "待确认" : taskCompleted ? "已完成" : taskNeedsAttention ? "等待确认" : running ? "进行中" : "已暂停"}
            </span>
            <span className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 sm:inline-flex">
              <GraduationCap className="h-3.5 w-3.5" />
              1,250
            </span>
            <span className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 md:inline-flex">
              <Moon className="h-3.5 w-3.5" />
              1h
            </span>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <button className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-950" aria-label="分享任务">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-slate-950" aria-label="更多操作">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pb-48 pt-9">
            <div className="mx-auto max-w-3xl space-y-7">
              {messages.map((message, index) => (
                <article key={index} className={message.role === "user" ? "flex justify-end" : ""}>
                  {message.role === "user" ? (
                    <div className="max-w-[78%] rounded-[18px] rounded-tr-md bg-[#e6f1ff] px-4 py-3 text-sm leading-6 text-slate-800">
                      {message.text}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-semibold">切问学术</span>
                        <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500">
                          {agentTiers.find((tier) => tier.id === selectedAgent)?.label}
                        </span>
                      </div>
                      <div className="rounded-[18px] rounded-tl-md bg-slate-50 px-5 py-4 text-[15px] leading-7 text-slate-700">
                        {message.text}
                      </div>
                    </div>
                  )}
                </article>
              ))}
              {running && !planReady && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  正在制定研究计划并选择工具…
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white to-transparent px-5 pb-3 pt-14">
            <div className="pointer-events-auto mx-auto max-w-3xl">
              <AgentComposer
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={() => submit()}
                selectedAgent={selectedAgent}
                onAgentChange={setSelectedAgent}
                selectedSkill={selectedSkill}
                onSelectSkill={selectQuickTask}
                onClearSkill={clearSkill}
                disabled={running}
                compact
              />
              <p className="mt-2 text-center text-[10px] text-slate-300">内容由 AI 生成，请仔细甄别</p>
            </div>
          </div>
        </section>
      </main>

      {panelOpen && (
        <aside className={`hidden shrink-0 border-l border-slate-200 bg-[#f7f9fc] lg:block ${activeTab === "gpu" || activeTab === "bio" ? "w-[520px] xl:w-[600px]" : "w-[360px]"}`}>
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
            <span className="text-sm font-semibold">{tabs.find((tab) => tab.id === activeTab)?.label}</span>
            <button
              onClick={() => setPanelOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-950"
              aria-label="收起工作台"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[calc(100%_-_4rem)]">
            <WorkbenchPanel
              activeTab={activeTab}
              running={running}
              planReady={planReady}
              planAccepted={planAccepted}
              todos={todos}
              onAcceptPlan={handleAcceptPlan}
              onToggleRunning={() => setRunning((value) => !value)}
              onTodoStatusChange={handleTodoStatusChange}
              onAddTodo={handleAddTodo}
              onStartBioSkill={handleStartBioSkill}
            />
          </div>
        </aside>
      )}

      <aside className="hidden w-14 shrink-0 flex-col items-center border-l border-slate-200 bg-white py-3 lg:flex">
        <button
          onClick={() => setPanelOpen((value) => !value)}
          className={`mb-4 rounded-xl p-2.5 transition ${
            panelOpen ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          }`}
          aria-label={panelOpen ? "收起工作台" : "展开工作台"}
        >
          <PanelRight className="h-4.5 w-4.5" />
        </button>
        <div className="h-px w-6 bg-slate-100" />
        <nav className="mt-3 flex flex-col gap-2" aria-label="Agent 工具">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = panelOpen && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPanelOpen(true);
                }}
                className={`group relative rounded-xl p-2.5 transition ${
                  active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
                aria-label={tab.label}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
