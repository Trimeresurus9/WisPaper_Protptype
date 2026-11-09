import { useCallback, useEffect, useState } from 'react';

export type OnboardingPage = 'home' | 'agent' | 'reader';
export type OnboardingStatus = 'idle' | 'active' | 'paused' | 'done';
export interface SavedGuide { id: string; page: OnboardingPage; step: number; savedAt: number }
interface Flow { step: number; status: OnboardingStatus }
interface OnboardingState {
  version: 1;
  home: Flow;
  agent: Flow;
  reader: Flow;
  signedIn: boolean;
  interests: string[] | null;
  draftInterests: string[];
  savedGuides: SavedGuide[];
}
export const ONBOARDING_STORAGE_KEY = 'wispaper-main-onboarding-v1';
const emptyFlow = (): Flow => ({ step: 0, status: 'idle' });
const initialState = (): OnboardingState => ({ version: 1, home: emptyFlow(), agent: emptyFlow(), reader: emptyFlow(), signedIn: false, interests: null, draftInterests: [], savedGuides: [] });
const validStatus = (value: unknown): value is OnboardingStatus => ['idle', 'active', 'paused', 'done'].includes(String(value));
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 50) : [];
function readState(): OnboardingState {
  try {
    const raw = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEY) ?? 'null');
    if (raw?.version !== 1) return initialState();
    const flow = (page: OnboardingPage): Flow => ({
      step: page === 'home' && [0, 1, 2].includes(raw[page]?.step) ? raw[page].step : 0,
      status: validStatus(raw[page]?.status) ? raw[page].status : 'idle',
    });
    return { version: 1, home: flow('home'), agent: flow('agent'), reader: flow('reader'), signedIn: raw.signedIn === true, interests: Array.isArray(raw.interests) ? strings(raw.interests) : null, draftInterests: strings(raw.draftInterests), savedGuides: Array.isArray(raw.savedGuides) ? raw.savedGuides.filter((g: SavedGuide) => g && ['home', 'agent', 'reader'].includes(g.page) && (g.page === 'home' ? [0, 1, 2].includes(g.step) : g.step === 0) && typeof g.id === 'string' && typeof g.savedAt === 'number').slice(0, 5) : [] };
  } catch { return initialState(); }
}
const mayAutoplay = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useOnboarding(currentView: string, agentTaskActive: boolean, readerAvailable = false) {
  const [state, setState] = useState(readState);
  const [playing, setPlaying] = useState(mayAutoplay);
  const [speed, setSpeed] = useState(1);
  const [animationVersion, setAnimationVersion] = useState(0);
  const page: OnboardingPage = currentView === 'academic-agent' ? 'agent' : currentView === 'quick-paper' ? 'reader' : 'home';
  const available = currentView === 'explore' || currentView === 'academic-agent' || (currentView === 'quick-paper' && readerAvailable);
  const flow = state[page];
  const active = available && flow.status === 'active';

  useEffect(() => { try { localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);
  const start = () => {
    setState(s => ({ ...s, [page]: { step: 0, status: 'active' }, draftInterests: page === 'home' ? s.interests ?? [] : s.draftInterests }));
    setAnimationVersion(v => v + 1);
    setPlaying(mayAutoplay());
  };
  const end = () => setState(s => ({ ...s, [page]: { ...s[page], status: 'done' }, savedGuides: s.savedGuides.filter(g => g.page !== page) }));
  const dismiss = () => setState(s => {
    const guide = { id: `${page}:${s[page].step}`, page, step: s[page].step, savedAt: Date.now() };
    return { ...s, [page]: { ...s[page], status: 'paused' }, savedGuides: [guide, ...s.savedGuides.filter(g => g.id !== guide.id)] };
  });
  const resume = (guide: SavedGuide) => {
    setState(s => ({ ...s, [guide.page]: { step: guide.step, status: 'active' }, savedGuides: s.savedGuides.filter(g => g.id !== guide.id) }));
    setAnimationVersion(v => v + 1); setPlaying(mayAutoplay());
  };
  const reset = () => { setState(s => ({ ...s, [page]: emptyFlow(), savedGuides: s.savedGuides.filter(g => g.page !== page) })); setPlaying(false); };
  const jump = (step: number) => {
    setState(s => ({ ...s, [page]: { step: page === 'home' ? Math.max(0, Math.min(2, step)) : 0, status: 'active' } }));
    setAnimationVersion(v => v + 1);
    setPlaying(mayAutoplay());
  };
  const replay = () => { setAnimationVersion(v => v + 1); setPlaying(true); };
  const setSignedIn = (signedIn: boolean) => setState(s => ({ ...s, signedIn }));
  const toggleInterest = (interest: string) => setState(s => ({ ...s, draftInterests: s.draftInterests.includes(interest) ? s.draftInterests.filter(i => i !== interest) : [...s.draftInterests, interest] }));
  const saveInterests = () => setState(s => s.draftInterests.length ? {
    ...s, interests: [...s.draftInterests], savedGuides: s.savedGuides.filter(g => g.page !== 'home' || g.step > 1), home: { step: s.signedIn ? 1 : 2, status: s.signedIn ? 'done' : 'active' },
  } : s);
  const completeLogin = () => setState(s => ({ ...s, signedIn: true, savedGuides: s.savedGuides.filter(g => g.page !== 'home'), home: { step: 2, status: 'done' } }));
  const updateInterests = useCallback((interests: string[]) => setState(s => ({ ...s, interests, draftInterests: interests })), []);

  return { state, page, flow, available, active, playing, setPlaying, speed, setSpeed, animationVersion, start, end, dismiss, resume, reset, jump, replay, setSignedIn, toggleInterest, saveInterests, completeLogin, updateInterests };
}
export type OnboardingController = ReturnType<typeof useOnboarding>;
