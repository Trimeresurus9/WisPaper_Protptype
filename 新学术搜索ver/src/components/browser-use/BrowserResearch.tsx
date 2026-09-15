import React, { useEffect, useRef, useState } from "react";
import { Sparkles, GraduationCap, Moon, MoreHorizontal, PanelRight, Share2, Lightbulb, ArrowLeft, ArrowUp, ArrowUpRight, BookOpen, Bot, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, ExternalLink, FileText, FolderOpen, Globe2, Hand, Link2, LoaderCircle, LockKeyhole, MousePointer2, Pause, Play, Plus, RotateCcw, Search, ShieldCheck, Square, X } from "lucide-react";
import "./browser-research.css";
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

type CreditState = "ok" | "low" | "empty";

export function BrowserResearch({onBack, initialTask = "", initialSkill = "灵感发现", projectContext, userCredits = 50000, creditState = "ok", onRecharge, onUpgrade, onNavigate}: {onBack: () => void; initialTask?: string; initialSkill?: string; projectContext?: {id: string; title: string}; userCredits?: number; creditState?: CreditState; onRecharge?: () => void; onUpgrade?: () => void; onNavigate?: (view: string) => void}) {
  const [clientTab, setClientTab] = useState(false);
  const [tabsCreated, setTabsCreated] = useState(false);
  const [workbench, setWorkbench] = useState<WorkbenchView>("common");
  const [panelOpen, setPanelOpen] = useState(true);
  const [attached, setAttached] = useState(false);
  const [composerMenu, setComposerMenu] = useState(false);
  const [activeSkill, setActiveSkill] = useState(initialSkill);
  const [lowCreditDismissed, setLowCreditDismissed] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:"user"|"agent";text:string}[]>(initialTask ? creditState === "empty" ? [{role:"user", text:initialTask}] : [{role:"user", text:initialTask},{role:"agent",text:"我会先梳理研究目标与已有材料。你可以在右侧选择研究工具，或通过输入框添加网页作为上下文。"}] : []);
  const title = initialTask || '从“NLP与多模态学习探索”生成可执行的研究计划';
  const selectSkill = (skill: string) => {setActiveSkill(skill);setPrompt(`请帮我进行${skill}，结合当前研究目标与已有材料。`);};
  const selectBrowserUse = () => { if (busy) return; setActiveSkill("网页执行"); setAttached(false); setComposerMenu(false); };
  const openBrowser = () => {setWorkbench("browser");setPanelOpen(true);};

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
  const busy = ["running", "paused", "takeover", "login", "error"].includes(phase);
  const page = pages.find(p => p.id === activePage)!;
  const completedSteps = phase === "done" ? 3 : step;
  const canOperate = clientTab && (!busy || phase === "takeover");

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setTimeout(() => {
      if (step === 1 && scenario === "login" && selected.includes("review") && !loggedIn) { setPhase("login"); setActivePage("review"); return; }
      if (step === 1 && scenario === "error" && !recovered) { setPhase("error"); return; }
      if (step === 2) { setPhase("done"); return; }
      setStep(s => s + 1);
      if (step === 0 && selected.includes("code")) setActivePage("code");
    }, 2800);
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
    setActivePage(selected[0]); setRecovered(false); setLoggedIn(false); setActivity([]);
  };
  const reset = () => { setPhase("ready"); setStep(0); setSubmitted(""); setSaved(false); setShowSources(false); setActivity([]); setActivePage("paper"); setArticleTab("摘要"); setSearch(""); };
  const takeOver = () => { setClientTab(true); setWorkbench("browser"); setPanelOpen(true); setPhase("takeover"); setActivity(items => [...items, "用户接管，Agent 已停止操作"]); };
  const resume = () => { setClientTab(false); setPhase("running"); setActivity(items => [...items, "已重新读取页面状态，继续任务"]); };
  const openPicker = () => { setDraftSelected(selected); setPickerSearch(""); setPicker(true); };
  const confirmPages = () => {
    setTabsCreated(true); setAttached(true); setWorkbench("browser"); setPanelOpen(true); setActiveSkill(""); if (!prompt.trim()) setPrompt(defaultPrompt);
    setSelected(draftSelected); if (!draftSelected.includes(activePage)) setActivePage(draftSelected[0]);
    setPicker(false); if (phase !== "ready") reset();
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
    if (activeSkill === "网页执行" || attached) {setTabsCreated(true); setAttached(true); openBrowser(); start(); return;}
    setChatMessages(items=>[...items,{role:"user",text:prompt.trim()},{role:"agent",text:`已进入${activeSkill || "研究"}流程。请补充研究问题、材料范围与预期产出；我会在当前任务中逐步整理。`}]);
    setPrompt("");
  };
  return <div className={`agent-task-shell ${tabsCreated ? "aw-has-client-tabs" : ""} ${clientTab ? "aw-client-active" : ""}`}>
    {tabsCreated && <div className="aw-client-tabs" role="tablist" aria-label="客户端标签页"><button role="tab" aria-selected={!clientTab} onClick={()=>setClientTab(false)}><Sparkles size={15}/>Agent · 当前研究</button>{selected.map(id=><button key={id} role="tab" aria-selected={clientTab && activePage===id} onClick={()=>{setActivePage(id);setClientTab(true);setWorkbench("browser");setPanelOpen(true);}}><Globe2 size={14}/>{pages.find(p=>p.id===id)!.title}<small>{phase==="running" && activePage===id ? "Agent 操作中" : "Agent 标签页"}</small></button>)}</div>}
    <AgentTaskNavigation onBack={onBack} onNavigate={onNavigate}/><div className={`br-workspace aw-workspace ${panelOpen ? "" : "aw-panel-closed"}`}>

    <div className="br-columns">
      <header className="aw-chat-header"><h1 title={title}>{title}</h1><div className="aw-header-actions"><span className={`br-status br-status-${phase}`} role="status"><i/>{creditState === "empty" ? "等待补充积分" : submitted ? phaseLabels[phase] : "进行中"}</span><span className="aw-metric"><GraduationCap size={17}/>1250</span><span className="aw-metric"><Moon size={16}/>1h</span><i className="aw-divider"/><button aria-label="复制任务链接" onClick={()=>{navigator.clipboard?.writeText(window.location.href).then(()=>setNotice("原型页面链接已复制"),()=>setNotice("请复制地址栏中的原型链接"));}}><Share2 size={18}/></button><button className="aw-stop" aria-label="停止当前任务" onClick={()=>{if(busy)setPhase("stopped");else setNotice("当前没有正在执行的步骤");}}><Square size={14}/></button><button aria-label="新建研究任务" onClick={onBack}><MoreHorizontal size={19}/></button>{!panelOpen && <button aria-label="展开工作台" onClick={()=>setPanelOpen(true)}><PanelRight size={18}/></button>}</div></header>
      {panelOpen && <header className="aw-workbench-header"><strong>{workbenchTools.find(t=>t.id===workbench)?.label}</strong><button aria-label="收起工作台" onClick={()=>setPanelOpen(false)}><PanelRight size={19}/></button></header>}
      <section className="br-conversation" aria-label="网页研究对话">
        <div className="br-chat-scroll">
          {projectContext && <div className="aw-project-context"><FolderOpen size={15}/><span>当前项目</span><strong>{projectContext.title}</strong></div>}
          {creditState === "empty" && <div className="aw-credit-notice is-empty" role="status"><strong>任务已保留，补充积分后即可启动</strong><p>当前余额为 0 Credits。你的任务内容和项目上下文不会丢失。</p><div><button onClick={onRecharge}>补充积分</button><button className="secondary" onClick={onUpgrade}>查看会员方案</button></div></div>}
          {creditState === "low" && !lowCreditDismissed && <div className="aw-credit-notice" role="status"><strong>当前余额较低</strong><p>剩余 {userCredits.toLocaleString()} Credits，本次任务仍可继续。建议提前补充积分，避免后续步骤中断。</p><div><button onClick={onRecharge}>补充积分</button><button className="secondary" onClick={()=>setLowCreditDismissed(true)}>知道了</button></div></div>}
          {chatMessages.map((message,index)=><div key={index} className={message.role === "user" ? "br-user-message" : "aw-chat-answer"}>{message.role === "agent" && <div className="br-assistant-label"><span className="br-agent-icon"><Bot size={16}/></span><strong>WisPaper</strong></div>}<p>{message.text}</p></div>)}
          {submitted && <>
            <div className="br-user-message">{submitted}<div><Globe2 size={12}/>{selected.length} 个网页 · {permission === "read" ? "仅阅读" : "阅读与操作"}</div></div>
            <div className="br-assistant-label"><span className="br-agent-icon"><Bot size={16}/></span><strong>WisPaper</strong><span>网页研究</span></div>
            <p className="br-response">{permission === "read" ? "我会读取已选择的页面，概括关键信息并保留来源。" : "我会核对论文信息，并在已选择的页面中整理可用的研究资源。保存前会请你确认。"}</p>
            <div className="br-execution"><div className="br-execution-head"><span><Globe2 size={16}/> {permission === "read" ? "阅读网页" : "浏览器任务"}</span><span>{completedSteps} / 3</span></div><ol>{stepTitles.map((title, i) => <li key={title} className={i === step && phase === "running" ? "active" : ""}>{i < completedSteps ? <CheckCircle2 size={17}/> : i === step && phase === "running" ? <LoaderCircle className="br-spin" size={17}/> : <Circle size={17}/>}<div><strong>{permission === "read" && i === 1 ? "提取正文与核心贡献" : title}</strong><small>{i < completedSteps ? ["arxiv.org · v7 · 2023-08-02", selected.includes("code") ? "PDF 与代码来源已定位" : "已定位所选页面中的全文链接", "已整理可追溯的来源"][i] : i === step ? phaseLabels[phase] : "等待执行"}</small></div></li>)}</ol>{activity.length > 0 && <div className="br-activity">{activity.slice(-2).map((item, i) => <span key={i}>{item}</span>)}</div>}</div>
            {busy && <div className="br-controls">{phase === "running" ? <button onClick={() => setPhase("paused")}><Pause size={14}/>暂停</button> : phase === "paused" || phase === "takeover" ? <button onClick={resume}><Play size={14}/>继续执行</button> : null}{["running", "paused"].includes(phase) && <button onClick={takeOver}><Hand size={14}/>我来接管</button>}<button onClick={() => setPhase("stopped")}><Square size={13}/>停止任务</button></div>}
            {phase === "paused" && <div className="br-callout">任务已暂停，浏览器不会继续操作。可以继续执行或接管页面。</div>}
            {phase === "takeover" && <div className="br-callout">已切换到客户端标签页，由你操作。点击“继续执行”后，Agent 会重新读取页面状态。</div>}
            {phase === "login" && <div className="br-callout amber"><LockKeyhole size={18}/><strong>需要你完成机构登录</strong><p>Agent 已暂停。请前往客户端标签页完成登录，再继续研究。</p><button onClick={()=>setClientTab(true)}>前往标签页登录</button><small>演示环境不收集账号或密码。</small></div>}
            {phase === "error" && <div className="br-callout amber"><strong>页面暂时无法加载</strong><p>已保留前一步结果，可以重试或停止任务。</p><button onClick={() => {setRecovered(true); setPhase("running");}}><RotateCcw size={14}/>重试当前步骤</button></div>}
            {phase === "stopped" && <div className="br-callout"><strong>任务已停止</strong><p>已完成的步骤保留，尚未保存材料。</p><button onClick={start}><RotateCcw size={14}/>重新开始</button></div>}
            {phase === "done" && <div className="br-result"><div className="br-result-heading"><CheckCircle2 size={19}/><strong>{permission === "read" ? "页面阅读完成" : "研究材料已整理"}</strong></div><h3>Attention Is All You Need</h3><p>{permission === "read" ? "论文提出完全基于注意力机制的 Transformer 架构，以自注意力建模序列依赖，替代循环与卷积结构。" : "已核对论文版本，并整理全文入口。代码资源仅在你选择对应网页时纳入。"}</p><div className="br-facts"><span>arXiv:1706.03762</span><span>v7 · 2023.08.02</span></div><button className="br-source-row" onClick={() => {openBrowser(); setActivePage("paper"); setArticleTab("全文");}}><FileText size={16}/><span>论文全文 <small>arxiv.org / PDF</small></span><ArrowUpRight size={15}/></button>{selected.includes("code") && <button className="br-source-row" onClick={() => {openBrowser(); setActivePage("code");}}><Link2 size={16}/><span>代码实现 <small>tensorflow / tensor2tensor</small></span><ArrowUpRight size={15}/></button>}<button className="br-primary br-save" disabled={saved} onClick={() => setSaveDialog(true)}>{saved ? <Check size={16}/> : <FolderOpen size={16}/>} {saved ? `已保存 · ${savedProject}` : "确认并保存到项目"}</button><small className="br-local-note">保存仅写入本地原型，不影响真实知识库。</small></div>}
          </>}
        </div>
        <div className="br-composer-wrap"><div className="br-composer"><div className="aw-input-line">{activeSkill && (!attached || activeSkill === "网页执行") && <button disabled={busy} className="aw-skill-chip" onClick={()=>{setActiveSkill("");setAttached(false);}} title="移除当前 Skill">{activeSkill === "网页执行" ? <Globe2 size={16}/> : <Lightbulb size={16}/>} {activeSkill}</button>}{attached && activeSkill !== "网页执行" && <button disabled={busy} className="br-context" onClick={openPicker}><Globe2 size={14}/>{selected.length} 个网页<ChevronDown size={13}/></button>}<textarea aria-label="研究任务输入" value={prompt} disabled={busy} onChange={e=>setPrompt(e.target.value)} placeholder={creditState === "empty" ? "补充积分后可继续发送任务" : activeSkill === "网页执行" ? "描述你想让 Agent 在网页上完成的任务" : attached ? "输入你想用这些网页完成的任务" : `输入我的${activeSkill || "当前"}的研究`} onKeyDown={e=>{if(e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing){e.preventDefault();send();}}}/></div><div className="br-composer-footer"><div className="aw-composer-actions"><button className="aw-add" aria-label="添加上下文" aria-expanded={composerMenu} disabled={busy} onClick={()=>setComposerMenu(v=>!v)}><Plus size={22}/></button>{composerMenu && <div className="aw-composer-menu"><button onClick={selectBrowserUse}><Globe2 size={16}/>使用网页<span>添加网页执行标签</span></button><button onClick={()=>{setComposerMenu(false);setWorkbench("files");setPanelOpen(true);}}><FolderOpen size={16}/>项目材料<span>查看当前任务文件</span></button></div>}{attached && <><label><ShieldCheck size={13}/><select aria-label="网页操作权限" disabled={busy} value={permission} onChange={e=>setPermission(e.target.value as typeof permission)}><option value="read">仅阅读</option><option value="interact">阅读与操作</option></select></label><button className="aw-detach" disabled={busy} aria-label="移除网页上下文" onClick={()=>{setAttached(false);setActiveSkill("灵感发现");}}><X size={13}/></button></>}</div><button className="br-send" onClick={send} disabled={busy || !prompt.trim() || creditState === "empty"} aria-label="发送研究任务"><ArrowUp size={21}/></button></div></div><p className="br-composer-note">内容由AI生成，请仔细甄别</p></div>
      </section>
      {panelOpen && <section className="aw-workbench-body" aria-label="任务工作台">
      {workbench === "common" && <CommonFunctions onSelect={selectSkill} onBrowser={selectBrowserUse}/>}
      {workbench !== "common" && workbench !== "browser" && <AuxiliaryWorkbench view={workbench} savedProject={savedProject} onSelect={selectSkill}/>}
      <section className="br-browser" aria-label="网页执行预览" hidden={workbench !== "browser"}>
        <div className="aw-browser-intro"><span><Globe2 size={16}/>{clientTab ? "客户端网页标签页" : "网页执行预览"}</span><button disabled={busy} onClick={openPicker}>{tabsCreated ? "管理任务标签页" : "新建 Agent 标签页"}<Plus size={13}/></button></div>
        {!attached && <div className="aw-browser-connect"><p>在客户端新建标签页，交给 Agent 执行网页任务。</p><small>这里仅显示页面预览和执行进度；网页操作发生在客户端标签页。</small></div>}
        <div className="br-demo-bar"><span>交互演示</span><label>场景<select aria-label="体验场景" value={scenario} disabled={busy} onChange={e=>{const value=e.target.value as typeof scenario;setScenario(value);setSelected(value === "login" ? ["paper","code","review"] : ["paper","code"]);reset();}}><option value="normal">正常完成</option><option value="login">需要登录</option><option value="error">页面加载失败</option></select></label></div>
        <div className="br-browser-heading" hidden><span><Globe2 size={16}/><strong>浏览器</strong><small>本机工作区</small></span><button onClick={openPicker} disabled={busy} className="br-icon" aria-label="选择网页"><Plus size={17}/></button></div>
        {tabsCreated && <div className="aw-preview-toolbar"><span>{clientTab ? "当前标签页" : "正在跟踪"} · {page.title}</span><button onClick={()=>setClientTab(v=>!v)}>{clientTab ? "返回 Agent 查看进度" : "前往标签页"}<ArrowUpRight size={14}/></button>{clientTab && phase==="takeover" && <button onClick={resume}>交还 Agent 并继续</button>}</div>}
        {submitted && !clientTab && <div className="aw-execution-progress"><strong>{phaseLabels[phase]}</strong><span>已完成 {completedSteps} / 3 步 · {page.title}</span></div>}
        <div className="br-address"><LockKeyhole size={13}/><span>{page.url}</span>{activePage !== "review" && <a href={page.url} target="_blank" rel="noreferrer" aria-label="打开公开来源（外部链接）"><ExternalLink size={14}/></a>}</div>
        <div className={`br-browser-state ${phase === "running" ? "is-running" : ""}`}><span>{phase === "running" ? <MousePointer2 size={14}/> : phase === "takeover" ? <Hand size={14}/> : <ShieldCheck size={14}/>} {phase === "running" ? `Agent 正在${step === 0 ? "读取页面" : step === 1 ? "查找研究资源" : "核对来源"}` : phase === "takeover" ? "由你在客户端标签页操作" : clientTab ? "客户端标签页 · 演示" : "页面预览 · 仅观察"}</span>{phase === "running" && <button onClick={takeOver}>接管</button>}</div>
        <div className="br-page-scroll" {...(!clientTab ? {inert: ""} as any : {})}>
          {phase === "error" ? <div className="br-page-empty"><Globe2 size={34}/><h2>网页未能加载</h2><p>模拟网络连接中断，已完成的结果不会丢失。</p><button className="br-primary" onClick={() => {setRecovered(true); setPhase("running");}}>重新加载并继续</button></div> : activePage === "review" ? <div className="br-page-empty"><LockKeyhole size={34}/><h2>{loggedIn ? "机构访问已就绪" : "通过机构访问全文"}</h2><p>{loggedIn ? "现在可以继续获取文献材料。" : "本示例用于体验登录中断与恢复流程。"}</p>{!loggedIn && <button className="br-primary" disabled={phase !== "login" && !canOperate} onClick={() => {setLoggedIn(true); if (phase === "login") {setPhase("running"); setActivity(items => [...items, "用户完成演示登录，继续读取"]);} else setNotice("演示登录已完成");}}>模拟登录完成{phase === "login" ? "并继续" : ""}</button>}<small>无需输入真实凭据</small></div> : activePage === "code" ? <div className="br-code-page"><div className="br-code-top"><span className="br-favicon code">⌘</span><strong>GitHub</strong><span>示例预览</span></div><p className="br-repo-name">tensorflow <span>/</span> <strong>tensor2tensor</strong><small>Public</small></p><div className="br-repo-nav">〈〉 Code <span>Issues</span><span>Pull requests</span></div><div className="br-repo-file"><FolderOpen size={15}/> tensor2tensor <small>模型与训练工具</small></div><div className="br-repo-file"><FileText size={15}/> README.md <small>项目说明</small></div><article><span className="br-eyebrow">README.md</span><h2>Tensor2Tensor</h2><p>A library of deep learning models and datasets designed to make deep learning more accessible and accelerate ML research.</p><h3>Transformer</h3><p>Implementation resources for “Attention Is All You Need”.</p><div className="br-code-snippet">tensor2tensor/models/transformer.py</div><p className="br-page-note">该页面为研究资源示例。复现前需核对原仓库版本、依赖与维护状态。</p></article></div> : <div className="br-paper-page"><div className="br-paper-top"><span>ar<span>χ</span>iv</span><span>Computer Science</span></div><div className="br-paper-search"><Search size={15}/><input aria-label="示例网页搜索" value={search} disabled={!canOperate} onChange={e => setSearch(e.target.value)} placeholder="Search papers…"/><button disabled={!canOperate || !search.trim()} onClick={() => setNotice(`示例页面已接收检索词“${search}”；此原型不发起真实搜索。`)}>搜索</button></div><div className="br-paper-body"><p className="br-breadcrumb">Computer Science <ChevronRight size={11}/> Computation and Language</p><div className="br-paper-meta">arXiv:1706.03762 <span>[cs.CL]</span></div><h2>Attention Is All You Need</h2><p className="br-authors">Ashish Vaswani, Noam Shazeer, Niki Parmar,<br/>Jakob Uszkoreit, Llion Jones, Aidan N. Gomez,<br/>Lukasz Kaiser, Illia Polosukhin</p><p className="br-version">Submitted 12 Jun 2017 · Revised 2 Aug 2023 (v7)</p><div className="br-article-tabs">{["摘要", "全文", "版本记录"].map(t => <button key={t} className={articleTab === t ? "selected" : ""} disabled={!canOperate} onClick={() => setArticleTab(t)}>{t}</button>)}</div>{articleTab === "摘要" ? <><h3>Abstract</h3><p className="br-abstract">The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.</p><div className={`br-highlight ${phase === "running" && step === 0 ? "scanning" : ""}`}><span><FileText size={15}/>研究线索</span><p>Transformer · Self-attention · Sequence modeling</p><small>可整理为当前研究项目的文献材料</small></div></> : articleTab === "全文" ? <div className="br-fulltext"><FileText size={28}/><h3>Attention Is All You Need.pdf</h3><p>15 pages · v7 · arXiv</p><a href="https://arxiv.org/pdf/1706.03762" target="_blank" rel="noreferrer">打开真实 PDF <ExternalLink size={14}/></a></div> : <div className="br-history"><p><strong>v7</strong> 2 Aug 2023 <span>当前版本</span></p><p><strong>v6</strong> 24 Jul 2023</p><p><strong>v1</strong> 12 Jun 2017</p></div>}<div className="br-paper-links"><button disabled={!canOperate} onClick={() => setArticleTab("全文")}><FileText size={15}/>View PDF<ArrowUpRight size={14}/></button>{selected.includes("code") && <button disabled={!canOperate} onClick={() => {openBrowser(); setActivePage("code");}}><Link2 size={15}/>Code<ArrowUpRight size={14}/></button>}</div></div></div>}
        </div><div className="br-browser-bottom"><span><ShieldCheck size={13}/>{permission === "read" ? "Agent 仅阅读" : "Agent 可阅读与操作"} · 限所选网页</span><button onClick={() => setShowSources(v => !v)}>来源记录<ChevronDown size={13}/></button></div>{showSources && <div className="br-sources"><strong>本轮所选来源 · 演示</strong>{selected.map(id => <p key={id}>{pages.find(p => p.id === id)!.url}</p>)}<small>此列表记录页面范围，不代表发生了真实网络访问。</small></div>}
      </section>
      <nav className="aw-tool-rail" aria-label="工作台工具">{workbenchTools.map(({id,label,icon:Icon})=><button key={id} aria-label={label} title={label} aria-pressed={workbench === id} onClick={()=>setWorkbench(id)}><Icon size={22}/>{id === "browser" && busy && <i/>}</button>)}</nav>
      </section>}
    </div>
    {notice && <div className="br-toast" role="status"><CheckCircle2 size={16}/>{notice}</div>}
    {picker && <div className="br-overlay" onClick={() => setPicker(false)}><div ref={pickerRef} role="dialog" aria-modal="true" aria-labelledby="br-picker-title" className="br-dialog" onClick={e => e.stopPropagation()}><div className="br-dialog-title"><div><h2 id="br-picker-title">新建 Agent 标签页</h2><p>选择研究起点，在客户端标签栏打开页面供 Agent 操作。</p></div><button className="br-icon" onClick={() => setPicker(false)} aria-label="关闭网页选择"><X size={18}/></button></div><div className="br-picker-search"><Search size={16}/><input aria-label="搜索研究页面" placeholder="搜索标题或网站" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}/></div><p className="br-eyebrow">可打开的研究页面 · 演示</p>{pages.filter(p => `${p.title} ${p.domain}`.toLowerCase().includes(pickerSearch.toLowerCase())).map(p => <label className="br-picker-item" key={p.id}><input type="checkbox" disabled={p.id === "paper"} checked={draftSelected.includes(p.id)} onChange={() => setDraftSelected(ids => ids.includes(p.id) ? ids.filter(id => id !== p.id) : [...ids, p.id])}/><span className={`br-favicon ${p.id}`}>{p.id === "paper" ? "a" : p.id === "code" ? "⌘" : "W"}</span><span><strong>{p.title}</strong><small>{p.domain}</small></span><em>{p.id === "paper" ? "研究起点" : p.tag}</em></label>)}{!pages.some(p => `${p.title} ${p.domain}`.toLowerCase().includes(pickerSearch.toLowerCase())) && <p className="br-muted">没有匹配的网页，请换个关键词。</p>}<div className="br-picker-foot"><span>{draftSelected.length ? `已选择 ${draftSelected.length} 个网页` : "至少选择一个网页"}</span><button className="br-primary" disabled={!draftSelected.length} onClick={confirmPages}>创建标签页并加入任务</button></div></div></div>}
    {saveDialog && <div className="br-overlay" onClick={() => setSaveDialog(false)}><div ref={saveRef} className="br-dialog" role="dialog" aria-modal="true" aria-labelledby="br-save-title" onClick={e => e.stopPropagation()}><div className="br-dialog-title"><div><h2 id="br-save-title">确认保存研究材料</h2><p>检查内容与目标项目，再完成保存。</p></div><button className="br-icon" aria-label="关闭保存确认" onClick={() => setSaveDialog(false)}><X size={18}/></button></div><div className="br-save-preview"><FileText size={20}/><div><strong>Attention Is All You Need</strong><p>论文元数据、PDF 链接{selected.includes("code") ? "、代码链接" : ""}</p><small>保留来源 URL 与论文版本</small></div></div><label className="br-project-label">保存到项目<select value={project} onChange={e => setProject(e.target.value)}>{projectContext && <option>{projectContext.title}</option>}<option>Transformer 文献调研</option><option>Default Project</option></select></label><p className="br-local-note">这是原型本地记录，不会写入真实 Wispaper 项目。</p><div className="br-picker-foot"><button onClick={() => setSaveDialog(false)}>取消</button><button className="br-primary" onClick={save}><FolderOpen size={15}/>确认保存</button></div></div></div>}
  </div></div>;
}
function Sparkle() { return <Plus size={12}/>; }
