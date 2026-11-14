import { DeviceHardwareSpecs, ResourceTier } from '../types';

export const HardwareService = {
  async inspectDevice(): Promise<DeviceHardwareSpecs> {
    const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const deviceMemoryGB = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || null : null;
    const platform = typeof navigator !== 'undefined' ? navigator.platform || 'Unknown OS' : 'Unknown';

    let storageUsedMB = 0;
    let storageQuotaMB = 0;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        storageUsedMB = Math.round((estimate.usage || 0) / (1024 * 1024));
        storageQuotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
      } catch (e) {
        console.warn('Storage estimate error:', e);
      }
    }

    let gpuRenderer = 'Default WebGL Surface';
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            gpuRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
          }
        }
      } catch (e) {
        console.warn('WebGL inspect error:', e);
      }
    }

    let batteryLevel: number | null = null;
    let isCharging: boolean | null = null;

    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      try {
        const battery = await (navigator as any).getBattery();
        batteryLevel = Math.round(battery.level * 100);
        isCharging = battery.charging;
      } catch (e) {
        console.warn('Battery inspect error:', e);
      }
    }

    return {
      cpuCores,
      deviceMemoryGB,
      storageUsedMB,
      storageQuotaMB,
      gpuRenderer,
      batteryLevel,
      isCharging,
      platform,
    };
  },

  getRecommendedTier(specs: DeviceHardwareSpecs): ResourceTier {
    // If running low on battery and unplugged, prefer Lite
    if (specs.batteryLevel !== null && specs.batteryLevel < 20 && specs.isCharging === false) {
      return 'lite';
    }

    // High performance devices: 8+ cores or 8GB+ RAM
    if (specs.cpuCores >= 8 || (specs.deviceMemoryGB && specs.deviceMemoryGB >= 8)) {
      return 'beast';
    }

    // Standard modern devices
    if (specs.cpuCores >= 4) {
      return 'balanced';
    }

    return 'lite';
  },

  getThreadsForTier(tier: ResourceTier, maxCores: number): number {
    switch (tier) {
      case 'lite':
        return 1;
      case 'balanced':
        return Math.max(1, Math.floor(maxCores / 2));
      case 'beast':
        return Math.max(1, maxCores);
    }
  },
};
