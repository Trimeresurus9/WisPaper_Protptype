import { domesticPlans, domesticStorageOptions, storageFee, useBilling } from '../contexts/BillingContext';

export function DomesticAccountBilling({ ordersOnly = false, storageOnly = false, onOpenPricing }: { ordersOnly?: boolean; storageOnly?: boolean; onOpenPricing?: () => void }) {
  const { subscription, orders } = useBilling();
  const plan = domesticPlans.find((item) => item.id === subscription.plan)!;
  const active = Boolean(subscription.end && new Date(subscription.end).getTime() > Date.now());
  const capacity = subscription.storageGb ?? domesticStorageOptions[subscription.plan][0];
  const end = subscription.end ? new Date(subscription.end).toLocaleDateString('zh-CN') : '—';
  const credits = active ? Number(plan.credits.replaceAll(',', '')) : 0;
  const renewal = active && subscription.renewal;
  const button = 'rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700';

  if (storageOnly) return <div className="p-8"><div className="mx-auto max-w-3xl overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[600px] text-left text-xs"><caption className="p-4 text-left text-slate-500">国内账户存储 · 本次演示未模拟文件占用</caption><thead className="bg-slate-50 text-slate-500"><tr>{['存储空间', '已用 / 总容量', '当前规格', '到期时间', '操作'].map((label) => <th key={label} className="p-4 font-medium">{label}</th>)}</tr></thead><tbody><tr className="border-t border-slate-100"><td className="p-4">高速存储</td><td className="p-4">0 / {active ? capacity : 1} GB</td><td className="p-4">{active ? plan.name : 'Free'}</td><td className="p-4">{active ? end : '—'}</td><td className="p-4"><button className={button} onClick={onOpenPricing}>查看套餐</button></td></tr><tr className="border-t border-slate-100"><td className="p-4">归档存储</td><td className="p-4" colSpan={4}>暂无归档文件（模拟）</td></tr></tbody></table></div></div>;

  return <div className="p-8"><div className="mx-auto max-w-3xl">
    <p className="mb-4 text-[11px] text-slate-400">国内版 · 支付宝 · 本地模拟数据，不会真实扣款</p>
    {!ordersOnly ? <>
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div><div className="flex items-center gap-2"><span className="text-[11px] tracking-[0.14em] text-slate-400">当前套餐</span><span className="rounded-md bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-300">{active ? '生效中' : subscription.end ? '已到期' : '未开通'}</span></div>
            <h3 className="mt-3 text-2xl font-semibold">{active ? `${plan.name} 月度版` : 'Free'}</h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-slate-400"><span>{subscription.end ? `${end} 到期` : '选择套餐开启研究'}</span><span>{subscription.failure ? '续费失败' : renewal ? '自动续费中' : '未开启自动续费'}</span><span>支付宝</span></div>
          </div><button type="button" onClick={onOpenPricing} className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-slate-100">{active ? '管理订阅' : '查看套餐'}</button>
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
      <section className="mt-6 rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-4"><h3 className="text-sm font-semibold">订阅管理</h3><button type="button" className={button} onClick={onOpenPricing}>{active ? '管理自动续费' : '开通会员'}</button></div><p className="mt-3 text-xs leading-6 text-slate-500">{renewal ? `下次扣费：${end} · ¥${plan.recurring + storageFee(plan.id, capacity)}/月（含所选存储）。` : '当前无自动扣费计划。'}关闭自动续费后，本期权益仍保留至到期。</p>{subscription.failure && <p role="alert" className="mt-2 text-xs text-amber-700">续费未成功，权益未延长，请检查支付宝付款设置。</p>}</section>
    </> : <>
      <section><div className="mb-4 flex justify-between gap-4"><h3 className="text-sm font-semibold text-slate-950">支付方式</h3><button type="button" onClick={onOpenPricing} className={button}>管理支付与订阅</button></div>
        <article className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">支</span><div><p className="text-xs font-semibold">支付宝{subscription.end ? ' ···· 8000' : ''}</p><p className="mt-1 text-[10px] text-slate-500">{renewal ? '自动续费授权已开启（模拟）' : '无自动续费授权'} · 开通时确认支付账户</p></div></article>
      </section>
      <section className="mt-6 border-t border-slate-200 pt-6"><h3 className="mb-4 text-sm font-semibold">订单记录 <span className="ml-2 text-xs font-normal text-slate-400">国内订单 · {orders.length} 笔</span></h3><div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['日期 / 订单号', '商品', '支付方式', '金额', '状态'].map((label) => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-slate-100"><td className="p-3">{new Date(order.date).toLocaleDateString('zh-CN')}<p className="mt-1 text-[10px] text-slate-400">{order.id}</p></td><td className="p-3">{order.plan}<p className="mt-1 text-slate-400">{order.kind}</p></td><td className="p-3">支付宝 ···· 8000</td><td className="p-3">¥{order.amount}</td><td className="p-3 text-emerald-600">模拟支付成功</td></tr>)}{!orders.length && <tr><td colSpan={5} className="p-10 text-center text-slate-400">暂无订单，模拟购买成功后将在这里显示。</td></tr>}</tbody></table></div><p className="mt-3 text-[11px] leading-5 text-slate-400">此处仅展示本次国内演示订单；不提供真实发票、退款或银行卡绑定。</p></section>
    </>}
  </div></div>;
}
