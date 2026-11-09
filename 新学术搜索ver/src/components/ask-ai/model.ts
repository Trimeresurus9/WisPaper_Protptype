export type Source = 'product_help' | 'library' | 'web' | 'selected_files' | 'search_session' | 'agent_status';
export const sourceLabels: Record<Source, string> = { product_help: 'Product Help', library: '我的知识库', web: 'Web 资源', selected_files: '所选文件', search_session: '当前搜索', agent_status: 'Agent 状态' };
export type FileRef = { id: string; title: string };
export type AgentContext = { id: string; title: string; status: string; step: string; completed: number; total: number; blocked: number };
export type SearchContext = { id: string; query: string; mode: string; count: number };
export type ContextRef = { files?: FileRef[]; attachments?: string[]; search?: SearchContext; agent?: AgentContext };
export type Message = { id: string; role: 'user' | 'assistant'; text: string; source: Source; status?: 'pending' | 'failed' | 'done'; action?: 'search' | 'agent'; context: ContextRef };
export type Session = { id: string; scope: string; title: string; createdAt: number; updatedAt: number; source: Source; context: ContextRef; messages: Message[]; draft: string };
export type Store = { sessions: Session[]; active: Record<string, string> };
export const STORAGE_KEY = 'wispaper-ask-ai-v1';
export const id = () => crypto.randomUUID();
export function readStore(): Store {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!Array.isArray(data?.sessions) || !data.active || typeof data.active !== 'object') return { sessions: [], active: {} };
    const sessions = data.sessions.filter((s: Session) => typeof s.id === 'string' && typeof s.scope === 'string' && typeof s.title === 'string' && s.source in sourceLabels && Array.isArray(s.messages)).map((s: Session) => ({ ...s, draft: typeof s.draft === 'string' ? s.draft : '', context: s.context || {}, messages: s.messages.filter(m => typeof m.text === 'string' && ['user', 'assistant'].includes(m.role)).map(m => m.status === 'pending' ? { ...m, status: 'failed' } : m) }));
    return { sessions, active: data.active };
  } catch { return { sessions: [], active: {} }; }
}
export function mockAnswer(question: string, source: Source, context: ContextRef): { text: string; action?: 'search' | 'agent' } {
  if (source === 'agent_status') {
    const a = context.agent;
    if (!a) return { text: '还没有开始研究任务。输入目标，选择模型与 Skill 后即可启动。' };
    return { text: `「${a.title}」${a.status}。\n${a.step}${a.total ? `\n已完成 ${a.completed} / ${a.total} 步，${a.blocked} 项需要处理。` : ''}\n你可以留在这里继续询问进度。` };
  }
  if (source === 'search_session') {
    const s = context.search;
    if (/survey|综述/i.test(question)) return { text: `已将「${s?.query || '当前搜索'}」的结果作为范围。可交给 Agent 核对文献、比较方法，并生成带引用的综述。`, action: 'agent' };
    if (/继续搜|修改|条件|再搜|检索/.test(question)) return { text: '可以继续调整研究对象、年份与方法关键词。确认后，将用这条问题更新当前搜索。', action: 'search' };
    return { text: `当前搜索「${s?.query || ''}」使用${s?.mode || '学术搜索'}，共有 ${s?.count || 0} 条示例结果。\n可先按研究问题、方法与数据集比较，再收藏需要精读的论文。` };
  }
  if (source === 'selected_files') return { text: `已关联 ${context.files?.length || 0} 篇文献${context.attachments?.length ? `和 ${context.attachments.length} 个附件` : ''}。\n可以按研究问题、方法、实验与局限整理对比表。当前为演示回答，尚未读取文件全文。` };
  if (source === 'library') return { text: '可以先从知识库筛选同一主题的文献，再比较研究问题、方法和结论。切换到「所选文件」可缩小讨论范围。\n当前为示例回答，未执行真实文献检索。' };
  if (source === 'web') return { text: '可从论文官网、作者主页与开源仓库核对信息，优先查看原始来源与更新时间。\n当前为 Web 资源演示，未发起联网检索。' };
  if (/兴趣|推荐|偏好/.test(question)) return { text: '在原首页点击「个性化设置」，选择长期关注的研究方向。保存后可随时调整，后续推荐会参考这些兴趣。' };
  if (/agent|skill|任务/i.test(question)) return { text: '在 Agent 输入研究目标，选择模型和适合任务的 Skill，再开始任务。\n文献综述、方法对比和论文解读都可以作为起点。' };
  if (/知识库|收藏|文献/.test(question)) return { text: '在搜索结果中收藏论文，即可在知识库集中管理。选择几篇文献后，打开 Ask AI 并切换到「所选文件」，就能继续提问。' };
  if (/气泡|引导|关闭|收起/.test(question)) return { text: '收起的引导会保存在这里的「继续了解」中。点击卡片可回到原来的步骤，兴趣选择也会保留。' };
  return { text: '在搜索框描述研究问题，查看相关论文；需要多步研究时，交给 Agent。\n你也可以问我如何收藏文献、设置兴趣，或继续下方的上手引导。' };
}
