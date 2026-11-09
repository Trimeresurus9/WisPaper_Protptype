import { useCallback, useEffect, useRef, useState } from 'react';
import { advanceEnvironment, applyRetention, createEnvironment, finishPreparation, runtime, setExecuting, type Environment, type Retention } from './environment';

export function useSandboxEnvironment(executing: boolean) {
  const [environment, setEnvironment] = useState(() => createEnvironment(Date.now(), executing));
  const current = useRef(environment);
  const mounted = useRef(true);
  const preparation = useRef<Promise<boolean> | null>(null);
  const commit = useCallback((update: (env: Environment) => Environment) => {
    current.current = update(current.current);
    if (mounted.current) setEnvironment(current.current);
  }, []);
  useEffect(() => {
    mounted.current = true;
    const tick = () => commit(env => advanceEnvironment(env, Date.now()));
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { mounted.current = false; clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [commit]);
  useEffect(() => { commit(env => setExecuting(env, executing, Date.now())); }, [executing, commit]);

  const ensureReady = useCallback((): Promise<boolean> => {
    if (preparation.current) return preparation.current;
    commit(env => advanceEnvironment(env, Date.now()));
    if (current.current.status === 'running') {
      commit(env => ({...env, idleSince: Date.now()}));
      return Promise.resolve(true);
    }
    commit(env => ({...env, status: env.status === 'recycled' ? 'creating' : 'waking'}));
    preparation.current = new Promise<boolean>(resolve => window.setTimeout(() => {
      if (mounted.current) commit(env => finishPreparation(env, Date.now()));
      preparation.current = null;
      resolve(mounted.current);
    }, 900));
    return preparation.current;
  }, [commit]);

  const setRetention = useCallback((retention: Retention) => {
    commit(env => applyRetention(env, retention, Date.now()));
  }, [commit]);
  const demo = useCallback((scenario: string) => {
    const now = Date.now();
    commit(env => {
      const base = {...env, createdAt: now - (scenario === 'extended' ? 40 : 15) * 60000, endedAt: null, executingSince: null, runMs: runtime(env, now)};
      if (scenario === 'running') return {...base, status: 'running', sleepAt: null, idleSince: now};
      if (scenario === 'recycled') return {...base, status: 'recycled', endedAt: now, sleepAt: now - 600000};
      return {...base, status: 'sleeping', retention: scenario === 'permanent' ? null : scenario === 'extended' ? 60 : 10, sleepAt: now - (scenario === 'extended' ? 1800000 : scenario === 'expiring' ? 570000 : 180000)};
    });
  }, [commit]);
  return { environment, ensureReady, setRetention, demo, preparing: environment.status === 'waking' || environment.status === 'creating' };
}
