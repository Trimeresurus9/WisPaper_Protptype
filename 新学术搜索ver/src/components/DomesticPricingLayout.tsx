import { useState, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { useBilling, domesticAnnualTotalPrice, domesticPlanRank, domesticPlans, domesticPurchasePrice, domesticStorageOptions, storageFee, type DomesticPurchaseMode, type PlanId } from '../contexts/BillingContext';
import { FreePlanCard, MembershipPlanCard, StorageChoice } from './MembershipPlanCard';
import { commonToolComparisonRows, comparisonRowOrder, modelAccess, researchComparisonRows } from './pricingBenefits';
import { CreditTopUpDrawer } from './CreditTopUpDrawer';
import { PricingStyles } from './PricingStyles';
import { MembershipSummary } from './PricingAccount';

type Props = {
  purchase: DomesticPurchaseMode;
  onPurchaseChange: (purchase: DomesticPurchaseMode) => void;
  active: boolean;
  upgraded: boolean;
  renewal: boolean;
  renewalPeriod?: 'monthly' | 'annual';
  firstUsed: boolean;
  currentPlan: PlanId;
  storage: Record<PlanId, number>;
  onStorageChange: (plan: PlanId, gb: number) => void;
  onBuy: (plan: PlanId) => void;
  onHelp: () => void;
  onOpenRecharge?: (language?: 'zh' | 'en') => void;
  children: ReactNode;
};

const features = [
  ...[modelAccess, ...researchComparisonRows, ...commonToolComparisonRows].map(row => ({
    name: row.label.zh, values: [row.free, row.plus, row.pro, row.maxX2, row.maxX5].map(value => typeof value === 'object' ? value.zh : value),
  })),
  { name: '基础高速存储', values: ['1 GB', '10 GB', '50 GB', '100 GB', '250 GB'] },
].sort((a, b) => comparisonRowOrder(a.name) - comparisonRowOrder(b.name));

export function DomesticPricingLayout({ purchase, onPurchaseChange, active, upgraded, renewal, renewalPeriod, firstUsed, currentPlan, storage, onStorageChange, onBuy, onHelp, onOpenRecharge, children }: Props) {
  const { subscription } = useBilling();
  const [maxTier, setMaxTier] = useState<'max' | 'max5'>(currentPlan === 'max5' ? 'max5' : 'max');
  const currentRank = domesticPlanRank(currentPlan);
  const restrictUpgrades = active;
  const visiblePlans = restrictUpgrades ? domesticPlans.filter((plan) => domesticPlanRank(plan.id) >= currentRank) : domesticPlans;
  const selectedMax = restrictUpgrades && currentPlan === 'max5' ? 'max5' : maxTier;
  const cardPlans = visiblePlans.filter(plan => plan.id === 'plus' || plan.id === 'pro' || plan.id === selectedMax);
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
      <section id="plans" aria-label="定价套餐">
        <div className="section-head domestic-pricing-head">
          <h1>会员套餐</h1>
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
        <div className="membership-grid tiered-membership-grid">
          {!active && <FreePlanCard language="zh" current />}
          {cardPlans.map((plan) => {
            const canUpgrade = active && domesticPlanRank(plan.id) > currentRank;
            const blockedByLevel = restrictUpgrades && !canUpgrade;
            const extraStorage = storageFee(plan.id, storage[plan.id]);
            const isFirstMonthOffer = purchase === 'recurring' && !firstUsed;
            const isFirstAnnualOffer = purchase === 'annual' && !firstUsed;
            const planPrice = domesticPurchasePrice(plan.id, purchase, firstUsed, storage[plan.id]);
            const displayPrice = planPrice.total.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
            const isMax = plan.id === 'max' || plan.id === 'max5';
            const unit = purchase === 'annual' ? (isFirstAnnualOffer ? '/ 首年' : '/ 年') : (isFirstMonthOffer ? '/ 首月' : '/ 月');
            const billingNote = purchase === 'annual'
              ? (isFirstAnnualOffer && `次年 ¥${(domesticAnnualTotalPrice(plan.id) + extraStorage * 12).toLocaleString('zh-CN')} / 年`)
              : isFirstMonthOffer && <><s>原价 ¥{plan.recurring + extraStorage}/月</s> · 次月起 ¥{plan.recurring + extraStorage}/月</>;
            return (
              <MembershipPlanCard
                key={isMax ? 'max-tier' : plan.id}
                variant={isMax ? 'max' : plan.id === 'pro' ? 'featured' : 'plus'}
                language="zh" plan={plan.id === 'max' ? 'maxX2' : plan.id === 'max5' ? 'maxX5' : plan.id}
                name={isMax ? 'Max' : plan.name}
                topUp={active && currentPlan === plan.id ? <CreditTopUpDrawer language="zh" /> : undefined}
                badge={blockedByLevel ? '当前会员' : plan.id === 'pro' ? '最受欢迎' : undefined}
                tierSwitch={isMax && <div className="max-tier-switch" role="group" aria-label="Max 规格">
                  {visiblePlans.filter(item => item.id === 'max' || item.id === 'max5').map(item => (
                    <button key={item.id} type="button" aria-pressed={item.id === selectedMax}
                      className={item.id === selectedMax ? 'active' : ''} onClick={() => setMaxTier(item.id === 'max5' ? 'max5' : 'max')}>
                      {item.id === 'max5' ? 'x5' : 'x2'}
                    </button>
                  ))}
                </div>}
                price={`¥${displayPrice}`} unit={unit} billingNote={billingNote} credits={plan.credits} description={plan.description}
                storage={<StorageChoice title="高速存储" label={`${plan.name} 高速存储`}
                  options={domesticStorageOptions[plan.id]} value={storage[plan.id]} formatCapacity={gb => `${gb} GB`}
                  formatFee={gb => storageFee(plan.id, gb) ? `+¥${storageFee(plan.id, gb)}/月` : '基础存储'}
                  disabled={blockedByLevel} onChange={gb => onStorageChange(plan.id, gb)} />}
                action={<button type="button" className="plan-cta secondary" disabled={blockedByLevel} onClick={() => onBuy(plan.id)}>
                  {blockedByLevel ? '当前会员' : `${active ? '升级至' : '选择'} ${plan.name}`}
                </button>}
              />
            );
          })}
        </div>
        {active && <div className="pricing-account-slot"><MembershipSummary subscription={subscription} language="zh" /></div>}
      </section>

      <div className="pricing-management">{children}</div>

      <section className="redeem-section" aria-label="兑换会员码">
        <h2>兑换会员码</h2>
        <div className="redeem-ticket"><input className="redeem-input" placeholder="输入会员码" aria-label="会员码" /><button type="button" className="redeem-button" onClick={onHelp}>兑换说明</button></div>
      </section>
      <section className={`compare ${restrictUpgrades ? 'domestic-compare-filtered' : ''}`} aria-label="套餐对比">
        <div className="section-head"><h2>套餐权益对比</h2></div>
        <div className="table-shell"><table><thead><tr><th>订阅计划</th><th>Free</th>{visiblePlans.map((plan) => { const canUpgrade = active && domesticPlanRank(plan.id) > currentRank; return <th key={plan.id}>{plan.name}<button type="button" className="table-plan-action" disabled={restrictUpgrades && !canUpgrade} onClick={() => onBuy(plan.id)}>{restrictUpgrades ? canUpgrade ? '升级 ↗' : '当前会员' : '选择 ↗'}</button></th>; })}</tr></thead>
          <tbody>{features.map((feature) => <tr key={feature.name}><td>{feature.name}</td><td>{typeof feature.values[0] === 'boolean' ? <span className={feature.values[0] ? 'uber-check' : 'uber-minus'} aria-label={feature.values[0] ? '包含' : '不包含'}>{feature.values[0] ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</span> : feature.values[0]}</td>{visiblePlans.map((plan) => { const value = feature.values[domesticPlanRank(plan.id) + 1]; return <td key={plan.id}>{typeof value === 'boolean' ? <span className={value ? 'uber-check' : 'uber-minus'} aria-label={value ? '包含' : '不包含'}>{value ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</span> : value}</td>; })}</tr>)}</tbody>
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
           ].map(([question, answer], index) => <details className="faq-row" key={question} open={index === 0}>
            <summary>{question}</summary><p>{answer}</p>
          </details>)}
        </div>
      </section>
    </main>
  </div>;
}
