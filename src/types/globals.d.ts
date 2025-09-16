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
  interface Timeout extends number {}
}
