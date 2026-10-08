import React, { useEffect } from 'react';
import { X, Sparkles, TrendingUp, Bell, Info, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ticketIsUnread, useFeedbackTickets } from '../contexts/FeedbackTicketsContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { t, language } = useLanguage();
  const { tickets, unreadCount, openTickets, simulateReply } = useFeedbackTickets();
  const zh = language === 'zh';

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('notifications.title')}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-73px)]">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-900">{zh ? '工单回复' : 'Ticket replies'} <span className="ml-1 text-gray-400">{unreadCount}</span></h3>
              <button onClick={() => { onClose(); openTickets(); }} className="text-xs text-gray-500 hover:text-gray-900">{zh ? '全部工单' : 'All tickets'} →</button>
            </div>
            {tickets.filter(ticketIsUnread).map(ticket => (
              <button key={ticket.id} onClick={() => { onClose(); openTickets(ticket.id); }} className="w-full rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2.5 text-gray-700"><MessageSquare className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /><span className="text-xs font-semibold text-gray-900">{zh ? '你的反馈有新回复' : 'Your feedback has a reply'}</span></div>
                    <p className="mt-2 text-xs text-gray-700">{zh ? ticket.title : ticket.titleEn}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{ticket.id} · {ticket.messages.at(-1)?.time}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-900">{zh ? '查看回复' : 'View reply'}<ArrowUpRight className="h-3 w-3" /></span>
                  </div>
                </div>
              </button>
            ))}
            {unreadCount === 0 && <div className="rounded-lg border border-gray-200 p-4 text-xs text-gray-500">{zh ? '暂无未读工单回复。历史记录可在“我的工单”查看。' : 'No unread replies. Find previous messages in My tickets.'}</div>}
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-[10px] text-gray-400"><span>Mock · {zh ? '不发送真实工单' : 'Demo only'}</span><button onClick={() => simulateReply()} className="font-medium text-gray-600 hover:text-gray-900">{zh ? '模拟收到新回复' : 'Simulate new reply'}</button></div>
            <h3 className="border-t border-gray-100 pt-4 text-xs font-semibold text-gray-900">{zh ? '产品与系统公告' : 'Product and system updates'}</h3>
            {/* Feature Update 1 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{t('notifications.feature1.title')}</h3>
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-medium rounded">NEW</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {t('notifications.feature1.description')}
                  </p>
                  <button className="text-xs font-medium text-gray-900 hover:text-black flex items-center gap-1">
                    {t('notifications.learnMore')}
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Update 2 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{t('notifications.feature2.title')}</h3>
                    <span className="px-2 py-0.5 bg-gray-700 text-white text-xs font-medium rounded">UPGRADE</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {t('notifications.feature2.description')}
                  </p>
                  <button className="text-xs font-medium text-gray-900 hover:text-black flex items-center gap-1">
                    {t('notifications.learnMore')}
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{t('notifications.notice1.title')}</h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t('notifications.notice1.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* System Update */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('notifications.system1.title')}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {t('notifications.system1.description')}
                  </p>
                  <p className="text-xs text-gray-400">2024-02-20 14:30</p>
                </div>
              </div>
            </div>

            {/* Maintenance Notice */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t('notifications.system2.title')}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">
                    {t('notifications.system2.description')}
                  </p>
                  <p className="text-xs text-gray-400">2024-02-18 09:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
