import * as React from 'react';

const STORAGE_KEY = 'wispaper-prototype-auth-state';

function readAuthState() {
  try {
    if (new URLSearchParams(window.location.search).get('guest') === '1') return false;
    return window.localStorage.getItem(STORAGE_KEY) !== 'guest';
  } catch {
    return true;
  }
}

export function setPrototypeAuthenticated(authenticated: boolean) {
  try { window.localStorage.setItem(STORAGE_KEY, authenticated ? 'authenticated' : 'guest'); } catch {}
  window.dispatchEvent(new CustomEvent('wispaper:auth-state-changed', { detail: { authenticated } }));
}

export function usePrototypeAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(readAuthState);

  React.useEffect(() => {
    const handleChange = (event: Event) => {
      const authenticated = (event as CustomEvent<{ authenticated?: boolean }>).detail?.authenticated;
      setIsAuthenticated(typeof authenticated === 'boolean' ? authenticated : readAuthState());
    };
    window.addEventListener('wispaper:auth-state-changed', handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      window.removeEventListener('wispaper:auth-state-changed', handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  return { isAuthenticated, setAuthenticated: setPrototypeAuthenticated };
}
