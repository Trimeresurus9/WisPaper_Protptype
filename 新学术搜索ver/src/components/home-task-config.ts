import { getAgentCase, type AgentCaseTask } from './home-agent-cases';
export type HomeTaskId = 'search' | 'ideas' | 'review' | 'peer-review' | 'slides';
export type HomeStage = 'home' | 'search' | 'agent' | 'case';
export interface HomeQuestion { label: string; prompt: string; options: string[]; placeholder: string }
export interface HomeTaskConfig {
  id: HomeTaskId; label: string; placeholder: string; example: string; introduction: string;
  question: HomeQuestion; steps: string[]; output: string;
}
export const homeTaskConfigs: HomeTaskConfig[] = [
  { id: 'search', label: '论文搜索', placeholder: '输入研究问题、关键词或论文标题', example: '找一些关于大语言模型长期记忆的论文', introduction: '', question: { label: '', prompt: '', options: [], placeholder: '' }, steps: ['理解研究问题', '检索相关论文', '整理文献线索'], output: '相关论文与研究线索' },
  { id: 'ideas', label: '灵感发现', placeholder: '告诉我你关注的方向，一起找到值得研究的问题', example: '多模态 Agent 的长期记忆，有哪些值得研究的方向？', introduction: '我会从已有研究中寻找问题与空白，帮你收敛成可开展的选题。', question: { label: '选题目标', prompt: '你希望这次选题帮你推进到哪一步？', options: ['探索新方向', '确定论文选题', '设计可行实验'], placeholder: '也可以说说已有想法、数据或实验条件…' }, steps: ['梳理研究现状', '寻找研究空白', '提出选题与验证思路'], output: '选题建议、研究价值与验证思路' },
  { id: 'review', label: '文献综述', placeholder: '输入综述主题，或描述你想梳理的研究问题', example: '帮我梳理检索增强生成（RAG）的评测方法与研究进展', introduction: '我会围绕你的主题梳理关键文献、方法演进与研究空白。', question: { label: '综述用途', prompt: '这份综述主要用在什么场景？', options: ['快速了解领域', '准备开题报告', '撰写综述论文'], placeholder: '也可以补充时间范围、重点问题或篇幅要求…' }, steps: ['检索与筛选相关文献', '对比方法与关键发现', '组织综述结构与引用'], output: '综述提纲、方法对比与参考文献' },
  { id: 'peer-review', label: '论文评审', placeholder: '粘贴论文标题、摘要或链接，并告诉我评审重点', example: '帮我评审一篇关于大语言模型长期记忆的论文，重点看创新性', introduction: '我会从研究贡献、方法与证据出发，整理可操作的修改建议。', question: { label: '评审重点', prompt: '你最希望先检查论文的哪个方面？', options: ['创新性与贡献', '方法与实验设计', '逻辑与表达'], placeholder: '也可以粘贴摘要或补充目标期刊、评审要求…' }, steps: ['确认论文与评审范围', '检查研究贡献与证据', '整理问题与修改建议'], output: '结构化评审意见与修改建议' },
  { id: 'slides', label: '组会 PPT', placeholder: '输入汇报主题或论文链接，告诉我这次想讲什么', example: '围绕 Attention Is All You Need，准备一份组会汇报 PPT', introduction: '我会把研究背景、核心方法和讨论点组织成清晰的汇报。', question: { label: '汇报时长', prompt: '这次组会，你预计讲多长时间？', options: ['5–10 分钟', '15–20 分钟', '30 分钟左右'], placeholder: '也可以补充听众背景、页数或重点章节…' }, steps: ['梳理论文与汇报主线', '安排页面结构与讲述节奏', '生成幻灯片与讲稿'], output: '汇报 PPT 与逐页讲稿' },
];
export const disciplineQuestion: HomeQuestion = {
  label: '学科方向', prompt: '为了让内容更贴近你的研究，你主要关注哪个学科方向？',
  options: ['计算机科学', '生物医学', '材料科学', '社会科学', '交叉学科'], placeholder: '输入你的学科或更具体的研究方向…',
};
export interface HomeSession {
  version: 1; draft: string; selected: HomeTaskId | null; task: HomeTaskId; query: string;
  answers: string[]; answerDraft: string; signedIn: boolean; savedPapers: string[]; caseId: string | null; caseStep: number; caseView: 'result' | 'process'; ownDrafts: Partial<Record<AgentCaseTask, { query: string; detail: string }>>;
}
export const HOME_SESSION_KEY = 'wispaper-unified-home-v1';
export const emptyHomeSession = (): HomeSession => ({ version: 1, draft: '', selected: null, task: 'search', query: '', answers: [], answerDraft: '', signedIn: false, savedPapers: [], caseId: null, caseStep: 0, caseView: 'result', ownDrafts: {} });
const isTask = (value: unknown): value is HomeTaskId => homeTaskConfigs.some(task => task.id === value);
export function readHomeSession(): HomeSession {
  try {
    const data = JSON.parse(sessionStorage.getItem(HOME_SESSION_KEY) || 'null');
    if (data?.version !== 1) return emptyHomeSession();
    const strings = (items: unknown, limit: number) => Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string').slice(0, limit) : [];
    const ownDrafts: HomeSession['ownDrafts'] = {};
    for (const task of ['ideas', 'review', 'peer-review', 'slides'] as const) {
      const draft = data.ownDrafts?.[task];
      if (draft && typeof draft.query === 'string') ownDrafts[task] = { query: draft.query.slice(0, 6000), detail: typeof draft.detail === 'string' ? draft.detail.slice(0, 2000) : '' };
    }
    return { version: 1, draft: typeof data.draft === 'string' ? data.draft : '', selected: isTask(data.selected) ? data.selected : null, task: isTask(data.task) ? data.task : 'search', query: typeof data.query === 'string' ? data.query : '', answers: strings(data.answers, 2), answerDraft: typeof data.answerDraft === 'string' ? data.answerDraft : '', signedIn: data.signedIn === true, savedPapers: strings(data.savedPapers, 100), caseId: typeof data.caseId === "string" ? getAgentCase(data.caseId)?.id ?? null : null, caseStep: Number.isInteger(data.caseStep) ? Math.max(0, Math.min(3, data.caseStep)) : 0, caseView: data.caseView === 'process' ? 'process' : 'result', ownDrafts };
  } catch { return emptyHomeSession(); }
}
// Prototype routing only. An explicit tag always takes precedence over keyword inference.
export function resolveHomeTask(query: string, selected: HomeTaskId | null): HomeTaskId {
  if (selected) return selected;
  if (/ppt|幻灯片|组会|汇报|presentation|slides/i.test(query)) return 'slides';
  if (/评审|审稿|peer.?review|review my paper/i.test(query)) return 'peer-review';
  if (/综述|梳理|survey|literature review/i.test(query)) return 'review';
  if (/灵感|选题|研究空白|研究方向|ideas?|brainstorm/i.test(query)) return 'ideas';
  return 'search';
}
export function buildHomeAgentPrompt(session: HomeSession) {
  const config = homeTaskConfigs.find(task => task.id === session.task)!;
  const context = [disciplineQuestion, config.question].flatMap((question, index) => session.answers[index] && session.answers[index] !== '暂时跳过' ? [`${question.label}：${session.answers[index]}`] : []);
  return [`任务类型：${config.label}`, `原始需求：${session.query}`, ...context].join('\n\n');
}
