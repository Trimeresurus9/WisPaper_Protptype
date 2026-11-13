import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type TicketStatus = 'processing' | 'needs-info' | 'resolved' | 'closed';
export interface TicketMessage {
  id: string;
  role: 'user' | 'support' | 'system';
  text: string;
  textEn: string;
  time: string;
  sequence: number;
  attachmentNames?: string[];
}
export interface FeedbackTicket {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  status: TicketStatus;
  createdAt: string;
  readThrough: number;
  messages: TicketMessage[];
  pageIdentifier?: string;
  contact?: string;
  phone?: string;
  attachmentNames?: string[];
}

const examples: FeedbackTicket[] = [
  {
    id: 'WP-20261008-0142', title: 'PDF 解析一直停留在处理中', titleEn: 'PDF parsing is stuck in progress',
    category: '故障反馈', categoryEn: 'Bug report', status: 'needs-info', createdAt: '2026-10-08 09:12', readThrough: 1,
    contact: 'researcher@university.edu', attachmentNames: ['parser-stuck.png'],
    messages: [
      { id: '142-1', role: 'user', text: '我上传了论文 PDF，等待十分钟后仍显示“处理中”。刷新页面后没有变化，应该如何处理？', textEn: 'My paper PDF is still processing after ten minutes. Refreshing did not help. What should I do?', time: '2026-10-08 09:12', sequence: 1 },
      { id: '142-2', role: 'support', text: '你好，我们已经收到你的反馈。为了定位问题，请补充：\n1. 出现问题时的操作步骤；\n2. 文件大小及页数；\n3. 页面显示的报错信息（如有）。\n\n无需发送论文全文或账号密码，你可以直接在下方回复。', textEn: 'Thanks for reporting this. To investigate, please share:\n1. The steps that led to the problem;\n2. The file size and page count;\n3. Any error text shown.\n\nDo not share the paper itself or your password. You can reply below.', time: '2026-10-08 10:46', sequence: 2 },
    ],
  },
  {
    id: 'WP-20261007-0096', title: '引用导出缺少期刊名称', titleEn: 'Journal names missing from citation exports',
    category: '技术支持', categoryEn: 'Technical support', status: 'resolved', createdAt: '2026-10-07 16:20', readThrough: 1,
    messages: [
      { id: '96-1', role: 'user', text: '导出的引用中部分文章没有期刊名称，希望帮忙确认。', textEn: 'Some exported citations have no journal name. Could you check?', time: '2026-10-07 16:20', sequence: 1 },
      { id: '96-2', role: 'support', text: '我们已在演示场景中提供解决方案：\n打开知识库中的文章详情，补全期刊元数据，再重新导出引用。\n\n请检查导出结果。如果已恢复正常，可点击“确认解决”；如果仍有问题，请选择“仍有问题”并补充说明。', textEn: 'The demo solution is to open the paper in your Library, complete its journal metadata and export again.\n\nCheck the new export. Choose “Confirm resolved” if it works, or “Still an issue” to add more details.', time: '2026-10-08 10:18', sequence: 2 },
    ],
  },
  {
    id: 'WP-20261006-0058', title: '希望搜索筛选项可以保留', titleEn: 'Keep search filters between sessions',
    category: '投诉与建议', categoryEn: 'Suggestions', status: 'processing', createdAt: '2026-10-06 14:05', readThrough: 2,
    messages: [
      { id: '58-1', role: 'user', text: '每次重新进入搜索都需要选择年份，希望保留上一次的筛选项。', textEn: 'I have to select the year each time I search. Please keep my previous filters.', time: '2026-10-06 14:05', sequence: 1 },
      { id: '58-2', role: 'support', text: '感谢你的建议，我们已记录这个使用场景，将交由产品团队评估。当前没有确定的上线时间，有进展会在这里更新。', textEn: 'Thank you. We have recorded this use case for product review. No release date is confirmed; updates will appear here.', time: '2026-10-07 11:30', sequence: 2 },
    ],
  },
];

export const ticketIsUnread = (ticket: FeedbackTicket) => ticket.messages.some(message => message.role === 'support' && message.sequence > ticket.readThrough);

interface TicketContextValue {
  tickets: FeedbackTicket[];
  unreadCount: number;
  isOpen: boolean;
  selectedId: string | null;
  openFeedback: (id?: string) => void;
  closeTickets: () => void;
  selectTicket: (id: string | null) => void;
  markRead: (id: string, through: number) => void;
  sendReply: (id: string, text: string, attachmentNames?: string[]) => void;
  createTicket: (input: { title: string; titleEn: string; category: string; categoryEn: string; content: string; contentEn?: string; pageIdentifier?: string; contact?: string; phone?: string; attachmentNames?: string[] }) => string;
  confirmResolved: (id: string) => void;
  simulateReply: (id?: string) => void;
  resetDemo: () => void;
}
const TicketContext = createContext<TicketContextValue | null>(null);
// ?mock=feedback / ?mock=tickets both open the feedback dialog on the thread list.
const mockEntry = new URLSearchParams(window.location.search).get('mock');
const demoTime = () => new Date().toLocaleString('sv-SE', { hour12: false }).slice(0, 16);
const newMessage = (ticket: FeedbackTicket, role: TicketMessage['role'], text: string, textEn = text, attachmentNames?: string[]): TicketMessage => ({
  id: crypto.randomUUID(), role, text, textEn, time: demoTime(), sequence: (ticket.messages.at(-1)?.sequence ?? 0) + 1, attachmentNames,
});

// Session-only demo state: no API calls, email, localStorage or real ticket creation.
export function FeedbackTicketsProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<FeedbackTicket[]>(() => structuredClone(examples));
  const [isOpen, setIsOpen] = useState(() => mockEntry === 'feedback' || mockEntry === 'tickets');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const openFeedback = useCallback((id?: string) => {
    setSelectedId(id ?? null);
    setIsOpen(true);
  }, []);
  const closeTickets = useCallback(() => setIsOpen(false), []);
  const selectTicket = useCallback((id: string | null) => setSelectedId(id), []);
  const markRead = useCallback((id: string, through: number) => {
    setTickets(current => current.map(ticket => ticket.id === id && through > ticket.readThrough
      ? { ...ticket, readThrough: Math.min(through, ticket.messages.at(-1)?.sequence ?? 0) } : ticket));
  }, []);
  const sendReply = useCallback((id: string, text: string, attachmentNames?: string[]) => {
    if (!text.trim()) return;
    setTickets(current => current.map(ticket => {
      if (ticket.id !== id || ticket.status === 'closed') return ticket;
      return { ...ticket, status: ticket.status === 'needs-info' || ticket.status === 'resolved' ? 'processing' : ticket.status,
        messages: [...ticket.messages, newMessage(ticket, 'user', text.trim(), text.trim(), attachmentNames?.length ? attachmentNames : undefined)] };
    }));
  }, []);
  const createTicket = useCallback((input: { title: string; titleEn: string; category: string; categoryEn: string; content: string; contentEn?: string; pageIdentifier?: string; contact?: string; phone?: string; attachmentNames?: string[] }) => {
    const now = new Date();
    const date = now.toLocaleDateString('sv-SE').replaceAll('-', '');
    const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
    const id = `WP-${date}-${suffix}`;
    const ticket: FeedbackTicket = {
      id,
      title: input.title,
      titleEn: input.titleEn,
      category: input.category,
      categoryEn: input.categoryEn,
      status: 'processing',
      createdAt: demoTime(),
      readThrough: 1,
      messages: [{ id: crypto.randomUUID(), role: 'user', text: input.content, textEn: input.contentEn ?? input.content, time: demoTime(), sequence: 1 }],
      pageIdentifier: input.pageIdentifier,
      contact: input.contact,
      phone: input.phone,
      attachmentNames: input.attachmentNames,
    };
    setTickets(current => [ticket, ...current]);
    return id;
  }, []);
  const confirmResolved = useCallback((id: string) => {
    setTickets(current => current.map(ticket => ticket.id === id && ticket.status === 'resolved'
      ? { ...ticket, status: 'closed', messages: [...ticket.messages, newMessage(ticket, 'system', '你已确认问题解决，工单已关闭。', 'You confirmed the solution. This ticket is now closed.')] } : ticket));
  }, []);
  const simulateReply = useCallback((id?: string) => {
    setTickets(current => {
      const targetId = id ?? current.find(ticket => ticket.status !== 'closed' && !ticketIsUnread(ticket))?.id
        ?? current.find(ticket => ticket.status !== 'closed')?.id;
      return current.map(ticket => {
        if (ticket.id !== targetId || ticket.status === 'closed') return ticket;
        const pending = ticket.messages.at(-1)?.role === 'user';
        const text = pending
          ? '感谢补充。演示支持团队已提供解决方案：请返回原任务重新尝试，并检查结果。若问题已解决，请确认；如果仍有问题，可继续补充说明。'
          : '这是一条新的模拟回复。支持团队正在核查你反馈的问题，请在本工单内补充操作步骤；有进展会继续在这里更新。';
        const textEn = pending
          ? 'Thanks for the details. Demo solution: retry the original task and check the result. Confirm if resolved, or add details if the issue remains.'
          : 'This is a new simulated reply. We are reviewing your issue. Add the steps here and check this ticket for updates.';
        return { ...ticket, status: pending ? 'resolved' : 'needs-info', messages: [...ticket.messages, newMessage(ticket, 'support', text, textEn)] };
      });
    });
  }, []);
  const resetDemo = useCallback(() => { setTickets(structuredClone(examples)); setSelectedId(null); }, []);
  const unreadCount = tickets.filter(ticketIsUnread).length;
  const value = useMemo(() => ({ tickets, unreadCount, isOpen, selectedId, openFeedback, closeTickets, selectTicket, markRead, sendReply, createTicket, confirmResolved, simulateReply, resetDemo }),
    [tickets, unreadCount, isOpen, selectedId, openFeedback, closeTickets, selectTicket, markRead, sendReply, createTicket, confirmResolved, simulateReply, resetDemo]);
  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useFeedbackTickets() {
  const value = useContext(TicketContext);
  if (!value) throw new Error('FeedbackTicketsProvider is required');
  return value;
}
