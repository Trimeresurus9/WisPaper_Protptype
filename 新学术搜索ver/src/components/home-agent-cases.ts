import type { HomeTaskId } from './home-task-config';

export type AgentCaseTask = Exclude<HomeTaskId, 'search'>;
export interface CaseSection { title: string; body: string; points?: string[] }
export interface CaseSource { title: string; detail: string }
export interface AgentCase {
  id: string; task: AgentCaseTask; title: string; prompt: string; topic: string;
  brief: string; context: string[]; plan: CaseSection[]; sources: CaseSource[];
  findings: CaseSection[]; resultTitle: string; resultIntro: string; result: CaseSection[];
  fileName: string; slides?: CaseSection[];
}

function ideaCase(id: string, title: string, prompt: string, topic: string, background: string, directions: CaseSection[]): AgentCase {
  return { id, task: 'ideas', title, prompt, topic,
    brief: `围绕${topic}，将宽泛兴趣收敛为可验证的研究问题，并提供最小实验方案。`,
    context: ['目标：形成 3 个可讨论的研究选题', '范围：问题定义、研究价值与可行实验', '交付：选题卡片与下一步行动'],
    plan: [
      {title:'明确研究边界',body:background},
      {title:'拆分问题与变量',body:`从${directions.map(item=>item.title).join('、')}三个切入点整理假设，区分已有条件与待验证问题。`},
      {title:'设计最小验证',body:'为每个方向给出对照条件、观察指标和下一步行动，避免把研究设想写成已验证结论。'},
    ],
    sources: [{title:'研究背景与约束.md',detail:background}, {title:'候选问题对照.md',detail:directions.map(item=>item.title).join(' / ')}, {title:'实验可行性检查.md',detail:'对照、评价指标、资源条件与可能失败的情况'}],
    findings: directions.map(item=>({title:item.title,body:item.body})),
    resultTitle:`${topic}：3 个研究选题`, resultIntro:'以下是本案例整理出的研究假设。每个方向均需通过实验验证，不代表已经获得研究结论。', result:directions,
    fileName:`${title}-研究选题.md`,
  };
}
function reviewCase(id:string,title:string,prompt:string,topic:string,scope:string,sections:CaseSection[]): AgentCase {
  return {id,task:'review',title,prompt,topic,
    brief:`整理${topic}的研究框架，用统一维度比较方法，并形成可以继续补充文献的综述结构。`,
    context:[`范围：${scope}`,'组织方式：问题 → 方法 → 比较 → 研究空白','交付：综述结构与方法对照'],
    plan:[{title:'定义综述范围',body:scope},{title:'建立方法分类',body:sections.map(item=>item.title).join('；')},{title:'归纳对比与空白',body:'对齐比较维度，保留适用条件和待核验项，避免仅按论文顺序罗列。'}],
    sources:[{title:'主题范围与关键词.md',detail:scope},{title:'方法分类表.md',detail:sections.map(item=>item.title).join(' / ')},{title:'综述证据整理.md',detail:'按研究问题、方法、评价方式与局限组织的预置案例材料'}],
    findings:sections.slice(0,3).map(item=>({title:item.title,body:item.body})),
    resultTitle:`${topic} · 综述框架`, resultIntro:'这份案例成果展示了从主题拆分到方法对照的组织方式。正式写作仍需逐条补齐、核对原始文献与引用。',
    result:[...sections,{title:'讨论与后续研究',body:`围绕${topic}，进一步核对不同方法的评价条件是否可比，并优先补齐缺少证据支撑的部分。`,points:['建立纳入与排除标准，保留筛选记录。','将每个关键判断关联到可核验的原始文献。','按应用条件讨论局限，避免跨设置直接比较数字。']}],fileName:`${title}-综述框架.md`};
}
function peerCase(id:string,title:string,prompt:string,topic:string,abstract:string,issues:CaseSection[]): AgentCase {
  return {id,task:'peer-review',title,prompt,topic,
    brief:`对预置示例稿“${topic}”做结构化评审，区分研究贡献、主要问题和可执行的修改建议。`,
    context:['材料：预置示例稿摘要与方法说明','范围：只评价案例提供的内容','交付：主要意见、验证要求与修改清单'],
    plan:[{title:'阅读示例稿',body:abstract},{title:'核对论证与实验',body:'逐项检查研究主张、基线设置、评价方式和结论范围。'},{title:'形成分级评审意见',body:'区分影响结论的主要问题与表达层面的修改，并给出补充实验建议。'}],
    sources:[{title:'示例稿-摘要与方法.md',detail:abstract},{title:'评审检查表.md',detail:'问题定义、创新点、对照实验、统计与可复现性'},{title:'修改建议工作表.md',detail:issues.map(item=>item.title).join(' / ')}],
    findings:issues.map(item=>({title:item.title,body:item.body})),resultTitle:`${topic} · 评审意见`,
    resultIntro:'基于案例提供的示例稿，建议先补足主要证据，再调整结论措辞。以下意见仅对应本示例，不是对真实投稿论文的评审。',
    result:[{title:'总体评价',body:abstract,points:['研究问题明确，具备继续讨论的价值。','当前材料不足以支持所有主张，优先处理以下主要问题。']},...issues,{title:'修改优先级',body:'先补证据，再改表达。',points:['P1：完成影响核心结论的实验与对照。','P2：补充评价细节、实现条件和失败案例。','P3：调整标题、摘要与讨论，使表述与证据一致。']}],fileName:`${title}-评审意见.md`};
}
function slideCase(id:string,title:string,prompt:string,topic:string,audience:string,pages:CaseSection[]):AgentCase {
  return {id,task:'slides',title,prompt,topic,brief:`围绕${topic}，组织一份面向${audience}的组会汇报，串联背景、方法、讨论与下一步。`,
    context:[`听众：${audience}`,'时长：约 15 分钟','交付：6 页汇报预览与逐页讲稿'],
    plan:[{title:'梳理汇报主线',body:`用“为什么研究${topic} → 如何解决 → 如何评价”的顺序组织讲述。`},{title:'分配页面与时间',body:'背景 2 分钟、核心内容 8 分钟、讨论和下一步 5 分钟。'},{title:'整理逐页讲稿',body:'每页保留一个核心信息，补充讲解要点，最后留下可供组会讨论的问题。'}],
    sources:[{title:'汇报需求.md',detail:`主题：${topic}；听众：${audience}；约 15 分钟`},{title:'内容提纲.md',detail:pages.map(page=>page.title).join(' / ')},{title:'逐页讲述要点.md',detail:'每页核心信息、展开顺序与讨论问题'}],
    findings:pages.slice(1,4).map(page=>({title:page.title,body:page.body})),resultTitle:`${topic} · 组会汇报`,resultIntro:'已整理 6 页汇报结构与逐页讲述要点。可在右侧翻页查看完整案例，或下载案例讲稿。',result:pages,slides:pages,fileName:`${title}-逐页讲稿.md`};
}

// Self-contained, precomputed prototype cases. Selecting or stepping through them never runs an Agent or changes credits.
export const homeAgentCases: AgentCase[] = [
  ideaCase('ideas-agent-memory','Agent 长期记忆选题','多模态 Agent 的长期记忆，有哪些值得研究的方向？','多模态 Agent 长期记忆','已关注多模态 Agent，希望从记忆存储、调用与更新中找到可验证的切入点。',[
    {title:'让记忆随证据更新',body:'当新信息与旧记忆冲突时，研究如何判断替换、保留或并存，避免过期信息继续影响回答。',points:['研究问题：不同更新策略如何影响跨会话一致性？','最小实验：构造具有信息变更的多轮任务，对比直接覆盖、保留全部与证据加权。','观察指标：更新正确率、旧信息干扰和额外存储开销。']},
    {title:'按任务选择跨模态记忆',body:'研究文本、图片和交互记录的组合是否能帮助当前任务，而不是无差别加入上下文。',points:['研究问题：哪些任务需要跨模态记忆，哪些只需要文本？','最小实验：固定任务和预算，比较单模态检索与跨模态检索。','观察指标：任务完成度、无关记忆比例与检索延迟。']},
    {title:'为长期记忆设计遗忘机制',body:'研究在有限容量下，怎样保留可复用的信息、删除冗余内容，同时解释遗忘决定。',points:['研究问题：基于时间、频次和任务价值的遗忘策略如何取舍？','最小实验：设置固定记忆预算，对比 FIFO 与任务相关性策略。','下一步：先建立小规模连续任务集，检查指标能否反映长期效果。']},
  ]),
  ideaCase('ideas-materials','材料筛选研究选题','我想研究机器学习辅助材料筛选，帮我找到三个可验证的选题。','机器学习辅助材料筛选','已有小规模材料性质数据，希望在有限实验预算下提高候选材料的筛选效率。',[
    {title:'让不确定性参与候选选择',body:'比较只按预测分数选样与同时考虑模型不确定性的选样方式。',points:['固定实验预算，对比不同候选选择策略。','记录有效候选比例与预测校准情况。','检查模型是否只在熟悉的数据区域表现良好。']},
    {title:'用主动学习减少标注需求',body:'把下一轮实验的选择视为研究问题，观察每批新增数据带来的收益。',points:['采用相同初始数据，比较随机选样与主动选样。','绘制随实验次数变化的效果曲线。','记录失败样本，避免只分析成功候选。']},
    {title:'检查跨材料体系的迁移',body:'研究模型在新材料类别上的适用边界，定位需要补充的数据。',points:['按材料类别划分训练与测试集合。','对比直接迁移、少样本微调与重新训练。','分析数据分布变化与误差的关系。']},
  ]),
  ideaCase('ideas-science-learning','AI 学习反馈选题','围绕 AI 辅助学习，帮我提出三个适合开展实验的研究问题。','AI 辅助学习反馈','关注反馈形式对学习过程的影响，希望区分即时答对与长期理解。',[
    {title:'先给提示还是直接给答案',body:'比较不同反馈深度对迁移题表现的影响。',points:['在同等练习时间下设置提示、完整答案与对照组。','同时记录即时表现和延迟测验表现。','将学习者基础作为需要控制的变量。']},
    {title:'如何让学习者核验 AI 建议',body:'研究要求解释或核验依据能否改变学习者对建议的使用方式。',points:['比较直接接受、解释理由与核对材料三种条件。','记录发现错误的比例及判断信心。','关注不同难度任务下的差异。']},
    {title:'何时介入反馈更合适',body:'比较即时反馈与完成阶段后集中反馈的作用。',points:['保持题目与反馈内容一致，只改变时间点。','记录任务中断、修正行为和后续迁移。','先以小规模试验验证测量工具。']},
  ]),
  reviewCase('review-rag','RAG 评测方法综述','帮我梳理检索增强生成（RAG）的评测方法，并整理成综述。','RAG 评测方法','覆盖检索质量、生成质量和端到端任务评价，不直接比较不同数据集上的分数。',[
    {title:'检索侧：证据是否找对',body:'将相关性、覆盖度与排序质量分开讨论，明确查询与相关文档的标注方式。',points:['比较不同检索粒度和候选集设置。','记录是否使用相同语料与相关性标签。','区分“没找到证据”和“找到但没使用证据”。']},
    {title:'生成侧：回答是否有依据',body:'围绕回答正确性、忠实度和引用支持关系组织评价，区分自动评价与人工评价。',points:['明确评价对象是整段回答还是单个事实。','说明参考答案与引用来源的生成方式。','对自动评价器保留人工复核样本。']},
    {title:'系统侧：任务是否真正完成',body:'在同一任务条件下综合观察效果、时延与成本，解释模块之间的误差传递。',points:['固定任务集与资源预算。','用消融实验定位检索和生成的贡献。','补充无答案、冲突证据和时间变化等情况。']},
  ]),
  reviewCase('review-multimodal','多模态推理评测综述','梳理多模态推理的评测方式，比较不同任务和评价维度。','多模态推理评测','按感知、信息整合、推理链与最终任务表现拆分评测。',[
    {title:'感知与推理的边界',body:'区分模型没有正确读取材料与未能完成推理，避免把两类错误混为一谈。',points:['记录输入模态、分辨率和信息量。','对感知结果建立独立检查。','补充遮挡、噪声与无关信息条件。']},
    {title:'跨模态信息整合',body:'比较单一模态足够作答与必须组合多模态信息的任务。',points:['设置单模态基线。','检查是否存在可绕过某种模态的捷径。','按任务难度分层报告结果。']},
    {title:'评价与可复现性',body:'将答案准确性、解释质量与计算成本分别报告。',points:['明确提示词、采样方式和评价程序。','重复实验并记录波动。','保留失败案例供后续分析。']},
  ]),
  reviewCase('review-active-learning','主动学习方法综述','帮我整理主动学习的主要方法、适用条件和研究空白。','主动学习方法','聚焦样本选择策略、标注预算与评价设置。',[
    {title:'基于不确定性的选样',body:'围绕如何度量和校准不确定性整理方法，讨论异常样本对选样的影响。',points:['区分预测熵、边界距离与模型分歧。','记录初始样本数量和选择批次。','避免仅报告单个预算点。']},
    {title:'兼顾代表性与多样性',body:'讨论所选样本是否覆盖数据结构，以及批量选样中的冗余问题。',points:['比较特征空间和距离度量。','检查类别不平衡影响。','报告不同随机初始化的变化。']},
    {title:'面向真实标注流程',body:'把标注成本、标注噪声和数据变化纳入评价条件。',points:['区分固定单样本成本与不同样本成本。','观察噪声标签如何影响后续选样。','记录人工反馈与模型更新的时间开销。']},
  ]),
  peerCase('peer-rag','RAG 方法稿评审','评审这篇 RAG 方法示例稿，重点检查创新性与实验设计。','一种自适应检索的 RAG 方法','示例稿提出根据问题特征决定检索次数，并以回答质量与查询开销作为评价目标。',[
    {title:'明确新增贡献来自哪里',body:'当前描述将检索次数、筛选方式与提示词一起改变，尚不能分清各部分的贡献。',points:['补充固定检索次数与自适应检索的对照。','分别消融筛选模块和提示词变化。','将创新点表述限定到已被对照支持的部分。']},
    {title:'在一致预算下比较',body:'若方法使用更多查询或更长上下文，单独比较回答分数不足以说明优势。',points:['报告查询次数、上下文长度和推理时延。','加入相同预算下的强基线。','展示质量与资源消耗之间的关系。']},
    {title:'补充失败与边界情况',body:'示例材料尚未覆盖无答案和冲突证据的情况。',points:['增加缺少证据时的拒答评价。','分析自适应机制错误停止的案例。','说明哪些问题类型不适合该方法。']},
  ]),
  peerCase('peer-graph','图学习方法稿评审','帮我评审一篇图学习示例稿，检查数据划分和结论是否充分。','面向节点分类的图学习方法','示例稿使用结构与节点特征进行分类，并声称在多种数据条件下具有稳定表现。',[
    {title:'说明训练与测试的边界',body:'需要明确是传导式还是归纳式设置，以及训练时能否看到测试节点的结构。',points:['给出数据划分流程与随机种子。','检查图构建过程中是否使用测试标签。','分别报告不同设置的结果。']},
    {title:'增强基线与消融',body:'仅与简单模型比较，不能充分说明结构模块的必要性。',points:['加入只用节点特征的基线。','分别移除结构和特征分支。','对齐超参数搜索预算。']},
    {title:'让稳定性结论对应证据',body:'单次运行不足以支持跨条件稳定的表述。',points:['报告多次运行的均值与变化范围。','按图规模和类别分布拆分结果。','说明表现下降的条件。']},
  ]),
  peerCase('peer-user-study','用户研究稿评审','评审一篇 AI 写作辅助的用户研究示例稿，重点看实验与论证。','AI 写作辅助工具的用户研究','示例稿比较有无 AI 辅助时的写作任务表现，并使用评分量表和访谈解释使用体验。',[
    {title:'区分工具效果与任务熟悉度',body:'若任务顺序固定，后一次表现可能受到练习影响。',points:['说明随机分组或顺序平衡方式。','控制任务难度与完成时间。','报告参与者相关经验。']},
    {title:'补齐评分与分析方法',body:'需要解释写作质量如何评分，以及评分者是否知道实验条件。',points:['公开评分维度和示例。','说明盲评及评分一致性检查。','将量化结果与访谈证据分别呈现。']},
    {title:'限定结论的适用范围',body:'短时任务的改善不能直接推断长期写作能力变化。',points:['明确结论只覆盖当前任务与样本。','讨论依赖性、学习效应和长期使用。','提出后续纵向研究设计。']},
  ]),
  slideCase('slides-transformer','Transformer 论文组会','围绕 Attention Is All You Need，准备一份 15 分钟组会 PPT。','Attention Is All You Need','了解基础深度学习的组员',[
    {title:'从序列建模问题出发',body:'介绍本次汇报的问题：如何组织序列中的信息交互。',points:['先交代输入、输出与任务背景。','用一句话说明今天要理解的核心机制。']},
    {title:'自注意力在做什么',body:'从查询、键和值的关系解释位置之间如何交换信息。',points:['先讲直觉，再引入符号。','用一个短句说明不同词之间的关联。']},
    {title:'从注意力到模型结构',body:'串联多头注意力、位置编码、前馈层与残差连接。',points:['按照数据流讲述各模块。','说明为什么模型仍需要位置信息。']},
    {title:'如何阅读实验部分',body:'围绕任务、对照、训练条件和评价方式组织论文实验。',points:['区分整体比较与组件消融。','核对图表条件，再解释结果。']},
    {title:'值得组会讨论的问题',body:'讨论注意力机制的能力边界，以及序列变长后需要考虑的问题。',points:['信息交互是否总是需要全局？','如何观察模型使用了哪些输入信息？']},
    {title:'总结与下一步',body:'回顾问题、机制和评价，提出一个可开展的小实验。',points:['实现一个简化注意力模块。','比较有无位置信息时的任务表现。']},
  ]),
  slideCase('slides-rag','RAG 项目进展汇报','把 RAG 项目的研究背景、方案和评测计划整理成组会 PPT。','RAG 项目进展','课题组老师与项目成员',[
    {title:'项目问题与目标',body:'围绕知识获取与回答依据，说明本次项目要解决的问题。',points:['列出目标用户和典型查询。','明确何种结果可以视为任务成功。']},
    {title:'系统方案',body:'按语料处理、检索、上下文构建与回答生成介绍流程。',points:['展示各模块输入和输出。','说明目前采用的基线设置。']},
    {title:'当前已完成的工作',body:'用可核验的工作项描述进展，不在案例中虚构实验分数。',points:['准备语料与任务样例。','建立可重复的评测流程。']},
    {title:'评测如何设计',body:'从检索、回答和系统资源三个层面组织评价。',points:['区分有答案与无答案的查询。','同时观察质量、时延与成本。']},
    {title:'风险与待解决问题',body:'明确数据、评价和系统实现中的不确定性。',points:['证据不完整时如何处理？','检索命中但回答错误时如何定位？']},
    {title:'下一阶段计划',body:'按可验证的里程碑安排接下来的研究。',points:['完成基线对照与关键消融。','汇总失败案例并提出改进假设。']},
  ]),
  slideCase('slides-graph','图神经网络入门组会','做一份图神经网络入门组会 PPT，讲清消息传递和评测方法。','图神经网络入门','刚接触图学习的组员',[
    {title:'为什么用图表示问题',body:'从实体与关系出发，说明图结构提供的信息。',points:['举出节点、边和特征的直观例子。','区分节点、边和整图层面的任务。']},
    {title:'消息传递的直觉',body:'解释节点如何聚合邻居信息并更新自身表示。',points:['明确聚合与更新两个步骤。','通过一轮更新追踪信息流动。']},
    {title:'模型设计中的选择',body:'介绍邻居采样、聚合方式与层数的选择。',points:['比较不同聚合操作的作用。','讨论图结构和节点特征各自的贡献。']},
    {title:'评测与数据划分',body:'说明传导式和归纳式设置的差异。',points:['先确定训练时可见的信息。','加入只用特征的基线并保持划分一致。']},
    {title:'常见误区与讨论',body:'围绕信息泄漏、深层传播与大图计算展开讨论。',points:['图构建是否使用了不应可见的信息？','更多传播层是否总是有帮助？']},
    {title:'从一个小实验开始',body:'用简单节点分类任务练习完整实验流程。',points:['固定数据划分，训练特征基线。','加入一层消息传递，再比较结果与成本。']},
  ]),
];
export const caseStepTitles = ['理解任务', '制定计划', '执行过程', '查看成果'] as const;
export const getAgentCase = (id: string | null) => homeAgentCases.find(item => item.id === id);
export const getAgentCasesForTask = (task: HomeTaskId | null) => homeAgentCases.filter(item => item.task === task);
export function agentCaseMarkdown(item:AgentCase) {
  return [`# ${item.resultTitle}`,'> 预置演示案例 · 免费查看，不执行任务、不消耗积分。',`## 原始需求\n${item.prompt}`,item.resultIntro,...item.result.map(section=>`## ${section.title}\n\n${section.body}${section.points ? '\n\n'+section.points.map(point=>'- '+point).join('\n'):''}`)].join('\n\n');
}
