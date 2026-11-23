import { domesticPlans, domesticTopUpPrice, TOP_UP_CREDITS, type Market, type PlanId, type Subscription } from '../contexts/BillingContext';
import { maxPlans, planPrices } from './pricingPlans';

export function canPurchaseCreditTopUp(subscription: Pick<Subscription, 'plan' | 'end'>, now = Date.now()) {
  return domesticPlans.some(plan => plan.id === subscription.plan)
    && Boolean(subscription.end && Date.parse(subscription.end) > now);
}

export function getCreditTopUpQuote(market: Market, planId: PlanId, language: 'zh' | 'en') {
  const plan = domesticPlans.find(item => item.id === planId)!;
  const overseasPrice = planId === 'plus' || planId === 'pro'
    ? planPrices[planId].monthly
    : maxPlans[planId === 'max5' ? 'x5' : 'x2'].price;
  const monthlyCredits = planId === 'plus' ? 20_000 : Number(plan.credits.replaceAll(',', ''));
  const amount = market === 'domestic'
    ? domesticTopUpPrice(planId)
    : Math.round(((overseasPrice[language] / monthlyCredits) * TOP_UP_CREDITS + 1e-9) * 100) / 100;
  const currency = market === 'domestic' || language === 'zh' ? '¥' : '$';
  return { planId, planName: plan.name, amount, formattedAmount: `${currency}${amount.toFixed(2)}` };
}

export function getCreditTopUpOffer(market: Market, subscription: Pick<Subscription, 'plan' | 'end'>, language: 'zh' | 'en', now = Date.now()) {
  const isMember = canPurchaseCreditTopUp(subscription, now);
  const quote = isMember
    ? getCreditTopUpQuote(market, subscription.plan, language)
    : domesticPlans.map(plan => getCreditTopUpQuote(market, plan.id, language))
      .reduce((lowest, candidate) => candidate.amount < lowest.amount ? candidate : lowest);
  return {
    ...quote,
    isMember,
    label: isMember ? `${quote.planName} ${language === 'zh' ? '会员价' : 'member price'}` : (language === 'zh' ? '会员专享价' : 'Member pricing'),
    displayAmount: isMember ? quote.formattedAmount : (language === 'zh' ? `${quote.formattedAmount} 起` : `From ${quote.formattedAmount}`),
  };
}
