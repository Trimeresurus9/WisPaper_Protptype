export type Retention = 10 | 20 | 60 | null;
export type EnvironmentStatus = 'running' | 'sleeping' | 'recycled' | 'waking' | 'creating';
export type Environment = {
  status: EnvironmentStatus;
  createdAt: number;
  endedAt: number | null;
  idleSince: number;
  sleepAt: number | null;
  retention: Retention;
  runMs: number;
  executingSince: number | null;
};
export const createEnvironment = (now: number, executing = false): Environment => ({
  status: 'running', createdAt: now, endedAt: null, idleSince: now,
  sleepAt: null, retention: 10, runMs: 0, executingSince: executing ? now : null,
});
export const recycleAt = (env: Environment) => env.sleepAt !== null && env.retention !== null ? env.sleepAt + env.retention * 60000 : null;
export const runtime = (env: Environment, now: number) => env.runMs + (env.executingSince === null ? 0 : Math.max(0, now - env.executingSince));
export function advanceEnvironment(env: Environment, now: number): Environment {
  let next = env;
  if (next.status === 'running' && next.executingSince === null && now >= next.idleSince + 60000) {
    next = {...next, status: 'sleeping', sleepAt: next.idleSince + 60000};
  }
  const deadline = recycleAt(next);
  if (next.status === 'sleeping' && deadline !== null && now >= deadline) {
    next = {...next, status: 'recycled', endedAt: deadline};
  }
  return next;
}
export function setExecuting(env: Environment, executing: boolean, now: number): Environment {
  if (env.status !== 'running') return env;
  if (executing && env.executingSince === null) return {...env, executingSince: now};
  if (!executing && env.executingSince !== null) return {...env, runMs: runtime(env, now), executingSince: null, idleSince: now};
  return env;
}
export function finishPreparation(env: Environment, now: number): Environment {
  if (env.status === 'creating') return {...createEnvironment(now), retention: env.retention, runMs: env.runMs};
  if (env.status === 'waking') return {...env, status: 'running', idleSince: now, sleepAt: null};
  return env;
}
export function formatDuration(ms: number) {
  if (ms <= 0) return '0min';
  const minutes = Math.floor(ms / 60000);
  if (minutes === 0) return '<1min';
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return hours ? `${hours}h${minutes % 60 ? ` ${minutes % 60}min` : ''}` : `${minutes}min`;
}

export function applyRetention(env: Environment, retention: Retention, now: number): Environment {
  const latest = advanceEnvironment(env, now);
  if (latest.status === 'recycled') return latest;
  const next = advanceEnvironment({...latest, retention}, now);
  return next.status === 'recycled' ? {...next, endedAt: now} : next;
}
