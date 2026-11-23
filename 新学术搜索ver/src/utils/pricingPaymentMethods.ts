export const pricingPaymentMethods = [
  { id: 'airwallex', provider: 'Airwallex', wallets: false },
  { id: 'stripe', provider: 'Stripe', wallets: false },
  { id: 'airwallex-wallets', provider: 'Airwallex', wallets: true },
  { id: 'stripe-wallets', provider: 'Stripe', wallets: true },
] as const;

export type PricingPaymentMethodId = typeof pricingPaymentMethods[number]['id'];

export function paymentMethodLabel(id: PricingPaymentMethodId, language: 'zh' | 'en') {
  const method = pricingPaymentMethods.find(method => method.id === id)!;
  return `${method.provider}${method.wallets ? language === 'zh' ? ' + 微信 / 支付宝' : ' + WeChat Pay / Alipay' : ''}`;
}
