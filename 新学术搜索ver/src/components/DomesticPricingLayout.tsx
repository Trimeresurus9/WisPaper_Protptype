import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { domesticAnnualTotalPrice, domesticPlanRank, domesticPlans, domesticPurchasePrice, domesticStorageOptions, domesticTopUpPrice, storageFee, TOP_UP_CREDITS, type DomesticPurchaseMode, type PlanId } from '../contexts/BillingContext';
import { PricingStyles } from './PricingStyles';

type Props = {
  purchase: DomesticPurchaseMode;
  onPurchaseChange: (purchase: DomesticPurchaseMode) => void;
  active: boolean;
  upgraded: boolean;
  renewal: boolean;
  renewalPeriod?: 'monthly' | 'annual';
  firstUsed: boolean;
  currentPlan: PlanId;
  currentPlanEnd?: string;
  renewalFailure: boolean;
  storage: Record<PlanId, number>;
  onStorageChange: (plan: PlanId, gb: number) => void;
  onBuy: (plan: PlanId) => void;
  onHelp: () => void;
  children: ReactNode;
};

const features = [
  { name: '快速搜索', values: [true, true, true, true, true] },
  { name: '深度搜索', values: [true, true, true, true, true] },
  { name: '问答', values: [true, true, true, true, true] },
  { name: '信息流', values: [true, true, true, true, true] },
  { name: '调研综述', values: [false, false, true, true, true] },
  { name: 'Agent', values: [false, true, true, true, true] },
  { name: 'AI 索引', values: ['50K', '全部', '全部', '全部', '全部'] },
  { name: '基础高速存储', values: ['1 GB', '10 GB', '50 GB', '100 GB', '250 GB'] },
];

export function DomesticPricingLayout({ purchase, onPurchaseChange, active, upgraded, renewal, renewalPeriod, firstUsed, currentPlan, currentPlanEnd, renewalFailure, storage, onStorageChange, onBuy, onHelp, children }: Props) {
  const [topUpPlan, setTopUpPlan] = useState<PlanId>(currentPlan);
  useEffect(() => {
    if (active && domesticPlanRank(topUpPlan) < domesticPlanRank(currentPlan)) setTopUpPlan(currentPlan);
  }, [active, currentPlan, topUpPlan]);
  const topUpPrice = domesticTopUpPrice(topUpPlan);
  const topUpPlanName = domesticPlans.find((plan) => plan.id === topUpPlan)!.name;
  const currentRank = domesticPlanRank(currentPlan);
  const currentPlanDate = currentPlanEnd && !Number.isNaN(Date.parse(currentPlanEnd))
    ? new Date(currentPlanEnd).toLocaleDateString('zh-CN')
    : null;
  const restrictUpgrades = active;
  const visiblePlans = restrictUpgrades ? domesticPlans.filter((plan) => domesticPlanRank(plan.id) >= currentRank) : domesticPlans;
  const annualLocked = restrictUpgrades && renewalPeriod === 'annual';
  const continuousLocked = restrictUpgrades && renewal;
  const continuous = purchase !== 'single';
  const changePeriod = (period: 'monthly' | 'annual') => {
    if (annualLocked && period === 'monthly') return;
    onPurchaseChange(period === 'annual' ? 'annual' : continuous ? 'recurring' : 'single');
  };
  const toggleContinuous = () => {
    if (annualLocked || continuousLocked) return;
    onPurchaseChange(continuous ? 'single' : 'recurring');
  };
  return <div className="uber-pricing-page">
    <PricingStyles />
    <main className="page">
      <section aria-label="定价套餐">
        <div className="section-head domestic-pricing-head">
          <h2>定价与套餐</h2>
          <div className="section-controls domestic-pricing-controls">
            <div className="billing-toggle domestic" role="group" aria-label="付款周期">
              {!annualLocked && <button type="button" aria-pressed={purchase !== 'annual'} className={purchase !== 'annual' ? 'active' : ''} onClick={() => changePeriod('monthly')}>月付</button>}
              <button type="button" aria-pressed={purchase === 'annual'} className={purchase === 'annual' ? 'active' : ''} title="年付仅支持连续订阅" onClick={() => changePeriod('annual')}>年付 <span className="annual-benefit">更优惠</span></button>
            </div>
            <button type="button" role="switch" aria-label="连续订阅" aria-checked={continuous} disabled={annualLocked || continuousLocked} className={`domestic-renew-toggle ${continuous ? 'active' : ''}`} onClick={toggleContinuous} title={annualLocked ? '当前年付会员不可切换为月付或单次购买' : continuousLocked ? '当前连续订阅不可切换为单次购买' : purchase === 'annual' ? '关闭后改为月付单次购买' : undefined}>
              <span className="domestic-renew-track" aria-hidden="true" />
              <span>连续订阅</span>
              {!firstUsed && <span className="domestic-renew-offer">首月 8 折</span>}
            </button>
          </div>
        </div>
        {restrictUpgrades && <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">{annualLocked ? '当前为连续包年：购买付费等级时仅可向上升级，不支持切换为月付或单次购买。可在“会员与 Credits”取消续订，或另选立即降为 Free。' : continuousLocked ? '当前为连续包月：购买付费等级时仅可向上升级或改为年付，不支持切换为单次购买。可在“会员与 Credits”管理续订或降为 Free。' : upgraded ? '当前会员已经完成升级：不能购买更低付费等级；国内版可单独立即降为 Free 并模拟全额退款。' : '有效会员只能购买更高付费等级；降为 Free 是独立操作。'}</div>}
        <div className="pricing-grid domestic-pricing-grid" style={{ '--visible-plan-count': visiblePlans.length } as CSSProperties}>
          {visiblePlans.map((plan) => {
            const canUpgrade = active && domesticPlanRank(plan.id) > currentRank;
            const blockedByLevel = restrictUpgrades && !canUpgrade;
            const extraStorage = storageFee(plan.id, storage[plan.id]);
            const isFirstMonthOffer = purchase === 'recurring' && !firstUsed;
            const isFirstAnnualOffer = purchase === 'annual' && !firstUsed;
            const planPrice = domesticPurchasePrice(plan.id, purchase, firstUsed, storage[plan.id]);
            const annualTotal = planPrice.total;
            const displayPrice = purchase === 'annual'
              ? domesticPurchasePrice(plan.id, 'recurring', firstUsed, storage[plan.id]).total
              : planPrice.total;
            return <article key={plan.id} className={`plan ${plan.id === 'pro' ? 'featured' : plan.id === 'plus' ? 'plus' : plan.id === 'max5' ? 'max-x5' : 'max'}`}>
            <div className="plan-title-row"><h3>{plan.name}</h3>{(plan.id === 'plus' || plan.id === 'pro') && <span className="plan-tag">{plan.id === 'pro' ? '最受欢迎' : '日常研究'}</span>}</div>
            <p className="plan-subtitle">{plan.description}</p>
            <div className="price-action">
              {isFirstMonthOffer && <div className="price-offer"><span className="price-original">原价 ¥{plan.recurring + extraStorage}/月</span></div>}
              <p className="price"><strong>¥{displayPrice}</strong><span>{purchase === 'annual' ? firstUsed ? '月付价' : '月付首月价' : isFirstMonthOffer ? '首月' : '/ 月'}</span></p>
              {purchase === 'annual' ? <p className="muted">{isFirstAnnualOffer ? `首月减免 ¥${planPrice.discount} · 首年实付 ¥${annualTotal} · 次年 ¥${domesticAnnualTotalPrice(plan.id) + extraStorage * 12}/年` : `年付总计 ¥${annualTotal}`}</p> : isFirstMonthOffer ? <p className="muted">次月起 ¥{plan.recurring + extraStorage}/月</p> : null}
              <button type="button" className="plan-cta secondary" disabled={blockedByLevel} style={blockedByLevel ? { opacity: 0.55, cursor: 'not-allowed' } : undefined} onClick={() => onBuy(plan.id)}>{restrictUpgrades ? currentPlan === plan.id ? '当前会员' : `升级至 ${plan.name}` : active && !canUpgrade ? '查看升级方案' : `选择 ${plan.name}`}</button>
              {domesticStorageOptions[plan.id].length > 1 && <label className="mt-3 block text-sm">高速存储
                <select aria-label={`${plan.name} 高速存储`} disabled={blockedByLevel} value={storage[plan.id]} onChange={(e) => onStorageChange(plan.id, Number(e.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900">
                  {domesticStorageOptions[plan.id].map((gb) => <option key={gb} value={gb}>{gb} GB · {storageFee(plan.id, gb) ? `+¥${storageFee(plan.id, gb)}/月` : '基础存储'}</option>)}
                </select>
              </label>}
            </div>
            <div className="info-list">
              <div className="info-row"><span className="uber-info-label">每月积分</span><strong>{plan.credits}</strong></div>
              <div className="info-row"><span className="uber-info-label">高速存储空间</span><strong>{storage[plan.id]} GB</strong></div>
              {active && plan.id === currentPlan && currentPlanDate && <div className="info-row domestic-current-plan-date" role="status"><span>当前套餐 · {renewal && !renewalFailure ? '下次续费' : '权益到期'}</span><strong>{currentPlanDate}</strong></div>}
            </div>
          </article>;})}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">国内版 · 支付宝 · 演示价格，不会真实扣款。{purchase === 'single' ? '三种购买方式享有同等级会员权益。' : '连续订阅需主动同意协议；可在个人中心“会员与 Credits”取消订阅。'}</p>
      </section>

      <div className="mt-8">{children}</div>

      <section className="recharge-products-section" aria-label="充值包商品">
        <div className="recharge-products-grid"><article className="plan mini-pack">
          <div className="plan-title-row"><h3>10K Credits Pack</h3></div>
          <p className="plan-subtitle">唯一充值规格，价格按会员连续包月续费单价等比例计算</p>
          <div className="price-action"><p className="price"><strong>¥{topUpPrice.toFixed(2)}</strong><span>一次性 · {topUpPlanName} 会员价</span></p><p className="muted">{TOP_UP_CREDITS.toLocaleString()} Credits</p><button type="button" className="plan-cta" onClick={onHelp}>查看充值说明</button></div>
          <label className="mt-4 block text-sm text-slate-600">会员计价等级
            <select aria-label="充值包会员计价等级" value={topUpPlan} onChange={(event) => setTopUpPlan(event.target.value as PlanId)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900">
              {visiblePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · ¥{domesticTopUpPrice(plan.id).toFixed(2)}</option>)}
            </select>
          </label>
          <div className="info-list"><div className="info-row"><span>包含积分</span><strong>{TOP_UP_CREDITS.toLocaleString()}</strong></div><div className="info-row"><span>定价公式</span><strong>续费价 ÷ 月度积分 × 10,000</strong></div><div className="info-row"><span>有效期</span><strong>一年有效</strong></div></div>
        </article></div>
      </section>
      <section className="redeem-section" aria-label="兑换会员码">
        <h2>兑换会员码</h2><p className="redeem-note">不限量功能仅供个人正常使用。此处为演示入口，不会兑换真实会员权益。</p>
        <div className="redeem-ticket"><input className="redeem-input" defaultValue="WISP2025" aria-label="会员码" /><button type="button" className="redeem-button" onClick={onHelp}>兑换说明</button></div>
      </section>
      <section className={`compare ${restrictUpgrades ? 'domestic-compare-filtered' : ''}`} aria-label="套餐对比">
        <div className="section-head"><h2>套餐对比</h2></div>
        <div className="table-shell"><table><thead><tr><th>订阅计划</th>{!restrictUpgrades && <th>Free</th>}{visiblePlans.map((plan) => { const canUpgrade = active && domesticPlanRank(plan.id) > currentRank; return <th key={plan.id}>{plan.name}<button type="button" className="table-plan-action" disabled={restrictUpgrades && !canUpgrade} onClick={() => onBuy(plan.id)}>{restrictUpgrades ? canUpgrade ? '升级 ↗' : '当前会员' : '选择 ↗'}</button></th>; })}</tr></thead>
          <tbody>{features.map((feature) => <tr key={feature.name}><td>{feature.name}</td>{!restrictUpgrades && <td>{typeof feature.values[0] === 'boolean' ? <span className={feature.values[0] ? 'uber-check' : 'uber-minus'} aria-label={feature.values[0] ? '包含' : '不包含'}>{feature.values[0] ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</span> : feature.values[0]}</td>}{visiblePlans.map((plan) => { const value = feature.values[domesticPlanRank(plan.id) + 1]; return <td key={plan.id}>{typeof value === 'boolean' ? <span className={value ? 'uber-check' : 'uber-minus'} aria-label={value ? '包含' : '不包含'}>{value ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</span> : value}</td>; })}</tr>)}</tbody>
        </table></div>
      </section>
      <section className="faq" aria-label="定价常见问题">
        <h2>定价常见问题</h2><div className="faq-list">
          {[
            ['月卡与连续订阅有什么区别？', '同等级会员权益相同。月卡只支付一次；连续包月或包年需主动授权，并按订单列明的金额及周期续费。'],
            ['如何取消订阅？', '连续订阅用户可在个人中心“会员与 Credits”取消订阅。本期权益保留至到期，之后降级为 Free，已支付费用不退还；单次购买到期自动结束，无需取消。'],
            ['国内版如何立即降级为 Free？', '可在个人中心“会员与 Credits”底部选择“降级为 Free”。原型会立即结束本期权益并生成模拟全额退款订单；这与仅停止下周期续费的“取消订阅”不同。'],
            ['扣费前会收到提醒吗？', '原型展示续费前 5 日的提醒预览，包含续费金额、日期及降级入口，不实际发送短信或邮件。'],
            ['积分不足会自动扣费吗？', '不会。积分包需单独购买，不会因积分不足自动充值。月度积分按周期发放，到期未使用余额将失效。'],
            ['选择更多高速存储后，优惠会变化吗？', '不会。超出套餐基础容量的部分按每 10 GB 每月 ¥6 加价，单月、首月和后续续费均增加相同金额，会员优惠金额保持不变。存储随会员统一续期。Plus 保留 10 GB 基础容量。'],
          ].map(([question, answer]) => <div className="faq-row" key={question}><h3>{question}</h3><p>{answer}</p></div>)}
        </div>
      </section>
    </main>
  </div>;
}
