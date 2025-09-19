// src/types/globals.d.ts
interface WakeLockSentinel {
  release(): Promise<void>;
}

interface Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
  webkitAudioContext?: typeof AudioContext;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
}

interface NotificationOptions {
  vibrate?: number[];
}

declare namespace NodeJS {
  interface Timeout extends Timer {}
}

declare var setTimeout: (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => NodeJS.Timeout;
declare var clearTimeout: (timeoutId: NodeJS.Timeout) => void;
