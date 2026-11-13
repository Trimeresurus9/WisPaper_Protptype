import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Bookmark, Check, CheckCircle2, ChevronDown, FileText, Lightbulb, LockKeyhole, Pencil, Presentation, RotateCcw, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import type { Paper } from '../types';
import logo from './onboarding/logo.svg';
import { buildHomeAgentPrompt, disciplineQuestion, emptyHomeSession, HOME_SESSION_KEY, homeTaskConfigs, readHomeSession, resolveHomeTask, type HomeSession, type HomeStage } from './home-task-config';
import { BrowserResearch } from './browser-use/BrowserResearch';
import { getAgentCase, getAgentCasesForTask, type AgentCase } from './home-agent-cases';
import { AgentCaseCard, ownCaseTaskCopy } from './AgentCasePreview';
import { SearchCasePreview, SearchExampleCard } from './SearchCasePreview';
import { homeSearchCases, type HomeSearchCase } from './home-search-cases';
import './workspace-home.css';

const taskIcons = { search: Search, ideas: Lightbulb, review: FileText, 'peer-review': ShieldCheck, slides: Presentation };
interface WorkspaceHomeProps {
  papers: Paper[];
  onSearch: (query: string) => void;
  onSearchExample: (item: HomeSearchCase) => void;
  onAgent: (query: string, skill: string, requiresLogin?: boolean) => void;
  onNavigate: (view: string) => void;
  stage: HomeStage;
  loginRequest: number;
  onAccountChange: (signedIn: boolean) => void;
}

export function WorkspaceHome({ papers, onSearch, onSearchExample, onAgent, onNavigate, stage, loginRequest, onAccountChange }: WorkspaceHomeProps) {
  const [session, setSession] = useState(readHomeSession);
  const [searchExample, setSearchExample] = useState<HomeSearchCase | null>(null);
  const [searchPromptReady, setSearchPromptReady] = useState(false);
  const searchExampleTrigger = useRef<HTMLElement | null>(null);
  const returnToSearchInput = useRef(false);
  const [ownTaskOpen, setOwnTaskOpen] = useState(false);
  const [ownTaskError, setOwnTaskError] = useState('');
  const ownTaskTrigger = useRef<HTMLElement | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<'continue' | 'own-agent'>('continue');
  const [email, setEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [pendingSave, setPendingSave] = useState<string | null>(null);
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const answerInput = useRef<HTMLTextAreaElement>(null);
  const currentQuestion = useRef<HTMLDivElement>(null);
  const loginTrigger = useRef<HTMLElement | null>(null);
  const loginTimer = useRef<ReturnType<typeof setTimeout>>();
  const seenLoginRequest = useRef(loginRequest);
  const config = homeTaskConfigs.find(task => task.id === session.task)!;
  const selectedConfig = homeTaskConfigs.find(task => task.id === session.selected);
  const questions = [disciplineQuestion, config.question];
  const ready = session.answers.length === questions.length;
  const activeCase = getAgentCase(session.caseId);
  const selectedCases = getAgentCasesForTask(session.selected);
  const showSearchExamples = session.selected === 'search';
  const ownTask = activeCase?.task ?? 'ideas';
  const ownCopy = ownCaseTaskCopy[ownTask];
  const ownConfig = homeTaskConfigs.find(task => task.id === ownTask)!;
  const ownDraft = session.ownDrafts[ownTask] ?? { query: session.draft, detail: '' };
  const showCase = stage === 'case' && !!activeCase;
  const showHome = stage === 'home' || (stage === 'case' ? !activeCase : !session.query);
  const Icon = taskIcons[session.task];
  const previewPapers = papers.filter(paper => paper.type === 'paper' && /Attention Is All You Need|Retrieval-Augmented Generation|Language Models are Few-Shot/i.test(paper.title)).slice(0, 3);

  useEffect(() => { try { sessionStorage.setItem(HOME_SESSION_KEY, JSON.stringify(session)); } catch { /* The in-memory flow remains available. */ } }, [session]);
  useEffect(() => { onAccountChange(session.signedIn); }, [session.signedIn, onAccountChange]);
  useEffect(() => () => clearTimeout(loginTimer.current), []);
  useEffect(() => {
    if (loginRequest === seenLoginRequest.current) return;
    seenLoginRequest.current = loginRequest;
    loginTrigger.current = document.activeElement as HTMLElement;
    setLoginIntent('continue');
    setLoginError('');
    setLoginOpen(true);
  }, [loginRequest]);
  useEffect(() => {
    if (stage === 'agent' && session.query) {
      currentQuestion.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      currentQuestion.current?.focus({ preventScroll: true });
    }
  }, [stage, session.query, session.answers.length, session.signedIn]);

  const patch = (next: Partial<HomeSession>) => setSession(current => ({ ...current, ...next }));
  const openLogin = (intent: 'continue' | 'own-agent' = 'continue') => { loginTrigger.current = document.activeElement as HTMLElement; setLoginIntent(intent); setLoginError(''); setLoginOpen(true); };
  const updateOwnDraft = (next: Partial<typeof ownDraft>) => {
    setOwnTaskError('');
    setSession(current => ({ ...current, ownDrafts: { ...current.ownDrafts, [ownTask]: { ...(current.ownDrafts[ownTask] ?? { query: current.draft, detail: '' }), ...next } } }));
  };
  const startOwnAgent = () => {
    const prompt = [`任务类型：${ownConfig.label}`, `原始需求：${ownDraft.query.trim()}`, ownDraft.detail ? `${ownConfig.question.label}：${ownDraft.detail}` : ''].filter(Boolean).join('\n\n');
    onAgent(prompt, ownTask === 'slides' ? 'PPT 创作' : ownConfig.label);
  };
  const openOwnTask = () => {
    ownTaskTrigger.current = document.activeElement as HTMLElement;
    setOwnTaskError('');
    setOwnTaskOpen(true);
  };
  const submitOwnTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ownDraft.query.trim()) { setOwnTaskError(`请先填写${ownCopy.label}。`); return; }
    updateOwnDraft({ query: ownDraft.query.trim() });
    setOwnTaskOpen(false);
    if (session.signedIn) startOwnAgent();
    else openLogin('own-agent');
  };
  const launchCase = (item: AgentCase) => {
    patch({ caseId: item.id, caseStep: 0, caseView: 'result' });
    onNavigate('home-agent-case');
  };
  const openSearchExample = (item: HomeSearchCase) => {
    searchExampleTrigger.current = document.activeElement as HTMLElement;
    returnToSearchInput.current = false;
    setSearchExample(item);
  };
  const useSearchExample = (item: HomeSearchCase) => {
    returnToSearchInput.current = true;
    patch({ draft: item.prompt, selected: 'search' });
    setSearchPromptReady(true);
    setSearchExample(null);
  };
  const launch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = session.draft.trim();
    if (!query) return;
    const task = resolveHomeTask(query, session.selected);
    const nextSession = { ...session, task, query, answers: [], answerDraft: '' };
    setSession(nextSession);
    // Persist before navigation unmounts this page; the next effect would be skipped.
    try { sessionStorage.setItem(HOME_SESSION_KEY, JSON.stringify(nextSession)); } catch {}
    const skill = task === 'slides' ? 'PPT 创作' : homeTaskConfigs.find(item => item.id === task)!.label;
    if (!session.signedIn) { onAgent(query, skill, true); return; }
    if (task === 'search') onSearch(query);
    else onAgent(query, skill);
  };
  const answer = (value: string) => {
    if (!value.trim() || ready) return;
    patch({ answers: [...session.answers, value.trim()], answerDraft: '' });
  };
  const editAnswer = (index: number) => {
    patch({ answers: session.answers.slice(0, index), answerDraft: session.answers[index] === '暂时跳过' ? '' : session.answers[index] });
    requestAnimationFrame(() => answerInput.current?.focus());
  };
  const finishLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setLoginError('请输入有效的邮箱地址，也可以使用 researcher@example.com 体验。'); return; }
    setLoginBusy(true);
    loginTimer.current = setTimeout(() => {
      const next = { ...session, signedIn: true, savedPapers: pendingSave ? [...new Set([...session.savedPapers, pendingSave])] : session.savedPapers };
      try { sessionStorage.setItem(HOME_SESSION_KEY, JSON.stringify(next)); } catch {}
      setSession(next); onAccountChange(true);
      setPendingSave(null); setLoginBusy(false); setLoginOpen(false);
      if (loginIntent === 'own-agent') startOwnAgent();
    }, 450);
  };
  const savePaper = (paper: Paper) => {
    if (!session.signedIn) { setPendingSave(paper.id); openLogin(); return; }
    patch({ savedPapers: session.savedPapers.includes(paper.id) ? session.savedPapers.filter(id => id !== paper.id) : [...session.savedPapers, paper.id] });
  };
  const reset = () => { setSession(emptyHomeSession()); setEmail(''); setPendingSave(null); onNavigate('workspace-home'); };
  const continueTask = () => session.task === 'search' ? onSearch(session.query) : onAgent(buildHomeAgentPrompt(session), session.task === 'slides' ? 'PPT 创作' : config.label);
  const enterToSubmit = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
  };

  const loginCard = <section className={`wh-login-card ${session.signedIn ? 'is-signed-in' : ''}`} aria-label={session.signedIn ? '已保留任务上下文' : '登录后继续'}>
    <span className="wh-login-symbol">{session.signedIn ? <CheckCircle2 size={21} /> : <LockKeyhole size={20} />}</span>
    <h3>{session.signedIn ? '已登录，接着刚才的研究继续' : stage === 'search' ? '让这次搜索成为研究的起点' : '准备好了，登录后开始这项任务'}</h3>
    <p>{session.signedIn ? '你的原始需求和补充信息都已保留，无需重新输入。' : stage === 'search' ? '登录后继续检索、收藏文献，把研究线索留在知识库。' : '保存这段对话，让 WisPaper 带着你的研究背景继续。'}</p>
    <button className="wh-primary" onClick={session.signedIn ? continueTask : () => openLogin()}>{session.signedIn ? stage === 'search' ? '继续搜索' : '进入工作台' : '登录并继续'}<ArrowRight size={16} /></button>
    {!session.signedIn && <span className="wh-card-footnote">当前输入会为你保留</span>}
  </section>;

  return <>{showCase && activeCase ? <BrowserResearch key={activeCase.id} initialTask={activeCase.prompt} initialSkill={activeCase.task === 'slides' ? 'PPT 创作' : homeTaskConfigs.find(task => task.id === activeCase.task)!.label} onBack={() => onNavigate('workspace-home')} onNavigate={onNavigate} caseExperience={{ item: activeCase, step: session.caseStep, view: session.caseView, onStep: step => patch(step === 3 ? { caseView: 'result' } : { caseStep: step }), onView: view => patch({ caseView: view }), onStartOwn: openOwnTask }} /> : <div className={`wh-root ${showHome ? 'is-home' : 'is-workspace'}`}>
    <header className="wh-topbar">
      {showHome ? <span className="wh-top-label">你的 AI 科研伙伴</span> : <button className="wh-back" onClick={() => onNavigate('workspace-home')}><ArrowLeft size={16} />返回首页</button>}
      <div className="wh-top-actions"><span className="wh-mode-label"><span />{session.signedIn ? '已登录 · 演示账号' : '游客体验'}</span>{session.signedIn ? <button className="wh-text-button" onClick={reset} title="清除本次演示状态"><RotateCcw size={14} />重置体验</button> : <button className="wh-login-link" onClick={() => openLogin()}>登录 / 注册<ArrowUp size={14} /></button>}</div>
    </header>

    {showHome ? <main className="wh-home-main" aria-label="科研首页">
      <section className={`wh-hero ${selectedCases.length || showSearchExamples ? 'has-cases' : ''}`}>
        <div className="wh-brand-mark"><img src={logo} alt="" /></div>
        <h1>从一个问题，<span>开始你的研究</span></h1>
        <p className="wh-subtitle">找论文、理思路、做研究，都从这里开始。</p>
        <form className="wh-composer" onSubmit={launch}>
          <textarea ref={input} value={session.draft} onChange={event => { patch({ draft: event.target.value }); setSearchPromptReady(false); }} onKeyDown={enterToSubmit} maxLength={6000} aria-label="描述你的研究需求" placeholder={selectedConfig?.placeholder ?? '想研究什么？输入一个问题，或选择下方任务开始…'} />
          <div className="wh-composer-bottom"><span>{selectedConfig ? selectedConfig.label : '告诉我你想完成什么'}</span><button type="submit" className="wh-send" disabled={!session.draft.trim()} aria-label="开始研究"><ArrowUp size={20} /></button></div>
        </form>
        <div className="wh-task-tags" role="group" aria-label="选择研究任务">
          {homeTaskConfigs.map(task => { const TagIcon = taskIcons[task.id]; return <button key={task.id} aria-pressed={session.selected === task.id} onClick={() => { patch({ selected: session.selected === task.id ? null : task.id }); setSearchPromptReady(false); input.current?.focus(); }}><TagIcon size={16} />{task.label}</button>; })}
        </div>
        {showSearchExamples ? <section className="wh-case-examples" aria-label="论文搜索提示词案例"><div className="wh-cases-heading"><span>从一个好问题，找到相关论文</span><span><CheckCircle2 size={12}/>免费查看 · 无需登录</span></div><div className="wh-case-grid">{homeSearchCases.map((item,index)=><SearchExampleCard key={item.id} item={item} index={index} onOpen={()=>openSearchExample(item)}/>)}</div></section> : selectedCases.length ? <section className="wh-case-examples" aria-label={`${selectedConfig?.label}案例示例`}><div className="wh-cases-heading"><span>先看看，你能做出什么</span><span><CheckCircle2 size={12} />免费查看 · 无需登录</span></div><div className="wh-case-grid">{selectedCases.map((item, index) => <AgentCaseCard key={item.id} item={item} index={index} onOpen={() => launchCase(item)} />)}</div></section> : <div className="wh-example">{selectedConfig ? <><span>试着问</span><button onClick={() => { patch({ draft: selectedConfig.example }); input.current?.focus(); }}>{selectedConfig.example}<ArrowUp size={13} /></button></> : <span>直接描述需求，或选择一个任务，让我们更了解你的目标。</span>}</div>}
        <p className="wh-start-note" role="status"><ShieldCheck size={14} />{searchPromptReady ? '已填入示例，改成你的研究问题后发送。' : '先体验，再登录。接着刚才的问题继续。'}</p>
      </section>
      <footer className="wh-home-footer">陪伴每一次好奇，推进每一步研究。</footer>
    </main> : <>
      <div className="wh-workspace-title"><span className="wh-task-icon"><Icon size={20} /></span><div><h1>{config.label}</h1><p>{stage === 'search' ? '从相关文献开始，找到下一条研究线索' : '先了解你的目标，再一起推进研究'}</p></div><span className="wh-preview-label">{stage === 'search' ? '结果示例' : '任务准备'}</span></div>
      {stage === 'search' ? <main className="wh-search-layout">
        <div className="wh-search-main">
          <form className="wh-search-query" onSubmit={launch}><Search size={18} /><input aria-label="修改搜索问题" value={session.draft} onChange={event => patch({ draft: event.target.value, selected: 'search' })} /><button className="wh-send" aria-label="重新搜索" disabled={!session.draft.trim()}><ArrowRight size={17} /></button></form>
          <div className="wh-search-heading"><h2>论文</h2><span>{session.signedIn ? '以下为文献展示示例，可继续进入完整检索' : '以下为文献展示示例，登录后继续检索'}</span></div>
          <p className="wh-search-topic">你的问题：{session.query}</p>
          <div className="wh-paper-list">{previewPapers.map(paper => <article className="wh-paper" key={paper.id}>
            <div className="wh-paper-meta"><span>{paper.year}</span><span>{paper.venue}</span><span>论文示例</span></div>
            <h3><button onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)} aria-expanded={expandedPaper === paper.id}>{paper.title}</button></h3>
            <p className="wh-paper-authors">{paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</p>
            <p className={`wh-paper-abstract ${expandedPaper === paper.id ? 'is-expanded' : ''}`}>{paper.abstract}</p>
            <div className="wh-paper-actions"><button onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)} aria-expanded={expandedPaper === paper.id}><ChevronDown size={14} />{expandedPaper === paper.id ? '收起摘要' : '展开摘要'}</button><button onClick={() => savePaper(paper)} aria-pressed={session.savedPapers.includes(paper.id)}>{session.savedPapers.includes(paper.id) ? <Check size={14} /> : <Bookmark size={14} />}{session.savedPapers.includes(paper.id) ? '已收藏' : '收藏'}</button></div>
          </article>)}</div>
        </div>
        <aside className="wh-search-aside">{loginCard}<div className="wh-side-note"><Bookmark size={16} /><p>先浏览示例，了解论文摘要与文献信息的呈现方式。</p></div></aside>
      </main> : <main className="wh-agent-layout">
        <section className="wh-conversation" aria-label="任务准备对话">
          <div className="wh-messages">
            <div className="wh-user-message"><p>{session.query}</p><span>你的研究需求</span></div>
            <div className="wh-assistant-message"><span className="wh-assistant-byline"><img src={logo} alt="" />WisPaper</span><p>{config.introduction}</p><p className="wh-muted">开始前，想先了解两点。你也可以跳过，稍后补充。</p></div>
            {session.answers.map((value, index) => <React.Fragment key={index}><div className="wh-past-question">{questions[index].prompt}</div><div className="wh-user-answer"><span>{value}</span><button aria-label={`修改${questions[index].label}`} onClick={() => editAnswer(index)}><Pencil size={13} /></button></div></React.Fragment>)}
            <div ref={currentQuestion} tabIndex={-1} className="wh-current-question" aria-live="polite">
              {!ready ? <><div className="wh-question-step"><span>{String(session.answers.length + 1).padStart(2, '0')}</span> / 02 · {questions[session.answers.length].label}</div><h2>{questions[session.answers.length].prompt}</h2><div className="wh-answer-options">{questions[session.answers.length].options.map(option => <button key={option} onClick={() => answer(option)}>{option}<ArrowUp size={13} /></button>)}</div><button className="wh-skip" onClick={() => answer('暂时跳过')}>暂时跳过<ArrowRight size={13} /></button></> : <><div className="wh-ready-note"><CheckCircle2 size={18} /><span>研究需求已整理好</span></div><p className="wh-ready-description">{session.task === 'peer-review' ? '评审开始后，可以继续补充论文全文或摘要。' : session.task === 'slides' ? '进入工作台后，可以继续添加论文与汇报材料。' : '我会结合你的研究背景，按照右侧的步骤推进。'}</p>{loginCard}</>}
            </div>
          </div>
          {!ready && <form className="wh-reply-composer" onSubmit={event => { event.preventDefault(); answer(session.answerDraft); }}><textarea ref={answerInput} aria-label="补充研究信息" placeholder={questions[session.answers.length].placeholder} maxLength={2000} value={session.answerDraft} onChange={event => patch({ answerDraft: event.target.value })} onKeyDown={enterToSubmit} /><div><span>Enter 发送 · Shift + Enter 换行</span><button className="wh-send" type="submit" disabled={!session.answerDraft.trim()} aria-label="发送补充信息"><ArrowUp size={18} /></button></div></form>}
        </section>
        <aside className="wh-brief" aria-label="研究任务摘要"><div className="wh-brief-heading"><FileText size={17} /><h2>这次研究</h2><span>自动保留</span></div><h3>{config.label}</h3><p className="wh-brief-query">{session.query}</p><dl>{questions.map((question, index) => <div key={question.label}><dt>{question.label}</dt><dd className={!session.answers[index] || session.answers[index] === '暂时跳过' ? 'is-pending' : ''}>{session.answers[index] === '暂时跳过' ? '稍后补充' : session.answers[index] || '待补充'}</dd></div>)}</dl><div className="wh-plan"><h3>接下来，我们会</h3><ol>{config.steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol></div><div className="wh-output"><Sparkles size={16} /><div><span>你将获得</span><p>{config.output}</p></div></div><div className="wh-preserved"><Check size={13} />{session.signedIn ? '已保留至本次演示会话' : '登录后接续，无需重新描述'}</div></aside>
      </main>}
    </>}

  </div>}
    <SearchCasePreview item={searchExample} onClose={()=>setSearchExample(null)} onChangeCase={setSearchExample} onViewResults={item=>{setSearchExample(null);onSearchExample(item);}} onUsePrompt={useSearchExample} onReturnFocus={()=>{
      if (returnToSearchInput.current) { input.current?.focus(); input.current?.select(); returnToSearchInput.current=false; }
      else if (searchExampleTrigger.current?.isConnected) searchExampleTrigger.current.focus();
    }}/>
    <Dialog open={ownTaskOpen} onOpenChange={setOwnTaskOpen}>
      <DialogContent className="wh-login-dialog wh-own-task-dialog" onCloseAutoFocus={event => { event.preventDefault(); if (ownTaskTrigger.current?.isConnected) ownTaskTrigger.current.focus(); }}>
        <span className="wh-own-eyebrow">从案例，到你的研究</span>
        <DialogHeader><DialogTitle>{ownCopy.title}</DialogTitle><DialogDescription>沿用这份案例的思路，换成你关心的问题。</DialogDescription></DialogHeader>
        <form className="wh-own-form" onSubmit={submitOwnTask} noValidate>
          <label htmlFor="wh-own-query">{ownCopy.label}</label>
          <textarea id="wh-own-query" value={ownDraft.query} onChange={event => updateOwnDraft({ query: event.target.value })} maxLength={6000} placeholder={ownCopy.placeholder} aria-invalid={!!ownTaskError} aria-describedby={ownTaskError ? 'wh-own-error' : undefined}/>
          {ownTaskError && <p id="wh-own-error" className="wh-form-error" role="alert">{ownTaskError}</p>}
          <fieldset><legend>{ownConfig.question.label}<span>可选</span></legend><div className="wh-own-options">{ownConfig.question.options.map(option => <button key={option} type="button" aria-pressed={ownDraft.detail === option} onClick={() => updateOwnDraft({ detail: ownDraft.detail === option ? '' : option })}>{option}</button>)}</div></fieldset>
          <button type="submit" className="wh-primary">{ownCopy.action}<ArrowRight size={16}/></button>
          <p className="wh-own-preserved"><Check size={12}/>{session.signedIn ? '带着这些信息，直接进入任务' : '下一步登录，当前输入会完整保留'}</p>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={loginOpen} onOpenChange={open => { if (!loginBusy) { setLoginOpen(open); if (!open) setPendingSave(null); } }}>
      <DialogContent className="wh-login-dialog" onCloseAutoFocus={event => { event.preventDefault(); if (loginTrigger.current?.isConnected) loginTrigger.current.focus(); else if (ownTaskTrigger.current?.isConnected) ownTaskTrigger.current.focus(); }}>
        <div className="wh-dialog-logo"><img src={logo} alt="WisPaper" /></div>
        <DialogHeader><DialogTitle>{loginIntent === 'own-agent' ? `登录，${ownCopy.action}` : '登录，继续你的研究'}</DialogTitle><DialogDescription>{loginIntent === 'own-agent' ? '任务已准备好，登录后直接开始，无需重新填写。' : showHome ? "登录后，继续推进你的研究。" : "刚才的问题与补充信息已为你保留。"}</DialogDescription></DialogHeader>
        {!showHome && !showCase && session.query && <div className="wh-login-context"><Icon size={16} /><div><strong>{config.label}</strong><p>{session.query}</p>{session.answers.some(value => value !== '暂时跳过') && <span>{session.answers.filter(value => value !== '暂时跳过').join(' · ')}</span>}</div><CheckCircle2 size={16} /></div>}
        {showCase && loginIntent === 'own-agent' && <div className="wh-login-context"><FileText size={17} /><div><strong>{ownConfig.label} · 我的任务</strong><p>{ownDraft.query}</p>{ownDraft.detail && <span>{ownConfig.question.label}：{ownDraft.detail}</span>}<button type="button" className="wh-edit-task" onClick={() => { setLoginOpen(false); setOwnTaskOpen(true); }}><Pencil size={12}/>修改任务</button></div><CheckCircle2 size={16}/></div>}
        <form className="wh-login-form" onSubmit={finishLogin} noValidate><label htmlFor="wh-login-email">邮箱</label><input id="wh-login-email" type="email" autoComplete="off" placeholder="researcher@example.com" value={email} onChange={event => { setEmail(event.target.value); setLoginError(''); }} aria-invalid={!!loginError} aria-describedby={loginError ? 'wh-email-error' : 'wh-login-demo-note'} />{loginError && <p id="wh-email-error" className="wh-form-error" role="alert">{loginError}</p>}<button type="submit" className="wh-primary" disabled={loginBusy}>{loginBusy ? '正在登录…' : loginIntent === 'own-agent' ? '登录并开始任务（演示）' : '登录并继续（演示）'}{!loginBusy && <ArrowRight size={16} />}</button></form>
        <button className="wh-later" disabled={loginBusy} onClick={() => { setLoginOpen(false); setPendingSave(null); }}>{showCase ? '继续查看案例' : '稍后登录，继续体验'}</button><p id="wh-login-demo-note" className="wh-demo-note">原型演示，无需真实账号，不发送验证码。</p>
      </DialogContent>
    </Dialog>
  </>;
}
