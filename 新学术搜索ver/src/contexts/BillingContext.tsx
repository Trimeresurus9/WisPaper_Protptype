import React, { createContext, useContext, useState } from 'react';

export const domesticPlans = [
  { id: 'plus', name: 'Plus', first: 19, recurring: 29, single: 39, credits: '10,000', storage: '10 GB', description: '稳定检索与轻量问答' },
  { id: 'pro', name: 'Pro', first: 69, recurring: 99, single: 129, credits: '200,000', storage: '50 GB', description: '深度研究与 Agent 任务' },
  { id: 'max', name: 'Max x2', first: 139, recurring: 199, single: 259, credits: '400,000', storage: '100 GB', description: '高频研究与多项目工作' },
] as const;
export type PlanId = typeof domesticPlans[number]['id'];
export const domesticStorageOptions: Record<PlanId, number[]> = { plus: [10], pro: [50, 75, 100], max: [100, 150, 200, 250] };
export const storageFee = (plan: PlanId, gb: number) => (Math.max(0, gb - domesticStorageOptions[plan][0]) / 10) * 6;
export type Market = 'domestic' | 'overseas';
export type Subscription = { plan: PlanId; storageGb?: number; end: string; renewal: boolean; failure: boolean; firstUsed: boolean };
export type BillingOrder = { id: string; plan: string; amount: number; date: string; kind: string };
export function nextMonth(date: Date) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const last = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, last));
  return result.toISOString();
}
const initialSubscription: Subscription = { plan: 'pro', end: '', renewal: false, failure: false, firstUsed: false };
type BillingValue = {
  market: Market; setMarket: (market: Market) => void;
  subscription: Subscription; setSubscription: React.Dispatch<React.SetStateAction<Subscription>>;
  orders: BillingOrder[]; addOrder: (order: BillingOrder) => void;
  outcome: 'success' | 'payment-failed' | 'sign-failed'; setOutcome: (outcome: BillingValue['outcome']) => void;
  scenario: (state: 'new' | 'active' | 'cancelled' | 'failed' | 'expired' | 'external-cancel') => void;
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
  const [revision, setRevision] = useState(0);
  const setMarket = (value: Market) => {
    updateMarket(value);
    setRevision((n) => n + 1);
    try { localStorage.setItem('wispaper-billing-market-v1', value); } catch {}
  };
  const scenario: BillingValue['scenario'] = (state) => {
    setRevision((n) => n + 1);
    if (state === 'external-cancel') {
      setSubscription((s) => ({ ...s, renewal: false, failure: false }));
      return;
    }
    setOrders([]);
    setOutcome('success');
    setSubscription(state === 'new' ? initialSubscription : {
      plan: 'pro', firstUsed: true,
      end: state === 'expired' ? new Date(Date.now() - 86400000).toISOString() : nextMonth(new Date()),
      renewal: state === 'active' || state === 'failed', failure: state === 'failed',
    });
  };
  return <BillingContext.Provider value={{ market, setMarket, subscription, setSubscription, orders,
    addOrder: (order) => setOrders((items) => [order, ...items]), outcome, setOutcome, scenario, revision }}>{children}</BillingContext.Provider>;
}
export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error('BillingProvider is required');
  return context;
}
