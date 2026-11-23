import { FreePlanCard, MembershipPlanCard, StorageChoice } from './MembershipPlanCard';
import { commonToolComparisonRows, comparisonRowOrder, modelAccess, researchComparisonRows } from './pricingBenefits';
import { CreditTopUpDrawer } from './CreditTopUpDrawer';
import { PricingStyles } from './PricingStyles';
import React from 'react';
import { Check, Minus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { domesticPlanRank, useBilling } from '../contexts/BillingContext';
import { DomesticBilling } from './DomesticBilling';
import { planPrices, maxPlans } from '../utils/pricingPlans';
import type { PlanId } from '../contexts/BillingContext';
import type { PricingPaymentMethodId } from '../utils/pricingPaymentMethods';
import { MembershipSummary, PaymentMethodSelector } from './PricingAccount';
import { PricingCheckout, type PricingQuote } from './PricingCheckout';

type BillingCycle = 'monthly' | 'annual';
type LocalizedText = { zh: string; en: string };
type LocalizedPrice = { zh: number; en: number };
type ComparisonValue = boolean | string | LocalizedText;
type StoragePlanKey = 'pro' | 'maxX2' | 'maxX5';
type MaxTier = 'x2' | 'x5';

const ANNUAL_STORAGE_DISCOUNT = 0.85;
const STORAGE_OPTIONS: Record<StoragePlanKey, number[]> = {
  pro: [50, 75, 100],
  maxX2: [100, 150, 200, 250],
  maxX5: [250, 500, 750, 1000],
};

const formatStorage = (storageGb: number) => {
  if (storageGb < 1000) return `${storageGb} GB`;
  const storageTb = storageGb / 1000;
  return `${Number.isInteger(storageTb) ? storageTb : Number(storageTb.toFixed(1))} TB`;
};

const getExtraStoragePrice = (
  storageGb: number,
  baseStorageGb: number,
  language: 'zh' | 'en',
) => (Math.max(storageGb - baseStorageGb, 0) / 10) * (language === 'zh' ? 6 : 1);

const formatCurrency = (amount: number, language: 'zh' | 'en') => {
  const formattedAmount = amount.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 2,
  });
  return language === 'zh' ? `¥${formattedAmount}` : `$${formattedAmount}`;
};

const formatPlanPrice = (
  price: LocalizedPrice,
  language: 'zh' | 'en',
  storageGb?: number,
  baseStorageGb?: number,
  storageDiscount = 1,
  roundUp = false,
) => {
  const total = price[language] + (
    storageGb !== undefined && baseStorageGb !== undefined
      ? getExtraStoragePrice(storageGb, baseStorageGb, language) * storageDiscount
      : 0
  );

  return formatCurrency(roundUp ? Math.ceil(total) : total, language);
};

const formatAnnualTotal = (
  price: LocalizedPrice,
  language: 'zh' | 'en',
  storageGb?: number,
  baseStorageGb?: number,
) => {
  const total = price[language] + (
    storageGb !== undefined && baseStorageGb !== undefined
      ? getExtraStoragePrice(storageGb, baseStorageGb, language) * 12 * ANNUAL_STORAGE_DISCOUNT
      : 0
  );

  return formatCurrency(Math.ceil(total), language);
};

const formatStoragePrice = (
  storageGb: number,
  baseStorageGb: number,
  language: 'zh' | 'en',
  isAnnual: boolean,
) => {
  const extraStorageGb = Math.max(storageGb - baseStorageGb, 0);

  if (extraStorageGb === 0) {
    return language === 'zh' ? '基础存储' : 'Base storage';
  }

  const price = getExtraStoragePrice(storageGb, baseStorageGb, language) * (isAnnual ? ANNUAL_STORAGE_DISCOUNT : 1);
  return language === 'zh'
    ? `+${formatCurrency(price, language)} / 月`
    : `+${formatCurrency(price, language)} / mo`;
};

const copy = (text: LocalizedText, language: 'zh' | 'en') => text[language];

const comparisonRows = [
  modelAccess,
  ...researchComparisonRows,
  ...commonToolComparisonRows,
  { label: { zh: '基础高速存储', en: 'Base high-speed storage' }, free: '1GB', plus: '10GB', pro: '50GB', maxX2: '100GB', maxX5: '250GB' },
  { label: { zh: '额外充值折扣', en: 'Top-up discount' }, free: false, plus: { zh: '8.8 折', en: '12% off' }, pro: { zh: '5 折', en: '50% off' }, maxX2: { zh: '5 折', en: '50% off' }, maxX5: { zh: '5 折', en: '50% off' } },
].sort((a, b) => comparisonRowOrder(a.label.zh) - comparisonRowOrder(b.label.zh));

function Availability({ value, language }: { value: ComparisonValue; language: 'zh' | 'en' }) {
  if (value === true) {
    return (
      <span className="uber-check" aria-label={language === 'zh' ? '包含' : 'Included'}>
        <Check className="h-4 w-4" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="uber-minus" aria-label={language === 'zh' ? '不包含' : 'Not included'}>
        <Minus className="h-4 w-4" />
      </span>
    );
  }

  return <span className="uber-table-value">{typeof value === 'string' ? value : copy(value, language)}</span>;
}

interface PricingPageProps {
  onOpenRecharge?: (language?: 'zh' | 'en') => void;
  language?: 'zh' | 'en';
  upgradeOnly?: boolean;
}

export function PricingPage({ onOpenRecharge, language: controlledLanguage, upgradeOnly = false }: PricingPageProps) {
  const { market, revision } = useBilling();
  if (market === 'domestic') return <DomesticBilling upgradeOnly={upgradeOnly} onOpenRecharge={onOpenRecharge} />;
  return <InternationalPricingPage key={revision} onOpenRecharge={onOpenRecharge} language={controlledLanguage} />;
}

function InternationalPricingPage({ onOpenRecharge, language: controlledLanguage }: PricingPageProps) {
  const { language: contextLanguage } = useLanguage();
  const language = controlledLanguage ?? contextLanguage;
  const { subscription } = useBilling();
  const active = Boolean(subscription.end && Date.parse(subscription.end) > Date.now());
  const currentRank = active ? domesticPlanRank(subscription.plan) : -1;
  const [paymentMethod, setPaymentMethod] = React.useState<PricingPaymentMethodId>(subscription.paymentMethod ?? 'airwallex');
  const [checkout, setCheckout] = React.useState<PricingQuote | null>(null);
  const checkoutTrigger = React.useRef<HTMLButtonElement | null>(null);
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>(active ? subscription.renewalPeriod ?? 'monthly' : 'monthly');
  const [maxTier, setMaxTier] = React.useState<MaxTier>(active && subscription.plan === 'max5' ? 'x5' : 'x2');
  React.useEffect(() => {
    if (active && (subscription.plan === 'max' || subscription.plan === 'max5')) {
      setMaxTier(subscription.plan === 'max5' ? 'x5' : 'x2');
    }
  }, [active, subscription.plan]);
  const [planStorage, setPlanStorage] = React.useState<Record<StoragePlanKey, number>>(() => {
    const initial = { pro: 50, maxX2: 100, maxX5: 250 };
    const key = subscription.plan === 'max' ? 'maxX2' : subscription.plan === 'max5' ? 'maxX5' : subscription.plan;
    if (active && key !== 'plus' && subscription.storageGb && STORAGE_OPTIONS[key].includes(subscription.storageGb)) initial[key] = subscription.storageGb;
    return initial;
  });
  const isAnnual = billingCycle === 'annual';
  const text = (localized: LocalizedText) => copy(localized, language);
  const selectedMaxTier = active && subscription.plan === 'max5' ? 'x5' : maxTier;
  const activeMaxPlan = maxPlans[selectedMaxTier];
  const activeMaxStorageKey: StoragePlanKey = selectedMaxTier === 'x2' ? 'maxX2' : 'maxX5';
  const activeMaxBaseStorage = selectedMaxTier === 'x2' ? 100 : 250;
  const activeMaxName = selectedMaxTier === 'x2' ? 'Max x2' : 'Max x5';
  const plans = [
    {
      id: 'plus', variant: 'plus', name: 'Plus', badge: undefined,
      ...planPrices.plus, base: 10, credits: '20,000', storageKey: null,
      description: text({ zh: '适合每周稳定检索和轻量问答', en: 'For steady weekly search and lightweight QA' }),
    },
    {
      id: 'pro', variant: 'featured', name: 'Pro', badge: text({ zh: '最受欢迎', en: 'Most popular' }),
      ...planPrices.pro, base: 50, credits: '200,000', storageKey: 'pro',
      description: text({ zh: '最适合日常深度研究和 Agent 任务', en: 'Best for daily deep research and Agent tasks' }),
    },
    {
      id: selectedMaxTier === 'x2' ? 'max' : 'max5', variant: 'max', name: activeMaxName, badge: undefined,
      monthly: activeMaxPlan.price, annual: activeMaxPlan.annualPrice, annualTotal: activeMaxPlan.annualTotal,
      base: activeMaxBaseStorage, credits: activeMaxPlan.monthly, storageKey: activeMaxStorageKey,
      description: text({ zh: '高频 Agent 使用、多项目协作和高存储需求', en: 'For frequent Agent usage, multi-project collaboration, and high storage needs' }),
    },
  ] as const;
  const visiblePlans = plans.filter(plan => domesticPlanRank(plan.id) >= currentRank);
  const openCheckout = (plan: PlanId, trigger: HTMLButtonElement) => {
    const key = plan === 'max' ? 'maxX2' : plan === 'max5' ? 'maxX5' : plan;
    const max = plan === 'max' ? maxPlans.x2 : maxPlans.x5;
    const base = plan === 'plus' ? 10 : plan === 'pro' ? 50 : plan === 'max' ? 100 : 250;
    const storage = key === 'plus' ? base : planStorage[key];
    const config = plan === 'plus' || plan === 'pro' ? planPrices[plan] : { monthly: max.price, annualTotal: max.annualTotal };
    const extra = getExtraStoragePrice(storage, base, language);
    const amount = isAnnual ? Math.ceil(config.annualTotal[language] + extra * 12 * ANNUAL_STORAGE_DISCOUNT) : config.monthly[language] + extra;
    checkoutTrigger.current = trigger;
    setCheckout({ plan, name: plan === 'plus' ? 'Plus' : plan === 'pro' ? 'Pro' : plan === 'max' ? 'Max x2' : 'Max x5', storage, cycle: billingCycle, amount });
  };

  return (
    <div className="uber-pricing-page">
      <PricingStyles />

      <main className="page">
        <section id="plans" tabIndex={-1} aria-label={text({ zh: '定价套餐', en: 'Pricing plans' })}>
          <div className="section-head">
            <h1>{text({ zh: '会员套餐', en: 'Pricing plans' })}</h1>
            <div className="section-controls">
              <div className="billing-toggle" role="group" aria-label={text({ zh: '计费周期', en: 'Billing cycle' })}>
                <button
                  type="button"
                  aria-pressed={!isAnnual}
                  className={billingCycle === 'monthly' ? 'active' : ''}
                  onClick={() => setBillingCycle('monthly')}
                >
                  {text({ zh: '月付', en: 'Monthly' })}
                </button>
                <button
                  type="button"
                  aria-pressed={isAnnual}
                  className={billingCycle === 'annual' ? 'active' : ''}
                  onClick={() => setBillingCycle('annual')}
                >
                  {text({ zh: '年付', en: 'Annual' })}
                  <span className="billing-discount">-15%</span>
                </button>
              </div>
            </div>
          </div>

          <div className="membership-grid tiered-membership-grid">
            {!active && <FreePlanCard language={language} current />}
            {visiblePlans.map(plan => {
              const storageKey = plan.storageKey;
              const storage = storageKey ? planStorage[storageKey] : plan.base;
              const storageLabel = text({ zh: '高速存储', en: 'High-speed storage' });
              const planId = plan.id;
              const isCurrent = active && subscription.plan === planId;
              return (
                <MembershipPlanCard key={plan.variant} variant={plan.variant}
                  language={language} plan={storageKey ?? 'plus'}
                  name={plan.variant === 'max' ? 'Max' : plan.name} badge={plan.badge}
                  topUp={isCurrent ? <CreditTopUpDrawer language={language} /> : undefined}
                  tierSwitch={plan.variant === 'max' && <div className="max-tier-switch" role="group" aria-label={text({ zh: 'Max 规格', en: 'Max tier' })}>
                    {(['x2', 'x5'] as const).filter(tier => domesticPlanRank(tier === 'x2' ? 'max' : 'max5') >= currentRank).map(tier => <button key={tier} type="button" aria-pressed={selectedMaxTier === tier}
                      className={selectedMaxTier === tier ? 'active' : ''} onClick={() => setMaxTier(tier)}>{tier}</button>)}
                  </div>}
                  price={isAnnual ? formatAnnualTotal(plan.annualTotal, language, storage, plan.base) : formatPlanPrice(plan.monthly, language, storage, plan.base)}
                  unit={isAnnual ? text({ zh: '/ 年', en: '/ year' }) : text({ zh: '/ 月', en: '/ month' })}
                  credits={plan.credits}
                  description={plan.description}
                  storage={<StorageChoice title={storageLabel}
                    label={`${plan.name} ${storageLabel}`} options={storageKey ? STORAGE_OPTIONS[storageKey] : [plan.base]}
                    value={storage} formatCapacity={formatStorage} formatFee={gb => formatStoragePrice(gb, plan.base, language, isAnnual)}
                    onChange={gb => storageKey && setPlanStorage(current => ({ ...current, [storageKey]: gb }))} />}
                  action={<button type="button" className="plan-cta secondary" disabled={isCurrent}
                    onClick={event => openCheckout(planId, event.currentTarget)}>
                    {isCurrent ? text({ zh: '当前套餐', en: 'Current plan' }) : text({ zh: `选择 ${plan.name}`, en: `Choose ${plan.name}` })}
                  </button>}
                >
                </MembershipPlanCard>
              );
            })}
          </div>

          <div className="pricing-account-slot" id="pricing-account" tabIndex={-1}>
            {active
              ? <MembershipSummary subscription={subscription} language={language} />
              : <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} language={language} />}
          </div>
        </section>

        <section className="redeem-section" aria-label={text({ zh: '兑换会员码', en: 'Redeem membership code' })}>
          <h2>{text({ zh: '兑换会员码', en: 'Redeem membership code' })}</h2>
          <div className="redeem-ticket">
            <input className="redeem-input" placeholder={text({ zh: '输入会员码', en: 'Enter membership code' })} aria-label={text({ zh: '会员码', en: 'Membership code' })} />
            <button type="button" className="redeem-button">{text({ zh: '立即兑换', en: 'Redeem Now' })}</button>
          </div>
        </section>

        <section className="compare" aria-labelledby="compare-title">
          <div className="section-head">
            <h2 id="compare-title">{text({ zh: '套餐权益对比', en: 'Compare plans' })}</h2>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>{text({ zh: '订阅计划', en: 'Subscription plan' })}</th>
                  <th>Free</th>
                  <th>Plus<button type="button" className="table-plan-action" disabled={active && subscription.plan === 'plus'} onClick={event => openCheckout('plus', event.currentTarget)}>{active && subscription.plan === 'plus' ? text({ zh: '当前套餐', en: 'Current plan' }) : text({ zh: '选择 ↗', en: 'Choose ↗' })}</button></th>
                  <th>Pro<button type="button" className="table-plan-action" disabled={active && subscription.plan === 'pro'} onClick={event => openCheckout('pro', event.currentTarget)}>{active && subscription.plan === 'pro' ? text({ zh: '当前套餐', en: 'Current plan' }) : text({ zh: '选择 ↗', en: 'Choose ↗' })}</button></th>
                  <th>Max x2<button type="button" className="table-plan-action" disabled={active && subscription.plan === 'max'} onClick={event => openCheckout('max', event.currentTarget)}>{active && subscription.plan === 'max' ? text({ zh: '当前套餐', en: 'Current plan' }) : text({ zh: '选择 ↗', en: 'Choose ↗' })}</button></th>
                  <th>Max x5<button type="button" className="table-plan-action" disabled={active && subscription.plan === 'max5'} onClick={event => openCheckout('max5', event.currentTarget)}>{active && subscription.plan === 'max5' ? text({ zh: '当前套餐', en: 'Current plan' }) : text({ zh: '选择 ↗', en: 'Choose ↗' })}</button></th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label.en}>
                    <td>{text(row.label)}</td>
                    <td><Availability value={row.free} language={language} /></td>
                    <td><Availability value={row.plus} language={language} /></td>
                    <td><Availability value={row.pro} language={language} /></td>
                    <td><Availability value={row.maxX2} language={language} /></td>
                    <td><Availability value={row.maxX5} language={language} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">{text({ zh: '定价常见问题', en: 'Pricing FAQ' })}</h2>
          <div className="faq-list">
            <details className="faq-row" open><summary>{text({ zh: '积分如何消耗？', en: 'How are credits consumed?' })}</summary>
              <p>{text({ zh: '积分用于 Search、Survey、QA、Feeds 和 Agent 等任务，不同任务会根据复杂度消耗不同积分。', en: 'Credits are used for Search, Survey, QA, Feeds, Agent, and related tasks. Each task consumes credits based on complexity.' })}</p>
            </details>
            <details className="faq-row"><summary>{text({ zh: '高速存储和归档存储有什么区别？', en: 'What is the difference between high-speed and archive storage?' })}</summary>
              <p>{text({ zh: '高速存储用于近期活跃文件，可被 Reader、QA、Survey 和 Agent 快速调用；归档存储用于长期保存低频文件，恢复到高速存储后才能用于高频任务。', en: 'High-speed storage keeps active files ready for Reader, QA, Survey, and Agent. Archive storage keeps lower-frequency files long term and requires restoration before high-frequency tasks.' })}</p>
            </details>
            <details className="faq-row"><summary>{text({ zh: '文件什么时候会自动归档？', en: 'When are files archived automatically?' })}</summary>
              <p>{text({ zh: '文件进入高速存储满 6 个月后会自动迁移至归档存储并释放额度；恢复文件后，6 个月保留期将重新计算。', en: 'Files move to archive storage after six months in high-speed storage, releasing capacity. Restoring a file restarts the six-month period.' })}</p>
            </details>
            <details className="faq-row"><summary>{text({ zh: '高速存储规格如何计费和调整？', en: 'How is the high-speed storage tier billed and changed?' })}</summary>
              <p>{text({ zh: '存储规格与会员套餐使用相同支付方式，并随会员统一续期。升级容量立即生效；降低容量将在下个计费周期生效。', en: 'The storage tier uses the membership payment method and renews with the plan. Upgrades take effect immediately; reductions take effect next cycle.' })}</p>
            </details>
            <details className="faq-row"><summary>{text({ zh: '充值包和套餐积分有什么区别？', en: 'How are top-up packs different from plan credits?' })}</summary>
              <p>{text({ zh: '套餐积分按周期发放，充值包用于按需补充 Credits；付费套餐可享对应充值折扣。', en: 'Plan credits are issued by billing cycle. Top-up packs add Credits on demand, and paid plans receive their corresponding top-up discounts.' })}</p>
            </details>
          </div>
        </section>
      </main>
      {checkout && <PricingCheckout quote={checkout} language={language} method={paymentMethod}
        onMethodChange={setPaymentMethod} onClose={() => setCheckout(null)}
        returnFocus={() => { const target = checkoutTrigger.current; if (target && !target.disabled) target.focus(); else document.getElementById('pricing-account')?.focus(); }} />}
    </div>
  );
}
