import React from 'react';
import { X, Zap } from 'lucide-react';
import { domesticPlans, domesticTopUpPrice, TOP_UP_CREDITS, useBilling } from '../contexts/BillingContext';
import { useLanguage } from '../contexts/LanguageContext';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RechargeModal({ isOpen, onClose }: RechargeModalProps) {
  const { market, subscription } = useBilling();
  const { language } = useLanguage();

  if (!isOpen) return null;

  const plan = domesticPlans.find((item) => item.id === subscription.plan) ?? domesticPlans[0];
  const overseasPlanPrice = plan.id === 'plus' ? { zh: 35, en: 5 } : plan.id === 'pro' ? { zh: 150, en: 20 } : { zh: 300, en: 40 };
  const planCredits = Number(plan.credits.replaceAll(',', ''));
  const amount = market === 'domestic'
    ? `¥${domesticTopUpPrice(plan.id).toFixed(2)}`
    : `${language === 'zh' ? '¥' : '$'}${((overseasPlanPrice[language] / planCredits) * TOP_UP_CREDITS).toFixed(2)}`;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl z-50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-6 px-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center border-2 border-gray-400">
              <svg className="w-7 h-7 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">充值 Credits</h2>
          <p className="text-gray-600 text-sm">唯一充值规格 · 按当前会员订阅单价等比例计算</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-6 rounded-xl border-2 border-gray-900 p-5 text-left shadow-lg">
            <div className="mb-3 inline-flex rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 p-2.5 text-white"><Zap className="h-6 w-6" /></div>
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold text-gray-900">10K Credits Pack</h3><p className="mt-1 text-sm text-gray-500">{plan.name} 会员价</p></div><div className="text-3xl font-bold text-gray-900">{amount}</div></div>
            <div className="mt-5 flex items-baseline gap-1"><span className="text-2xl font-bold text-gray-900">{TOP_UP_CREDITS.toLocaleString()}</span><span className="text-sm text-gray-600">Credits</span></div>
            <p className="mt-3 text-xs leading-5 text-gray-500">订阅价格 ÷ 每月 Credits × 10,000 · 一次性购买</p>
          </div>

          {/* Purchase Button */}
          <button
            className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white rounded-lg font-semibold text-base transition-all shadow-lg hover:shadow-xl"
          >
            立即充值 {amount}
          </button>

          {/* Info */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>充值后积分立即到账 · {market === 'domestic' ? '支付宝模拟支付' : 'Stripe 模拟支付'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
