import type { ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { modelAccess, researchBenefits, type MembershipTier } from './pricingBenefits';

type PlanCardProps = {
  variant: 'free' | 'plus' | 'featured' | 'max';
  plan: MembershipTier;
  language: 'zh' | 'en';
  name: string;
  badge?: string;
  tierSwitch?: ReactNode;
  price: string;
  unit: string;
  billingNote?: ReactNode;
  credits?: string;
  description: string;
  storage: ReactNode;
  children?: ReactNode;
  action: ReactNode;
  topUp?: ReactNode;
};

export function MembershipPlanCard({ variant, plan, language, name, badge, tierSwitch, price, unit, billingNote, credits, description, storage, children, action, topUp }: PlanCardProps) {
  return (
    <div className={`membership-plan-column${topUp ? ' has-top-up' : ''}`}>
    <article className={`plan ${variant}`} lang={language}>
      <div className="plan-title-row">
        <h3>{name}</h3>
        {badge && <span className="plan-tag">{badge}</span>}
        {tierSwitch}
      </div>
      <p className="plan-subtitle">{description}</p>
      <div className="plan-amount">
        <p className="price"><strong>{price}</strong><span>{unit}</span></p>
        {billingNote && <p className="member-billing-note">{billingNote}</p>}
        {credits && <p className="member-credit-allowance"><strong>{credits}</strong><span>{language === 'zh' ? '积分 / 月' : 'credits / month'}</span></p>}
      </div>
      <div className="member-action">{action}</div>
      {storage}
      <ul className="member-benefits">
        {children}
        <PlanBenefit label={modelAccess.label[language]}>{modelAccess[plan]}</PlanBenefit>
      </ul>
      <div className="member-features">
        <ul className="member-benefits member-tools" aria-label={language === 'zh' ? '功能权益' : 'Included tools'}>
          {researchBenefits.filter(feature => feature[plan]).map(feature => (
            <PlanBenefit key={feature.label.en} exclusive={Boolean(feature.exclusive)} supplementary={feature.supplementary} withCheck>
              <span className="member-tool-copy">{feature.label[language]}
                {feature.limits?.[plan] && <small className="member-tool-limit" aria-label={language === 'en' ? `Up to ${feature.limits[plan]} papers` : undefined}>{language === 'zh' ? `最多 ${feature.limits[plan]} 篇` : `≤ ${feature.limits[plan]}`}</small>}
              </span>
            </PlanBenefit>
          ))}
        </ul>
      </div>
    </article>
    {topUp}
    </div>
  );
}

export function PlanBenefit({ children, exclusive, supplementary, label, withCheck }: { children: ReactNode; exclusive?: boolean; supplementary?: boolean; label?: ReactNode; withCheck?: boolean }) {
  return <li className={[exclusive ? 'exclusive-benefit' : '', supplementary ? 'member-perk' : ''].filter(Boolean).join(' ') || undefined}>
    {withCheck && <Check className="benefit-check" size={14} strokeWidth={1.8} aria-hidden="true" />}
    {label ? <><span className="member-detail-label">{label}</span><span className="member-detail-value">{children}</span></> : children}
  </li>;
}

export function FreePlanCard({ language, current }: { language: 'zh' | 'en'; current: boolean }) {
  const zh = language === 'zh';
  return <MembershipPlanCard variant="free" plan="free" language={language} name="Free"
    price={zh ? '¥0' : '$0'} unit={zh ? '/ 月' : '/ month'}
    credits="2,000"
    description={zh ? '体验基础研究功能' : 'Start with essential research tools'}
    storage={<StorageChoice title={zh ? '高速存储' : 'High-speed storage'} label="Free storage" options={[1]} value={1} formatCapacity={gb => `${gb} GB`} formatFee={() => ''} onChange={() => {}} />}
    action={<button type="button" className="plan-cta secondary" disabled>{current ? zh ? '当前套餐' : 'Current plan' : zh ? '免费版' : 'Free plan'}</button>} />;
}

type StorageChoiceProps = {
  title: string;
  label: string;
  options: readonly number[];
  value: number;
  formatCapacity: (gb: number) => string;
  formatFee: (gb: number) => string;
  disabled?: boolean;
  onChange: (gb: number) => void;
};

export function StorageChoice({ title, label, options, value, formatCapacity, formatFee, disabled, onChange }: StorageChoiceProps) {
  const selectable = options.length > 1;
  return (
    <div className={`member-storage${selectable ? ' selectable' : ''}${disabled ? ' disabled' : ''}`}>
      <span aria-hidden={selectable || undefined}>{title} {formatCapacity(value)}</span>
      {selectable && (
        <>
          <select aria-label={label} value={value} disabled={disabled}
            onChange={event => onChange(Number(event.currentTarget.value))}>
            {options.map(gb => (
              <option key={gb} value={gb}>{formatCapacity(gb)} · {formatFee(gb)}</option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
