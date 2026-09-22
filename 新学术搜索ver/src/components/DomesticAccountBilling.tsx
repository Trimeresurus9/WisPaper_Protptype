import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { domesticAnnualTotalPrice, domesticPlans, domesticStorageOptions, storageFee, type BillingOrder, type BillingOrderStatus, useBilling } from '../contexts/BillingContext';

const orderStatusMeta: Record<BillingOrderStatus, { label: string; className: string }> = {
  processing: { label: '进行中', className: 'text-amber-600' },
  paid: { label: '已支付', className: 'text-emerald-600' },
  'refund-processing': { label: '退款处理中', className: 'text-amber-600' },
  refunded: { label: '已退款', className: 'text-blue-600' },
  'refund-rejected': { label: '退款未通过', className: 'text-rose-600' },
};

function RefundAppealComposer({ order, onClose }: { order: BillingOrder; onClose: () => void }) {
  const [subject, setSubject] = useState(`退款申诉｜${order.id}`);
  const [body, setBody] = useState(`你好，WisPaper 支持团队：\n\n我希望对退款订单 ${order.id} 提交申诉。\n关联原订单：${order.relatedOrderId ?? '请补充'}\n订单商品：${order.plan}\n退款金额：¥${Math.abs(order.amount)}\n\n申诉原因：\n请在此补充退款争议的具体情况与期望处理结果。\n\n谢谢。`);
  return <div className="fixed inset-0 z-[12500] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="退款申诉邮件写作页" onClick={onClose}>
    <div className="flex h-[min(720px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Mail className="h-4 w-4" /></span><div><h2 className="text-base font-semibold text-slate-950">退款申诉邮件</h2><p className="mt-0.5 text-[11px] text-slate-500">已带入退款订单信息，请补充申诉原因</p></div></div><button type="button" onClick={onClose} aria-label="关闭邮件写作页" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></header>
      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] border-b border-slate-200 px-6 py-3 text-sm"><span className="text-slate-400">收件人</span><span className="font-medium text-slate-800">refund-appeal@wispaper.com</span></div>
      <label className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center border-b border-slate-200 px-6 py-3 text-sm"><span className="text-slate-400">主题</span><input aria-label="申诉邮件主题" value={subject} onChange={(event) => setSubject(event.target.value)} className="min-w-0 border-0 bg-transparent p-0 text-slate-900 outline-none" /></label>
      <textarea aria-label="申诉邮件正文" value={body} onChange={(event) => setBody(event.target.value)} className="min-h-0 flex-1 resize-none px-6 py-5 text-sm leading-7 text-slate-700 outline-none" />
      <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4"><p className="text-[11px] text-slate-500">原型仅展示写作页，不会真实发送邮件。</p><button type="button" onClick={onClose} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">完成编辑</button></footer>
    </div>
  </div>;
}

export function DomesticAccountBilling({ ordersOnly = false, storageOnly = false, onOpenPricing }: { ordersOnly?: boolean; storageOnly?: boolean; onOpenPricing?: (source?: 'upgrade' | 'general') => void }) {
  const { subscription, setSubscription, orders, downgradeToFree } = useBilling();
  const [appealOrder, setAppealOrder] = useState<BillingOrder | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [downgradeNotice, setDowngradeNotice] = useState('');
  const plan = domesticPlans.find((item) => item.id === subscription.plan)!;
  const active = Boolean(subscription.end && new Date(subscription.end).getTime() > Date.now());
  const capacity = subscription.storageGb ?? domesticStorageOptions[subscription.plan][0];
  const end = subscription.end ? new Date(subscription.end).toLocaleDateString('zh-CN') : '—';
  const credits = active ? Number(plan.credits.replaceAll(',', '')) : 0;
  const renewal = active && subscription.renewal;
  const renewalPeriod = subscription.renewalPeriod === 'annual' ? '年' : '月';
  const renewalAmount = subscription.renewalPeriod === 'annual'
    ? domesticAnnualTotalPrice(plan.id) + storageFee(plan.id, capacity) * 12
    : plan.recurring + storageFee(plan.id, capacity);
  const lastPaidOrder = orders.find((order) => order.status === 'paid' && order.amount > 0 && order.plan.startsWith(plan.name));
  const refundAmount = lastPaidOrder?.amount ?? (subscription.renewalPeriod === 'annual'
    ? domesticAnnualTotalPrice(plan.id) + storageFee(plan.id, capacity) * 12
    : plan.recurring + storageFee(plan.id, capacity));
  const button = 'rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700';
  const cancelSubscription = () => {
    if (!active || !subscription.renewal) return;
    setSubscription((current) => ({ ...current, renewal: false, failure: false, scheduledFreeAt: current.end }));
    setShowCancelDialog(false);
  };

  if (storageOnly) return <div className="p-8"><div className="mx-auto max-w-3xl overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[600px] text-left text-xs"><caption className="p-4 text-left text-slate-500">国内账户存储 · 本次演示未模拟文件占用</caption><thead className="bg-slate-50 text-slate-500"><tr>{['存储空间', '已用 / 总容量', '当前规格', '到期时间', '操作'].map((label) => <th key={label} className="p-4 font-medium">{label}</th>)}</tr></thead><tbody><tr className="border-t border-slate-100"><td className="p-4">高速存储</td><td className="p-4">0 / {active ? capacity : 1} GB</td><td className="p-4">{active ? plan.name : 'Free'}</td><td className="p-4">{active ? end : '—'}</td><td className="p-4"><button className={button} onClick={onOpenPricing}>查看套餐</button></td></tr><tr className="border-t border-slate-100"><td className="p-4">归档存储</td><td className="p-4" colSpan={4}>暂无归档文件（模拟）</td></tr></tbody></table></div></div>;

  return <div className="p-8"><div className="mx-auto max-w-3xl">
    <p className="mb-4 text-[11px] text-slate-400">国内版 · 支付宝 · 本地模拟数据，不会真实扣款</p>
    {!ordersOnly ? <>
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div><div className="flex items-center gap-2"><span className="text-[11px] tracking-[0.14em] text-slate-400">当前套餐</span><span className="rounded-md bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-300">{active ? '生效中' : subscription.end ? '已到期' : '未开通'}</span></div>
            <h3 className="mt-3 text-2xl font-semibold">{active ? `${plan.name} ${subscription.renewalPeriod === 'annual' ? '年付版' : '月度版'}` : 'Free'}</h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-slate-400"><span>{subscription.end ? `${end} 到期` : '选择套餐开启研究'}</span><span>{subscription.scheduledFreeAt && active ? '下周期降级为 Free' : subscription.failure ? '续费失败' : renewal ? '自动续费中' : '未开启自动续费'}</span><span>支付宝</span></div>
          </div><button type="button" onClick={() => onOpenPricing?.(active ? 'upgrade' : 'general')} className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-slate-100">{active ? '查看升级方案' : '查看套餐'}</button>
        </div>
        <div className="border-t border-white/10 px-6 py-5">
          <div className="flex items-end justify-between gap-4"><p className="text-xs font-semibold">会员 Credits <span className="ml-2 rounded-md bg-white/10 px-2 py-1 text-[9px] text-slate-300">月度额度</span></p><p className="text-xs font-semibold">{credits.toLocaleString()} 剩余</p></div>
          <div role="progressbar" aria-label="会员 Credits 已使用额度" aria-valuemin={0} aria-valuemax={credits || 1} aria-valuenow={0} className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-0 bg-white" /></div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>{active ? `本期额度有效至 ${end}` : '暂无付费会员额度'}</span><span>{active ? '100% 可用 · 模拟未使用' : '—'}</span></div>
          <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-[10px] text-slate-500"><span>已领取 Voucher</span><span>0 笔 · 0 Credits</span></div>
        </div>
      </section>
      <section className="mt-5 space-y-3">
        <details className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><summary className="cursor-pointer text-xs font-semibold text-slate-900">充值包 Credits <span className="float-right">0 剩余</span></summary><p className="mt-3 text-xs text-slate-500">本次国内演示账户暂无充值包；不使用国外账户的模拟余额。</p><button type="button" onClick={onOpenPricing} className={`${button} mt-3`}>查看充值包</button></details>
        <details className="rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-xs font-semibold text-slate-900">Voucher Credits <span className="float-right">0 剩余</span></summary><p className="mt-3 text-xs text-slate-500">暂无已领取的 Voucher。</p></details>
      </section>
      <section className="mt-6 rounded-xl border border-slate-200 p-5"><h3 className="text-sm font-semibold">高速存储</h3><div className="mt-4 flex justify-between text-xs"><span className="text-slate-500">当前容量</span><strong>{active ? capacity : 1} GB</strong></div><p className="mt-2 text-xs leading-5 text-slate-500">{active ? `包含套餐基础容量及所选扩容；存储附加费 ¥${storageFee(plan.id, capacity)}/月，会员优惠金额不变。` : 'Free 基础容量；可在定价页选择付费套餐与存储空间。'}</p></section>
      <section className="mt-6 rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-4"><h3 className="text-sm font-semibold">订阅规则</h3><button type="button" className={button} onClick={() => onOpenPricing?.(active ? 'upgrade' : 'general')}>{active ? '查看升级方案' : '开通会员'}</button></div><p className="mt-3 text-xs leading-6 text-slate-500">{subscription.scheduledFreeAt && active ? `已取消订阅，权益保留至 ${end}，之后降级为 Free。` : renewal ? `下次扣费：${end} · ¥${renewalAmount}/${renewalPeriod}（含所选存储）。` : '当前无自动扣费计划。'} {active ? subscription.renewalPeriod === 'annual' ? '年付周期不支持切换为月付，仅可向上升级。' : '付费等级之间仅可向上升级。' : ''}</p>{active && (renewal ? <button type="button" onClick={() => setShowCancelDialog(true)} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50">取消订阅</button> : <span role="status" className="mt-4 inline-flex cursor-default rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-500">{subscription.scheduledFreeAt ? '已取消订阅' : '单次购买'} · {end} 到期</span>)}{subscription.failure && <p role="alert" className="mt-2 text-xs text-amber-700">续费未成功，权益未延长，请检查支付宝付款设置。</p>}</section>
      {active && <section className="mt-8 border-t border-slate-200 pt-6"><button type="button" onClick={() => setShowDowngradeDialog(true)} className="text-xs font-medium text-slate-500 underline underline-offset-4 hover:text-slate-900">降级为 Free（立即生效）</button><p className="mt-2 text-[11px] leading-5 text-slate-400">与“取消订阅”不同：降级将立即结束本期权益，并模拟全额退款。</p></section>}
      {downgradeNotice && <p role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{downgradeNotice}</p>}
    </> : <>
      <section><div className="mb-4 flex justify-between gap-4"><h3 className="text-sm font-semibold text-slate-950">支付方式</h3><button type="button" onClick={onOpenPricing} className={button}>查看套餐</button></div>
        <article className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">支</span><div><p className="text-xs font-semibold">支付宝{subscription.end ? ' ···· 8000' : ''}</p><p className="mt-1 text-[10px] text-slate-500">{renewal ? '自动续费授权已开启（模拟）' : '无自动续费授权'} · 开通时确认支付账户</p></div></article>
      </section>
      <section className="mt-6 border-t border-slate-200 pt-6"><div className="mb-4"><h3 className="text-sm font-semibold">订单记录 <span className="ml-2 text-xs font-normal text-slate-400">国内订单 · {orders.length} 笔</span></h3><p className="mt-1 text-[11px] text-slate-400">进行中、退款处理中与已退款订单都会保留在列表中；退款订单可发起申诉。</p></div><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['日期 / 订单号', '商品', '支付方式', '金额', '状态', '操作'].map((label) => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{orders.map((order) => { const status = orderStatusMeta[order.status]; const refundable = order.status === 'refund-processing' || order.status === 'refunded' || order.status === 'refund-rejected'; return <tr key={order.id} className="border-t border-slate-100"><td className="p-3">{new Date(order.date).toLocaleDateString('zh-CN')}<p className="mt-1 text-[10px] text-slate-400">{order.id}</p>{order.relatedOrderId && <p className="mt-1 text-[10px] text-slate-400">关联 {order.relatedOrderId}</p>}</td><td className="p-3">{order.plan}<p className="mt-1 text-slate-400">{order.kind}</p></td><td className="p-3">{order.status === 'processing' ? '支付宝 · 待确认' : '支付宝 ···· 8000'}</td><td className="p-3 font-medium">{order.amount < 0 ? '-¥' : '¥'}{Math.abs(order.amount)}</td><td className={`p-3 font-medium ${status.className}`}>{status.label}</td><td className="p-3">{refundable ? <button type="button" onClick={() => setAppealOrder(order)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><Mail className="h-3.5 w-3.5" />退款申诉</button> : <span className="text-slate-300">—</span>}</td></tr>; })}{!orders.length && <tr><td colSpan={6} className="p-10 text-center text-slate-400">暂无订单，模拟购买成功后将在这里显示。</td></tr>}</tbody></table></div><p className="mt-3 text-[11px] leading-5 text-slate-400">取消订阅请前往个人中心“会员与 Credits”；退款申诉仅针对已有退款记录。</p></section>
    </>}
    {appealOrder && <RefundAppealComposer order={appealOrder} onClose={() => setAppealOrder(null)} />}
    {showCancelDialog && active && renewal && <div className="fixed inset-0 z-[12500] flex items-center justify-center bg-slate-950/55 p-4" onClick={() => setShowCancelDialog(false)}><div role="dialog" aria-modal="true" aria-label="确认取消订阅" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><h3 className="text-lg font-semibold text-slate-950">取消订阅？</h3><p className="mt-3 text-sm leading-6 text-slate-600">取消后不会继续自动扣费。当前 {plan.name} 权益仍可使用至 {end}，届时降级为 Free；本期已支付费用不退还。</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowCancelDialog(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">暂不取消</button><button type="button" onClick={cancelSubscription} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">确认取消订阅</button></div></div></div>}
    {showDowngradeDialog && active && <div className="fixed inset-0 z-[12500] flex items-center justify-center bg-slate-950/55 p-4" onClick={() => setShowDowngradeDialog(false)}><div role="dialog" aria-modal="true" aria-label="确认降级为 Free" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><h3 className="text-lg font-semibold text-slate-950">降级为 Free？</h3><p className="mt-3 text-sm leading-6 text-slate-600">确认后将立即停止 {plan.name} 会员权益及后续自动续费，并模拟全额退款 ¥{refundAmount.toFixed(2)}。退款记录会保留在“订单与账单”。此操作不同于仅取消下周期续费。</p><p className="mt-3 text-xs text-slate-400">当前仅为交互演示，不会发起真实退款。</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowDowngradeDialog(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">保留会员</button><button type="button" onClick={() => { const result = downgradeToFree(); if (result) setDowngradeNotice(`已模拟降级为 Free，并生成全额退款 ¥${result.amount.toFixed(2)}；请在“订单与账单”查看记录。`); setShowDowngradeDialog(false); }} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">确认降级并退款</button></div></div></div>}
  </div></div>;
}
