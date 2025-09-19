import { useState, useEffect, useCallback, useRef } from 'react';
import { AlarmConfig, AlarmState } from '../types';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const useAlarmManager = () => {
  const [alarms, setAlarms] = useState<AlarmConfig>(() => {
    const saved = localStorage.getItem('zeiterfassung-alarms');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [activeAlarm, setActiveAlarm] = useState<AlarmState | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  
  const alarmTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isPlaying = useRef(false);

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      } catch (error) {
        console.warn('Audio context not available:', error);
      }
    };
    initAudio();
  }, []);

  // Save alarms to localStorage
  useEffect(() => {
    localStorage.setItem('zeiterfassung-alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Initialize push notifications
  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // VAPID public key - replace with your actual key
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViQFAKRd7X8A9e_qJ3R1wSvKrt1WQXJaeCX8xZ1l3i9aF_qKlV7QX6RsN4JQhNQ2L6V';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      if (subscription) {
        setPushSubscription(subscription as any);
        // Send subscription to server
        await sendSubscriptionToServer(subscription);
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const sendSubscriptionToServer = async (subscription: any) => {
    try {
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  const scheduleServerAlarm = async (type: string, time: string, message: string) => {
    if (!pushSubscription) return;

    try {
      await fetch('/api/schedule-alarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: pushSubscription,
          alarmData: { type, time, message }
        })
      });
    } catch (error) {
      console.error('Failed to schedule server alarm:', error);
    }
  };

  const playAlarmSound = useCallback(async () => {
    if (!audioContext || isPlaying.current) return;

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      isPlaying.current = true;
      
      const playBeep = () => {
        if (!isPlaying.current) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);

        if (isPlaying.current) {
          setTimeout(playBeep, 800);
        }
      };

      playBeep();
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  }, [audioContext]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
      }
    } catch (error) {
      console.warn('Wake lock failed:', error);
    }
  };

  const triggerAlarm = useCallback((type: string, message: string) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Set active alarm state
    setActiveAlarm({
      isActive: true,
      type,
      message,
      time: currentTime
    });

    // Play sound if page is visible
    if (document.visibilityState === 'visible') {
      playAlarmSound();
      requestWakeLock();
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Zeiterfassung Alarm', {
        body: message,
        icon: '/icon-192.png',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        tag: 'zeiterfassung-alarm'
      });
    }

    // Vibrate if available
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }, [playAlarmSound]);

  const dismissAlarm = useCallback(() => {
    isPlaying.current = false;
    setActiveAlarm(null);
    
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  const snoozeAlarm = useCallback((minutes: number = 5) => {
    dismissAlarm();
    
    setTimeout(() => {
      triggerAlarm('SNOOZE', `Snooze beendet! (${minutes} Min)`);
    }, minutes * 60 * 1000);
  }, [dismissAlarm, triggerAlarm]);

  const setBreakAlarm = useCallback((time: string) => {
    const newAlarms = { ...alarms, breakReminder: time };
    setAlarms(newAlarms);
    
    // Clear existing timeout
    const existingTimeout = alarmTimeouts.current.get('break');
    if (existingTimeout) clearTimeout(existingTimeout);
    
    // Schedule new alarm
    scheduleAlarmForTime('break', time, 'Zeit für eine Pause! ☕');
    scheduleServerAlarm('break', time, 'Zeit für eine Pause! ☕');
  }, [alarms]);

  const setEndAlarm = useCallback((time: string) => {
    const newAlarms = { ...alarms, endReminder: time };
    setAlarms(newAlarms);
    
    const existingTimeout = alarmTimeouts.current.get('end');
    if (existingTimeout) clearTimeout(existingTimeout);
    
    scheduleAlarmForTime('end', time, 'Feierabend! Vergiss nicht auszustempeln 🏠');
    scheduleServerAlarm('end', time, 'Feierabend! Vergiss nicht auszustempeln 🏠');
  }, [alarms]);

  const setMaxHoursWarning = useCallback((hours: number) => {
    const newAlarms = { ...alarms, maxHoursWarning: hours };
    setAlarms(newAlarms);
  }, [alarms]);

  const scheduleAlarmForTime = (type: string, time: string, message: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const timeUntilAlarm = alarmTime.getTime() - now.getTime();
    
const timeout = setTimeout(() => {
  triggerAlarm(type, message);
}, timeUntilAlarm) as ReturnType<typeof setTimeout>;
alarmTimeouts.current.set(type, timeout);
}; // <- Schließende Klammer für die scheduleAlarmForTime Funktion
  
const testAlarm = useCallback(() => {
    triggerAlarm('TEST', 'Test Alarm! Das System funktioniert 🎉');
  }, [triggerAlarm]);

  const clearAlarm = useCallback((type: string) => {
    const timeout = alarmTimeouts.current.get(type);
    if (timeout) {
      clearTimeout(timeout);
      alarmTimeouts.current.delete(type);
    }
    
    const newAlarms = { ...alarms };
    delete newAlarms[type as keyof AlarmConfig];
    setAlarms(newAlarms);
  }, [alarms]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      alarmTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

return {
    alarms,
    activeAlarm,
    setBreakAlarm,
    setEndAlarm,
    setMaxHoursWarning,
    dismissAlarm,
    snoozeAlarm,
    testAlarm,
    clearAlarm,
    isAudioSupported: !!audioContext,
    isPushSupported: !!pushSubscription
  };
}; // <- Diese Zeile schließt die useAlarmManager Funktion

export type { AlarmConfig, AlarmState } from '../types';
