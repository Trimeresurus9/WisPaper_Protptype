import React, { createContext, useContext, useState } from 'react';

export const domesticPlans = [
  { id: 'plus', name: 'Plus', first: 28, recurring: 35, single: 35, annualMonthly: 30, annualTotal: 360, credits: '10,000', storage: '10 GB', description: '适合日常搜索与文献阅读' },
  { id: 'pro', name: 'Pro', first: 120, recurring: 150, single: 150, annualMonthly: 105, annualTotal: 1260, credits: '200,000', storage: '50 GB', description: '适合深度研究与日常 Agent 任务' },
  { id: 'max', name: 'Max x2', first: 240, recurring: 300, single: 300, annualMonthly: 225, annualTotal: 2700, credits: '400,000', storage: '100 GB', description: '适合高频 Agent 任务与大容量存储' },
  { id: 'max5', name: 'Max x5', first: 600, recurring: 750, single: 750, annualMonthly: 565, annualTotal: 6780, credits: '1,000,000', storage: '250 GB', description: '适合超高频 Agent 任务与大容量存储' },
] as const;
export type PlanId = typeof domesticPlans[number]['id'];
export type DomesticPurchaseMode = 'single' | 'recurring' | 'annual';
export const domesticPlanRank = (planId: PlanId) => domesticPlans.findIndex((plan) => plan.id === planId);
export const domesticAnnualMonthlyPrice = (planId: PlanId) => {
  const plan = domesticPlans.find((item) => item.id === planId)!;
  return plan.annualMonthly;
};
export const domesticAnnualTotalPrice = (planId: PlanId) => domesticPlans.find((item) => item.id === planId)!.annualTotal;
export const TOP_UP_CREDITS = 10_000;
export const planCreditsNumber = (plan: typeof domesticPlans[number]) => Number(plan.credits.replaceAll(',', ''));
export const domesticTopUpPrice = (planId: PlanId) => {
  const plan = domesticPlans.find((item) => item.id === planId)!;
  const rawPrice = (plan.recurring / planCreditsNumber(plan)) * TOP_UP_CREDITS;
  return Math.round((rawPrice + 1e-9) * 100) / 100;
};
export const domesticStorageOptions: Record<PlanId, number[]> = { plus: [10], pro: [50, 75, 100], max: [100, 150, 200, 250], max5: [250, 500, 750, 1000] };
export const storageFee = (plan: PlanId, gb: number) => (Math.max(0, gb - domesticStorageOptions[plan][0]) / 10) * 6;
export const CREATOR_DISCOUNT_CODE = 'BLOGGER';
export const domesticPurchasePrice = (planId: PlanId, purchase: DomesticPurchaseMode, firstUsed: boolean, storageGb: number, creatorDiscountPercent = 0) => {
  const plan = domesticPlans.find((item) => item.id === planId)!;
  const regularTotal = purchase === 'annual' ? plan.annualTotal : purchase === 'single' ? plan.single : plan.recurring;
  const firstMonthBase = purchase === 'annual' ? plan.annualMonthly : purchase === 'single' ? plan.single : plan.recurring;
  const discountPercent = creatorDiscountPercent > 0 ? creatorDiscountPercent : purchase !== 'single' && !firstUsed ? 20 : 0;
  const discount = Math.round(firstMonthBase * discountPercent) / 100;
  const storageTotal = storageFee(planId, storageGb) * (purchase === 'annual' ? 12 : 1);
  return { total: Math.round((regularTotal - discount + storageTotal) * 100) / 100, discount, discountSource: creatorDiscountPercent > 0 ? 'creator' as const : discountPercent > 0 ? 'first-month' as const : null };
};
export type Market = 'domestic' | 'overseas';
export type Subscription = { plan: PlanId; storageGb?: number; end: string; renewal: boolean; renewalPeriod?: 'monthly' | 'annual'; failure: boolean; firstUsed: boolean; upgraded?: boolean; scheduledFreeAt?: string };
export type BillingOrderStatus = 'processing' | 'paid' | 'refund-processing' | 'refunded' | 'refund-rejected';
export type BillingOrder = { id: string; plan: string; amount: number; date: string; kind: string; status: BillingOrderStatus; relatedOrderId?: string };
export function nextMonth(date: Date) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const last = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, last));
  return result.toISOString();
}
export function nextYear(date: Date) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + 1);
  return result.toISOString();
}
const initialSubscription: Subscription = { plan: 'pro', end: '', renewal: false, failure: false, firstUsed: false };
type BillingValue = {
  market: Market; setMarket: (market: Market) => void;
  subscription: Subscription; setSubscription: React.Dispatch<React.SetStateAction<Subscription>>;
  orders: BillingOrder[]; addOrder: (order: BillingOrder) => void;
  downgradeToFree: () => { amount: number; orderId: string } | null;
  outcome: 'success' | 'payment-failed' | 'sign-failed'; setOutcome: (outcome: BillingValue['outcome']) => void;
  creatorDiscountPercent: number; setCreatorDiscountPercent: (percent: number) => void;
  scenario: (state: 'new' | 'active' | 'single-active' | 'scheduled-free' | 'cancelled' | 'failed' | 'expired' | 'external-cancel' | 'upgraded-plus' | 'upgraded-pro' | 'upgraded-max' | 'upgraded-annual' | 'refunded-order' | 'downgraded-refunded') => void;
  revision: number;
};
const BillingContext = createContext<BillingValue | null>(null);
export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [market, updateMarket] = useState<Market>(() => {
    try { return localStorage.getItem('wispaper-billing-market-v1') === 'overseas' ? 'overseas' : 'domestic'; } catch { return 'domestic'; }
  });
  const [subscription, setSubscription] = useState(initialSubscription);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [outcome, setOutcome] = useState<BillingValue['outcome']>('success');
  const [creatorDiscountPercent, setCreatorDiscountPercent] = useState(25);
  const [revision, setRevision] = useState(0);
  const downgradeInFlight = React.useRef(false);
  React.useEffect(() => {
    if (subscription.end && new Date(subscription.end).getTime() > Date.now()) downgradeInFlight.current = false;
  }, [subscription.end]);
  const setMarket = (value: Market) => {
    updateMarket(value);
    setRevision((n) => n + 1);
    try { localStorage.setItem('wispaper-billing-market-v1', value); } catch {}
  };
  const downgradeToFree = () => {
    if (downgradeInFlight.current || market !== 'domestic' || !subscription.end || new Date(subscription.end).getTime() <= Date.now()) return null;
    downgradeInFlight.current = true;
    const plan = domesticPlans.find((item) => item.id === subscription.plan)!;
    const paidOrder = orders.find((order) => order.status === 'paid' && order.amount > 0 && order.plan.startsWith(plan.name));
    const timestamp = Date.now();
    const originalId = paidOrder?.id ?? `MOCK-ORDER-${timestamp}`;
    const amount = paidOrder?.amount ?? (subscription.renewalPeriod === 'annual'
      ? domesticAnnualTotalPrice(plan.id) + storageFee(plan.id, subscription.storageGb ?? domesticStorageOptions[plan.id][0]) * 12
      : plan.recurring + storageFee(plan.id, subscription.storageGb ?? domesticStorageOptions[plan.id][0]));
    const date = new Date().toISOString();
    setOrders((current) => [
      { id: `MOCK-REFUND-${timestamp}`, relatedOrderId: originalId, plan: `${plan.name} · ${subscription.storageGb ?? domesticStorageOptions[plan.id][0]} GB`, amount: -amount, date, kind: '降级 Free · 全额退款（模拟）', status: 'refunded' },
      ...(paidOrder ? [] : [{ id: originalId, plan: `${plan.name} · ${subscription.storageGb ?? domesticStorageOptions[plan.id][0]} GB`, amount, date, kind: '演示原订单', status: 'paid' as const }]),
      ...current,
    ]);
    setSubscription((current) => ({ ...current, end: '', renewal: false, failure: false, scheduledFreeAt: undefined, upgraded: false }));
    return { amount, orderId: originalId };
  };
  const scenario: BillingValue['scenario'] = (state) => {
    setRevision((n) => n + 1);
    if (state === 'external-cancel') {
      setSubscription((s) => ({ ...s, renewal: false, failure: false }));
      return;
    }
    const now = new Date();
    const upgradedPlan = state === 'upgraded-plus' ? 'plus' : state === 'upgraded-pro' || state === 'upgraded-annual' ? 'pro' : state === 'upgraded-max' ? 'max' : null;
    if (state === 'refunded-order') {
      const paidId = 'MOCK-ORDER-20260918';
      const pendingRefundOrderId = 'MOCK-ORDER-REFUND-PENDING';
      setOrders([
        { id: 'MOCK-ORDER-PROCESSING', plan: 'Max x2 · 100 GB', amount: 300, date: now.toISOString(), kind: '连续包月首期', status: 'processing' },
        { id: 'MOCK-REFUND-PROCESSING', relatedOrderId: pendingRefundOrderId, plan: 'Plus · 10 GB', amount: -35, date: new Date(now.getTime() - 3600000).toISOString(), kind: '退款申请', status: 'refund-processing' },
        { id: 'MOCK-REFUND-20260920', relatedOrderId: paidId, plan: 'Pro · 50 GB', amount: -150, date: new Date(now.getTime() - 86400000).toISOString(), kind: '退款订单', status: 'refunded' },
        { id: pendingRefundOrderId, plan: 'Plus · 10 GB', amount: 35, date: new Date(now.getTime() - 2 * 86400000).toISOString(), kind: '月卡', status: 'paid' },
        { id: paidId, plan: 'Pro · 50 GB', amount: 150, date: new Date(now.getTime() - 3 * 86400000).toISOString(), kind: '连续包月首期', status: 'paid' },
      ]);
      setOutcome('success');
      setSubscription({ plan: 'pro', storageGb: 50, firstUsed: true, upgraded: false, end: nextMonth(now), renewal: false, renewalPeriod: 'monthly', failure: false });
      return;
    }
    if (state === 'downgraded-refunded') {
      const paidId = 'MOCK-ORDER-DOWNGRADE';
      setOrders([
        { id: 'MOCK-REFUND-DOWNGRADE', relatedOrderId: paidId, plan: 'Pro · 50 GB', amount: -150, date: now.toISOString(), kind: '降级 Free · 全额退款（模拟）', status: 'refunded' },
        { id: paidId, plan: 'Pro · 50 GB', amount: 150, date: new Date(now.getTime() - 86400000).toISOString(), kind: '连续包月首期', status: 'paid' },
      ]);
      setOutcome('success');
      setSubscription({ plan: 'pro', storageGb: 50, firstUsed: true, upgraded: false, end: '', renewal: false, renewalPeriod: 'monthly', failure: false });
      return;
    }
    setOrders([]);
    setOutcome('success');
    setSubscription(state === 'new' ? initialSubscription : upgradedPlan ? {
      plan: upgradedPlan,
      storageGb: domesticStorageOptions[upgradedPlan][0],
      firstUsed: true,
      upgraded: true,
      end: state === 'upgraded-annual' ? nextYear(now) : nextMonth(now),
      renewal: true,
      renewalPeriod: state === 'upgraded-annual' ? 'annual' : 'monthly',
      failure: false,
    } : {
      plan: 'pro', firstUsed: true, upgraded: false,
      end: state === 'expired' ? new Date(Date.now() - 86400000).toISOString() : nextMonth(now),
      renewal: state === 'active' || state === 'failed', renewalPeriod: 'monthly', failure: state === 'failed',
      scheduledFreeAt: state === 'scheduled-free' ? nextMonth(now) : undefined,
    });
  };
  return <BillingContext.Provider value={{ market, setMarket, subscription, setSubscription, orders, downgradeToFree,
    addOrder: (order) => setOrders((items) => [order, ...items]), outcome, setOutcome, creatorDiscountPercent, setCreatorDiscountPercent, scenario, revision }}>{children}</BillingContext.Provider>;
}
export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error('BillingProvider is required');
  return context;
}
