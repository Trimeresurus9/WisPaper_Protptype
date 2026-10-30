import { useLanguage } from '../../contexts/LanguageContext';
import { handleMemoryRequest, appendDocument, taskScope, projectScope } from "../agent-memory/store";
import { TaskMemoryPanel, useTaskMemory } from "../agent-memory/TaskMemoryPanel";
import React, { useEffect, useRef, useState } from "react";
import { Sparkles, GraduationCap, Moon, MoreHorizontal, PanelRight, Share2, Lightbulb, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Bot, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, ExternalLink, FileText, FolderOpen, Globe2, Hand, Link2, LoaderCircle, LockKeyhole, MousePointer2, Pause, Play, Plus, RotateCcw, Search, ShieldCheck, Square, X } from "lucide-react";
import "./browser-research.css";
import { AgentResponse, type ResponseStatus } from "./AgentResponse";
import "./agent-workspace.css";
import { AgentTaskNavigation, CommonFunctions, AuxiliaryWorkbench, workbenchTools, WorkbenchView } from "./AgentWorkbench";

type Phase = "ready" | "running" | "paused" | "takeover" | "login" | "error" | "done" | "stopped";
type PageId = "paper" | "code" | "review";
const pages: { id: PageId; title: string; domain: string; url: string; tag: string }[] = [
  { id: "paper", title: "Attention Is All You Need", domain: "arxiv.org", url: "https://arxiv.org/abs/1706.03762", tag: "论文" },
  { id: "code", title: "tensor2tensor · 官方实现", domain: "github.com", url: "https://github.com/tensorflow/tensor2tensor", tag: "代码" },
  { id: "review", title: "文献平台 · 机构访问", domain: "文献平台演示", url: "机构文献平台 / 全文访问演示", tag: "需登录" },
];
const stepTitles = ["读取论文页面与版本信息", "定位全文与相关资源", "核对来源并整理研究材料"];
const phaseLabels: Record<Phase, string> = {ready:"等待开始", running:"正在操作网页", paused:"已暂停", takeover:"由你操作", login:"等待登录", error:"页面加载失败", done:"本轮已完成", stopped:"已停止"};
const defaultPrompt = "读取这篇论文，整理论文信息、PDF 和官方代码，保存前让我确认。";
const storageKey = "wispaper-browser-research-demo-materials";

type ChatMessage = {role: "user" | "agent"; text: string; status?: ResponseStatus};

type CreditState = "ok" | "low" | "empty";

export function BrowserResearch({onBack, initialTask = "", initialSkill = "灵感发现", projectContext, userCredits = 50000, creditState = "ok", onRecharge, onUpgrade, onNavigate}: {onBack: () => void; initialTask?: string; initialSkill?: string; projectContext?: {id: string; title: string}; userCredits?: number; creditState?: CreditState; onRecharge?: () => void; onUpgrade?: () => void; onNavigate?: (view: string) => void}) {
  // The task and preview share one simulated browser session. Inspecting a tab
  // does not redirect that session unless the user has taken control.
  const { t } = useLanguage();
  const [clientTab, setClientTab] = useState(false);
  const [followPage, setFollowPage] = useState(true);
  const [inspectedPage, setInspectedPage] = useState<PageId>("paper");
  const [pageRevision, setPageRevision] = useState(0);
  const returnPhase = useRef<Phase>("ready");
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const browserDemo = new URLSearchParams(window.location.search).get("browser") === "demo";
  const [tabsCreated, setTabsCreated] = useState(false);
  const [workbench, setWorkbench] = useState<WorkbenchView>("common");
  const [panelOpen, setPanelOpen] = useState(true);
  const [attached, setAttached] = useState(false);
  const [composerMenu, setComposerMenu] = useState(false);
  const [activeSkill, setActiveSkill] = useState(initialSkill);
  const [lowCreditDismissed, setLowCreditDismissed] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialTask ? creditState === "empty" ? [{role:"user", text:initialTask}] : [{role:"user", text:initialTask},{role:"agent",text:initialTask,status:"running"}] : []);
  const responseRunning = chatMessages.some(message => message.status === "running");
  const responsePending = chatMessages.some(message => message.status === "running" || message.status === "stopped");
  const updateResponseStatus = (index: number, status: ResponseStatus) => setChatMessages(items => items.map((message, i) => i === index ? {...message, status} : message));
  const title = initialTask || '从“NLP与多模态学习探索”生成可执行的研究计划';
  const selectSkill = (skill: string) => {setActiveSkill(skill);setPrompt(`请帮我进行${skill}，结合当前研究目标与已有材料。`);};
  const selectBrowserUse = () => { if (busy) return; setActiveSkill("网页执行"); setAttached(false); setComposerMenu(false); openBrowser(); };
  const openBrowser = () => {setClientTab(false);setWorkbench("browser");setPanelOpen(true);setFollowPage(true);};

  const [phase, setPhase] = useState<Phase>("ready");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<PageId[]>(["paper", "code"]);
  const [draftSelected, setDraftSelected] = useState<PageId[]>(selected);
  const [activePage, setActivePage] = useState<PageId>("paper");
  const [picker, setPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [permission, setPermission] = useState<"read" | "interact">("interact");
  const [scenario, setScenario] = useState<"normal" | "login" | "error">("normal");
  const [recovered, setRecovered] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [saved, setSaved] = useState(false);
  const [project, setProject] = useState(projectContext?.title || "Transformer 文献调研");
  const [savedProject, setSavedProject] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [articleTab, setArticleTab] = useState("摘要");
  const [showSources, setShowSources] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);
  const browserBusy = ["running", "paused", "takeover", "login", "error"].includes(phase);
  const busy = browserBusy || responsePending;
  const displayedPage = followPage ? activePage : inspectedPage;
  const page = pages.find(p => p.id === displayedPage)!;
  const taskPage = pages.find(p => p.id === activePage)!;
  const completedSteps = phase === "done" ? 3 : step;
  const canOperate = phase === "takeover";
  const currentAction = submitted ? phase === "done" ? "研究材料已整理" : stepTitles[step] : "浏览器页面预览";
  const taskMemory = useTaskMemory(title, submitted ? phaseLabels[phase] : "研究目标已记录，等待下一步", [...chatMessages].reverse().find(m => m.role === "user")?.text || "", projectContext?.id);
  const initialMemoryRequest = useRef(false);
  useEffect(() => {
    if (initialMemoryRequest.current) return;
    initialMemoryRequest.current = true;
    const reply = handleMemoryRequest(initialTask, projectContext?.id, taskMemory.id);
    if (reply) setChatMessages([{role:"user",text:initialTask},{role:"agent",text:reply}]);
  }, [initialTask, projectContext?.id, taskMemory.id]);
  useEffect(() => {
    if (phase !== "done") return;
    const summary = `已核对《Attention Is All You Need》（arXiv:1706.03762）的论文信息与全文入口${selected.includes("code") ? "，并定位 tensor2tensor 官方代码" : ""}。材料保存到项目需用户确认。`;
    try {
      appendDocument(taskScope(taskMemory.id), summary, 'Agent');
      if (projectContext?.id) appendDocument(projectScope(projectContext.id), summary, 'Agent');
    } catch { setNotice("Agent.md 更新失败，请检查浏览器存储空间。"); }
  }, [phase, projectContext?.id, taskMemory.id, selected]);
  const currentUrl = (page.id === "paper" && articleTab === "全文") ? "https://arxiv.org/pdf/1706.03762" : page.url;
  const stop = () => {setPhase("stopped");setActivity(items => [...items, "任务已停止，保留当前浏览器页面"]);};
  const inspectPage = (id: PageId) => {
    if (canOperate) {setActivePage(id);setFollowPage(true);}
    else {setInspectedPage(id);setFollowPage(id === activePage);}
  };

  useEffect(() => { pageScrollRef.current?.scrollTo({top: 0}); }, [displayedPage, articleTab, pageRevision]);
  useEffect(() => {
    if (!browserDemo) return;
    setChatMessages([]);setActiveSkill("网页执行");setAttached(true);setTabsCreated(true);
    setWorkbench("browser");setSubmitted(initialTask || defaultPrompt);
    setPhase("paused");setActivity(["演示已就绪，点击继续执行即可跟踪页面变化"]);
  }, [browserDemo, initialTask]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setTimeout(() => {
      if (step === 1 && scenario === "login" && selected.includes("review") && !loggedIn) { setPhase("login"); setActivePage("review"); return; }
      if (step === 1 && scenario === "error" && !recovered) { setPhase("error"); return; }
      if (step === 2) { setPhase("done"); return; }
      setStep(s => s + 1);
      if (step === 0 && selected.includes("code")) setActivePage("code");
      if (step === 1) {setActivePage("paper");setArticleTab("全文");}
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [phase, step, scenario, loggedIn, recovered, selected]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!picker && !saveDialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = picker ? pickerRef.current : saveRef.current;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]') ?? []);
    focusables()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPicker(false); setSaveDialog(false); }
      if (event.key === "Tab") {
        const nodes = focusables(); const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, [picker, saveDialog]);

  const start = () => {
    if (!prompt.trim() || !selected.length || busy || creditState === "empty") return;
    setSubmitted(prompt.trim()); setPhase("running"); setStep(0); setSaved(false); setSavedProject("");
    setActivePage(selected[0]); setArticleTab("摘要"); setFollowPage(true); setClientTab(false); setRecovered(false); setLoggedIn(false); setActivity([]); openBrowser();
  };
  const reset = (nextPage: PageId = selected[0] ?? "paper") => { setPhase("ready"); setStep(0); setSubmitted(""); setSaved(false); setShowSources(false); setActivity([]); setActivePage(nextPage); setInspectedPage(nextPage); setFollowPage(true); setClientTab(false); setArticleTab("摘要"); setSearch(""); };
  const takeOver = () => {
    returnPhase.current = phase;
    openBrowser();setPhase("takeover");
    setActivity(items => [...items, "用户接管当前页面，Agent 已暂停操作"]);
  };
  const resume = () => {
    setClientTab(false);setFollowPage(true);
    const previous = returnPhase.current;
    setPhase(phase === "takeover" && ["ready", "done", "stopped", "error"].includes(previous) ? previous : "running");
    setActivity(items => [...items, "已交还控制，重新读取当前页面状态"]);
  };
  const openPicker = () => { setDraftSelected(selected); setPickerSearch(""); setPicker(true); };
  const confirmPages = () => {
    if (!draftSelected.length) return;
    setTabsCreated(true); setAttached(true); setWorkbench("browser"); setPanelOpen(true); setActiveSkill(""); if (!prompt.trim()) setPrompt(defaultPrompt);
    const nextPage = draftSelected.includes(activePage) ? activePage : draftSelected[0];
    setSelected(draftSelected); setActivePage(nextPage); setInspectedPage(nextPage); setFollowPage(true); setClientTab(false);
    setPicker(false); if (phase !== "ready") reset(nextPage);
  };
  const save = () => {
    try {
      const previous = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const records = Array.isArray(previous) ? previous : [];
      const record = { id: `${project}:1706.03762`, project, title: pages[0].title, sources: selected.filter(id => id !== "review").map(id => pages.find(p => p.id === id)!.url), savedAt: new Date().toISOString(), prototype: true };
      localStorage.setItem(storageKey, JSON.stringify([...records.filter(item => item.id !== record.id), record]));
      setSaved(true); setSavedProject(project); setSaveDialog(false); setNotice("已保存到此原型的项目材料记录");
    } catch { setNotice("浏览器存储不可用，尚未保存，请重试。"); }
  };
  const send = () => {
    if (busy || !prompt.trim() || creditState === "empty") return;
    const memoryReply = handleMemoryRequest(prompt.trim(), projectContext?.id, taskMemory.id);
    if (memoryReply) {
      setChatMessages(items => [...items, {role:"user",text:prompt.trim()}, {role:"agent",text:memoryReply}]);
      setPrompt(""); return;
    }
    if (activeSkill === "网页执行" || attached) {setTabsCreated(true); setAttached(true); openBrowser(); start(); return;}
    setChatMessages(items=>[...items,{role:"user",text:prompt.trim()},{role:"agent",text:prompt.trim(),status:"running"}]);
    setPrompt("");
  };
  return <div className={`agent-task-shell ${tabsCreated ? "aw-has-client-tabs" : ""} ${clientTab ? "aw-client-active" : ""}`}>
    {tabsCreated && <div className="aw-client-tabs" role="tablist" aria-label="客户端标签页"><button role="tab" aria-selected={!clientTab} onClick={()=>setClientTab(false)}><Sparkles size={15}/>Agent · 当前研究</button>{selected.map(id=><button key={id} role="tab" aria-selected={workbench === "browser" && displayedPage===id} onClick={()=>{inspectPage(id);setWorkbench("browser");setPanelOpen(true);}}><Globe2 size={14}/>{pages.find(p=>p.id===id)!.title}<small>{phase==="running" && activePage===id ? "Agent 操作中" : "Agent 标签页"}</small></button>)}</div>}
    <AgentTaskNavigation onBack={onBack} onNavigate={onNavigate}/><div className={`br-workspace aw-workspace ${workbench === "browser" ? "aw-tracking-browser" : ""} ${panelOpen ? "" : "aw-panel-closed"}`}>

    <div className="br-columns">
      <header className="aw-chat-header"><h1 title={title}>{title}</h1><div className="aw-header-actions"><span className={`br-status br-status-${phase}`} role="status"><i/>{creditState === "empty" ? "等待补充积分" : responseRunning ? "正在生成" : responsePending ? "已暂停" : submitted ? phaseLabels[phase] : chatMessages.length ? "已完成" : "等待开始"}</span><span className="aw-metric"><GraduationCap size={17}/>1250</span><span className="aw-metric"><Moon size={16}/>1h</span><i className="aw-divider"/><button aria-label="复制任务链接" onClick={()=>{navigator.clipboard?.writeText(window.location.href).then(()=>setNotice("原型页面链接已复制"),()=>setNotice("请复制地址栏中的原型链接"));}}><Share2 size={18}/></button><button className="aw-stop" aria-label="停止当前任务" onClick={()=>{if(responseRunning)setChatMessages(items=>items.map(message=>message.status === "running" ? {...message,status:"stopped"} : message));else if(browserBusy)stop();else setNotice("当前没有正在执行的步骤");}}><Square size={14}/></button><button aria-label="新建研究任务" onClick={onBack}><MoreHorizontal size={19}/></button>{!panelOpen && <button aria-label="展开工作台" onClick={()=>setPanelOpen(true)}><PanelRight size={18}/></button>}</div></header>
      {panelOpen && <header className={`aw-workbench-header ${workbench === "browser" ? "aw-browser-control-header" : ""}`}>
        {workbench === "browser" ? <>
          <div className="aw-tracking-heading"><strong>{currentAction}</strong><span role="status"><i className={phase === "running" ? "is-live" : ""}/>{phaseLabels[phase]} · {taskPage.domain}</span></div>
          <div className="aw-browser-header-actions">
            {browserBusy && <button className="aw-browser-stop" onClick={stop}><Square size={12}/>停止</button>}
            {phase === "takeover" ? <button className="aw-browser-control" onClick={resume}><Play size={14}/>交还 Agent</button> : <button className="aw-browser-control" disabled={!attached && !submitted} onClick={takeOver}><MousePointer2 size={14}/>控制浏览器</button>}
            <button className="aw-browser-close" aria-label="关闭浏览器面板" onClick={()=>setPanelOpen(false)}><X size={19}/></button>
          </div>
        </> : <><strong>{workbench === 'memory' ? t('agentPreferences.title') : workbenchTools.find(t=>t.id===workbench)?.label}</strong><button aria-label="收起工作台" onClick={()=>setPanelOpen(false)}><PanelRight size={19}/></button></>}
      </header>}
      <section className="br-conversation" aria-label="Agent 研究对话">
        <div className="br-chat-scroll">
          {projectContext && <div className="aw-project-context"><FolderOpen size={15}/><span>当前项目</span><strong>{projectContext.title}</strong></div>}
          {creditState === "empty" && <div className="aw-credit-notice is-empty" role="status"><strong>任务已保留，补充积分后即可启动</strong><p>当前余额为 0 Credits。你的任务内容和项目上下文不会丢失。</p><div><button onClick={onRecharge}>补充积分</button><button className="secondary" onClick={onUpgrade}>查看会员方案</button></div></div>}
          {creditState === "low" && !lowCreditDismissed && <div className="aw-credit-notice" role="status"><strong>当前余额较低</strong><p>剩余 {userCredits.toLocaleString()} Credits，本次任务仍可继续。建议提前补充积分，避免后续步骤中断。</p><div><button onClick={onRecharge}>补充积分</button><button className="secondary" onClick={()=>setLowCreditDismissed(true)}>知道了</button></div></div>}
          {chatMessages.map((message,index)=><div key={index} className={message.role === "user" ? "br-user-message" : "aw-chat-answer"}>{message.role === "agent" && <div className="br-assistant-label"><span className="br-agent-icon"><Bot size={16}/></span><strong>WisPaper</strong></div>}{message.role === "agent" && message.status ? <AgentResponse task={message.text} status={message.status} onStatusChange={status=>updateResponseStatus(index,status)} canReplay={index === chatMessages.length - 1 && !submitted}/> : <p>{message.text}</p>}</div>)}
          {submitted && <>
            <div className="br-user-message">{submitted}<div><Globe2 size={12}/>{selected.length} 个网页 · {permission === "read" ? "仅阅读" : "阅读与操作"}</div></div>
            <div className="br-assistant-label"><span className="br-agent-icon"><Bot size={16}/></span><strong>WisPaper</strong><span>网页研究</span></div>
            <p className="br-response">{permission === "read" ? "我会读取已选择的页面，概括关键信息并保留来源。" : "我会核对论文信息，并在已选择的页面中整理可用的研究资源。保存前会请你确认。"}</p>
            <div className="aw-browser-task-card" data-browser-page={activePage}>
              <div className="aw-browser-task-title"><span><Globe2 size={19}/></span><div><strong>浏览器</strong><p>{currentAction}</p></div>{phase === "running" ? <LoaderCircle className="br-spin" size={16}/> : <span className="aw-card-status">{phaseLabels[phase]}</span>}</div>
              <button className="aw-live-thumbnail" aria-label="查看正在跟踪的浏览器页面" onClick={openBrowser}>
                <div className="aw-thumbnail-address"><i/><i/><i/><span>{taskPage.domain}</span></div>
                <div className={`aw-thumbnail-page ${activePage === "code" ? "is-code" : ""}`}>
                  <div className="aw-thumbnail-brand">{activePage === "paper" ? "arχiv" : activePage === "code" ? "GitHub" : "机构文献平台"}</div>
                  <strong>{taskPage.title}</strong><span>{activePage === "paper" ? articleTab === "全文" ? "Attention Is All You Need.pdf · 15 pages" : "Transformer · Self-attention · Sequence modeling" : activePage === "code" ? "README.md · tensor2tensor/models/transformer.py" : loggedIn ? "机构访问已就绪" : "通过机构访问全文"}</span>
                  <div className="aw-thumbnail-lines"><i/><i/><i/></div>
                </div>
              </button>
              <button className="aw-open-browser" onClick={openBrowser}><Globe2 size={14}/>打开浏览器<ArrowUpRight size={14}/></button>
            </div>
            <div className="br-execution"><div className="br-execution-head"><span><Globe2 size={16}/> {permission === "read" ? "阅读网页" : "浏览器任务"}</span><span>{completedSteps} / 3</span></div><ol>{stepTitles.map((title, i) => <li key={title} className={i === step && phase === "running" ? "active" : ""}>{i < completedSteps ? <CheckCircle2 size={17}/> : i === step && phase === "running" ? <LoaderCircle className="br-spin" size={17}/> : <Circle size={17}/>}<div><strong>{permission === "read" && i === 1 ? "提取正文与核心贡献" : title}</strong><small>{i < completedSteps ? ["arxiv.org · v7 · 2023-08-02", selected.includes("code") ? "PDF 与代码来源已定位" : "已定位所选页面中的全文链接", "已整理可追溯的来源"][i] : i === step ? phaseLabels[phase] : "等待执行"}</small></div></li>)}</ol>{activity.length > 0 && <div className="br-activity">{activity.slice(-2).map((item, i) => <span key={i}>{item}</span>)}</div>}</div>
            {browserBusy && <div className="br-controls">{phase === "running" ? <button onClick={() => setPhase("paused")}><Pause size={14}/>暂停</button> : phase === "paused" || phase === "takeover" ? <button onClick={resume}><Play size={14}/>继续执行</button> : null}{["running", "paused"].includes(phase) && <button onClick={takeOver}><Hand size={14}/>我来接管</button>}<button onClick={() => setPhase("stopped")}><Square size={13}/>停止任务</button></div>}
            {phase === "paused" && <div className="br-callout">任务已暂停，浏览器不会继续操作。可以继续执行或接管页面。</div>}
            {phase === "takeover" && <div className="br-callout">Agent 已暂停，你可以直接在右侧操作当前页面。点击“交还 Agent”后，任务会基于当前页面继续。</div>}
            {phase === "login" && <div className="br-callout amber"><LockKeyhole size={18}/><strong>需要你完成机构登录</strong><p>Agent 已暂停。请控制右侧演示页面完成登录，再继续研究。</p><button onClick={takeOver}>控制浏览器并登录</button><small>演示环境不收集账号或密码。</small></div>}
            {phase === "error" && <div className="br-callout amber"><strong>页面暂时无法加载</strong><p>已保留前一步结果，可以重试或停止任务。</p><button onClick={() => {setRecovered(true); setPhase("running");}}><RotateCcw size={14}/>重试当前步骤</button></div>}
            {phase === "stopped" && <div className="br-callout"><strong>任务已停止</strong><p>已完成的步骤保留，尚未保存材料。</p><button onClick={start}><RotateCcw size={14}/>重新开始</button></div>}
            {phase === "done" && <div className="br-result"><div className="br-result-heading"><CheckCircle2 size={19}/><strong>{permission === "read" ? "页面阅读完成" : "研究材料已整理"}</strong></div><h3>Attention Is All You Need</h3><p>{permission === "read" ? "论文提出完全基于注意力机制的 Transformer 架构，以自注意力建模序列依赖，替代循环与卷积结构。" : "已核对论文版本，并整理全文入口。代码资源仅在你选择对应网页时纳入。"}</p><div className="br-facts"><span>arXiv:1706.03762</span><span>v7 · 2023.08.02</span></div><button className="br-source-row" onClick={() => {openBrowser(); setActivePage("paper"); setArticleTab("全文");}}><FileText size={16}/><span>论文全文 <small>arxiv.org / PDF</small></span><ArrowUpRight size={15}/></button>{selected.includes("code") && <button className="br-source-row" onClick={() => {openBrowser(); setActivePage("code");}}><Link2 size={16}/><span>代码实现 <small>tensorflow / tensor2tensor</small></span><ArrowUpRight size={15}/></button>}<button className="br-primary br-save" disabled={saved} onClick={() => setSaveDialog(true)}>{saved ? <Check size={16}/> : <FolderOpen size={16}/>} {saved ? `已保存 · ${savedProject}` : "确认并保存到项目"}</button><small className="br-local-note">保存仅写入本地原型，不影响真实知识库。</small></div>}
          </>}
        </div>
        <div className="br-composer-wrap"><div className="br-composer"><div className="aw-input-line">{activeSkill && (!attached || activeSkill === "网页执行") && <button disabled={busy} className="aw-skill-chip" onClick={()=>{setActiveSkill("");setAttached(false);}} title="移除当前 Skill">{activeSkill === "网页执行" ? <Globe2 size={16}/> : <Lightbulb size={16}/>} {activeSkill}</button>}{attached && activeSkill !== "网页执行" && <button disabled={busy} className="br-context" onClick={openPicker}><Globe2 size={14}/>{selected.length} 个网页<ChevronDown size={13}/></button>}<textarea aria-label="研究任务输入" value={prompt} disabled={busy} onChange={e=>setPrompt(e.target.value)} placeholder={creditState === "empty" ? "补充积分后可继续发送任务" : activeSkill === "网页执行" ? "描述你想让 Agent 在网页上完成的任务" : attached ? "输入你想用这些网页完成的任务" : `输入我的${activeSkill || "当前"}的研究`} onKeyDown={e=>{if(e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing){e.preventDefault();send();}}}/></div><div className="br-composer-footer"><div className="aw-composer-actions"><button className="aw-add" aria-label="添加上下文" aria-expanded={composerMenu} disabled={busy} onClick={()=>setComposerMenu(v=>!v)}><Plus size={22}/></button>{composerMenu && <div className="aw-composer-menu"><button onClick={selectBrowserUse}><Globe2 size={16}/>使用网页<span>添加网页执行标签</span></button><button onClick={()=>{setComposerMenu(false);setWorkbench("files");setPanelOpen(true);}}><FolderOpen size={16}/>项目材料<span>查看当前任务文件</span></button></div>}{attached && <><label><ShieldCheck size={13}/><select aria-label="网页操作权限" disabled={busy} value={permission} onChange={e=>setPermission(e.target.value as typeof permission)}><option value="read">仅阅读</option><option value="interact">阅读与操作</option></select></label><button className="aw-detach" disabled={busy} aria-label="移除网页上下文" onClick={()=>{setAttached(false);setActiveSkill("灵感发现");}}><X size={13}/></button></>}</div><button className="br-send" onClick={send} disabled={busy || !prompt.trim() || creditState === "empty"} aria-label="发送研究任务"><ArrowUp size={21}/></button></div></div><p className="br-composer-note">内容由AI生成，请仔细甄别</p></div>
      </section>
      {panelOpen && <section className="aw-workbench-body" aria-label="任务工作台">
      {workbench === "memory" && <TaskMemoryPanel memory={taskMemory} projectContext={projectContext}/>}
      {workbench === "common" && <CommonFunctions onSelect={selectSkill} onBrowser={selectBrowserUse}/>}
      {workbench !== "memory" && workbench !== "common" && workbench !== "browser" && <AuxiliaryWorkbench view={workbench} savedProject={savedProject} onSelect={selectSkill}/>}
      <section className="br-browser" aria-label="网页执行预览" hidden={workbench !== "browser"}>
        <div className="aw-browser-intro"><span><Globe2 size={16}/>{clientTab ? "客户端网页标签页" : "网页执行预览"}</span><button disabled={busy} onClick={openPicker}>{tabsCreated ? "管理任务标签页" : "新建 Agent 标签页"}<Plus size={13}/></button></div>
        {!attached && <div className="aw-browser-connect"><p>在客户端新建标签页，交给 Agent 执行网页任务。</p><small>右侧与任务共享模拟页面状态，控制浏览器后可直接操作。此原型不连接真实浏览器。</small></div>}
        <div className="br-demo-bar"><span>交互演示</span><label>场景<select aria-label="体验场景" value={scenario} disabled={busy} onChange={e=>{const value=e.target.value as typeof scenario;setScenario(value);setSelected(value === "login" ? ["paper","code","review"] : ["paper","code"]);reset("paper");}}><option value="normal">正常完成</option><option value="login">需要登录</option><option value="error">页面加载失败</option></select></label></div>
        <div className="br-browser-heading" hidden><span><Globe2 size={16}/><strong>浏览器</strong><small>本机工作区</small></span><button onClick={openPicker} disabled={busy} className="br-icon" aria-label="选择网页"><Plus size={17}/></button></div>
        <div className="aw-browser-follow-toolbar">
          <span><i className={phase === "running" && followPage ? "is-live" : ""}/>{canOperate ? "由你控制当前页面" : followPage ? "跟随 Agent 当前页面" : "查看其它标签页"}</span>
          {!followPage && <button onClick={()=>{setFollowPage(true);setClientTab(false);}}>回到 Agent 当前页面</button>}
          <button onClick={()=>{setClientTab(v=>!v);setFollowPage(true);}}>{clientTab ? "标准宽度" : "加宽预览"}<ArrowUpRight size={13}/></button>
        </div>
        <div className="aw-browser-session-tabs" role="tablist" aria-label="浏览器页面标签">
          {selected.map(id => <button key={id} role="tab" aria-selected={displayedPage === id} onClick={()=>inspectPage(id)}><Globe2 size={13}/><span>{pages.find(p=>p.id===id)!.title}</span>{phase === "running" && activePage === id && <i className="is-live"/>}</button>)}
          <button aria-label="管理浏览器页面" disabled={busy} onClick={openPicker}><Plus size={15}/></button>
        </div>
        <div className="br-address aw-browser-address"><button aria-label="查看上一个演示页面" disabled={!canOperate || selected.indexOf(activePage) <= 0} onClick={()=>inspectPage(selected[selected.indexOf(activePage)-1])}><ArrowLeft size={15}/></button><button aria-label="查看下一个演示页面" disabled={!canOperate || selected.indexOf(activePage) >= selected.length-1} onClick={()=>inspectPage(selected[selected.indexOf(activePage)+1])}><ArrowRight size={15}/></button><button aria-label="刷新页面预览" onClick={()=>{setPageRevision(v=>v+1);setNotice("当前模拟页面预览已刷新");}}><RotateCcw size={14}/></button><span title={currentUrl}><LockKeyhole size={12}/>{currentUrl}</span>{page.id !== "review" && <a href={currentUrl} target="_blank" rel="noreferrer" aria-label="打开公开来源（外部链接）"><ExternalLink size={14}/></a>}</div>
        <div className={`br-browser-state ${phase === "running" ? "is-running" : ""}`}><span>{phase === "running" ? <MousePointer2 size={14}/> : canOperate ? <Hand size={14}/> : <ShieldCheck size={14}/>} {canOperate ? "Agent 已让出控制 · 可在此操作演示页面" : phase === "running" ? "正在同步页面 · 只读观察" : `页面已保留 · ${phaseLabels[phase]}`}</span>{phase === "paused" && <button onClick={resume}><Play size={12}/>继续执行</button>}</div>
        <div ref={pageScrollRef} data-browser-page={displayedPage} className="br-page-scroll" {...(!canOperate ? {inert: ""} as any : {})}>
          {phase === "error" ? <div className="br-page-empty"><Globe2 size={34}/><h2>网页未能加载</h2><p>模拟网络连接中断，已完成的结果不会丢失。</p><button className="br-primary" onClick={() => {setRecovered(true); setPhase("running");}}>重新加载并继续</button></div> : displayedPage === "review" ? <div className="br-page-empty"><LockKeyhole size={34}/><h2>{loggedIn ? "机构访问已就绪" : "通过机构访问全文"}</h2><p>{loggedIn ? "现在可以继续获取文献材料。" : "本示例用于体验登录中断与恢复流程。"}</p>{!loggedIn && <button className="br-primary" disabled={phase !== "login" && !canOperate} onClick={() => {setLoggedIn(true); if (phase === "login") {setPhase("running"); setActivity(items => [...items, "用户完成演示登录，继续读取"]);} else setNotice("演示登录已完成");}}>模拟登录完成{phase === "login" ? "并继续" : ""}</button>}<small>无需输入真实凭据</small></div> : displayedPage === "code" ? <div className="br-code-page"><div className="br-code-top"><span className="br-favicon code">⌘</span><strong>GitHub</strong><span>示例预览</span></div><p className="br-repo-name">tensorflow <span>/</span> <strong>tensor2tensor</strong><small>Public</small></p><div className="br-repo-nav">〈〉 Code <span>Issues</span><span>Pull requests</span></div><div className="br-repo-file"><FolderOpen size={15}/> tensor2tensor <small>模型与训练工具</small></div><div className="br-repo-file"><FileText size={15}/> README.md <small>项目说明</small></div><article><span className="br-eyebrow">README.md</span><h2>Tensor2Tensor</h2><p>A library of deep learning models and datasets designed to make deep learning more accessible and accelerate ML research.</p><h3>Transformer</h3><p>Implementation resources for “Attention Is All You Need”.</p><div className="br-code-snippet">tensor2tensor/models/transformer.py</div><p className="br-page-note">该页面为研究资源示例。复现前需核对原仓库版本、依赖与维护状态。</p></article></div> : <div className="br-paper-page"><div className="br-paper-top"><span>ar<span>χ</span>iv</span><span>Computer Science</span></div><div className="br-paper-search"><Search size={15}/><input aria-label="示例网页搜索" value={search} disabled={!canOperate} onChange={e => setSearch(e.target.value)} placeholder="Search papers…"/><button disabled={!canOperate || !search.trim()} onClick={() => setNotice(`示例页面已接收检索词“${search}”；此原型不发起真实搜索。`)}>搜索</button></div><div className="br-paper-body"><p className="br-breadcrumb">Computer Science <ChevronRight size={11}/> Computation and Language</p><div className="br-paper-meta">arXiv:1706.03762 <span>[cs.CL]</span></div><h2>Attention Is All You Need</h2><p className="br-authors">Ashish Vaswani, Noam Shazeer, Niki Parmar,<br/>Jakob Uszkoreit, Llion Jones, Aidan N. Gomez,<br/>Lukasz Kaiser, Illia Polosukhin</p><p className="br-version">Submitted 12 Jun 2017 · Revised 2 Aug 2023 (v7)</p><div className="br-article-tabs">{["摘要", "全文", "版本记录"].map(t => <button key={t} className={articleTab === t ? "selected" : ""} disabled={!canOperate} onClick={() => setArticleTab(t)}>{t}</button>)}</div>{articleTab === "摘要" ? <><h3>Abstract</h3><p className="br-abstract">The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.</p><div className={`br-highlight ${phase === "running" && step === 0 ? "scanning" : ""}`}><span><FileText size={15}/>研究线索</span><p>Transformer · Self-attention · Sequence modeling</p><small>可整理为当前研究项目的文献材料</small></div></> : articleTab === "全文" ? <div className="br-fulltext"><FileText size={28}/><h3>Attention Is All You Need.pdf</h3><p>15 pages · v7 · arXiv</p><a href="https://arxiv.org/pdf/1706.03762" target="_blank" rel="noreferrer">打开真实 PDF <ExternalLink size={14}/></a></div> : <div className="br-history"><p><strong>v7</strong> 2 Aug 2023 <span>当前版本</span></p><p><strong>v6</strong> 24 Jul 2023</p><p><strong>v1</strong> 12 Jun 2017</p></div>}<div className="br-paper-links"><button disabled={!canOperate} onClick={() => setArticleTab("全文")}><FileText size={15}/>View PDF<ArrowUpRight size={14}/></button>{selected.includes("code") && <button disabled={!canOperate} onClick={() => {openBrowser(); setActivePage("code");}}><Link2 size={15}/>Code<ArrowUpRight size={14}/></button>}</div></div></div>}
        </div><div className="br-browser-bottom"><span><ShieldCheck size={13}/>{permission === "read" ? "Agent 仅阅读" : "Agent 可阅读与操作"} · 限所选网页</span><button onClick={() => setShowSources(v => !v)}>来源记录<ChevronDown size={13}/></button></div>{showSources && <div className="br-sources"><strong>本轮所选来源 · 演示</strong>{selected.map(id => <p key={id}>{pages.find(p => p.id === id)!.url}</p>)}<small>此列表记录页面范围，不代表发生了真实网络访问。</small></div>}
      </section>
      <nav className="aw-tool-rail" aria-label="工作台工具">{workbenchTools.map(({id,label,icon:Icon})=><button key={id} aria-label={id === 'memory' ? t('agentPreferences.title') : label} title={id === 'memory' ? t('agentPreferences.title') : label} aria-pressed={workbench === id} onClick={()=>{setWorkbench(id);setPanelOpen(true);}}><Icon size={22}/>{id === "browser" && busy && <i/>}</button>)}</nav>
      </section>}
    </div>
    {notice && <div className="br-toast" role="status"><CheckCircle2 size={16}/>{notice}</div>}
    {picker && <div className="br-overlay" onClick={() => setPicker(false)}><div ref={pickerRef} role="dialog" aria-modal="true" aria-labelledby="br-picker-title" className="br-dialog" onClick={e => e.stopPropagation()}><div className="br-dialog-title"><div><h2 id="br-picker-title">新建 Agent 标签页</h2><p>选择研究起点，在客户端标签栏打开页面供 Agent 操作。</p></div><button className="br-icon" onClick={() => setPicker(false)} aria-label="关闭网页选择"><X size={18}/></button></div><div className="br-picker-search"><Search size={16}/><input aria-label="搜索研究页面" placeholder="搜索标题或网站" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}/></div><p className="br-eyebrow">可打开的研究页面 · 演示</p>{pages.filter(p => `${p.title} ${p.domain}`.toLowerCase().includes(pickerSearch.toLowerCase())).map(p => <label className="br-picker-item" key={p.id}><input type="checkbox" disabled={p.id === "paper"} checked={draftSelected.includes(p.id)} onChange={() => setDraftSelected(ids => ids.includes(p.id) ? ids.filter(id => id !== p.id) : [...ids, p.id])}/><span className={`br-favicon ${p.id}`}>{p.id === "paper" ? "a" : p.id === "code" ? "⌘" : "W"}</span><span><strong>{p.title}</strong><small>{p.domain}</small></span><em>{p.id === "paper" ? "研究起点" : p.tag}</em></label>)}{!pages.some(p => `${p.title} ${p.domain}`.toLowerCase().includes(pickerSearch.toLowerCase())) && <p className="br-muted">没有匹配的网页，请换个关键词。</p>}<div className="br-picker-foot"><span>{draftSelected.length ? `已选择 ${draftSelected.length} 个网页` : "至少选择一个网页"}</span><button className="br-primary" disabled={!draftSelected.length} onClick={confirmPages}>创建标签页并加入任务</button></div></div></div>}
    {saveDialog && <div className="br-overlay" onClick={() => setSaveDialog(false)}><div ref={saveRef} className="br-dialog" role="dialog" aria-modal="true" aria-labelledby="br-save-title" onClick={e => e.stopPropagation()}><div className="br-dialog-title"><div><h2 id="br-save-title">确认保存研究材料</h2><p>检查内容与目标项目，再完成保存。</p></div><button className="br-icon" aria-label="关闭保存确认" onClick={() => setSaveDialog(false)}><X size={18}/></button></div><div className="br-save-preview"><FileText size={20}/><div><strong>Attention Is All You Need</strong><p>论文元数据、PDF 链接{selected.includes("code") ? "、代码链接" : ""}</p><small>保留来源 URL 与论文版本</small></div></div><label className="br-project-label">保存到项目<select value={project} onChange={e => setProject(e.target.value)}>{projectContext && <option>{projectContext.title}</option>}<option>Transformer 文献调研</option><option>Default Project</option></select></label><p className="br-local-note">这是原型本地记录，不会写入真实 Wispaper 项目。</p><div className="br-picker-foot"><button onClick={() => setSaveDialog(false)}>取消</button><button className="br-primary" onClick={save}><FolderOpen size={15}/>确认保存</button></div></div></div>}
  </div></div>;
}
function Sparkle() { return <Plus size={12}/>; }
