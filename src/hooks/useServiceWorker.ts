import { useState, useEffect } from 'react';

export type ServiceWorkerStatus = 'checking' | 'installing' | 'ready' | 'error';

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>('checking');

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setStatus('error');
      return;
    }

    const checkServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
          setStatus('installing');
          return;
        }

        if (registration.installing) {
          setStatus('installing');
          registration.installing.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === 'activated') {
              setStatus('ready');
            }
          });
        } else if (registration.waiting) {
          setStatus('installing');
        } else if (registration.active) {
          setStatus('ready');
        }
      } catch {
        setStatus('error');
      }
    };

    checkServiceWorker();

    // Écouter les mises à jour du service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setStatus('ready');
    });
  }, []);

  return status;
}
