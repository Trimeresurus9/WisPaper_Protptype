import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, LoaderCircle, LockKeyhole, Mail, School, Search } from 'lucide-react';
import logo from './onboarding/logo.svg';
import './agent-login-card.css';

type Provider = 'google' | 'apple' | 'institution' | 'wechat';
const providerNames: Record<Provider, string> = { google: 'Google', apple: 'Apple', institution: '机构账号', wechat: '微信' };
const institutions = ['复旦大学', '北京大学', '清华大学', '上海交通大学', '浙江大学', '中国科学院'];

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'institution') return <School size={20} strokeWidth={1.8}/>;
  if (provider === 'google') return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.8-2.5l-3.3-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.8v2.7A10.2 10.2 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.6a6.1 6.1 0 0 1 0-3.2V7.7H2.8a10 10 0 0 0 0 8.6l3.4-2.7Z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10.2 10.2 0 0 0-9.2 5.7l3.4 2.7C7 7.9 9.3 6.1 12 6.1Z"/></svg>;
  if (provider === 'apple') return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.1 12.7c0-2 1.6-3 1.7-3.1-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.7.8-3.4 2-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2 2.6 2 1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 1.9-1 2.5-1.9c.8-1.1 1.1-2.2 1.2-2.3-.1 0-2.4-.9-2.4-3.5ZM15 6.7c.5-.7 1-1.6.9-2.6-.8 0-1.9.6-2.5 1.3-.6.6-1 1.6-.9 2.5.9.1 1.9-.5 2.5-1.2Z"/></svg>;
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="#16B332" d="M9.1 3C4.6 3 1 5.9 1 9.5c0 2 1.1 3.8 3 5l-.8 2.6 2.9-1.4c.9.3 1.9.5 3 .5h.5a6.8 6.8 0 0 1-.3-1.9c0-3.6 3.3-6.5 7.4-6.5h.4C16.1 5 12.9 3 9.1 3Z"/><path fill="#16B332" d="M23 14.4c0-3-2.9-5.4-6.4-5.4s-6.4 2.4-6.4 5.4 2.9 5.4 6.4 5.4c.9 0 1.7-.2 2.4-.4l2.3 1.2-.6-2.2c1.4-1 2.3-2.4 2.3-4Z"/><g fill="white"><circle cx="6.4" cy="8" r="1"/><circle cx="11.7" cy="8" r="1"/><circle cx="14.4" cy="13.3" r=".8"/><circle cx="18.8" cy="13.3" r=".8"/></g></svg>;
}

export function AgentLoginCard({ onComplete, onEdit }: { onComplete: () => void; onEdit: () => void }) {
  const id = useId();
  const [step, setStep] = useState<'options' | 'email' | Provider>('options');
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [legal, setLegal] = useState<string | null>(null);
  const [institution, setInstitution] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [busy, setBusy] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const consentInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const changeStep = (next: typeof step) => { setError(''); setLegal(null); setStep(next); };
  const requireConsent = () => {
    if (agreed) return true;
    setError('请先阅读并勾选同意服务条款和隐私政策。');
    consentInput.current?.focus();
    return false;
  };
  const chooseProvider = (provider: Provider) => { if (requireConsent()) changeStep(provider); };
  const emailContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('请输入有效的邮箱地址。'); emailInput.current?.focus(); return; }
    if (requireConsent()) changeStep('email');
  };
  const complete = () => {
    if (busy) return;
    setBusy(true); setError('');
    timer.current = setTimeout(onComplete, 600);
  };
  const confirmEmail = (event: React.FormEvent) => {
    event.preventDefault();
    if (code !== '123456') { setError('原型演示验证码为 123456，请重新输入。'); return; }
    complete();
  };
  const visibleInstitutions = institutions.filter(name => name.includes(institution.trim()));
  const providerStep = step !== 'options' && step !== 'email' ? step : null;
  const title = step === 'options' ? signup ? '创建账户，开始研究' : '登录，继续你的研究' : step === 'email' ? '使用邮箱登录' : step === 'institution' ? '使用机构账号登录' : `使用 ${providerNames[step]} 登录`;
  return <section className="agl-card" aria-labelledby={`${id}-title`} aria-busy={busy}>
    <div className="agl-brand"><img src={logo} alt="WisPaper"/><span>WisPaper</span><span className="agl-saved"><Check size={12}/>问题已保留</span></div>
    {step !== 'options' && <button type="button" className="agl-back" onClick={() => changeStep('options')} disabled={busy}><ArrowLeft size={13}/>其他登录方式</button>}
    <h2 ref={heading} tabIndex={-1} id={`${id}-title`}>{title}</h2>
    <p className="agl-description">{step === 'options' ? '登录后，Agent 会接着你的问题开始工作。' : step === 'email' ? email.trim() : '完成登录后会回到当前任务，无需重新输入。'}</p>
    {step === 'options' ? <>
      <form onSubmit={emailContinue} noValidate className="agl-email-form">
        <label className="agl-label" htmlFor={`${id}-email`}>邮箱</label>
        <div className="agl-input"><Mail size={16}/><input ref={emailInput} id={`${id}-email`} type="email" autoComplete="email" placeholder="you@university.edu" value={email} onChange={event => { setEmail(event.target.value); setError(''); }} aria-describedby={error ? `${id}-error` : undefined}/></div>
        <div className="agl-consent"><input ref={consentInput} id={`${id}-consent`} type="checkbox" checked={agreed} onChange={event => { setAgreed(event.target.checked); setError(''); }}/><div><label htmlFor={`${id}-consent`}>我已阅读并同意</label>{' '}<button type="button" onClick={() => setLegal(legal === '服务条款' ? null : '服务条款')}>服务条款</button><span>和</span><button type="button" onClick={() => setLegal(legal === '隐私政策' ? null : '隐私政策')}>隐私政策</button></div></div>
        {legal && <div className="agl-legal" role="note"><strong>{legal}</strong><p>此处为原型入口，正式条款页面尚未接入。演示不会创建真实账号，也不会发送或验证你的登录凭据。</p><button type="button" onClick={() => setLegal(null)}>收起</button></div>}
        <button className="agl-primary" type="submit">{signup ? '创建账户' : '继续'}<ArrowRight size={15}/></button>
      </form>
      <p className="agl-signup">{signup ? '已有账户？' : '还没有账户？'}<button type="button" onClick={() => { setSignup(!signup); setError(''); }}>{signup ? '登录' : '创建账户'}</button></p>
      <div className="agl-divider"><span>或使用以下方式</span></div>
      <div className="agl-providers">{(['google', 'apple', 'institution', 'wechat'] as const).map(provider => <button className="agl-provider" key={provider} onClick={() => chooseProvider(provider)}><ProviderIcon provider={provider}/><span>{provider === 'institution' ? '机构登录' : `通过 ${providerNames[provider]} 继续`}</span><ChevronRight size={14}/></button>)}</div>
    </> : step === 'email' ? <form className="agl-verification" onSubmit={confirmEmail}>
      <label className="agl-label" htmlFor={`${id}-code`}>邮箱验证码</label><input id={`${id}-code`} aria-describedby={`${id}-demo-code`} className="agl-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 位验证码" value={code} disabled={busy} onChange={event => { setCode(event.target.value.replace(/\D/g, '')); setError(''); }}/>
      <p id={`${id}-demo-code`} className="agl-help">输入 123456 体验此流程，不会发送邮件。</p><button className="agl-primary" disabled={busy} type="submit">{busy ? <><LoaderCircle size={15} className="agl-spin"/>正在继续任务</> : <>登录并继续<ArrowRight size={15}/></>}</button>
    </form> : <div className="agl-provider-step">
      {step === 'institution' ? <>
        <label className="agl-label" htmlFor={`${id}-institution`}>选择你的机构</label><div className="agl-input"><Search size={16}/><input id={`${id}-institution`} value={institution} disabled={busy} placeholder="搜索机构名称" onChange={event => { setInstitution(event.target.value); setSelectedInstitution(''); }}/></div>
        <div className="agl-institutions" role="group" aria-label="可用机构">{visibleInstitutions.map(name => <button type="button" disabled={busy} aria-pressed={selectedInstitution === name} key={name} onClick={() => setSelectedInstitution(name)}><School size={16}/><span>{name}</span>{selectedInstitution === name ? <Check size={15}/> : <ChevronRight size={13}/>}</button>)}{!visibleInstitutions.length && <p className="agl-help">未找到机构，可返回使用邮箱或其他方式登录。</p>}</div>
      </> : <div className="agl-provider-confirm"><span><ProviderIcon provider={providerStep!}/></span><strong>{providerNames[providerStep!]} 账号授权</strong><p>登录后保留当前问题，继续这项研究。</p></div>}
      <button type="button" className="agl-primary" disabled={busy || (step === 'institution' && !selectedInstitution)} onClick={complete}>{busy ? <><LoaderCircle size={15} className="agl-spin"/>正在继续任务</> : <>模拟授权并继续<ArrowRight size={15}/></>}</button>
    </div>}
    {error && <p id={`${id}-error`} className="agl-error" role="alert">{error}</p>}
    <div className="agl-foot"><span><LockKeyhole size={11}/>原型演示 · 不连接真实账号</span><button type="button" disabled={busy} onClick={onEdit}>修改问题</button></div>
  </section>;
}
