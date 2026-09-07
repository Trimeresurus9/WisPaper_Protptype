import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, X, Bell, CreditCard, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { domesticPlans, domesticStorageOptions, storageFee, nextMonth, PlanId, useBilling } from '../contexts/BillingContext';
import { DomesticPricingLayout } from './DomesticPricingLayout';

const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString('zh-CN') : '—';
const primary = 'rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50';

function PaymentQRCode({ amount, unlocked, agreement, onComplete }: { amount: number; unlocked: boolean; agreement?: React.ReactNode; onComplete: () => void }) {
  const [source, setSource] = useState('');
  useEffect(() => {
    let current = true;
    QRCode.toDataURL(`WISPAPER-MOCK-PAYMENT:${amount}:${Date.now()}`, { width: 320, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#050505', light: '#ffffff' } })
      .then((url) => { if (current) setSource(url); });
    return () => { current = false; };
  }, [amount]);
  return <div className="text-center">
    <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">使用支付宝扫码支付</h3>
    <div className="relative mx-auto mt-12 w-fit overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {source ? <img src={source} alt="支付宝模拟支付二维码" className={`h-64 w-64 transition duration-300 sm:h-72 sm:w-72 ${unlocked ? '' : 'select-none blur-[10px]'}`} /> : <div className="h-64 w-64 animate-pulse rounded-xl bg-slate-100 sm:h-72 sm:w-72" />}
      {!unlocked && <div className="absolute inset-3 flex items-center justify-center rounded-xl bg-white/35"><span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-lg">同意协议后显示二维码</span></div>}
    </div>
    <p className="mt-10 text-xl text-slate-500">总计：</p>
    <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">¥{amount.toFixed(2)} <span className="text-xl font-normal text-slate-500">CNY</span></p>
    <div className="mt-10 flex items-center justify-center gap-3 text-lg">
      <span className="font-medium text-slate-950">购买数量</span>
      <button type="button" aria-label="减少购买月数" disabled className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">−</button>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-900">1</span>
      <button type="button" aria-label="增加购买月数" disabled className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">+</button>
      <span className="text-slate-500">个月</span>
    </div>
    {agreement}
    <button type="button" className="mt-12 inline-flex items-center gap-2 text-lg text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35" disabled={!unlocked || !source} onClick={onComplete}>通过阿里云市场购买 <ArrowRight className="h-5 w-5" /></button>
    <p className="mt-3 text-xs text-slate-400">演示二维码，不包含真实付款链接</p>
  </div>;
}

function BillingDialog({ title, children, onClose, payment = false }: { title: string; children: React.ReactNode; onClose: () => void; payment?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
      onClick={(e) => e.stopPropagation()} onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        if (e.key !== 'Tab') return;
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]') ?? []);
        const first = items[0]; const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first?.focus(); }
      }} className={`relative max-h-[94vh] w-full overflow-y-auto rounded-[3rem] bg-white text-slate-900 shadow-2xl outline-none ${payment ? 'max-w-2xl px-6 py-16 sm:px-14 sm:py-20' : 'max-w-lg p-6 sm:p-8'}`}>
      {payment
        ? <button aria-label="关闭订阅弹窗" onClick={onClose} className="absolute right-7 top-7 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-7 w-7" /></button>
        : <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{title}</h2><button aria-label="关闭订阅弹窗" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>}
      {children}
    </div>
  </div>, document.body);
}

export function DomesticBilling({ compact = false, ordersOnly = false }: { compact?: boolean; ordersOnly?: boolean }) {
  const { revision } = useBilling();
  return <DomesticBillingContent key={revision} compact={compact} ordersOnly={ordersOnly} />;
}

function DomesticBillingContent({ compact, ordersOnly }: { compact: boolean; ordersOnly: boolean }) {
  const { subscription: sub, setSubscription, orders, addOrder, outcome } = useBilling();
  const [selected, setSelected] = useState<PlanId>('pro');
  const [storage, setStorage] = useState<Record<PlanId, number>>({ plus: 10, pro: 50, max: 100 });
  const [purchase, setPurchase] = useState<'single' | 'recurring'>('single');
  const [dialog, setDialog] = useState<'checkout' | 'cancel' | 'result' | 'agreement' | 'support' | null>(null);
  const [consent, setConsent] = useState(false);
  const [resume, setResume] = useState(false);
  const [result, setResult] = useState({ title: '', body: '', success: true });
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const plan = domesticPlans.find((p) => p.id === selected)!;
  const current = domesticPlans.find((p) => p.id === sub.plan)!;
  const active = Boolean(sub.end && new Date(sub.end).getTime() > Date.now());
  const recurring = purchase === 'recurring';
  const currentStorage = sub.storageGb ?? domesticStorageOptions[sub.plan][0];
  const selectedStorage = resume ? currentStorage : storage[selected];
  const extraStorage = storageFee(selected, selectedStorage);
  const renewalPrice = plan.recurring + extraStorage;
  const currentRenewalPrice = current.recurring + storageFee(sub.plan, currentStorage);
  const price = (recurring ? sub.firstUsed ? plan.recurring : plan.first : plan.single) + extraStorage;
  const nextDate = resume ? sub.end : nextMonth(new Date());
  const close = () => { setDialog(null); locked.current = false; };
  const openCheckout = (renewOnly = false, planId?: PlanId) => {
    setResume(renewOnly); setConsent(false); locked.current = false;
    if (planId) setSelected(planId);
    if (renewOnly) { setSelected(sub.plan); setPurchase('recurring'); }
    setDialog('checkout');
  };
  const confirmAuthorization = () => {
    if (locked.current) return;
    locked.current = true;
    if (outcome === 'payment-failed' || (resume && outcome === 'sign-failed')) {
      setResult({ title: resume ? '授权未完成' : '支付未完成', body: '本次模拟未扣款，也未新增扣款授权。你可以关闭后重试，或在 Mock 中切换为成功场景。', success: false });
    } else if (resume) {
      setSubscription((s) => ({ ...s, renewal: true, failure: false }));
      setResult({ title: '自动续费已重新开启', body: `本次未扣款。本期权益期限不变，将于 ${dateLabel(sub.end)} 通过支付宝续费 ¥${currentRenewalPrice}。`, success: true });
    } else {
      const signed = recurring && outcome !== 'sign-failed';
      setSubscription({ plan: selected, storageGb: selectedStorage, end: nextDate, renewal: signed, failure: false, firstUsed: true });
      addOrder({ id: `MOCK-${Date.now()}`, plan: `${plan.name} · ${selectedStorage} GB`, amount: price, date: new Date().toISOString(), kind: signed ? '连续包月首期' : '单期会员' });
      setResult({ title: signed ? '会员已开通，自动续费已开启' : recurring ? '会员已开通，自动续费未开启' : '单月会员已开通',
        body: `模拟支付 ¥${price}，权益有效至 ${dateLabel(nextDate)}。${signed ? `下次将扣费 ¥${renewalPrice}，可随时在会员与订阅中关闭。` : '本期权益正常生效，到期不会自动扣款。'}${recurring && !signed ? '签约未完成，可在会员管理中重新授权，无需重复购买本期会员。' : ''}`, success: true });
    }
    setDialog('result');
  };
  const cancel = () => {
    setSubscription((s) => ({ ...s, renewal: false, failure: false }));
    setDialog(null);
    setNotice(`自动续费已关闭（模拟）。权益保留至 ${dateLabel(sub.end)}，不再产生后续自动扣款。`);
  };
  const ordersBlock = <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between"><h3 className="font-semibold">订单与账单</h3><button className="text-xs text-blue-600" onClick={() => setDialog('support')}>退款与账单帮助</button></div>
    {!orders.length ? <p className="mt-4 text-sm text-slate-500">暂无本次演示订单。模拟购买成功后将在这里显示。</p> : <ul className="mt-3 divide-y divide-slate-100">{orders.map((order) => <li key={order.id} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><div><p>{order.plan} · {order.kind}</p><p className="mt-1 text-xs text-slate-500">{dateLabel(order.date)} · {order.id}</p></div><div className="text-right"><p>¥{order.amount}</p><p className="mt-1 text-xs text-emerald-600">模拟支付成功 · 支付宝</p></div></li>)}</ul>}
  </section>;

  const management = <>
    {(compact || ordersOnly) && <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">国内版 · 支付宝</span><span>交互演示 · 价格仅供演示 · 不会真实扣款</span></div>}
    {(compact || ordersOnly) && <><h1 className="text-3xl font-semibold tracking-tight">{ordersOnly ? '国内订单与账单' : '会员与订阅'}</h1><p className="mt-3 text-sm text-slate-500">购买方式由你选择，续费规则始终透明。</p></>}
    {notice && <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{notice}</div>}

    {!ordersOnly && <>
      {!compact && <section className="subscription-management" aria-label="会员信息">
        <div className="subscription-management-head"><h3>会员信息</h3><span>国内版 · 支付宝（模拟）</span></div>
        <div className="subscription-management-grid">
          <div className="subscription-management-item"><span className="subscription-label">当前会员</span><strong className="subscription-value">{active ? current.name : sub.end ? '会员已到期' : 'Free'}</strong><span className="subscription-note">{sub.end ? `权益截止 ${dateLabel(sub.end)} · ${currentStorage} GB` : '选择上方套餐开通会员'}</span></div>
          <div className="subscription-management-item"><span className="subscription-label">连续订阅</span><strong className="subscription-value">{sub.failure ? '续费失败' : active && sub.renewal ? '已开启' : '未开启'}</strong><span className="subscription-note">{active && sub.renewal ? `${dateLabel(sub.end)} · ¥${currentRenewalPrice}/月` : '无自动扣费计划'}</span></div>
          <div className="subscription-management-item"><span className="subscription-label">支付方式</span><div className="locked-payment"><span className="card-brand">支付宝</span><strong className="subscription-value">{sub.end ? '演示账户 ···· 8000' : '开通时授权'}</strong></div><span className="subscription-note">不会真实扣款或收集支付凭据</span></div>
          <div className="subscription-management-item"><span className="subscription-label">订阅管理</span>{active ? <button className="cancel-subscription-button" onClick={() => sub.renewal ? setDialog('cancel') : openCheckout(true)}>{sub.renewal ? '关闭自动续费' : '开通自动续费'}</button> : <strong className="subscription-value">暂无有效订阅</strong>}<span className="subscription-note">关闭后本期权益保留至到期</span></div>
        </div>
        {sub.failure && <p role="alert" className="border-t border-slate-200 bg-amber-50 p-4 text-xs text-amber-800">本次续费失败，未延长权益；请检查支付宝付款设置。此原型不会自动重试扣款。</p>}
        {active && sub.renewal && <p className="border-t border-slate-200 p-4 text-xs text-slate-500">续费前 5 日提醒预览：你的 {current.name} 将于 {dateLabel(sub.end)} 通过支付宝扣费 ¥{currentRenewalPrice}。可在此关闭续费。此演示不实际发送通知。</p>}
      </section>}
      {compact && sub.end && <section className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-slate-500">当前会员</p><h2 className="mt-2 text-xl font-semibold">{current.name} · {active ? '会员有效' : '已到期'}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs ${sub.failure ? 'bg-amber-100 text-amber-800' : sub.renewal && active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{sub.failure ? '续费失败' : sub.renewal && active ? '自动续费已开启' : '自动续费未开启'}</span></div>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">本期权益截止</dt><dd className="mt-1 font-medium">{dateLabel(sub.end)}</dd></div><div><dt className="text-slate-500">{sub.renewal && active ? '下次扣费' : '后续扣费'}</dt><dd className="mt-1 font-medium">{sub.renewal && active ? `${dateLabel(sub.end)} · ¥${currentRenewalPrice}/月` : '无自动扣费计划'}</dd></div><div><dt className="text-slate-500">支付渠道</dt><dd className="mt-1">支付宝 · 演示账户 ···· 8000</dd></div><div><dt className="text-slate-500">周期额度</dt><dd className="mt-1">{current.credits} Credits · {currentStorage} GB 存储</dd></div></dl>
        {sub.failure && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">本次续费未成功，未延长权益。本期权益仍以截止日期为准；请检查支付宝付款设置。此原型不会自动重试扣款。</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">{active ? sub.renewal ? <button className={secondary} onClick={() => setDialog('cancel')}>关闭自动续费</button> : <button className={primary} onClick={() => openCheckout(true)}>重新开通自动续费</button> : <span className="text-sm text-slate-500">可在下方重新选择套餐购买。</span>}<span className="text-xs text-slate-500">关闭续费不会提前终止本期权益</span></div>
        {sub.renewal && active && <div className="mt-5 flex gap-2 rounded-xl bg-white p-4 text-xs leading-5 text-slate-500"><Bell className="mt-0.5 h-4 w-4 shrink-0" /><p>续费前 5 日提醒预览：你的 {current.name} 将于 {dateLabel(sub.end)} 通过支付宝扣费 ¥{currentRenewalPrice}。可在此关闭续费。<br />演示仅展示文案，不会实际发送短信或邮件。</p></div>}
      </section>}

      {!active && compact && <section className="mt-8">
        <h2 className="text-sm font-semibold">1. 选择会员等级</h2>
        <div role="radiogroup" aria-label="会员等级" className="mt-3 grid gap-3 md:grid-cols-3">{domesticPlans.map((item) => <button key={item.id} role="radio" aria-checked={selected === item.id} onClick={() => setSelected(item.id)} className={`rounded-2xl border p-5 text-left transition ${selected === item.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-400'}`}><div className="flex justify-between"><span className="text-xl font-semibold">{item.name}</span>{selected === item.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}</div><p className="mt-2 text-xs text-slate-500">{item.description}</p><p className="mt-6 text-sm">{item.credits} Credits / 周期</p><p className="mt-1 text-xs text-slate-500">{item.storage} 基础高速存储</p></button>)}</div>
        <label className="mt-5 block text-sm">高速存储空间<select aria-label="高速存储空间" value={storage[selected]} onChange={(e) => setStorage((values) => ({ ...values, [selected]: Number(e.target.value) }))} className="ml-3 rounded-lg border border-slate-200 p-2">{domesticStorageOptions[selected].map((gb) => <option key={gb} value={gb}>{gb} GB · +¥{storageFee(selected, gb)}/月</option>)}</select></label>
        <h2 className="mt-7 text-sm font-semibold">2. 选择购买方式</h2>
        <div role="radiogroup" aria-label="购买方式" className="mt-3 grid gap-3 sm:grid-cols-2">
          <button role="radio" aria-checked={recurring} onClick={() => setPurchase('recurring')} className={`rounded-2xl border p-5 text-left ${recurring ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}><p className="font-semibold">连续包月 <span className="ml-2 text-xs font-normal text-blue-600">更优惠</span></p><p className="mt-3 text-3xl font-semibold">¥{(sub.firstUsed ? plan.recurring : plan.first) + extraStorage}<span className="ml-1 text-sm font-normal">{sub.firstUsed ? '/月' : '首月'}</span></p><p className="mt-2 text-sm text-slate-600">{sub.firstUsed ? '每月' : '次月起'} ¥{renewalPrice}/月 · 自动续费</p><p className="mt-2 text-xs text-slate-500">随时可取消 · {sub.firstUsed ? '首月优惠已使用' : '首月优惠限首次购买'}</p></button>
          <button role="radio" aria-checked={!recurring} onClick={() => setPurchase('single')} className={`rounded-2xl border p-5 text-left ${!recurring ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}><p className="font-semibold">单月购买</p><p className="mt-3 text-3xl font-semibold">¥{plan.single + extraStorage}<span className="ml-1 text-sm font-normal">/月</span></p><p className="mt-2 text-sm text-slate-600">一次支付，到期不自动续费</p><p className="mt-2 text-xs text-slate-500">相同等级享有相同会员权益</p></button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">积分不足时需单独充值，不会自动购买积分包或额外扣费。月度积分按周期发放，到期未用完将失效。</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5"><div><p className="text-xs text-slate-500">{plan.name} · {recurring ? '连续包月' : '单月购买'}</p><p className="mt-1 text-xl font-semibold">本次 ¥{price}</p></div><button className={primary} onClick={() => openCheckout()}>确认购买方式 <ArrowRight className="ml-2 inline h-4 w-4" /></button></div>
      </section>}
      {active && compact && <p className="mt-5 text-xs leading-5 text-slate-500">当前已有有效会员，已阻止重复购买。第一期暂不支持周期内升降级；可通过 Mock 切换新用户或已到期状态体验购买。</p>}
    </>}
    {(compact || ordersOnly) && ordersBlock}

    {dialog === 'checkout' && <BillingDialog title="使用支付宝扫码支付" onClose={close} payment>
      <PaymentQRCode
        amount={resume ? 0 : price}
        unlocked={!recurring || consent}
        onComplete={confirmAuthorization}
        agreement={recurring ? <label className="mx-auto mt-8 flex max-w-md items-start gap-3 rounded-xl bg-slate-50 p-4 text-left text-xs leading-6 text-slate-600"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-600" /><span>我已阅读并同意会员服务协议与自动续费协议，授权按当前套餐金额及周期续费。可随时在个人中心关闭。<button type="button" className="ml-1 text-blue-600 underline" onClick={() => setDialog('agreement')}>查看协议摘要</button></span></label> : undefined}
      />
    </BillingDialog>}
    {dialog === 'agreement' && <BillingDialog title="协议摘要 · 演示" onClose={() => setDialog('checkout')}><p className="text-sm leading-7 text-slate-600">本期价格、续费价格与扣费时间以确认订单中的明示信息为准。连续包月需主动授权，可随时取消；取消不影响已购买的有效期，亦不等于申请退款。月度积分按周期发放，不会因积分不足额外自动扣费。正式会员与续费协议需上线前法务审核，本摘要不是正式签约文件。</p><button className={`${primary} mt-6 w-full`} onClick={() => setDialog('checkout')}>返回订单</button></BillingDialog>}
    {dialog === 'cancel' && <BillingDialog title="关闭自动续费？" onClose={close}><p className="text-sm leading-7 text-slate-600">关闭后将停止后续自动续费。你的 {current.name} 会员仍可使用至 <strong>{dateLabel(sub.end)}</strong>，本期权益不会提前失效。关闭自动续费不等于申请退款。</p><p className="mt-3 text-xs text-slate-400">此操作仅模拟解约成功；正式服务需要确认支付渠道解约结果。已发起的扣款应单独查看订单状态。</p><div className="mt-6 flex gap-3"><button className={primary} onClick={cancel}>确认关闭</button><button className={secondary} onClick={close}>暂不关闭</button></div></BillingDialog>}
    {dialog === 'result' && <BillingDialog title={result.title} onClose={close}>{result.success ? <CheckCircle2 className="h-10 w-10 text-emerald-600" /> : <AlertCircle className="h-10 w-10 text-amber-500" />}<p role="status" className="mt-4 text-sm leading-7 text-slate-600">{result.body}</p><button className={`${primary} mt-6 w-full`} onClick={close}>{result.success ? '查看会员与订阅' : '返回重试'}</button></BillingDialog>}
    {dialog === 'support' && <BillingDialog title="支付与权益说明" onClose={close}><CreditCard className="h-8 w-8 text-slate-500" /><p className="mt-4 text-sm leading-7 text-slate-600">积分包为一次性购买，不会自动充值；会员码需验证后才能兑换。本次原型仅展示这两个入口，尚未接入充值和兑换。退款与关闭续费是不同操作，正式服务可凭订单号申请售后审核。此演示没有真实付款，也不提供真实退款或开票申请。</p><button className={`${primary} mt-5 w-full`} onClick={close}>知道了</button></BillingDialog>}
  </>;
  return compact || ordersOnly ? <div className="p-6 text-slate-900">{management}</div> : <DomesticPricingLayout
    recurring={recurring} onPurchaseChange={(value) => setPurchase(value ? 'recurring' : 'single')}
    active={active} firstUsed={sub.firstUsed} currentPlan={sub.plan}
    storage={active ? { ...storage, [sub.plan]: currentStorage } : storage} onStorageChange={(planId, gb) => setStorage((values) => ({ ...values, [planId]: gb }))}
    onBuy={(planId) => openCheckout(false, planId)}
    onHelp={() => setDialog('support')}
  >{management}</DomesticPricingLayout>;
}
