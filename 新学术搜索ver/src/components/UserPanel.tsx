import React, { useState, useRef, useEffect } from 'react';
import { Globe, Bell, Settings, Gift, ArrowRight, Users, User, Download, LogOut, ChevronRight, ChevronDown, Copy, Check, Coins, HelpCircle, Crown, UserPlus, MessageSquare, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { FeedbackModal } from './FeedbackModal';
import { ShinyText } from './ShinyText';
import { domesticPlans, useBilling } from '../contexts/BillingContext';

interface UserPanelProps {
  onOpenInvite?: () => void;
  onOpenPaywall?: () => void;
  onOpenRecharge?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  isCollapsed?: boolean;
}

export function UserPanel({ onOpenInvite, onOpenPaywall, onOpenNotifications, onOpenSettings, isCollapsed = false }: UserPanelProps) {
  const openId = 'tyqx1tdh3nwg';
  const { language, setLanguage, t } = useLanguage();
  const { market, subscription } = useBilling();
  const domestic = market === 'domestic';
  const domesticActive = domestic && Boolean(subscription.end && new Date(subscription.end).getTime() > Date.now());
  const domesticPlan = domesticPlans.find((plan) => plan.id === subscription.plan)!;
  const domesticEnd = subscription.end ? new Date(subscription.end).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US') : '';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showInviteBanner, setShowInviteBanner] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [openIdCopied, setOpenIdCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadLinks = {
    windows: 'https://download.wispaper.com/windows',
    macApple: 'https://download.wispaper.com/mac-apple-silicon',
    macIntel: 'https://download.wispaper.com/mac-intel',
  } as const;

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenNotifications) {
      onOpenNotifications();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
        setShowDownloadMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => () => {
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
  }, []);

  const handleCopyOpenId = async () => {
    try {
      await navigator.clipboard.writeText(openId);
      setOpenIdCopied(true);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setOpenIdCopied(false), 1800);
    } catch (error) {
      console.error('Failed to copy Open ID', error);
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    // Implement logout logic here
    setShowUserMenu(false);
    setShowDownloadMenu(false);
  };

  const handleDownloadClient = (platform: keyof typeof downloadLinks) => {
    window.open(downloadLinks[platform], '_blank', 'noopener,noreferrer');
    setShowUserMenu(false);
    setShowDownloadMenu(false);
  };

  const handleSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
    setShowUserMenu(false);
    setShowDownloadMenu(false);
  };

  return (
    <div className="border-t border-gray-100">
      {/* Invite Banner */}
      {showInviteBanner && !isCollapsed && (
        <div className="mx-3 mt-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg relative">
          <button
            onClick={() => setShowInviteBanner(false)}
            className="absolute top-2 right-2 p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-2 mb-2">
            <Gift className="w-4 h-4 text-gray-900 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-0.5">{t('invite.title')}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{t('invite.description')}</p>
            </div>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-black hover:bg-gray-900 text-white text-xs font-medium rounded transition-colors"
            onClick={onOpenInvite}
          >
            <ShinyText text={t('invite.action')} className="inline-block" />
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* User Profile & Actions */}
      <div className={`${isCollapsed ? 'px-1.5' : 'px-3'} py-3 relative`} ref={menuRef}>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              setShowUserMenu((prev) => {
                const nextValue = !prev;
                if (!nextValue) {
                  setShowDownloadMenu(false);
                }
                return nextValue;
              });
            }}
            className={`${isCollapsed ? 'w-10 h-10 justify-center' : 'flex-1'} flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors`}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              用
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-gray-900 truncate">添孬孬佛佛会员</div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
              </>
            )}
          </button>
          
          {/* Notification Icon */}
          {!isCollapsed && (
            <button
              onClick={handleNotificationClick}
              className="relative p-1.5 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              title={t('notifications.title')}
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          )}
        </div>
        
        {/* User Menu Dropdown */}
        {showUserMenu && (
          <div className={`absolute bottom-full ${isCollapsed ? 'left-0 right-auto w-56' : 'left-3 right-3'} z-[10010] mb-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl`}>
            {/* User Info Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  用
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">添孬孬佛佛会员</div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-xs font-medium tracking-[0.02em] text-gray-500">
                      {openId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOpenId}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                        openIdCopied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                      aria-label={openIdCopied ? 'Open ID 已复制' : '复制 Open ID'}
                      title={openIdCopied ? '已复制' : '复制 Open ID'}
                    >
                      {openIdCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <span className="sr-only" aria-live="polite">
                      {openIdCopied ? 'Open ID 已复制' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Membership Info Card */}
              <div className="mx-3 mb-2 mt-2 overflow-hidden rounded-xl bg-slate-950 text-white shadow-[0_14px_30px_-22px_rgba(15,23,42,0.9)]">
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                      <span className="truncate text-xs font-semibold">
                        {domestic ? domesticActive ? `${domesticPlan.name} ${subscription.renewalPeriod === 'annual' ? (language === 'zh' ? '年付版' : 'Annual') : (language === 'zh' ? '月度版' : 'Monthly')}` : 'Free' : language === 'zh' ? 'Pro 月度版' : 'Pro Monthly'}
                      </span>
                    </div>
                    <span className="shrink-0 rounded bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
                      {domestic && !domesticActive ? (language === 'zh' ? '未开通' : 'Inactive') : (language === 'zh' ? '生效中' : 'Active')}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-slate-400">
                    <span>{domestic && subscription.renewalPeriod === 'annual' ? (language === 'zh' ? '年付' : 'Annual') : (language === 'zh' ? '月付' : 'Monthly')}</span>
                    <span>{domestic ? (language === 'zh' ? '支付宝' : 'Alipay') : 'Stripe'}</span>
                    <span>{domestic ? subscription.scheduledFreeAt && domesticActive ? (language === 'zh' ? '下周期降级 Free' : 'Free next cycle') : subscription.renewal && domesticActive ? (language === 'zh' ? '自动续费中' : 'Auto-renew on') : (language === 'zh' ? '不自动续费' : 'No auto-renewal') : (language === 'zh' ? '自动续费中' : 'Auto-renew on')}</span>
                    <span>{domestic ? domesticEnd ? `${domesticEnd} ${language === 'zh' ? '到期' : 'expires'}` : (language === 'zh' ? '未开通' : 'Not subscribed') : (language === 'zh' ? '7 月 10 日到期' : 'Expires Jul 10')}</span>
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {language === 'zh' ? '会员 Credits' : 'Member Credits'}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{domestic ? domesticActive ? domesticPlan.credits : '0' : '36,600'}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full bg-white ${domestic ? domesticActive ? 'w-full' : 'w-0' : 'w-[77.125%]'}`} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                    <span>{domestic ? domesticActive ? `${domesticEnd} ${language === 'zh' ? '到期' : 'expires'}` : (language === 'zh' ? '暂无付费额度' : 'No paid credits') : (language === 'zh' ? '将在 7 月 10 日重置' : 'Resets Jul 10')}</span>
                    <span>{domestic ? domesticActive ? (language === 'zh' ? '100% 可用' : '100% available') : '—' : (language === 'zh' ? '22.9% 可用' : '22.9% available')}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-[9px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3 w-3 text-slate-500" />
                      <span>{language === 'zh' ? '已领取 Voucher' : 'Claimed vouchers'}</span>
                    </div>
                    <span className="tabular-nums text-slate-400">{domestic ? `0 ${language === 'zh' ? '笔' : 'items'} · 0 Credits` : `3 ${language === 'zh' ? '笔' : 'items'} · 5,400 Credits`}</span>
                  </div>
                </div>

                <div className="border-t border-white/10">
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-[10px] font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      if (onOpenPaywall) onOpenPaywall();
                      setShowUserMenu(false);
                    }}
                  >
                    {language === 'zh' ? '升级' : 'Upgrade'}
                  </button>
                </div>
              </div>

              {/* Invite */}
              <button 
                onClick={() => {
                  if (onOpenInvite) onOpenInvite();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('user.invite')}</span>
              </button>

              {/* Settings */}
              <button 
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>{t('user.settings')}</span>
              </button>

              <div>
                <button
                  onClick={() => setShowDownloadMenu((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Download className="w-4 h-4" />
                    <span>{t('user.download')}</span>
                  </span>
                  {showDownloadMenu ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {showDownloadMenu ? (
                  <div className="mx-3 mb-2 mt-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <button
                      onClick={() => handleDownloadClient('windows')}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-white hover:text-gray-900"
                    >
                      {t('user.download.windows')}
                    </button>
                    <button
                      onClick={() => handleDownloadClient('macApple')}
                      className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-white hover:text-gray-900"
                    >
                      {t('user.download.macApple')}
                    </button>
                    <button
                      onClick={() => handleDownloadClient('macIntel')}
                      className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-white hover:text-gray-900"
                    >
                      {t('user.download.macIntel')}
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Feedback */}
              <button 
                onClick={() => {
                  console.log('Feedback clicked');
                  setShowUserMenu(false);
                  setShowDownloadMenu(false);
                  setShowFeedbackModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('user.feedback')}</span>
              </button>

              {/* Language Settings */}
              <div className="px-3 py-2 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-500 mb-2">{t('user.languageSettings')}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLanguage('zh');
                      setShowUserMenu(false);
                      setShowDownloadMenu(false);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      language === 'zh' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    简体中文
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowUserMenu(false);
                      setShowDownloadMenu(false);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      language === 'en' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('user.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}
