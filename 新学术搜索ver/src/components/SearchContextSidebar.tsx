import React from 'react';
import { ArrowRight, ArrowUp, Atom, Bot, ChevronDown, FileText, History, Network, Plus, Sparkles } from 'lucide-react';
import { usePrototypeAuth } from '../lib/usePrototypeAuth';
import { normalizeAskAIMessages, useGlobalAskAIHistory } from '../lib/useGlobalAskAIHistory';

interface SearchContextSidebarProps {
  query: string;
  resultCount: number;
  sessionId: string;
  mode: 'quick' | 'deep';
  onStartDeepSearch: () => void;
  onOpenAgent: (prompt: string) => void;
  onOpenSurvey: () => void;
}

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user' | 'tool' | 'workflow' | 'survey-link';
  content: string;
}

interface StoredConversation {
  messages: ChatMessage[];
  showAgentGuide: boolean;
  surveyWorkflowStarted: boolean;
  chatSessions?: SearchChatSession[];
}

interface SearchChatSession { id: string; title: string; time: string; messages: ChatMessage[] }

const getInitialConversation = (sessionId: string, query: string, resultCount: number): StoredConversation => {
  try {
    const stored = window.localStorage.getItem(`wispaper-search-chat:${sessionId}`);
    if (stored) return JSON.parse(stored) as StoredConversation;
  } catch {}

  return {
    messages: [{
      id: 1,
      role: 'assistant',
      content: `我已读取“${query}”的搜索上下文和当前 ${resultCount} 篇结果。你可以让我比较方法、总结共识或寻找研究空白。`,
    }],
    showAgentGuide: false,
    surveyWorkflowStarted: false,
  };
};

const taxonomyBranches = [
  { title: '问题定义', items: ['位置偏差', '长上下文退化'] },
  { title: '方法路线', items: ['位置编码', '注意力机制'] },
  { title: '评测体系', items: ['检索任务', '长文本基准'] },
];

export function SearchContextSidebar({ query, resultCount, sessionId, mode, onStartDeepSearch, onOpenAgent, onOpenSurvey }: SearchContextSidebarProps) {
  const { isAuthenticated, setAuthenticated } = usePrototypeAuth();
  const historyScene = `search:${sessionId}`;
  const { sessions: globalAskSessions, latestForScene, upsertSession } = useGlobalAskAIHistory(historyScene);
  const historyInitialized = React.useRef(false);
  const initialConversation = React.useMemo(
    () => getInitialConversation(sessionId, query, resultCount),
    [sessionId],
  );
  const [input, setInput] = React.useState('');
  const [showAgentGuide, setShowAgentGuide] = React.useState(initialConversation.showAgentGuide);
  const [surveyWorkflowStarted, setSurveyWorkflowStarted] = React.useState(initialConversation.surveyWorkflowStarted);
  const [surveyCollapsing, setSurveyCollapsing] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialConversation.messages);
  const [chatSessionId, setChatSessionId] = React.useState(() => `search-${sessionId}-${Date.now()}`);
  const [knowledgeSource, setKnowledgeSource] = React.useState<'当前搜索' | 'Product Help'>('当前搜索');
  const [showSourceMenu, setShowSourceMenu] = React.useState(false);
  const [showChatHistory, setShowChatHistory] = React.useState(false);
  const [chatSessions, setChatSessions] = React.useState<SearchChatSession[]>(initialConversation.chatSessions ?? [
    { id: 'methods', title: '比较当前结果中的方法差异', time: '今天 09:56', messages: [{ id: 101, role: 'user', content: '比较当前结果中的方法差异' }, { id: 102, role: 'assistant', content: '当前结果主要可分为位置编码、注意力优化与评测方法三条路线。' }] },
  ]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setKnowledgeSource('Product Help');
      setShowSourceMenu(false);
      setShowChatHistory(false);
      setMessages([{ id: Date.now(), role: 'assistant', content: '请先登录后使用 Ask AI。登录后可继续提问并访问全局聊天历史。' }]);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated || historyInitialized.current) return;
    historyInitialized.current = true;
    if (latestForScene) {
      setChatSessionId(latestForScene.id);
      setKnowledgeSource(latestForScene.source === 'Product Help' ? 'Product Help' : '当前搜索');
      setMessages(normalizeAskAIMessages(latestForScene.messages).map((message, index) => ({ id: Date.now() + index, role: message.role, content: message.text })));
    }
  }, [isAuthenticated, latestForScene]);

  React.useEffect(() => {
    if (!isAuthenticated) { historyInitialized.current = false; return; }
    const firstQuestion = messages.find((message) => message.role === 'user')?.content;
    if (!firstQuestion) return;
    upsertSession({ id: chatSessionId, scene: historyScene, pageLabel: '搜索结果', title: firstQuestion, source: knowledgeSource, messages: normalizeAskAIMessages(messages) });
  }, [chatSessionId, historyScene, isAuthenticated, knowledgeSource, messages, upsertSession]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    try {
      window.localStorage.setItem(`wispaper-search-chat:${sessionId}`, JSON.stringify({
        messages,
        showAgentGuide,
        surveyWorkflowStarted,
        chatSessions,
      } satisfies StoredConversation));
    } catch {}
  }, [messages, sessionId, showAgentGuide, surveyWorkflowStarted, chatSessions, isAuthenticated]);

  const startNewConversation = () => {
    const firstQuestion = messages.find((message) => message.role === 'user')?.content;
    if (firstQuestion) setChatSessions((sessions) => [{ id: `search-chat-${Date.now()}`, title: firstQuestion, time: '刚刚', messages }, ...sessions]);
    setMessages([{ id: Date.now(), role: 'assistant', content: `我已读取“${query}”的搜索上下文和当前 ${resultCount} 篇结果。你可以开始新的问题。` }]);
    setChatSessionId(`search-${sessionId}-${Date.now()}`);
    setInput('');
    setShowAgentGuide(false);
    setShowChatHistory(false);
  };

  const runDeepSearchTool = (request: string, action: 'continue' | 'modify') => {
    const refinedQuery = action === 'continue'
      ? `${query} 最新进展 方法比较 实证评测`
      : `${query} AND (benchmark OR evaluation OR method comparison)`;
    const timestamp = Date.now();

    setMessages((current) => [
      ...current,
      { id: timestamp, role: 'user', content: request },
      {
        id: timestamp + 1,
        role: 'tool',
        content: `Deep Search MCP\n检索条件：${refinedQuery}\n范围：当前结果 + 引用网络 + 最新论文`,
      },
      {
        id: timestamp + 2,
        role: 'assistant',
        content: action === 'continue'
          ? '已通过 Deep Search MCP 扩展检索范围，并按相关性合并新结果。你可以继续让我聚焦某个方法或数据集。'
          : '已通过 Deep Search MCP 更新检索条件并重新搜索，结果将优先展示方法对比与评测证据。',
      },
    ]);
    setInput('');
    onStartDeepSearch();
  };

  React.useEffect(() => {
    const handleMockDeepSearch = () => {
      runDeepSearchTool('继续搜索并修改当前搜索条件，增加方法对比与评测证据', 'modify');
    };

    window.addEventListener('wispaper:mock-ask-ai-deep-search', handleMockDeepSearch);
    return () => window.removeEventListener('wispaper:mock-ask-ai-deep-search', handleMockDeepSearch);
  });

  const requestAgentIntent = (request: string) => {
    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: timestamp, role: 'user', content: request },
      {
        id: timestamp + 1,
        role: 'assistant',
        content: '这个任务包含多步检索、证据综合或综述生成，建议转到 Agent 继续完成。',
      },
    ]);
    setShowAgentGuide(true);
    setInput('');
  };

  const startSurveyWorkflow = (request: string) => {
    const timestamp = Date.now();
    setSurveyCollapsing(true);
    window.setTimeout(() => {
      setSurveyWorkflowStarted(true);
      setSurveyCollapsing(false);
    }, 450);
    setMessages((current) => [
      ...current,
      { id: timestamp, role: 'user', content: request },
      { id: timestamp + 1, role: 'workflow', content: '0' },
    ]);
    setInput('');
    onStartDeepSearch();

    [1, 2, 3].forEach((step) => {
      window.setTimeout(() => {
        setMessages((current) => current.map((message) => message.id === timestamp + 1 ? { ...message, content: String(step) } : message));
        if (step === 3) {
          setMessages((current) => [
            ...current,
            { id: timestamp + 2, role: 'survey-link', content: `${query}：研究进展、方法谱系与未来方向` },
          ]);
        }
      }, step * 700);
    });
  };

  const sendMessage = () => {
    if (!isAuthenticated) return;
    const question = input.trim();
    if (!question) return;

    if (knowledgeSource === 'Product Help') {
      setMessages((current) => [...current, { id: Date.now(), role: 'user', content: question }, { id: Date.now() + 1, role: 'assistant', content: '我会基于 WisPaper Product Help 回答。你可以询问搜索、Ask AI、Library、Agent、科研画布或 Survey 的使用方法。' }]);
      setInput('');
      return;
    }

    if (/(生成|创建|继续).*(survey|综述)|survey/i.test(question)) {
      startSurveyWorkflow(question);
      return;
    }

    if (/agent|复杂.*(搜索|检索)|综述|系统调研|研究计划|多步骤/i.test(question)) {
      requestAgentIntent(question);
      return;
    }

    if (/(继续|扩大|补充).*(搜索|检索)|修改.*(搜索|检索|条件)|调整.*(搜索|检索|条件)/.test(question)) {
      const action = /修改|调整/.test(question) ? 'modify' : 'continue';
      runDeepSearchTool(question, action);
      return;
    }

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', content: question },
      {
        id: Date.now() + 1,
        role: 'assistant',
        content: `结合当前搜索结果，相关工作主要集中在位置编码、注意力分配与长上下文评测三条路线。关于“${question}”，现有证据提示可以优先比较不同方法在上下文长度增长时的稳定性。`,
      },
    ]);
    setInput('');
  };

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col gap-3 overflow-hidden">
      {!surveyWorkflowStarted && (mode === 'deep' ? (
        <section className={`shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-500 ease-in-out ${surveyCollapsing ? 'h-0 min-h-0 max-h-0 -translate-y-2 border-transparent p-0 opacity-0' : 'h-[20%] min-h-[180px] max-h-[210px] border-slate-200 p-3 opacity-100'}`}>
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-violet-600" />
            <h3 className="truncate text-xs font-semibold text-slate-900">
              Survey · {query}：研究进展、方法谱系与未来方向
            </h3>
          </div>

          <div className="relative mt-2 h-24 overflow-hidden rounded-lg border border-violet-100 bg-gradient-to-br from-violet-50 to-blue-50 px-3 pt-2">
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-violet-700">
              <Network className="h-3 w-3" />
              Taxonomy 预览
            </div>
            <div className="mx-auto mt-1 h-2 w-px bg-violet-300" />
            <div className="grid grid-cols-3 gap-1.5 border-t border-violet-200 pt-1.5">
              {taxonomyBranches.map((branch) => (
                <div key={branch.title} className="rounded border border-slate-200 bg-white px-1 py-1 text-center text-[9px] text-slate-600 shadow-sm">
                  <div className="font-semibold text-slate-700">{branch.title}</div>
                  <div className="mt-1 space-y-1">
                    {branch.items.map((item) => (
                      <div key={item} className="rounded bg-slate-50 px-1 py-0.5 text-[8px] text-slate-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent via-white/75 to-white" />
          </div>

          <button
            type="button"
            onClick={() => startSurveyWorkflow('继续生成完整 Survey 和 Taxonomy')}
            className="mt-2 w-full rounded-lg bg-slate-950 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            继续生成
          </button>
        </section>
      ) : (
        <section className="h-[20%] min-h-[180px] max-h-[210px] shrink-0 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
              <Atom className="h-4 w-4" />
            </span>
            使用深度搜索
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            深入理解研究意图，自动分析证据关系，并生成 Survey 与 Taxonomy。
          </p>
          <button
            type="button"
            onClick={onStartDeepSearch}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            开始深度搜索
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </section>
      ))}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bot className="h-4 w-4 text-blue-500" />
            Ask AI
          </div>
        </div>
        {isAuthenticated && <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1.5">
          <button type="button" onClick={startNewConversation} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />新对话</button>
          <button type="button" onClick={() => setShowChatHistory((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${showChatHistory ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}><History className="h-3.5 w-3.5" />历史对话</button>
        </div>}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {showChatHistory ? <div><p className="mb-2 text-[10px] text-slate-400">{globalAskSessions.length} 个全局历史对话</p><div className="divide-y divide-slate-100">{globalAskSessions.map((session) => <button key={session.id} type="button" onClick={() => { setChatSessionId(session.id); setMessages(normalizeAskAIMessages(session.messages).map((message, index) => ({ id: Date.now() + index, role: message.role, content: message.text }))); setKnowledgeSource(session.source === 'Product Help' ? 'Product Help' : '当前搜索'); setShowChatHistory(false); }} className="w-full py-3 text-left"><span className="block truncate text-xs font-medium text-slate-800">{session.title}</span><span className="mt-1 block text-[10px] text-slate-400">{session.pageLabel} · {session.source} · {session.time}</span></button>)}</div></div> : <>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'tool' ? (
                <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <Atom className="h-3.5 w-3.5" />
                    Tool use · Deep Search MCP
                  </div>
                  <div className="whitespace-pre-line leading-5 text-slate-600">{message.content.split('\n').slice(1).join('\n')}</div>
                  <div className="mt-2 flex items-center gap-1.5 font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    搜索完成
                  </div>
                </div>
              ) : message.role === 'workflow' ? (
                <div className="w-full rounded-xl border border-violet-200 bg-violet-50 p-3 text-[11px]">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-violet-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    Survey Workflow
                  </div>
                  <div className="space-y-2">
                    {['整理核心论文与证据', '构建 Taxonomy', '生成结构化综述'].map((step, index) => {
                      const progress = Number(message.content);
                      const completed = progress > index;
                      const active = progress === index;
                      return (
                        <div key={step} className={`flex items-center gap-2 ${completed ? 'text-emerald-600' : active ? 'text-violet-700' : 'text-slate-400'}`}>
                          <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${completed ? 'bg-emerald-100' : active ? 'animate-pulse bg-violet-200' : 'bg-slate-200'}`}>{completed ? '✓' : index + 1}</span>
                          {step}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : message.role === 'survey-link' ? (
                <button
                  type="button"
                  onClick={onOpenSurvey}
                  className="w-full rounded-xl border border-violet-200 bg-white p-3 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Survey 已生成</div>
                  <div className="mt-2 text-xs font-semibold leading-5 text-slate-900">{message.content}</div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-violet-600">查看 Survey <ArrowRight className="h-3 w-3" /></div>
                </button>
              ) : (
              <div
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-5 ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-blue-600 text-white'
                    : 'rounded-bl-md bg-slate-100 text-slate-700'
                }`}
              >
                {message.content}
              </div>
              )}
            </div>
            {isAuthenticated && message.id === 1 && message.role === 'assistant' && (
              <div className="flex flex-wrap gap-1.5 pl-1">
                <button
                  type="button"
                  onClick={() => runDeepSearchTool('继续搜索更多高相关论文', 'continue')}
                  className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100"
                >
                  继续搜索
                </button>
                <button
                  type="button"
                  onClick={() => runDeepSearchTool('修改当前搜索条件，增加方法对比与评测证据', 'modify')}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  修改搜索条件
                </button>
                <button
                  type="button"
                  onClick={() => requestAgentIntent('我想开启 Agent，进行更复杂的检索和综述')}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700 hover:bg-violet-100"
                >
                  开启 Agent
                </button>
              </div>
            )}
            </React.Fragment>
          ))}
          </>}
        </div>

        <div className="border-t border-slate-100 p-3">
          {!isAuthenticated && <div className="mb-2 rounded-lg border border-blue-100 bg-blue-50 p-2.5"><p className="text-[11px] leading-4 text-slate-600">请先登录后使用 Ask AI。登录后可基于当前搜索上下文提问，并访问全局聊天历史。</p><button type="button" onClick={() => setAuthenticated(true)} className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white">注册 / 登录</button></div>}
          {showAgentGuide && (
            <button
              type="button"
              onClick={() => onOpenAgent(`基于当前搜索“${query}”及其 ${resultCount} 篇结果，进行更复杂的检索、证据综合与学术综述。`)}
              className="mb-2 flex w-full items-center justify-between rounded-lg bg-violet-50 px-3 py-2 text-left text-[11px] font-medium text-violet-700 transition hover:bg-violet-100"
            >
              <span className="flex items-center gap-2">
                <Bot className="h-3.5 w-3.5" />
                转到 Agent 进行更复杂的检索或综述
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:bg-white">
            <textarea
              value={input}
              disabled={!isAuthenticated}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              placeholder="基于搜索结果提问…"
              className="min-h-[32px] w-full resize-none bg-transparent px-1 py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between">
            <div className="relative"><button type="button" disabled={!isAuthenticated} onClick={() => setShowSourceMenu((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-slate-600 hover:bg-white disabled:cursor-default"><FileText className="h-3.5 w-3.5" />{knowledgeSource}<ChevronDown className="h-3 w-3" /></button>{showSourceMenu && isAuthenticated && <div className="absolute bottom-10 left-0 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{(['当前搜索', 'Product Help'] as const).map((source) => <button key={source} type="button" onClick={() => { setKnowledgeSource(source); setShowSourceMenu(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${knowledgeSource === source ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{source}</button>)}</div>}</div>

            <button
              type="button"
              onClick={sendMessage}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              aria-label="发送问题"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
