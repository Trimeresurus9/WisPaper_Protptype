import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, X, CreditCard, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { CREATOR_DISCOUNT_CODE, domesticAnnualTotalPrice, domesticPlanRank, domesticPlans, domesticPurchasePrice, domesticStorageOptions, storageFee, nextMonth, nextYear, type BillingOrderStatus, type DomesticPurchaseMode, type PlanId, useBilling } from '../contexts/BillingContext';
import { DomesticPricingLayout } from './DomesticPricingLayout';

const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString('zh-CN') : '—';
const primary = 'rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50';

function PaymentQRCode({ amount, unlocked, agreement, promotion, purchaseLabel, unit, onComplete }: { amount: number; unlocked: boolean; agreement?: React.ReactNode; promotion?: React.ReactNode; purchaseLabel: string; unit: '个月' | '年'; onComplete: () => void }) {
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
    <p className="mt-7 text-sm font-medium text-slate-500">{purchaseLabel}</p>
    {promotion}
    <p className="mt-4 text-xl text-slate-500">总计：</p>
    <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">¥{amount.toFixed(2)} <span className="text-xl font-normal text-slate-500">CNY</span></p>
    <div className="mt-10 flex items-center justify-center gap-3 text-lg">
      <span className="font-medium text-slate-950">购买数量</span>
      <button type="button" aria-label="减少购买月数" disabled className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">−</button>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-900">1</span>
      <button type="button" aria-label="增加购买月数" disabled className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">+</button>
      <span className="text-slate-500">{unit}</span>
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

export function DomesticBilling({ compact = false, ordersOnly = false, upgradeOnly = false, purchaseOnly = false, initialPlan, onFinished }: { compact?: boolean; ordersOnly?: boolean; upgradeOnly?: boolean; purchaseOnly?: boolean; initialPlan?: PlanId; onFinished?: () => void }) {
  const { revision } = useBilling();
  return <DomesticBillingContent key={revision} compact={compact} ordersOnly={ordersOnly} upgradeOnly={upgradeOnly} purchaseOnly={purchaseOnly} initialPlan={initialPlan} onFinished={onFinished} />;
}

function DomesticBillingContent({ compact, ordersOnly, upgradeOnly, purchaseOnly, initialPlan, onFinished }: { compact: boolean; ordersOnly: boolean; upgradeOnly: boolean; purchaseOnly: boolean; initialPlan?: PlanId; onFinished?: () => void }) {
  const { subscription: sub, setSubscription, orders, addOrder, outcome, creatorDiscountPercent } = useBilling();
  const [selected, setSelected] = useState<PlanId>(initialPlan ?? 'pro');
  const [storage, setStorage] = useState<Record<PlanId, number>>({ plus: 10, pro: 50, max: 100, max5: 250 });
  const [purchase, setPurchase] = useState<DomesticPurchaseMode>('single');
  const [dialog, setDialog] = useState<'checkout' | 'result' | 'agreement' | 'support' | null>(null);
  const [consent, setConsent] = useState(false);
  const [resume, setResume] = useState(false);
  const [result, setResult] = useState({ title: '', body: '', success: true });
  const [notice, setNotice] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [creatorCouponApplied, setCreatorCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [purchaseTarget, setPurchaseTarget] = useState<PlanId | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    if (!sub.end) { setPurchase('single'); if (initialPlan) setSelected(initialPlan); return; }
    const nextPlan = domesticPlans.find((item) => domesticPlanRank(item.id) > domesticPlanRank(sub.plan));
    setSelected(purchaseOnly ? initialPlan && domesticPlanRank(initialPlan) > domesticPlanRank(sub.plan) ? initialPlan : nextPlan?.id ?? sub.plan : sub.plan);
    setPurchase(sub.renewalPeriod === 'annual' ? 'annual' : sub.renewal ? 'recurring' : 'single');
  }, [sub.end, sub.plan, sub.renewal, sub.renewalPeriod, purchaseOnly, initialPlan]);
  const plan = domesticPlans.find((p) => p.id === selected)!;
  const current = domesticPlans.find((p) => p.id === sub.plan)!;
  const active = Boolean(sub.end && new Date(sub.end).getTime() > Date.now());
  const changePurchase = (next: DomesticPurchaseMode) => {
    if (active && sub.renewalPeriod === 'annual' && next !== 'annual') return;
    if (active && sub.renewal && next === 'single') return;
    setPurchase(next);
  };
  const recurring = purchase === 'recurring';
  const annual = purchase === 'annual';
  const continuous = purchase !== 'single';
  const currentStorage = sub.storageGb ?? domesticStorageOptions[sub.plan][0];
  const selectedStorage = resume ? currentStorage : storage[selected];
  const extraStorage = storageFee(selected, selectedStorage);
  const renewalPrice = annual ? domesticAnnualTotalPrice(selected) + extraStorage * 12 : plan.recurring + extraStorage;
  const currentRenewalPrice = sub.renewalPeriod === 'annual'
    ? domesticAnnualTotalPrice(sub.plan) + storageFee(sub.plan, currentStorage) * 12
    : current.recurring + storageFee(sub.plan, currentStorage);
  const pricing = domesticPurchasePrice(selected, purchase, sub.firstUsed, selectedStorage, creatorCouponApplied ? creatorDiscountPercent : 0);
  const price = pricing.total;
  const nextDate = resume ? sub.end : annual ? nextYear(new Date()) : nextMonth(new Date());
  const close = () => { if (dialog === 'result' && purchaseOnly) onFinished?.(); setDialog(null); locked.current = false; };
  const applyCreatorCode = () => {
    if (couponInput.trim().toUpperCase() !== CREATOR_DISCOUNT_CODE || creatorDiscountPercent <= 0) {
      setCreatorCouponApplied(false);
      setCouponError('优惠码无效，请检查 Mock 中的演示码。');
      return;
    }
    setCreatorCouponApplied(true);
    setCouponError('');
  };
  const openCheckout = (renewOnly = false, planId?: PlanId) => {
    if (!renewOnly && active && domesticPlanRank(planId ?? selected) <= domesticPlanRank(sub.plan)) { setDialog('support'); return; }
    if (active && sub.renewalPeriod === 'annual') setPurchase('annual');
    else if (active && sub.renewal && purchase === 'single') setPurchase('recurring');
    setResume(renewOnly); setConsent(false); setCouponInput(''); setCreatorCouponApplied(false); setCouponError(''); locked.current = false;
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
      const signed = continuous && outcome !== 'sign-failed';
      setSubscription({ plan: selected, storageGb: selectedStorage, end: nextDate, renewal: signed, renewalPeriod: annual ? 'annual' : 'monthly', failure: false, firstUsed: true, upgraded: active || sub.upgraded });
      addOrder({ id: `MOCK-${Date.now()}`, plan: `${plan.name} · ${selectedStorage} GB`, amount: price, date: new Date().toISOString(), kind: `${active ? `升级至 ${plan.name}` : annual ? '连续包年首期' : recurring ? '连续包月首期' : '月卡'}${creatorCouponApplied ? ' · 博主优惠码' : ''}`, status: 'paid' });
      setResult({ title: signed ? '会员已开通，自动续费已开启' : continuous ? '会员已开通，自动续费未开启' : '月卡已开通',
        body: `模拟支付 ¥${price}${creatorCouponApplied ? `，已优先使用博主优惠码减免 ¥${pricing.discount}，不叠加首月八折` : ''}，权益有效至 ${dateLabel(nextDate)}。${signed ? `下次将按${annual ? '年' : '月'}扣费 ¥${renewalPrice}。可在个人中心“会员与 Credits”取消订阅。` : '本期权益正常生效，到期不会自动扣款。'}${continuous && !signed ? '签约未完成，可在会员管理中重新授权，无需重复购买本期会员。' : ''}`, success: true });
    }
    setDialog('result');
  };
  const orderStatus = (status: BillingOrderStatus) => ({
    processing: { label: '进行中', className: 'text-amber-600' },
    paid: { label: '模拟支付成功', className: 'text-emerald-600' },
    'refund-processing': { label: '退款处理中', className: 'text-amber-600' },
    refunded: { label: '已退款', className: 'text-blue-600' },
    'refund-rejected': { label: '退款未通过', className: 'text-rose-600' },
  }[status]);
  const ordersBlock = <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between"><h3 className="font-semibold">订单与账单</h3><button className="text-xs text-blue-600" onClick={() => setDialog('support')}>退款与账单帮助</button></div>
    {!orders.length ? <p className="mt-4 text-sm text-slate-500">暂无本次演示订单。模拟购买成功后将在这里显示。</p> : <ul className="mt-3 divide-y divide-slate-100">{orders.map((order) => { const status = orderStatus(order.status); return <li key={order.id} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><div><p>{order.plan} · {order.kind}</p><p className="mt-1 text-xs text-slate-500">{dateLabel(order.date)} · {order.id}</p>{order.relatedOrderId && <p className="mt-1 text-xs text-slate-400">关联订单：{order.relatedOrderId}</p>}</div><div className="text-right"><p>{order.amount < 0 ? '-¥' : '¥'}{Math.abs(order.amount)}</p><p className={`mt-1 text-xs ${status.className}`}>{status.label} · 支付宝</p></div></li>; })}</ul>}
  </section>;

  const chooserPlans = active ? domesticPlans.filter((item) => domesticPlanRank(item.id) >= domesticPlanRank(sub.plan)) : domesticPlans;
  const canBuySelected = !active || domesticPlanRank(selected) > domesticPlanRank(sub.plan);
  const purchaseChooser = <section aria-label="快速购买会员" className="text-slate-900">
    <div className="mb-5"><p className="text-xs font-medium tracking-wide text-blue-600">国内版 · 支付宝模拟支付</p><h2 className="mt-1 text-2xl font-semibold">{active ? '升级会员' : '开通会员'}</h2><p className="mt-2 text-xs leading-5 text-slate-500">在这里选择套餐并完成购买，无需离开当前页面。</p></div>
    {active && <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">当前 {current.name} 权益至 {dateLabel(sub.end)}。仅展示当前及更高等级；本期不能购买更低等级。{sub.renewalPeriod === 'annual' ? '年付不能改为月付。' : ''}</p>}
    <div role="radiogroup" aria-label="选择会员等级" className="grid grid-cols-2 gap-2">
      {chooserPlans.map((item) => { const isCurrent = active && item.id === sub.plan; return <button key={item.id} type="button" role="radio" aria-checked={selected === item.id} disabled={isCurrent} onClick={() => setSelected(item.id)} className={`rounded-xl border px-4 py-3 text-left transition ${selected === item.id && !isCurrent ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white'} ${isCurrent ? 'cursor-not-allowed opacity-55' : 'hover:border-blue-400'}`}><span className="block text-sm font-semibold">{item.name}</span><span className="mt-1 block text-[11px] text-slate-500">{isCurrent ? '当前会员' : `${item.credits} Credits / 月`}</span></button>; })}
    </div>
    {canBuySelected ? <>
      <div className={`mt-5 grid gap-2 ${active && sub.renewalPeriod === 'annual' ? 'grid-cols-1' : 'grid-cols-3'}`} role="radiogroup" aria-label="选择购买方式">{([
        { id: 'single', label: '单月购买', detail: '到期不续费' },
        { id: 'recurring', label: '连续包月', detail: sub.firstUsed ? '按月续费' : '首月 8 折' },
        { id: 'annual', label: '连续包年', detail: '按年续费' },
      ] as const).filter((mode) => !active || sub.renewalPeriod !== 'annual' || mode.id === 'annual').map((mode) => { const disabled = active && (sub.renewal || Boolean(sub.scheduledFreeAt)) && mode.id === 'single'; return <button key={mode.id} type="button" role="radio" aria-checked={purchase === mode.id} disabled={disabled} onClick={() => changePurchase(mode.id)} className={`rounded-xl border px-2 py-3 text-center transition ${purchase === mode.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'} ${disabled ? 'cursor-not-allowed opacity-35' : 'hover:border-blue-400'}`}><span className="block text-xs font-semibold">{mode.label}</span><span className="mt-1 block text-[10px] text-slate-500">{mode.detail}</span></button>; })}</div>
      {domesticStorageOptions[selected].length > 1 && <label className="mt-4 block text-xs font-medium text-slate-600">高速存储空间<select aria-label="快速购买高速存储空间" value={storage[selected]} onChange={(event) => setStorage((values) => ({ ...values, [selected]: Number(event.target.value) }))} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900">{domesticStorageOptions[selected].map((gb) => <option key={gb} value={gb}>{gb} GB {storageFee(selected, gb) ? `· +¥${storageFee(selected, gb)}/月` : '· 基础容量'}</option>)}</select></label>}
      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><div><p className="text-[11px] text-slate-500">{plan.name} · {purchase === 'single' ? '单月购买' : purchase === 'annual' ? '连续包年' : '连续包月'}</p><p className="mt-1 text-xl font-semibold">本次 ¥{price.toFixed(2)}</p></div><button type="button" onClick={() => openCheckout()} className={primary}>继续支付 <ArrowRight className="ml-1 inline h-4 w-4" /></button></div>
      {continuous && <p className="mt-2 text-[11px] text-slate-500">后续续费 ¥{renewalPrice}/{annual ? '年' : '月'}；扫码前需主动同意自动续费协议。</p>}
    </> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">当前已是最高等级。可在“会员与 Credits”查看或管理现有会员。</p>}
  </section>;

  const management = <>
    {!purchaseOnly && (compact || ordersOnly) && <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">国内版 · 支付宝</span><span>交互演示 · 价格仅供演示 · 不会真实扣款</span></div>}
    {!purchaseOnly && (compact || ordersOnly) && <><h1 className="text-3xl font-semibold tracking-tight">{ordersOnly ? '国内订单与账单' : '会员与订阅'}</h1><p className="mt-3 text-sm text-slate-500">购买方式由你选择，续费规则始终透明。</p></>}
    {notice && <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{notice}</div>}

    {!ordersOnly && !purchaseOnly && <>
      {!compact && upgradeOnly && <section className="subscription-management" aria-label="会员信息">
        <div className="subscription-management-head"><h3>会员信息</h3><span>国内版 · 支付宝（模拟）</span></div>
        <div className="subscription-management-grid">
          <div className="subscription-management-item"><span className="subscription-label">当前会员</span><strong className="subscription-value">{active ? current.name : sub.end ? '会员已到期' : 'Free'}</strong><span className="subscription-note">{sub.end ? `权益截止 ${dateLabel(sub.end)} · ${currentStorage} GB` : '选择上方套餐开通会员'}</span></div>
          <div className="subscription-management-item"><span className="subscription-label">连续订阅</span><strong className="subscription-value">{sub.failure ? '续费失败' : active && sub.renewal ? `连续包${sub.renewalPeriod === 'annual' ? '年' : '月'}` : '未开启'}</strong><span className="subscription-note">{active && sub.renewal ? `${dateLabel(sub.end)} · ¥${currentRenewalPrice}/${sub.renewalPeriod === 'annual' ? '年' : '月'}` : '无自动扣费计划'}</span></div>
          <div className="subscription-management-item"><span className="subscription-label">支付方式</span><div className="locked-payment"><span className="card-brand">支付宝</span><strong className="subscription-value">{sub.end ? '演示账户 ···· 8000' : '开通时授权'}</strong></div><span className="subscription-note">不会真实扣款或收集支付凭据</span></div>
          <div className="subscription-management-item"><span className="subscription-label">订阅规则</span><strong className="subscription-value">{active ? sub.scheduledFreeAt ? '订阅已取消' : sub.renewalPeriod === 'annual' ? '年付周期锁定' : '仅支持向上升级' : '暂无有效订阅'}</strong><span className="subscription-note">{sub.scheduledFreeAt ? `本期权益保留至 ${dateLabel(sub.scheduledFreeAt)}` : '取消订阅请前往个人中心“会员与 Credits”'}</span></div>
        </div>
        {sub.failure && <p role="alert" className="border-t border-slate-200 bg-amber-50 p-4 text-xs text-amber-800">本次续费失败，未延长权益；请检查支付宝付款设置。此原型不会自动重试扣款。</p>}
        {active && sub.renewal && <p className="border-t border-slate-200 p-4 text-xs text-slate-500">续费前 5 日提醒预览：你的 {current.name} 将于 {dateLabel(sub.end)} 通过支付宝扣费 ¥{currentRenewalPrice}。可在个人中心“会员与 Credits”取消订阅；此演示不实际发送通知。</p>}
      </section>}
      {compact && sub.end && <section className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-slate-500">当前会员</p><h2 className="mt-2 text-xl font-semibold">{current.name} · {active ? '会员有效' : '已到期'}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs ${sub.failure ? 'bg-amber-100 text-amber-800' : sub.scheduledFreeAt && active ? 'bg-sky-100 text-sky-800' : sub.renewal && active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{sub.failure ? '续费失败' : sub.scheduledFreeAt && active ? '下周期降级为 Free' : sub.renewal && active ? '自动续费已开启' : '自动续费未开启'}</span></div>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">本期权益截止</dt><dd className="mt-1 font-medium">{dateLabel(sub.end)}</dd></div><div><dt className="text-slate-500">{sub.renewal && active ? '下次扣费' : '后续扣费'}</dt><dd className="mt-1 font-medium">{sub.renewal && active ? `${dateLabel(sub.end)} · ¥${currentRenewalPrice}/${sub.renewalPeriod === 'annual' ? '年' : '月'}` : '无自动扣费计划'}</dd></div><div><dt className="text-slate-500">支付渠道</dt><dd className="mt-1">支付宝 · 演示账户 ···· 8000</dd></div><div><dt className="text-slate-500">周期额度</dt><dd className="mt-1">{current.credits} Credits · {currentStorage} GB 存储</dd></div></dl>
        {sub.failure && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800">本次续费未成功，未延长权益。本期权益仍以截止日期为准；请检查支付宝付款设置。此原型不会自动重试扣款。</p>}
        <div className="mt-5 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">{active ? sub.renewalPeriod === 'annual' ? '当前年付周期内仅支持升级到更高等级，不支持改为月付。' : '当前有效会员购买付费等级时仅支持升级。' : '可重新选择套餐购买。'} {active && sub.renewal ? '取消续订仅停止下周期扣费，本期权益保留至到期且不退款；立即降为 Free 是另一项操作。' : ''}</div>
      </section>}

      {!active && compact && <section className="mt-8">
        <h2 className="text-sm font-semibold">1. 选择会员等级</h2>
        <div role="radiogroup" aria-label="会员等级" className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{domesticPlans.map((item) => <button key={item.id} role="radio" aria-checked={selected === item.id} onClick={() => setSelected(item.id)} className={`rounded-2xl border p-5 text-left transition ${selected === item.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-400'}`}><div className="flex justify-between"><span className="text-xl font-semibold">{item.name}</span>{selected === item.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}</div><p className="mt-2 text-xs text-slate-500">{item.description}</p><p className="mt-6 text-sm">{item.credits} Credits / 周期</p><p className="mt-1 text-xs text-slate-500">{item.storage} 基础高速存储</p></button>)}</div>
        <label className="mt-5 block text-sm">高速存储空间<select aria-label="高速存储空间" value={storage[selected]} onChange={(e) => setStorage((values) => ({ ...values, [selected]: Number(e.target.value) }))} className="ml-3 rounded-lg border border-slate-200 p-2">{domesticStorageOptions[selected].map((gb) => <option key={gb} value={gb}>{gb} GB · +¥{storageFee(selected, gb)}/月</option>)}</select></label>
        <h2 className="mt-7 text-sm font-semibold">2. 选择购买方式</h2>
        <div role="radiogroup" aria-label="购买方式" className="mt-3 grid gap-3 lg:grid-cols-3">
          <button role="radio" aria-checked={purchase === 'single'} onClick={() => setPurchase('single')} className={`rounded-2xl border p-5 text-left ${purchase === 'single' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}><p className="font-semibold">月卡</p><p className="mt-3 text-3xl font-semibold">¥{plan.single + extraStorage}<span className="ml-1 text-sm font-normal">/月</span></p><p className="mt-2 text-sm text-slate-600">到期不续费</p></button>
          <button role="radio" aria-checked={recurring} onClick={() => setPurchase('recurring')} className={`relative overflow-hidden rounded-2xl border p-5 text-left ${recurring ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}>{!sub.firstUsed && <span className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-3 py-1.5 text-[11px] font-semibold text-white">首月 8 折</span>}<p className="font-semibold">连续包月</p>{!sub.firstUsed && <p className="mt-3 text-xs text-slate-400 line-through">原价 ¥{plan.single + extraStorage}</p>}<p className={`${sub.firstUsed ? 'mt-3' : 'mt-1'} text-3xl font-semibold`}>¥{(sub.firstUsed ? plan.recurring : plan.first) + extraStorage}<span className="ml-1 text-sm font-normal">{sub.firstUsed ? '/月' : '首月'}</span></p><p className="mt-2 text-sm text-slate-600">{sub.firstUsed ? '每月' : '次月起'} ¥{plan.recurring + extraStorage}/月</p></button>
          <button role="radio" aria-checked={annual} onClick={() => setPurchase('annual')} className={`relative overflow-hidden rounded-2xl border p-5 text-left ${annual ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200'}`}>{!sub.firstUsed && <span className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-3 py-1.5 text-[11px] font-semibold text-white">首月 8 折</span>}<p className="font-semibold">连续包年</p><p className="mt-3 text-3xl font-semibold">¥{domesticPurchasePrice(selected, 'recurring', sub.firstUsed, selectedStorage).total}<span className="ml-1 text-sm font-normal">{sub.firstUsed ? '月付价' : '月付首月价'}</span></p><p className="mt-2 text-sm text-slate-600">{sub.firstUsed ? '年付总计' : `首月减免 ¥${domesticPurchasePrice(selected, 'annual', false, selectedStorage).discount} · 首年实付`} ¥{domesticPurchasePrice(selected, 'annual', sub.firstUsed, selectedStorage).total}{!sub.firstUsed ? ` · 次年 ¥${domesticAnnualTotalPrice(selected) + extraStorage * 12}` : ''}</p></button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">积分不足时需单独充值，不会自动购买积分包或额外扣费。月度积分按周期发放，到期未用完将失效。</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-5"><div><p className="text-xs text-slate-500">{plan.name} · {purchase === 'single' ? '月卡' : purchase === 'annual' ? '连续包年' : '连续包月'}</p><p className="mt-1 text-xl font-semibold">本次 ¥{price}</p></div><button className={primary} onClick={() => openCheckout()}>确认购买方式 <ArrowRight className="ml-2 inline h-4 w-4" /></button></div>
      </section>}
      {active && compact && <p className="mt-5 text-xs leading-5 text-slate-500">当前已有有效会员。付费等级之间仅支持升级；取消续订不退款，国内版可在“会员与 Credits”另行选择立即降为 Free 并模拟全额退款。年付周期不允许切换为月付。</p>}
    </>}
    {!purchaseOnly && (compact || ordersOnly) && ordersBlock}

    {dialog === 'checkout' && <BillingDialog title="使用支付宝扫码支付" onClose={close} payment>
      <PaymentQRCode
        amount={resume ? 0 : price}
        unlocked={!continuous || consent}
        purchaseLabel={`${plan.name} · ${purchase === 'single' ? '月卡' : purchase === 'annual' ? '连续包年' : '连续包月'} · ${selectedStorage} GB`}
        unit={annual ? '年' : '个月'}
        onComplete={confirmAuthorization}
        promotion={!resume ? <div className="mx-auto mt-6 max-w-md rounded-xl border border-slate-200 p-4 text-left"><label htmlFor="creator-coupon" className="text-xs font-semibold text-slate-700">博主优惠码 <span className="font-normal text-slate-400">· 演示</span></label><div className="mt-2 flex gap-2"><input id="creator-coupon" value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCreatorCouponApplied(false); setCouponError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyCreatorCode(); } }} placeholder="输入优惠码" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" /><button type="button" onClick={applyCreatorCode} className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white">使用</button></div>{couponError && <p role="alert" className="mt-2 text-xs text-rose-600">{couponError}</p>}{pricing.discountSource && <p role="status" className="mt-2 text-xs text-emerald-700">{pricing.discountSource === 'creator' ? `博主优惠码已优先使用（${creatorDiscountPercent}%）` : annual ? '年付首月 8 折' : '首月 8 折'} · 本次减免 ¥{pricing.discount}{pricing.discountSource === 'creator' ? '，不叠加首月八折' : ''}</p>}</div> : undefined}
        agreement={continuous ? <label className="mx-auto mt-8 flex max-w-md items-start gap-3 rounded-xl bg-slate-50 p-4 text-left text-xs leading-6 text-slate-600"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-600" /><span>我已阅读并同意会员服务协议与自动续费协议，授权按当前套餐金额及周期续费。可在个人中心“会员与 Credits”取消订阅。<button type="button" className="ml-1 text-blue-600 underline" onClick={() => setDialog('agreement')}>查看协议摘要</button></span></label> : undefined}
      />
    </BillingDialog>}
    {dialog === 'agreement' && <BillingDialog title="协议摘要 · 演示" onClose={() => setDialog('checkout')}><p className="text-sm leading-7 text-slate-600">本期价格、续费价格与扣费时间以确认订单中的明示信息为准。连续订阅需主动授权；可在个人中心“会员与 Credits”取消订阅，本期权益保留至到期，已支付费用不退还。月度积分按周期发放，不会因积分不足额外自动扣费。正式会员与续费协议需上线前法务审核，本摘要不是正式签约文件。</p><button className={`${primary} mt-6 w-full`} onClick={() => setDialog('checkout')}>返回订单</button></BillingDialog>}
    {dialog === 'result' && <BillingDialog title={result.title} onClose={close}>{result.success ? <CheckCircle2 className="h-10 w-10 text-emerald-600" /> : <AlertCircle className="h-10 w-10 text-amber-500" />}<p role="status" className="mt-4 text-sm leading-7 text-slate-600">{result.body}</p><button className={`${primary} mt-6 w-full`} onClick={close}>{result.success ? '查看会员与订阅' : '返回重试'}</button></BillingDialog>}
    {dialog === 'support' && <BillingDialog title="支付与权益说明" onClose={close}><CreditCard className="h-8 w-8 text-slate-500" /><p className="mt-4 text-sm leading-7 text-slate-600">有效会员只可购买更高等级，年付不能改为月付。连续订阅可在个人中心取消后续续费，本期权益保留至到期；国内版也可单独选择“降级为 Free”，立即结束权益并模拟全额退款。退款订单保留在订单页，可对退款结果发起申诉。</p><button className={`${primary} mt-5 w-full`} onClick={close}>知道了</button></BillingDialog>}
  </>;
  return purchaseOnly ? <div className="text-slate-900">{purchaseChooser}{management}</div> : compact || ordersOnly ? <div className="p-6 text-slate-900">{management}</div> : <><DomesticPricingLayout
    purchase={purchase} onPurchaseChange={changePurchase}
    active={active} upgraded={Boolean(sub.upgraded)} renewal={sub.renewal} renewalPeriod={sub.renewalPeriod} firstUsed={sub.firstUsed} currentPlan={sub.plan} currentPlanEnd={sub.end} renewalFailure={sub.failure}
    storage={active ? { ...storage, [sub.plan]: currentStorage } : storage} onStorageChange={(planId, gb) => setStorage((values) => ({ ...values, [planId]: gb }))}
    onBuy={(planId) => setPurchaseTarget(planId)}
    onHelp={() => setDialog('support')}
  >{management}</DomesticPricingLayout>{purchaseTarget && <BillingDialog title="选择购买方案" onClose={() => setPurchaseTarget(null)}><DomesticBilling purchaseOnly initialPlan={purchaseTarget} onFinished={() => setPurchaseTarget(null)} /></BillingDialog>}</>;
}
