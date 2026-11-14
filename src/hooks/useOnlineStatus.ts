import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';

export function useOnlineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulatedOffline, setSimulatedOfflineState] = useState(() => {
    return StorageService.getSettings().simulatedOffline;
  });

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setSimulatedOffline = (value: boolean) => {
    setSimulatedOfflineState(value);
    const settings = StorageService.getSettings();
    settings.simulatedOffline = value;
    StorageService.saveSettings(settings);
  };

  const effectiveOnline = isBrowserOnline && !simulatedOffline;

  return {
    isOnline: effectiveOnline,
    realBrowserOnline: isBrowserOnline,
    simulatedOffline,
    setSimulatedOffline,
  };
}
