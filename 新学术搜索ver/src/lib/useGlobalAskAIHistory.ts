import * as React from 'react';

const STORAGE_KEY = 'wispaper-global-ask-ai-history-v1';
const EVENT_NAME = 'wispaper:global-ask-ai-history-changed';

export interface GlobalAskAISession {
  id: string;
  scene: string;
  pageLabel: string;
  title: string;
  time: string;
  source: string;
  updatedAt: number;
  messages: unknown[];
}

export function normalizeAskAIMessages(messages: unknown[]): Array<{ role: 'user' | 'assistant'; text: string }> {
  return messages.flatMap((value) => {
    const message = value as { role?: string; text?: string; content?: string };
    const text = message.text ?? message.content;
    if (!text || (message.role !== 'user' && message.role !== 'assistant')) return [];
    return [{ role: message.role, text }];
  });
}

function readSessions(): GlobalAskAISession[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function useGlobalAskAIHistory(scene: string) {
  const [sessions, setSessions] = React.useState<GlobalAskAISession[]>(readSessions);

  React.useEffect(() => {
    const refresh = () => setSessions(readSessions());
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const upsertSession = React.useCallback((session: Omit<GlobalAskAISession, 'updatedAt' | 'time'>) => {
    const next: GlobalAskAISession = { ...session, updatedAt: Date.now(), time: '刚刚' };
    const all = [next, ...readSessions().filter((item) => item.id !== next.id)].slice(0, 100);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
    setSessions(all);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return {
    sessions,
    latestForScene: sessions.find((session) => session.scene === scene) ?? null,
    upsertSession,
  };
}
