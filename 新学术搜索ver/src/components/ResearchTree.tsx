import React, { useEffect, useMemo, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  AtSign, BookOpen, Bot, Check, ChevronDown, ChevronRight, Clock3, Edit3,
  ExternalLink, File, FileText, FlaskConical, FolderTree, GripVertical, Lightbulb, LoaderCircle, Maximize2, MoreHorizontal,
  Plus, Redo2, Save, Search, Table2, Trash2, Undo2, X, ZoomIn, ZoomOut,
} from "lucide-react";

type ResourceKind = "论文" | "Survey" | "Agent 对话" | "文件";
type Resource = { id: string; kind: ResourceKind; title: string };
type CategoryColor = "violet" | "indigo" | "blue" | "cyan" | "teal" | "emerald" | "amber" | "orange" | "rose" | "fuchsia";
type TreeNode = { id: string; title: string; category?: string; categoryColor?: CategoryColor; tags?: string[]; updatedAt?: number; parentId: string | null; note: string; resources: Resource[]; root?: boolean };
type TreeSnapshot = { nodes: TreeNode[]; expanded: string[]; selectedId: string | null };
type AgentActivity = { agentName: string; action: "访问中" | "修改中"; updatedAt: number };
type NodePosition = { x: number; y: number };

const defaultNodeCategories: Record<string, string> = {
  root: "研究问题", n1: "方法", n2: "实验", n3: "方法", n4: "假设", n5: "实验",
};
const defaultNodeTags: Record<string, string[]> = {
  root: ["长期记忆", "LLM"], n1: ["架构", "进行中"], n2: ["基线", "LoCoMo"], n3: ["知识图谱"], n4: ["待验证"], n5: ["失败分析"],
};

const resources: Resource[] = [
  { id: "paper-1", kind: "论文", title: "MemGPT: Towards LLMs as Operating Systems" },
  { id: "paper-2", kind: "论文", title: "MemoryBank: Enhancing LLMs with Long-Term Memory" },
  { id: "survey-1", kind: "Survey", title: "长期记忆机制研究综述" },
  { id: "agent-1", kind: "Agent 对话", title: "分层记忆架构可行性分析" },
  { id: "file-1", kind: "文件", title: "memory-evaluation-results.csv" },
  { id: "file-2", kind: "文件", title: "experiment-notes-v3.md" },
];

const initialNodes: TreeNode[] = [
  { id: "root", title: "LLM 长期记忆研究", parentId: null, root: true, note: "# LLM 长期记忆研究\n\n研究问题：在 50 轮以上的持续对话中，如何兼顾事实召回率、时序一致性与存储成本？\n\n## 本周进展\n\n已完成向量检索与图记忆两条基线，下一步验证分层记忆在跨会话任务上的稳定性。", resources: [] },
  { id: "n1", title: "分层记忆架构", parentId: "root", note: "# 分层记忆架构\n\n研究目标是在不显著增加首 Token 延迟的前提下，让 Agent 在长周期任务中稳定记住用户偏好、历史决策与尚未完成的约束。当前方案将记忆划分为工作记忆、情景记忆和语义记忆三层，并要求每条进入长期层的事实都保留来源、时间与置信度。\n\n## 架构假设\n\n工作记忆保留最近 8 轮原始对话和当前任务状态，容量目标控制在 6K Token 内。情景记忆按会话与任务阶段切片，保存摘要、关键动作和结果。语义记忆只保存经过归一化与冲突消解的长期事实，例如稳定偏好、人物关系和项目约束。\n\n参考 [论文 · MemGPT: Towards LLMs as Operating Systems](#resource-paper-1) 的分层调度思路，但不直接采用基于上下文溢出的被动换页，而是由检索器根据当前任务意图、事实重要性和最近访问时间主动选择需要进入上下文的记忆。\n\n## 写入流程\n\n每轮对话结束后，Extractor 先抽取候选事实，并为其标注 subject、predicate、object、valid_time 与 confidence。候选事实与现有语义记忆进行相似度匹配；相似度高于 0.86 时进入更新流程，低于阈值时作为新事实写入。存在属性冲突时，不直接覆盖旧值，而是保留版本链并标记生效时间。\n\n对动作与实验过程类内容，不拆成孤立事实，而是保存在情景记忆中。只有当同类情景至少出现两次，或用户明确确认其长期有效时，才将归纳结果提升到语义记忆层。这样可以降低单次偶然行为被误判为稳定偏好的概率。\n\n## 检索与编排\n\n检索阶段先对当前问题进行意图分类，再并行查询三层记忆。工作记忆直接按时间顺序进入上下文；情景记忆按向量相关性与时间邻近度加权；语义记忆采用向量召回加属性过滤，并对存在冲突的事实优先返回最新有效版本。\n\n第一版综合评分为 0.55 × relevance + 0.20 × recency + 0.15 × importance + 0.10 × access_frequency。为了避免高频但无关的事实长期占据前列，每条记忆连续三次被召回但未被模型引用后，访问频率权重会暂时衰减。\n\n## 小规模验证\n\n在 120 段人工构造的跨会话对话上进行预实验。相较于仅使用最近窗口，分层方案的事实问答准确率从 62.5% 提升到 81.7%，约束遵循率从 70.8% 提升到 88.3%。平均输入 Token 增加 14.6%，P95 首 Token 延迟增加 183 ms，仍在当前 250 ms 的预算内。\n\n错误主要集中在两类：一是同一人物在不同项目中的角色被错误合并；二是用户用隐含表达修改偏好时，旧事实没有及时失效。前者需要引入项目命名空间，后者需要增加对否定、转折和时间范围表达的专项识别。\n\n## 风险记录\n\n分层架构会增加可观测性成本。如果无法解释一条事实为何被写入、为何被召回，线上错误将很难定位。因此每次检索都需要记录候选集合、最终得分、过滤原因和进入 Prompt 的文本片段，但调试日志不得包含用户无权查看的原始内容。\n\n另一个风险是摘要递归导致信息漂移。情景记忆不能反复基于旧摘要生成新摘要，压缩时必须回看原始事件或保留可追溯引用。对于数值、日期和实体名称，摘要器应优先复制原值并进行格式校验。\n\n## 阶段结论\n\n当前结果支持继续推进分层方案，但尚不能证明三层结构优于更简单的双层结构。下一轮会移除情景层做消融实验，并比较召回准确率、上下文长度和延迟变化。\n\n## 下一步\n\n本周完成项目命名空间和冲突版本链；下周在 LoCoMo 全量样本上运行三次不同随机种子的评测。若 P95 延迟超过 250 ms，将优先减少情景召回数量，而不是降低语义事实的覆盖率。", resources: [resources[0]] },
  { id: "n2", title: "向量检索基线", parentId: "n1", note: "## 实验设置\n\n- 数据集：LoCoMo，1,540 个跨会话问答样本\n- Embedding：BGE-M3\n- Top K：8\n- 对照组：BM25 与全量上下文\n\n三次运行的平均 Recall@8 为 71.4%，较 BM25 提升 12.8 个百分点；但时间型问题准确率仅为 58.2%。原始结果见 [文件 · memory-evaluation-results.csv](#resource-file-1)。\n\n下一步加入时间特征重排，并单独分析人物属性发生变化的样本。", resources: [resources[4]] },
  { id: "n3", title: "图记忆方案", parentId: "root", note: "# 图记忆方案\n\n本分支评估结构化图记忆是否能改善跨会话多跳推理。图中的核心实体包括人物、组织、项目、事件、地点和结论；边同时保存关系类型、发生时间、来源消息和置信度，支持回答‘某项决定为什么改变’以及‘某个约束在哪次会议中提出’等问题。\n\n## 文献与讨论\n\n现有方法的分类与评测指标参考 [Survey · 长期记忆机制研究综述](#resource-survey-1)。在 [Agent 对话 · 分层记忆架构可行性分析](#resource-agent-1) 中，Agent 建议优先验证冲突事实覆盖、时间范围查询和跨项目实体隔离，这三类能力也是纯向量检索最容易出现稳定错误的场景。\n\n## 数据建模\n\n事件节点保存 start_time、end_time、participants 和 outcome；事实边保存 valid_from 与 valid_to。对于‘小林从算法组转到平台组’这类变化，不删除旧关系，而是结束旧边的有效区间并创建新边。查询当前状态时只返回当前有效边，查询历史原因时则沿时间链回溯。\n\n实体消歧采用名称、所属项目、共现实体和文本表示联合评分。初步阈值设置为 0.82，高于阈值自动合并，0.65–0.82 进入候选队列，低于 0.65 新建实体。为了避免错误合并扩散，自动合并后的节点在 24 小时内保留可逆映射。\n\n## 预实验结果\n\n从内部测试集抽取 300 个跨会话问题，其中单跳事实 120 个、时间推理 90 个、因果链 60 个、冲突事实 30 个。图记忆总体准确率为 78.0%，向量基线为 72.3%。在因果链问题上提升最明显，从 55.0% 提升到 73.3%；单跳事实仅提升 1.7 个百分点。\n\n图查询平均耗时 96 ms，实体链接与图构建平均每轮增加 41 ms。离线构建成本可接受，但在线实体消歧在长消息中出现明显抖动，P95 达到 164 ms。若与向量检索串行执行，总延迟会超过预算，因此下一版改为并行召回后统一重排。\n\n## 典型错误\n\n错误一：同名人物被合并。在两个不同项目中都出现‘王晨’，系统依据名称和相近的职位描述误判为同一人，导致项目 A 的会议结论进入项目 B。加入项目命名空间后，该类错误由 11 条下降到 2 条。\n\n错误二：隐式时间表达解析失败。‘下个季度再评估’需要结合消息时间推导绝对日期；当前解析器只保存原文，查询具体月份时无法命中。计划在写入阶段同时保存原始表达和解析后的时间范围，并记录解析所使用的时区。\n\n错误三：否定关系丢失。句子‘并不是因为成本，而是数据授权没有通过’被抽取成‘成本导致延期’。需要将否定范围作为边属性，并在抽取评测中单独增加转折和排除关系样本。\n\n## 消融观察\n\n移除时间属性后，总体准确率下降 4.8 个百分点，说明图结构本身不足以处理状态变化。移除来源引用后离线指标不变，但人工审核定位错误的平均时间从 2.4 分钟增加到 7.1 分钟，因此来源引用属于必须保留的工程能力。\n\n只使用图检索会漏掉描述性较强、尚未形成稳定实体关系的内容。当前更合理的方向是图与向量混合：图负责精确关系和时间约束，向量库负责语义近似与长文本证据，最终由同一重排器结合问题类型选择证据。\n\n## 阶段结论\n\n图记忆对多跳和时间问题有明确收益，但构建复杂度高于预期，不适合作为所有记忆的唯一存储。下一阶段保留最小关系集合，仅对人物关系、项目决策和状态变化建图，其余内容继续进入情景记忆与向量索引。\n\n## 下一轮计划\n\n完成 500 条实体消歧标注集；增加否定关系与隐式时间的专项测试；将图检索和向量检索改为并行；在相同 Token 预算下对比混合方案、纯图方案和分层向量方案。", resources: [resources[2], resources[3]] },
  { id: "n4", title: "时间衰减策略", parentId: "n3", note: "## 核心假设\n\n引入时间衰减可以降低陈旧信息对当前任务的干扰，但衰减速度应同时受事实重要性和最近访问频率控制。\n\n## 实验计划\n\n对比固定指数衰减、分段衰减和重要性自适应衰减。主要指标为时间型问答准确率、过期事实误召回率与平均检索延迟。", resources: [] },
  { id: "n5", title: "失败：固定衰减率", parentId: "n4", note: "## 失败记录\n\n固定衰减率 λ=0.08 时，过期事实误召回率下降 9.6%，但低频关键事实的 Recall@8 同时下降 14.1%。\n\n## 原因分析\n\n时间新鲜度不能代表任务重要性。生日、长期偏好等事实访问频率低，却需要长期保留。\n\n## 后续调整\n\n改为 importance × recency × access frequency 的组合评分，并为用户明确确认的事实设置最低保留权重。", resources: [] },
];

function calculateTreeLayout(nodes: TreeNode[], expandedIds: Set<string>): Record<string, NodePosition> {
  const result: Record<string, NodePosition> = {};
  const byParent = (parentId: string) => nodes.filter((node) => node.parentId === parentId);
  let leafIndex = 0;
  const place = (node: TreeNode, depth: number): number => {
    const children = expandedIds.has(node.id) ? byParent(node.id) : [];
    const y = children.length ? children.map((child) => place(child, depth + 1)).reduce((sum, value) => sum + value, 0) / children.length : 90 + leafIndex++ * 150;
    result[node.id] = { x: depth === 0 ? 100 : 430 + (depth - 1) * 330, y };
    return y;
  };
  nodes.filter((node) => node.parentId === null).sort((a, b) => Number(b.root) - Number(a.root)).forEach((node) => place(node, 0));
  return result;
}

type CanvasTemplateBlueprint = { id: string; title: string; description: string; nodes: Array<[string, string, number?]> };
const canvasTemplateBlueprints: CanvasTemplateBlueprint[] = [
  { id: "ai-algorithm", title: "AI 算法实验", description: "从研究问题、基线到训练与评测", nodes: [["研究问题", "研究主题"], ["基线模型与数据集", "方法设计"], ["模型训练与超参数", "实验"], ["消融实验", "实验"], ["评测结果与误差分析", "结论"]] },
  { id: "clinical-trial", title: "临床实验", description: "研究假设、受试者、干预与终点", nodes: [["临床研究假设", "研究主题"], ["入组与排除标准", "方法设计"], ["干预与对照方案", "技术路线"], ["主要与次要终点", "实验"], ["安全性与不良事件", "结论"]] },
  { id: "literature-review", title: "系统文献综述", description: "检索、筛选、质量评估与证据综合", nodes: [["综述问题与 PICO", "研究主题"], ["数据库与检索式", "技术路线"], ["纳入排除与文献筛选", "方法设计"], ["偏倚风险评估", "实验"], ["证据综合与研究空白", "结论"]] },
  { id: "data-analysis", title: "统计数据分析", description: "数据质量、建模、验证与结果解释", nodes: [["分析目标与核心指标", "研究主题"], ["数据清理与缺失值", "技术路线"], ["统计模型与变量选择", "方法设计"], ["稳健性与敏感性分析", "实验"], ["效应量与不确定性解释", "结论"]] },
  { id: "large-research", title: "大型科研项目", description: "多条技术路线并行分支、演化并在里程碑汇合", nodes: [
    ["项目总目标与核心科学问题", "研究主题"],
    ["技术路线 A：数据驱动", "技术路线", 0],
    ["技术路线 B：机理建模", "技术路线", 0],
    ["技术路线 C：实验验证", "技术路线", 0],
    ["数据采集、治理与基线", "方法设计", 1],
    ["多模态算法与规模化训练", "实验", 1],
    ["理论假设与数学模型", "假设", 2],
    ["数值模拟与参数校准", "实验", 2],
    ["实验系统与样机验证", "实验", 3],
    ["多中心重复与失败分析", "失败记录", 3],
    ["路线交叉验证与阶段里程碑", "结论", 0],
  ] },
];

function nodesFromTemplate(projectTitle: string, templateId: string): TreeNode[] {
  const template = canvasTemplateBlueprints.find((item) => item.id === templateId);
  if (!template) return [];
  return template.nodes.map(([title, category, parentIndex], index) => {
    const displayTitle = index === 0 ? projectTitle : title;
    return ({
    id: `template-${template.id}-${index}`,
    title: displayTitle,
    category,
    tags: index === 0 ? [template.title] : ["待完善"],
    updatedAt: Date.now(),
    parentId: index === 0 ? null : `template-${template.id}-${parentIndex ?? (index <= 2 ? 0 : 2)}`,
    root: index === 0,
    note: `# ${displayTitle}\n\n这是由「${template.title}」模板生成的初始节点。\n\n## 待完善\n\n请记录研究目标、关键决策、证据与下一步行动。`,
    resources: [],
  }); });
}

const kindIcon: Record<ResourceKind, React.ElementType> = { "论文": BookOpen, Survey: Search, "Agent 对话": Bot, "文件": File };

function markdownToBlocks(markdown: string): PartialBlock[] {
  if (!markdown.trim()) return [{ type: "paragraph", content: "" }];
  const parts = markdown.split(/\n\n+/);
  if (parts[0]?.startsWith("# ")) parts.shift();
  if (!parts.length) return [{ type: "paragraph", content: "" }];
  return parts.map((part) => {
    if (part.startsWith("# ")) return { type: "heading", props: { level: 1 }, content: part.slice(2) } as PartialBlock;
    if (part.startsWith("## ")) return { type: "heading", props: { level: 2 }, content: part.slice(3) } as PartialBlock;
    if (part.split("\n").every((line) => line.startsWith("- "))) {
      const items = part.split("\n");
      return { type: "bulletListItem", content: items.map((line) => line.slice(2)).join(" · ") } as PartialBlock;
    }
    return { type: "paragraph", content: part.replace(/\*\*/g, "") } as PartialBlock;
  });
}

function BlockNoteEditor({ initialMarkdown, availableResources, onChange, onAttach }: {
  initialMarkdown: string;
  availableResources: Resource[];
  onChange: (markdown: string) => void;
  onAttach: (resource: Resource) => void;
}) {
  const editor = useCreateBlockNote({ initialContent: markdownToBlocks(initialMarkdown) });
  const attachResource = (resource: Resource) => {
    editor.insertInlineContent([
      { type: "link", href: `#resource-${resource.id}`, content: [{ type: "text", text: `${resource.kind} · ${resource.title}`, styles: {} }] },
      { type: "text", text: " ", styles: {} },
    ], { updateSelection: true });
    onAttach(resource);
  };

  const getMentionItems = async (query: string) => availableResources
    .filter((resource) => `${resource.title} ${resource.kind}`.toLowerCase().includes(query.toLowerCase()))
    .map((resource) => {
      const Icon = kindIcon[resource.kind];
      return {
        title: resource.title,
        subtext: resource.kind,
        aliases: [resource.kind, resource.title],
        group: "工作空间资源",
        icon: <Icon className="h-4 w-4" />,
        onItemClick: () => attachResource(resource),
      };
    });

  return <div className="blocknote-research-editor relative pb-6">
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={async () => onChange(await editor.blocksToMarkdownLossy(editor.document))}
    >
      <SuggestionMenuController triggerCharacter="@" getItems={getMentionItems} />
    </BlockNoteView>
    <p className="pointer-events-none absolute bottom-0 left-2 text-[10px] font-normal tracking-wide text-slate-300/70">输入 “/” 插入 Block，输入 “@” 提及工作空间资源</p>
  </div>;
}

function HashTagEditor({ nodeId, tags, onCommit }: { nodeId: string; tags: string[]; onCommit: (tags: string[]) => void }) {
  const formatTags = (items: string[]) => items.map((tag) => `#${tag}`).join("  ");
  const [value, setValue] = useState(() => formatTags(tags));
  const commitTimer = useRef<number>();
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const parseTags = (text: string) => text.split(/[，,\s]+/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean);

  useEffect(() => {
    window.clearTimeout(commitTimer.current);
    setValue(formatTags(tags));
    return () => window.clearTimeout(commitTimer.current);
  }, [nodeId]);

  const scheduleCommit = (nextValue: string) => {
    window.clearTimeout(commitTimer.current);
    commitTimer.current = window.setTimeout(() => commitRef.current(parseTags(nextValue)), 450);
  };

  return <input
    value={value}
    onChange={(event) => { setValue(event.target.value); scheduleCommit(event.target.value); }}
    onBlur={() => { window.clearTimeout(commitTimer.current); commitRef.current(parseTags(value)); }}
    placeholder="添加 #Hash tags，空格分隔"
    className="w-full border-0 bg-transparent p-0 text-xs text-slate-500 outline-none placeholder:text-slate-300"
    aria-label="Hash tags"
  />;
}

export function ResearchTree({ projectId, projectTitle, initialTemplate = "demo" }: { projectId: number; projectTitle: string; initialTemplate?: string }) {
  const [nodes, setNodes] = useState<TreeNode[]>(() => {
    try {
      const projectKey = `wispaper-research-canvas-nodes-${projectId}`;
      const savedRaw = window.localStorage.getItem(projectKey) || (projectId === 1 ? window.localStorage.getItem("wispaper-research-canvas-nodes") : null);
      const saved = JSON.parse(savedRaw || "[]") as TreeNode[];
      if (saved.length && saved.every((node) => node.id && "note" in node)) return saved.map((node) => node.root ? { ...node, title: projectTitle } : node);
    } catch { /* use mock defaults */ }
    if (initialTemplate === "blank") return [];
    if (initialTemplate !== "demo") return nodesFromTemplate(projectTitle, initialTemplate);
    return initialNodes.map((node) => node.id === "root" ? { ...node, title: projectTitle } : node);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(() => new Set(nodes.map((node) => node.id)));
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>(() => {
    const allExpanded = new Set(nodes.map((node) => node.id));
    return calculateTreeLayout(nodes, allExpanded);
  });
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const undoStack = useRef<TreeSnapshot[]>([]);
  const redoStack = useRef<TreeSnapshot[]>([]);
  const [, setHistoryVersion] = useState(0);
  const [fullScreen, setFullScreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingNodeMeta, setEditingNodeMeta] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [toast, setToast] = useState("");
  const [mapScale, setMapScale] = useState(0.9);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [snapTargetId, setSnapTargetId] = useState<string | null>(null);
  const [selectedEdgeChildId, setSelectedEdgeChildId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const panStart = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const nodeDrag = useRef<{ id: string; ids: string[]; pointerX: number; pointerY: number; startPositions: Record<string, NodePosition>; moved: boolean } | null>(null);
  const selectionStart = useRef<{ clientX: number; clientY: number; canvasLeft: number; canvasTop: number } | null>(null);
  const suppressNodeClick = useRef<string | null>(null);
  const snapTargetRef = useRef<string | null>(null);
  const saveTimer = useRef<number>();
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const [agentActivities, setAgentActivities] = useState<Record<string, AgentActivity>>(() => {
    try { return JSON.parse(window.localStorage.getItem("wispaper-canvas-agent-activity") || "{}"); } catch { return {}; }
  });

  useEffect(() => setEditingNodeMeta(false), [selectedId]);
  useEffect(() => {
    const syncAgentActivities = () => {
      try { setAgentActivities(JSON.parse(window.localStorage.getItem("wispaper-canvas-agent-activity") || "{}")); } catch { setAgentActivities({}); }
    };
    window.addEventListener("wispaper-canvas-agent-activity", syncAgentActivities);
    window.addEventListener("storage", syncAgentActivities);
    return () => {
      window.removeEventListener("wispaper-canvas-agent-activity", syncAgentActivities);
      window.removeEventListener("storage", syncAgentActivities);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(`wispaper-research-canvas-nodes-${projectId}`, JSON.stringify(nodes.map((node) => ({
      ...node,
      category: node.category || defaultNodeCategories[node.id] || "探索",
      noteSummary: node.note.replace(/[#*\[\]()]/g, "").slice(0, 240),
    }))));
  }, [nodes, projectId]);

  const children = (parentId: string) => nodes.filter((node) => node.parentId === parentId);
  const descendants = (id: string): TreeNode[] => children(id).flatMap((child) => [child, ...descendants(child.id)]);
  const visibleNodes = useMemo(() => {
    const result: TreeNode[] = [];
    const visit = (node: TreeNode) => { result.push(node); if (expanded.has(node.id)) children(node.id).forEach(visit); };
    nodes.filter((node) => node.parentId === null).sort((a, b) => Number(b.root) - Number(a.root)).forEach(visit);
    return result;
  }, [nodes, expanded]);
  useEffect(() => {
    const layout = calculateTreeLayout(nodes, expanded);
    setNodePositions((current) => {
      const next = { ...current };
      visibleNodes.forEach((node) => { if (!next[node.id]) next[node.id] = layout[node.id]; });
      return next;
    });
  }, [nodes.length, expanded, visibleNodes]);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const nodeCategory = (node: TreeNode) => node.category || defaultNodeCategories[node.id] || "探索";
  const demoAgentNodeId = visibleNodes.find((node) => nodeCategory(node).includes("实验"))?.id;
  const nodeTags = (node: TreeNode) => node.tags || defaultNodeTags[node.id] || [];
  const categoryIcon = (category: string): React.ElementType => category.includes("实验") ? FlaskConical : category.includes("假设") ? Lightbulb : category.includes("研究") || category.includes("问题") ? Search : category.includes("失败") ? X : FolderTree;
  const categoryColorOptions: Array<{ id: CategoryColor; label: string; dot: string }> = [
    { id: "violet", label: "紫色", dot: "bg-violet-500" }, { id: "indigo", label: "靛蓝", dot: "bg-indigo-500" },
    { id: "blue", label: "蓝色", dot: "bg-blue-500" }, { id: "cyan", label: "青色", dot: "bg-cyan-500" },
    { id: "teal", label: "青绿", dot: "bg-teal-500" }, { id: "emerald", label: "绿色", dot: "bg-emerald-500" },
    { id: "amber", label: "黄色", dot: "bg-amber-400" }, { id: "orange", label: "橙色", dot: "bg-orange-500" },
    { id: "rose", label: "红色", dot: "bg-rose-500" }, { id: "fuchsia", label: "粉紫", dot: "bg-fuchsia-500" },
  ];
  const categoryColorMap: Record<CategoryColor, { label: string; card: string; filled: string }> = {
    violet: { label: "bg-violet-600 text-white shadow-sm shadow-violet-200", card: "border-violet-500 bg-white text-slate-900 shadow-violet-200/50", filled: "border-violet-500 bg-violet-100 text-slate-900 shadow-violet-200/50" },
    indigo: { label: "bg-indigo-600 text-white shadow-sm shadow-indigo-200", card: "border-indigo-500 bg-white text-slate-900 shadow-indigo-200/50", filled: "border-indigo-500 bg-indigo-100 text-slate-900 shadow-indigo-200/50" },
    blue: { label: "bg-blue-600 text-white shadow-sm shadow-blue-200", card: "border-blue-500 bg-white text-slate-900 shadow-blue-200/50", filled: "border-blue-500 bg-blue-100 text-slate-900 shadow-blue-200/50" },
    cyan: { label: "bg-cyan-600 text-white shadow-sm shadow-cyan-200", card: "border-cyan-500 bg-white text-slate-900 shadow-cyan-200/50", filled: "border-cyan-500 bg-cyan-100 text-slate-900 shadow-cyan-200/50" },
    teal: { label: "bg-teal-600 text-white shadow-sm shadow-teal-200", card: "border-teal-500 bg-white text-slate-900 shadow-teal-200/50", filled: "border-teal-500 bg-teal-100 text-slate-900 shadow-teal-200/50" },
    emerald: { label: "bg-emerald-600 text-white shadow-sm shadow-emerald-200", card: "border-emerald-500 bg-white text-slate-900 shadow-emerald-200/50", filled: "border-emerald-500 bg-emerald-100 text-slate-900 shadow-emerald-200/50" },
    amber: { label: "bg-amber-400 text-amber-950 shadow-sm shadow-amber-200", card: "border-amber-400 bg-white text-slate-900 shadow-amber-200/50", filled: "border-amber-400 bg-amber-100 text-slate-900 shadow-amber-200/50" },
    orange: { label: "bg-orange-500 text-white shadow-sm shadow-orange-200", card: "border-orange-500 bg-white text-slate-900 shadow-orange-200/50", filled: "border-orange-500 bg-orange-100 text-slate-900 shadow-orange-200/50" },
    rose: { label: "bg-rose-500 text-white shadow-sm shadow-rose-200", card: "border-rose-500 bg-white text-slate-900 shadow-rose-200/50", filled: "border-rose-500 bg-rose-100 text-slate-900 shadow-rose-200/50" },
    fuchsia: { label: "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200", card: "border-fuchsia-500 bg-white text-slate-900 shadow-fuchsia-200/50", filled: "border-fuchsia-500 bg-fuchsia-100 text-slate-900 shadow-fuchsia-200/50" },
  };
  const inferredCategoryColor = (category: string): CategoryColor => {
    const presets: Record<string, CategoryColor> = { "研究问题": "violet", "方法": "cyan", "实验": "emerald", "假设": "amber", "失败记录": "rose", "研究主题": "indigo", "方法设计": "blue", "技术路线": "orange" };
    if (presets[category]) return presets[category];
    const palette: CategoryColor[] = ["teal", "fuchsia", "orange", "blue"];
    return palette[[...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];
  };
  const categoryClass = (category: string, color?: CategoryColor) => {
    if (color) return categoryColorMap[color].label;
    const presets: Record<string, string> = {
      "研究问题": "bg-violet-600 text-white shadow-sm shadow-violet-200", "方法": "bg-cyan-600 text-white shadow-sm shadow-cyan-200", "实验": "bg-emerald-600 text-white shadow-sm shadow-emerald-200",
      "假设": "bg-amber-400 text-amber-950 shadow-sm shadow-amber-200", "失败记录": "bg-rose-500 text-white shadow-sm shadow-rose-200",
      "研究主题": "bg-indigo-600 text-white shadow-sm shadow-indigo-200", "方法设计": "bg-sky-600 text-white shadow-sm shadow-sky-200", "技术路线": "bg-orange-500 text-white shadow-sm shadow-orange-200",
    };
    if (presets[category]) return presets[category];
    const palette = ["bg-teal-600 text-white shadow-sm shadow-teal-200", "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200", "bg-orange-500 text-white shadow-sm shadow-orange-200", "bg-sky-600 text-white shadow-sm shadow-sky-200"];
    return palette[[...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];
  };
  const categoryCardClass = (category: string, color?: CategoryColor) => {
    if (color) return category === "研究主题" ? categoryColorMap[color].filled : categoryColorMap[color].card;
    const presets: Record<string, string> = {
      "研究问题": "border-violet-500 bg-white text-slate-900 shadow-violet-200/50", "方法": "border-cyan-500 bg-white text-slate-900 shadow-cyan-200/50",
      "实验": "border-emerald-500 bg-white text-slate-900 shadow-emerald-200/50", "假设": "border-amber-400 bg-white text-slate-900 shadow-amber-200/50", "失败记录": "border-rose-500 bg-white text-slate-900 shadow-rose-200/50",
      "研究主题": "border-indigo-500 bg-indigo-100 text-slate-900 shadow-indigo-200/50", "方法设计": "border-sky-500 bg-white text-slate-900 shadow-sky-200/50", "技术路线": "border-orange-500 bg-white text-slate-900 shadow-orange-200/50",
    };
    if (presets[category]) return presets[category];
    const palette = ["border-teal-500 bg-white text-slate-900 shadow-teal-200/50", "border-fuchsia-500 bg-white text-slate-900 shadow-fuchsia-200/50", "border-orange-500 bg-white text-slate-900 shadow-orange-200/50", "border-sky-500 bg-white text-slate-900 shadow-sky-200/50"];
    return palette[[...category].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];
  };
  const updateNodeMeta = (id: string, patch: Partial<Pick<TreeNode, "title" | "category" | "categoryColor" | "tags">>) => setNodes((items) => items.map((item) => {
    if (item.id !== id) return item;
    const nextNote = patch.title && /^# .+/m.test(item.note) ? item.note.replace(/^# .+/m, `# ${patch.title}`) : item.note;
    return { ...item, ...patch, note: nextNote, updatedAt: Date.now() };
  }));
  const updatedLabel = (node: TreeNode) => node.updatedAt ? "刚刚更新" : "今天 10:24";
  const currentSnapshot = (): TreeSnapshot => ({ nodes, expanded: [...expanded], selectedId });
  const applySnapshot = (snapshot: TreeSnapshot) => {
    setNodes(snapshot.nodes);
    setExpanded(new Set(snapshot.expanded));
    setSelectedId(snapshot.selectedId);
  };
  const recordHistory = () => {
    undoStack.current = [...undoStack.current.slice(-49), currentSnapshot()];
    redoStack.current = [];
    setHistoryVersion((value) => value + 1);
  };
  const undo = () => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    redoStack.current.push(currentSnapshot());
    applySnapshot(snapshot);
    setHistoryVersion((value) => value + 1);
    showToast("已撤销上一步操作");
  };
  const redo = () => {
    const snapshot = redoStack.current.pop();
    if (!snapshot) return;
    undoStack.current.push(currentSnapshot());
    applySnapshot(snapshot);
    setHistoryVersion((value) => value + 1);
    showToast("已重做上一步操作");
  };

  const reparentNode = (draggedId: string, targetId: string) => {
    const dragged = nodes.find((item) => item.id === draggedId);
    const target = nodes.find((item) => item.id === targetId);
    if (!dragged || !target || dragged.root || draggedId === targetId || descendants(draggedId).some((child) => child.id === targetId)) {
      showToast("不能将节点移动到自身或其子节点下");
    } else if (dragged.parentId !== targetId) {
      recordHistory();
      setNodes((items) => items.map((item) => item.id === draggedId ? { ...item, parentId: targetId } : item));
      setExpanded((items) => new Set(items).add(targetId));
      showToast(`已将「${dragged.title}」移动到「${target.title}」下`);
    }
    setDraggedNodeId(null);
    setSnapTargetId(null);
  };

  const addNode = (anchor: TreeNode, sibling: boolean) => {
    if (sibling && anchor.root) { showToast("根节点不可添加同级节点"); return; }
    const parentId = sibling ? anchor.parentId : anchor.id;
    const node: TreeNode = { id: `n-${Date.now()}`, title: "未命名探索", category: "研究问题", tags: ["新建"], updatedAt: Date.now(), parentId, note: "", resources: [] };
    recordHistory();
    setNodes((items) => [...items, node]);
    setExpanded((items) => new Set(items).add(parentId || "root"));
    setSelectedId(node.id);
    setEditingNodeMeta(true);
  };

  const deleteNode = (id: string) => {
    const node = nodes.find((item) => item.id === id);
    if (!node || node.root) { showToast("根节点不可删除"); return; }
    const childNodes = descendants(id);
    const ids = new Set([id, ...childNodes.map((item) => item.id)]);
    recordHistory();
    setNodes((items) => items.filter((item) => !ids.has(item.id)));
    setSelectedId(null);
    showToast(`已删除「${node.title}」，可撤销`);
  };

  const addIsolatedNode = () => {
    recordHistory();
    const id = `isolated-${Date.now()}`;
    const node: TreeNode = { id, title: "未命名研究节点", category: "探索", tags: [], updatedAt: Date.now(), parentId: null, note: "", resources: [] };
    const isolatedCount = nodes.filter((item) => item.parentId === null).length;
    setNodes((items) => [...items, node]);
    setExpanded((items) => new Set(items).add(id));
    setNodePositions((items) => ({ ...items, [id]: { x: 140 + isolatedCount * 38, y: 180 + isolatedCount * 155 } }));
    setSelectedIds(new Set([id]));
    setSelectedId(id);
    setSelectedEdgeChildId(null);
    showToast("已添加孤立节点");
  };

  const deleteEdge = (childId: string) => {
    const child = nodes.find((node) => node.id === childId);
    if (!child?.parentId) return;
    recordHistory();
    setNodes((items) => items.map((node) => node.id === childId ? { ...node, parentId: null, updatedAt: Date.now() } : node));
    setSelectedEdgeChildId(null);
    showToast(`已删除与「${child.title}」的连线，节点保留为孤立节点`);
  };

  const openEditor = () => { if (!selected) return; setDraft(selected.note); setEditing(true); };
  const updateDraft = (value: string) => {
    setDraft(value); setSaveState("saving");
    setNodes((items) => items.map((node) => node.id === selected?.id ? { ...node, note: value, updatedAt: Date.now() } : node));
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setSaveState("saved");
    }, 650);
  };
  const attachResource = (resource: Resource) => {
    setNodes((items) => items.map((node) => node.id === selected?.id && !node.resources.some((r) => r.id === resource.id)
      ? { ...node, resources: [...node.resources, resource] } : node));
  };

  /* Legacy recursive tree rendering was replaced by the freely positioned card canvas. */
  const MindMapBranch = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
    const nodeChildren = children(node.id); const isOpen = expanded.has(node.id);
    const visibleWeight = (item: TreeNode): number => {
      const itemChildren = children(item.id);
      return expanded.has(item.id) && itemChildren.length ? itemChildren.reduce((sum, child) => sum + visibleWeight(child), 0) : 1;
    };
    const childWeights = nodeChildren.map(visibleWeight);
    const totalChildWeight = childWeights.reduce((sum, weight) => sum + weight, 0);
    let accumulatedWeight = 0;
    const childCurveY = childWeights.map((weight) => {
      const y = ((accumulatedWeight + weight / 2) / totalChildWeight) * 100;
      accumulatedWeight += weight;
      return y;
    });
    const hiddenNodeCount = !isOpen ? descendants(node.id).length : 0;
    return <div className="flex items-center">
      <div className="relative shrink-0">
      {hiddenNodeCount > 0 && <>
        <span className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-slate-200 bg-slate-100 shadow-sm" />
        <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl border border-slate-200 bg-white shadow-sm" />
        <span className="absolute -right-3 -top-3 z-30 grid h-7 min-w-7 place-items-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white shadow-lg ring-2 ring-white">+{hiddenNodeCount}</span>
      </>}
      <div
        data-tree-node-id={node.id}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        draggable={!node.root}
        onDragStart={(event) => { event.dataTransfer.setData("text/node-id", node.id); event.dataTransfer.effectAllowed = "move"; setDraggedNodeId(node.id); }}
        onDragEnd={() => { setDraggedNodeId(null); setSnapTargetId(null); }}
        onDragOver={(event) => { if (draggedNodeId && draggedNodeId !== node.id && !descendants(draggedNodeId).some((child) => child.id === node.id)) { event.preventDefault(); setSnapTargetId(node.id); } }}
        onDrop={(event) => {
          event.preventDefault(); event.stopPropagation(); const draggedId = event.dataTransfer.getData("text/node-id") || draggedNodeId;
          if (draggedId) reparentNode(draggedId, node.id);
        }}
        className={`group relative flex min-h-[96px] w-[230px] shrink-0 select-none items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${snapTargetId === node.id ? "z-30 scale-[1.06] border-emerald-400 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-200/80 shadow-xl" : selectedId === node.id ? "border-blue-500 bg-blue-50 text-blue-900 ring-4 ring-blue-100/70" : node.root ? "border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-200" : "border-slate-200 bg-white text-slate-700"}`}
      >
        {snapTargetId === node.id && <span className="absolute -top-7 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">释放，设为父节点</span>}
        {!node.root && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 opacity-0 group-hover:opacity-100" />}
        <div onClick={() => setSelectedId(node.id)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${node.root ? "bg-white/15 text-white" : selectedId === node.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}><FolderTree className="h-4 w-4" /></span>
          {editingTitle === node.id ? <span className="flex min-w-0 flex-1 flex-col gap-1.5"><input autoFocus value={node.title} onClick={(e) => e.stopPropagation()} onChange={(e) => setNodes((items) => items.map((item) => item.id === node.id ? { ...item, title: e.target.value } : item))} onKeyDown={(e) => e.key === "Enter" && setEditingTitle(null)} className="min-w-0 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-slate-800 outline-none" /><input value={nodeCategory(node)} placeholder="自定义类别" onClick={(e) => e.stopPropagation()} onChange={(e) => setNodes((items) => items.map((item) => item.id === node.id ? { ...item, category: e.target.value } : item))} onKeyDown={(e) => e.key === "Enter" && setEditingTitle(null)} className="min-w-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-600 outline-none" /></span> : <span className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="truncate font-semibold">{node.title}</span><span className={`w-fit max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryClass(nodeCategory(node), node.categoryColor)}`}>{nodeCategory(node)}</span></span>}
        </div>
        <button onClick={() => addNode(node, false)} className="absolute -right-4 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-blue-600 text-white opacity-0 shadow-lg transition-opacity hover:bg-blue-700 group-hover:opacity-100" title="添加子节点"><Plus className="h-4 w-4" /></button>
        {nodeChildren.length > 0 && <button onClick={() => setExpanded((items) => { const next = new Set(items); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; })} className="absolute -left-3 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm group-hover:opacity-100" title={isOpen ? "折叠分支" : "展开分支"}>{isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>}
        <div className="absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {!node.root && <button onClick={() => addNode(node, true)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-700" title="添加同级节点" aria-label="添加同级节点"><Plus className="h-3.5 w-3.5" /></button>}
          <button onClick={() => { recordHistory(); setEditingTitle(node.id); }} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" title="编辑节点卡片" aria-label="编辑节点卡片"><Edit3 className="h-3.5 w-3.5" /></button>
          {!node.root && <button onClick={() => deleteNode(node.id)} className="grid h-7 w-7 place-items-center rounded-lg text-red-600 hover:bg-red-50" title="删除节点" aria-label="删除节点"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
      </div>
      {isOpen && nodeChildren.length > 0 && <div className="relative ml-12 flex flex-col gap-8 py-5 pl-10">
        <svg className="pointer-events-none absolute -left-12 top-0 h-full w-[88px] overflow-visible" viewBox="0 0 88 100" preserveAspectRatio="none" aria-hidden="true">
          {childCurveY.map((targetY, index) => <path key={nodeChildren[index].id} d={`M 0 50 C 32 50, 48 ${targetY}, 88 ${targetY}`} fill="none" stroke="#bfdbfe" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
        </svg>
        {nodeChildren.map((child) => <div key={child.id} className="relative"><MindMapBranch node={child} depth={depth + 1} /></div>)}
      </div>}
    </div>;
  };

  const CanvasNodeCard = ({ node }: { node: TreeNode }) => {
    const nodeChildren = children(node.id);
    const isOpen = expanded.has(node.id);
    const hiddenNodeCount = !isOpen ? descendants(node.id).length : 0;
    const CategoryIcon = categoryIcon(nodeCategory(node));
    return <div
      data-tree-node-id={node.id}
      onPointerDown={(event) => {
        event.stopPropagation();
        if ((event.target as HTMLElement).closest("button,input")) return;
        if (event.metaKey) {
          event.preventDefault();
          setSelectedIds((items) => { const next = new Set(items); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; });
          setSelectedId(null);
          return;
        }
        if (node.root) {
          setSelectedIds(new Set([node.id]));
          setSelectedId(node.id);
          return;
        }
        const position = nodePositions[node.id]; if (!position) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const ids = selectedIds.has(node.id) ? [...selectedIds].filter((id) => !nodes.find((item) => item.id === id)?.root) : [node.id];
        const startPositions = Object.fromEntries(ids.map((id) => [id, nodePositions[id]]).filter((entry) => entry[1])) as Record<string, NodePosition>;
        nodeDrag.current = { id: node.id, ids, pointerX: event.clientX, pointerY: event.clientY, startPositions, moved: false };
        setDraggedNodeId(node.id);
      }}
      onPointerMove={(event) => {
        const drag = nodeDrag.current; if (!drag || drag.id !== node.id) return;
        const dx = (event.clientX - drag.pointerX) / mapScale; const dy = (event.clientY - drag.pointerY) / mapScale;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
        setNodePositions((items) => {
          const next = { ...items };
          drag.ids.forEach((id) => { const start = drag.startPositions[id]; if (start) next[id] = { x: start.x + dx, y: start.y + dy }; });
          return next;
        });
        if (drag.ids.length > 1) { snapTargetRef.current = null; setSnapTargetId(null); return; }
        let nearest: { id: string; distance: number } | null = null;
        const invalid = new Set([node.id, ...descendants(node.id).map((item) => item.id)]);
        const movingRect = event.currentTarget.getBoundingClientRect();
        document.querySelectorAll<HTMLElement>("[data-tree-node-id]").forEach((element) => {
          const id = element.dataset.treeNodeId; if (!id || invalid.has(id)) return;
          const rect = element.getBoundingClientRect();
          const gapX = Math.max(rect.left - movingRect.right, movingRect.left - rect.right, 0);
          const gapY = Math.max(rect.top - movingRect.bottom, movingRect.top - rect.bottom, 0);
          const distance = Math.hypot(gapX, gapY);
          if (distance <= 150 && (!nearest || distance < nearest.distance)) nearest = { id, distance };
        });
        snapTargetRef.current = nearest?.id || null; setSnapTargetId(snapTargetRef.current);
      }}
      onPointerUp={(event) => {
        const drag = nodeDrag.current; if (!drag || drag.id !== node.id) return;
        if (drag.moved) {
          suppressNodeClick.current = node.id;
          window.setTimeout(() => { if (suppressNodeClick.current === node.id) suppressNodeClick.current = null; }, 0);
          if (snapTargetRef.current) reparentNode(node.id, snapTargetRef.current);
        } else {
          setSelectedIds(new Set([node.id]));
          setSelectedId(node.id);
        }
        nodeDrag.current = null; snapTargetRef.current = null; setDraggedNodeId(null); setSnapTargetId(null);
        try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      }}
      className={`group absolute flex min-h-[138px] w-[260px] select-none flex-col items-stretch rounded-2xl border-2 px-4 py-3 text-sm shadow-sm transition-[box-shadow,border-color,background-color] hover:shadow-md ${node.root ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${categoryCardClass(nodeCategory(node), node.categoryColor)} ${snapTargetId === node.id ? "z-30 scale-[1.04] ring-4 ring-emerald-300/80 shadow-xl" : selectedIds.has(node.id) ? "ring-4 ring-blue-300/80 shadow-md" : ""}`}
      style={{ left: nodePositions[node.id]?.x || 0, top: nodePositions[node.id]?.y || 0 }}
    >
      {snapTargetId === node.id && <span className="absolute -top-7 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">释放，设为父节点</span>}
      {hiddenNodeCount > 0 && <span className="absolute -left-2 -top-3 z-30 grid h-7 min-w-7 place-items-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white shadow-lg ring-2 ring-white">+{hiddenNodeCount}</span>}
      <div onClick={(event) => {
        if (suppressNodeClick.current === node.id) { suppressNodeClick.current = null; return; }
        if (event.metaKey) return;
        setSelectedIds(new Set([node.id]));
        setSelectedId(node.id);
      }} className="flex min-w-0 flex-1 cursor-pointer flex-col">
        <span className={`inline-flex w-fit max-w-full items-center gap-1.5 truncate rounded-full px-2 py-1 text-[10px] font-semibold ${categoryClass(nodeCategory(node), node.categoryColor)}`}><CategoryIcon className="h-3 w-3 shrink-0" />{nodeCategory(node)}</span>
        <span className="mt-2 line-clamp-2 text-[15px] font-semibold leading-5">{node.title}</span>
        <span className="mt-2 flex min-w-0 gap-1">{nodeTags(node).slice(0, 2).map((tag) => <span key={tag} className="max-w-24 truncate rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">#{tag}</span>)}</span>
        <span className="mt-auto flex items-center justify-between gap-2 border-t border-current/10 pt-2 text-[9px] opacity-70"><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{updatedLabel(node)}</span>{node.id === demoAgentNodeId && <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700"><LoaderCircle className="h-3 w-3 animate-spin" /><span>GPU实验</span></span>}</span>
      </div>
      <button onPointerDown={(event) => event.stopPropagation()} onClick={() => addNode(node, false)} className="absolute -right-4 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-blue-600 text-white opacity-0 shadow-lg transition-opacity hover:bg-blue-700 group-hover:opacity-100" title="添加子节点"><Plus className="h-4 w-4" /></button>
      {nodeChildren.length > 0 && <button onPointerDown={(event) => event.stopPropagation()} onClick={() => setExpanded((items) => { const next = new Set(items); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; })} className="absolute -left-3 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm group-hover:opacity-100" title={isOpen ? "折叠分支" : "展开分支"}>{isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>}
      <div onPointerDown={(event) => event.stopPropagation()} className="absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {!node.root && <button onClick={() => addNode(node, true)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-700" title="添加同级节点"><Plus className="h-3.5 w-3.5" /></button>}
        {!node.root && <button onClick={() => deleteNode(node.id)} className="grid h-7 w-7 place-items-center rounded-lg text-red-600 hover:bg-red-50" title="删除节点"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    </div>;
  };

  const noteCategoryChoices = ["研究主题", "研究问题", "假设", "方法设计", "技术路线", "实验", "结论", "失败记录"];
  const NoteIdentity = () => {
    if (!selected) return null;
    const CategoryIcon = categoryIcon(nodeCategory(selected));
    const choices = noteCategoryChoices.includes(nodeCategory(selected)) ? noteCategoryChoices : [nodeCategory(selected), ...noteCategoryChoices];
    return <div className="border-b border-slate-100 pb-5">
      <label className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${categoryClass(nodeCategory(selected), selected.categoryColor)}`}>
        <CategoryIcon className="h-3.5 w-3.5 shrink-0" />
        <select value={nodeCategory(selected)} onChange={(event) => updateNodeMeta(selected.id, { category: event.target.value, categoryColor: undefined })} className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold text-inherit outline-none" aria-label="切换笔记分类">
          {choices.map((category) => <option key={category} value={category} className="bg-white text-slate-900">{category}</option>)}
        </select>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </label>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{selected.title}</h1>
      {!!nodeTags(selected).length && <div className="mt-3 flex flex-wrap gap-1.5">{nodeTags(selected).map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-500">#{tag}</span>)}</div>}
    </div>;
  };

  const FullScreenMetadataEditor = () => {
    if (!selected) return null;
    return <div className="mb-6 border-b border-slate-100 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryClass(nodeCategory(selected), selected.categoryColor)}`}>{React.createElement(categoryIcon(nodeCategory(selected)), { className: "h-3.5 w-3.5" })}<select value={nodeCategory(selected)} onChange={(event) => updateNodeMeta(selected.id, { category: event.target.value, categoryColor: undefined })} className="cursor-pointer appearance-none bg-transparent font-semibold text-inherit outline-none" aria-label="分类标签">{(noteCategoryChoices.includes(nodeCategory(selected)) ? noteCategoryChoices : [nodeCategory(selected), ...noteCategoryChoices]).map((category) => <option key={category} value={category} className="bg-white text-slate-900">{category}</option>)}</select><ChevronDown className="h-3 w-3 opacity-70" /></label>
        <div className="flex items-center gap-1.5">{categoryColorOptions.map((option) => <button key={option.id} type="button" onClick={() => updateNodeMeta(selected.id, { categoryColor: option.id })} title={`标签颜色：${option.label}`} aria-label={`设置为${option.label}`} className={`grid h-5 w-5 place-items-center rounded-full transition ${selected.categoryColor === option.id || (!selected.categoryColor && inferredCategoryColor(nodeCategory(selected)) === option.id) ? "ring-2 ring-slate-400 ring-offset-1" : "opacity-55 hover:opacity-100"}`}><span className={`h-3.5 w-3.5 rounded-full ${option.dot}`} /></button>)}</div>
      </div>
      <input value={selected.title} onChange={(event) => updateNodeMeta(selected.id, { title: event.target.value })} placeholder="输入笔记标题" className="mt-4 w-full border-0 bg-transparent p-0 text-2xl font-bold tracking-tight text-slate-950 outline-none placeholder:text-slate-300" aria-label="卡片与笔记标题" />
      <div className="mt-3"><HashTagEditor nodeId={selected.id} tags={nodeTags(selected)} onCommit={(tags) => updateNodeMeta(selected.id, { tags })} /></div>
    </div>;
  };

  const NoteContent = () => {
    if (!selected) return null;
    const linkedResources = selected.resources.filter((resource) => selected.note.includes(`#resource-${resource.id}`));
    return <div className="space-y-5">
    <NoteIdentity />
    {selected.note ? selected.note.split("\n\n").map((block, index) => block.startsWith("# ") ? null : block.startsWith("## ") ? <h2 key={index} className="text-lg font-semibold">{block.slice(3)}</h2> : <p key={index} className="whitespace-pre-line text-sm leading-7 text-slate-600">{block.replace(/\*\*/g, "").split(/(\[[^\]]+\]\(#resource-[^)]+\))/g).map((part, partIndex) => { const match = part.match(/^\[([^\]]+)\]\(#resource-[^)]+\)$/); return match ? <span key={partIndex} className="mx-0.5 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{match[1]}</span> : part; })}</p>) : <div className="py-24 text-center"><FileText className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 font-medium">开始记录本次科研探索</p><button onClick={openEditor} className="mt-3 text-sm font-medium text-blue-600">开始编辑</button></div>}
    {!!linkedResources.length && <div className="border-t border-slate-100 pt-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">关联资源</p><div className="flex flex-wrap gap-2">{linkedResources.map((resource) => { const Icon = kindIcon[resource.kind]; return <button key={resource.id} onClick={() => showToast(`已在新页面打开：${resource.title}`)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:border-blue-300 hover:text-blue-700"><Icon className="h-4 w-4" /><span className="max-w-72 truncate">{resource.title}</span><ExternalLink className="h-3.5 w-3.5 text-slate-400" /></button>; })}</div></div>}
  </div>;
  };

  const NoteWorkspaceContent = () => <>
    <FullScreenMetadataEditor />
    <BlockNoteEditor key={selected?.id} initialMarkdown={selected?.note ?? draft} availableResources={resources} onChange={updateDraft} onAttach={attachResource} />
    <div className="mt-6 flex items-center justify-end gap-2 text-xs text-slate-400">{saveState === "saving" ? <><Clock3 className="h-3.5 w-3.5" />自动保存中…</> : <><Check className="h-3.5 w-3.5 text-emerald-500" />已自动保存</>}</div>
  </>;

  const applyCanvasTemplate = (templateId: string) => {
    const templateNodes = nodesFromTemplate(projectTitle, templateId);
    const expandedIds = new Set(templateNodes.map((node) => node.id));
    setNodes(templateNodes);
    setExpanded(expandedIds);
    setNodePositions(calculateTreeLayout(templateNodes, expandedIds));
    setShowTemplatePicker(false);
    showToast("已从模板创建科研画布");
  };

  if (!nodes.length) return <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(#dbe3ef_1px,transparent_1px)] bg-[size:20px_20px] shadow-sm">
    <div className="max-w-lg rounded-3xl border border-dashed border-slate-300 bg-white/95 px-12 py-14 text-center shadow-sm backdrop-blur">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><FolderTree className="h-7 w-7" /></span>
      <h2 className="mt-5 text-xl font-semibold">空白科研画布</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">从第一个研究节点开始，或使用模板快速搭建实验流程。</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => { const rootNode: TreeNode = { id: `root-${projectId}`, title: projectTitle, category: "研究主题", tags: ["新建"], updatedAt: Date.now(), parentId: null, root: true, note: "", resources: [] }; setNodes([rootNode]); setExpanded(new Set([rootNode.id])); setNodePositions({ [rootNode.id]: { x: 100, y: 160 } }); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">新建空白节点</button>
        <button onClick={() => setShowTemplatePicker(true)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">从模板创建</button>
      </div>
    </div>
    {showTemplatePicker && <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6" onMouseDown={() => setShowTemplatePicker(false)}><div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between"><div><h3 className="text-xl font-semibold">选择科研画布模板</h3><p className="mt-1 text-sm text-slate-500">模板会生成可编辑、可拖拽的初始节点。</p></div><button onClick={() => setShowTemplatePicker(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
      <div className="mt-6 grid grid-cols-2 gap-4">{canvasTemplateBlueprints.map((template, index) => <button key={template.id} onClick={() => applyCanvasTemplate(template.id)} className="group rounded-2xl border border-slate-200 p-5 text-left hover:border-blue-400 hover:shadow-md"><span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 0 ? "bg-violet-100 text-violet-700" : index === 1 ? "bg-rose-100 text-rose-700" : index === 2 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}><FlaskConical className="h-5 w-5" /></span><h4 className="mt-5 font-semibold group-hover:text-blue-700">{template.title}</h4><p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p><p className="mt-4 text-xs text-slate-400">{template.nodes.length} 个初始节点</p></button>)}</div>
    </div></div>}
  </div>;

  return <div className="flex h-full min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
    <section className={`relative flex min-w-0 flex-col overflow-hidden bg-[#f8fafc] transition-[flex] duration-300 ${selected ? "flex-[1.7] border-r border-slate-200" : "flex-1"}`}>
      <div
        onDragOver={(event) => {
          if (!draggedNodeId) return;
          event.preventDefault();
          const invalidIds = new Set([draggedNodeId, ...descendants(draggedNodeId).map((item) => item.id)]);
          let nearest: { id: string; distance: number } | null = null;
          document.querySelectorAll<HTMLElement>("[data-tree-node-id]").forEach((element) => {
            const id = element.dataset.treeNodeId;
            if (!id || invalidIds.has(id)) return;
            const rect = element.getBoundingClientRect();
            const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
            const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
            const distance = Math.hypot(dx, dy);
            if (distance <= 150 && (!nearest || distance < nearest.distance)) nearest = { id, distance };
          });
          setSnapTargetId(nearest?.id ?? null);
          event.dataTransfer.dropEffect = nearest ? "move" : "none";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/node-id") || draggedNodeId;
          if (draggedId && snapTargetId) reparentNode(draggedId, snapTargetId);
          else { setDraggedNodeId(null); setSnapTargetId(null); }
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          if (event.metaKey) {
            const rect = event.currentTarget.getBoundingClientRect();
            selectionStart.current = { clientX: event.clientX, clientY: event.clientY, canvasLeft: rect.left, canvasTop: rect.top };
            setSelectionBox({ left: event.clientX - rect.left, top: event.clientY - rect.top, width: 0, height: 0 });
            return;
          }
          panStart.current = { pointerX: event.clientX, pointerY: event.clientY, offsetX: mapOffset.x, offsetY: mapOffset.y, moved: false };
          setIsPanning(true);
        }}
        onPointerMove={(event) => {
          if (selectionStart.current) {
            const start = selectionStart.current;
            setSelectionBox({ left: Math.min(start.clientX, event.clientX) - start.canvasLeft, top: Math.min(start.clientY, event.clientY) - start.canvasTop, width: Math.abs(event.clientX - start.clientX), height: Math.abs(event.clientY - start.clientY) });
            return;
          }
          if (!panStart.current) return;
          const dx = event.clientX - panStart.current.pointerX;
          const dy = event.clientY - panStart.current.pointerY;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panStart.current.moved = true;
          setMapOffset({ x: panStart.current.offsetX + dx, y: panStart.current.offsetY + dy });
        }}
        onPointerUp={(event) => {
          if (selectionStart.current) {
            const start = selectionStart.current;
            const bounds = { left: Math.min(start.clientX, event.clientX), right: Math.max(start.clientX, event.clientX), top: Math.min(start.clientY, event.clientY), bottom: Math.max(start.clientY, event.clientY) };
            const matched = new Set<string>();
            document.querySelectorAll<HTMLElement>("[data-tree-node-id]").forEach((element) => {
              const rect = element.getBoundingClientRect();
              if (rect.right >= bounds.left && rect.left <= bounds.right && rect.bottom >= bounds.top && rect.top <= bounds.bottom && element.dataset.treeNodeId) matched.add(element.dataset.treeNodeId);
            });
            setSelectedIds(matched);
            setSelectedId(matched.size === 1 ? [...matched][0] : null);
            selectionStart.current = null;
            setSelectionBox(null);
            event.currentTarget.releasePointerCapture(event.pointerId);
            return;
          }
          if (!panStart.current) return;
          if (!panStart.current.moved) { setSelectedId(null); setSelectedIds(new Set()); setSelectedEdgeChildId(null); }
          panStart.current = null;
          setIsPanning(false);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { panStart.current = null; selectionStart.current = null; setSelectionBox(null); setIsPanning(false); }}
        onWheel={(event) => {
          event.preventDefault();
          const direction = event.deltaY < 0 ? 1 : -1;
          setMapScale((value) => Math.min(1.2, Math.max(.65, Number((value + direction * .08).toFixed(2)))));
        }}
        className={`relative flex-1 overflow-hidden touch-none bg-[radial-gradient(#dbe3ef_1px,transparent_1px)] bg-[size:20px_20px] ${isPanning ? "cursor-grabbing select-none" : "cursor-grab"}`}
      >
        {selectionBox && <div className="pointer-events-none absolute z-50 border border-blue-500 bg-blue-100/35" style={selectionBox} />}
        {selectedIds.size > 1 && <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">已选择 {selectedIds.size} 个节点 · 拖动任一节点同步移动</div>}
        <div onPointerDown={(event) => event.stopPropagation()} className="absolute right-4 top-4 z-40 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
          <button onClick={addIsolatedNode} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="添加孤立节点" aria-label="添加孤立节点"><Plus className="h-4 w-4" /></button>
          <span className="mx-1 h-5 border-l border-slate-200" />
          <button onClick={() => { const layout = calculateTreeLayout(nodes, expanded); const root = nodes.find((node) => node.root); if (root && nodePositions[root.id]) layout[root.id] = nodePositions[root.id]; setNodePositions(layout); showToast("已自动排列节点，根节点位置保持不变"); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="自动布局" aria-label="自动布局"><Table2 className="h-4 w-4" /></button>
          <span className="mx-1 h-5 border-l border-slate-200" />
          <button onClick={undo} disabled={!undoStack.current.length} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent" title="撤销" aria-label="撤销"><Undo2 className="h-4 w-4" /></button>
          <button onClick={redo} disabled={!redoStack.current.length} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent" title="重做" aria-label="重做"><Redo2 className="h-4 w-4" /></button>
          <span className="mx-1 h-5 border-l border-slate-200" /><button onClick={() => setMapScale((value) => Math.max(.65, value - .1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="缩小"><ZoomOut className="h-4 w-4" /></button><span className="w-10 text-center text-xs text-slate-400">{Math.round(mapScale * 100)}%</span><button onClick={() => setMapScale((value) => Math.min(1.2, value + .1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="放大"><ZoomIn className="h-4 w-4" /></button>
        </div>
        <div className="relative h-[1200px] w-[1900px] transition-transform duration-100" style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`, transformOrigin: "left top" }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {visibleNodes.filter((node) => !node.root && node.parentId && visibleNodes.some((item) => item.id === node.parentId)).map((node) => {
              const from = nodePositions[node.parentId!]; const to = nodePositions[node.id]; if (!from || !to) return null;
              const childIsRight = to.x >= from.x;
              const direction = childIsRight ? 1 : -1;
              const startX = from.x + (childIsRight ? 260 : 0);
              const endX = to.x + (childIsRight ? 0 : 260);
              const startY = from.y + 69;
              const endY = to.y + 69;
              const bend = Math.max(70, Math.min(180, Math.abs(endX - startX) * .45));
              const path = `M ${startX} ${startY} C ${startX + direction * bend} ${startY}, ${endX - direction * bend} ${endY}, ${endX} ${endY}`;
              const selectedEdge = selectedEdgeChildId === node.id;
              return <React.Fragment key={node.id}>
                <path d={path} fill="none" stroke="transparent" strokeWidth="16" className="pointer-events-auto cursor-pointer" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setSelectedEdgeChildId(node.id); setSelectedId(null); setSelectedIds(new Set()); }} />
                <path d={path} fill="none" stroke={selectedEdge ? "#ef4444" : "#93c5fd"} strokeWidth={selectedEdge ? 3 : 2} strokeLinecap="round" className="pointer-events-none" />
                {selectedEdge && <g className="pointer-events-auto cursor-pointer" transform={`translate(${(startX + endX) / 2} ${(startY + endY) / 2})`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); deleteEdge(node.id); }}>
                  <circle r="13" fill="#ef4444" stroke="white" strokeWidth="2" />
                  <text x="0" y="1" fill="white" fontSize="17" fontWeight="600" textAnchor="middle" dominantBaseline="middle">×</text>
                </g>}
              </React.Fragment>;
            })}
          </svg>
          {visibleNodes.map((node) => <CanvasNodeCard key={node.id} node={node} />)}
        </div>
        <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] font-normal tracking-wide text-slate-300/80">拖动空白区域平移 · 滚轮缩放 · ⌘ 点击/拖动框选 · 多选后拖动同步移动</div>
      </div>
    </section>
    {selected && <section className="flex min-w-[390px] flex-1 flex-col bg-[#fafbfc]">
      <>
        <div className="flex items-center justify-end gap-2 border-b border-slate-200 bg-white px-5 py-3"><span className="mr-auto text-[11px] text-slate-400">可直接编辑 · 自动保存</span><button onClick={() => setFullScreen(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" title="全屏查看" aria-label="全屏查看"><Maximize2 className="h-4 w-4" /></button></div>
        <div className="flex-1 overflow-auto p-5">
          <article className="mx-auto min-h-[440px] max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><NoteWorkspaceContent /></article>
        </div>
      </>
    </section>}

    {fullScreen && selected && <div className="fixed inset-0 z-[1150] flex flex-col bg-white">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6"><div className="flex min-w-0 items-center gap-3"><button onClick={() => setFullScreen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button><div><p className="text-xs text-slate-400">{projectTitle} / 科研画布</p><h2 className="font-semibold">{selected.title}</h2></div></div><span className="flex items-center gap-1.5 text-xs text-slate-500">{saveState === "saving" ? <><Clock3 className="h-4 w-4" />自动保存中…</> : <><Check className="h-4 w-4 text-emerald-500" />已自动保存</>}</span></header>
      <main className="flex-1 overflow-auto bg-[#f8fafc] p-8"><article className="relative mx-auto min-h-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm"><NoteWorkspaceContent /></article></main>
    </div>}
    {toast && <div className="fixed bottom-6 left-1/2 z-[1300] -translate-x-1/2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
  </div>;
}
