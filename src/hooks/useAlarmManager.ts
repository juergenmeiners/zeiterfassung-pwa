import { useState, useEffect, useCallback, useRef } from 'react';
import { AlarmConfig, AlarmState, CustomAlarm, WorkDay } from '../types';

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
    return saved ? JSON.parse(saved) : {
      customAlarms: [],
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as WorkDay[]
    };
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

  // Check if today is a work day
  const isWorkDay = useCallback(() => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const workDayNumbers: Record<WorkDay, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    const currentWorkDays = alarms.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as WorkDay[];
    return currentWorkDays.some(day => workDayNumbers[day] === today);
  }, [alarms.workDays]);

  // Check if specific custom alarm should trigger today
  const shouldCustomAlarmTrigger = useCallback((alarm: CustomAlarm) => {
    if (!alarm.isActive) return false;
    
    const today = new Date().getDay();
    const workDayNumbers: Record<WorkDay, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    // If no specific days set, use work days
    const activeDays = alarm.activeDays.length > 0 ? alarm.activeDays : (alarms.workDays || []);
    
    return activeDays.some(day => workDayNumbers[day] === today);
  }, [alarms.workDays]);

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

        // VAPID public key
        const vapidPublicKey = 'BDZ3ycN4IBijw3P5O_z-udAKGo08Sf_AGPtkIc97rUVioDUzqBQVeSLf-MR6KfoIgyafJ6pysj60vzBfjgEfZws';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      if (subscription) {
        setPushSubscription(subscription as any);
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

    setActiveAlarm({
      isActive: true,
      type,
      message,
      time: currentTime
    });

    if (document.visibilityState === 'visible') {
      playAlarmSound();
      requestWakeLock();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Zeiterfassung Alarm', {
        body: message,
        icon: '/icon-192.png',
        requireInteraction: true,
        tag: 'zeiterfassung-alarm'
      });
    }

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

  const scheduleAlarmForTime = (type: string, time: string, message: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const timeUntilAlarm = alarmTime.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      triggerAlarm(type, message);
    }, timeUntilAlarm) as ReturnType<typeof setTimeout>;

    alarmTimeouts.current.set(type, timeout);
  };

  const setBreakAlarm = useCallback((time: string) => {
    if (!isWorkDay()) {
      console.log('Kein Arbeitstag - Pausenalarm wird nicht gesetzt');
      return;
    }

    const newAlarms = { ...alarms, breakReminder: time };
    setAlarms(newAlarms);
    
    const existingTimeout = alarmTimeouts.current.get('break');
    if (existingTimeout) clearTimeout(existingTimeout);
    
    scheduleAlarmForTime('break', time, 'Zeit für eine Pause! ☕');
    scheduleServerAlarm('break', time, 'Zeit für eine Pause! ☕');
  }, [alarms, isWorkDay]);

  const setEndAlarm = useCallback((time: string) => {
    if (!isWorkDay()) {
      console.log('Kein Arbeitstag - Feierabend-Alarm wird nicht gesetzt');
      return;
    }

    const newAlarms = { ...alarms, endReminder: time };
    setAlarms(newAlarms);
    
    const existingTimeout = alarmTimeouts.current.get('end');
    if (existingTimeout) clearTimeout(existingTimeout);
    
    scheduleAlarmForTime('end', time, 'Feierabend! Vergiss nicht auszustempeln 🏠');
    scheduleServerAlarm('end', time, 'Feierabend! Vergiss nicht auszustempeln 🏠');
  }, [alarms, isWorkDay]);

  const setMaxHoursWarning = useCallback((hours: number) => {
    const newAlarms = { ...alarms, maxHoursWarning: hours };
    setAlarms(newAlarms);
  }, [alarms]);

  const addCustomAlarm = useCallback((alarm: CustomAlarm) => {
    const newAlarms = { 
      ...alarms, 
      customAlarms: [...(alarms.customAlarms || []), alarm] 
    };
    setAlarms(newAlarms);
    
    // Schedule the custom alarm if it should trigger today
    if (shouldCustomAlarmTrigger(alarm)) {
      scheduleAlarmForTime(alarm.id, alarm.time, alarm.message);
      scheduleServerAlarm(alarm.id, alarm.time, alarm.message);
    }
  }, [alarms, shouldCustomAlarmTrigger]);

  const updateCustomAlarm = useCallback((updatedAlarm: CustomAlarm) => {
    const newAlarms = { 
      ...alarms, 
      customAlarms: (alarms.customAlarms || []).map(alarm => 
        alarm.id === updatedAlarm.id ? updatedAlarm : alarm
      ) 
    };
    setAlarms(newAlarms);
    
    // Clear existing timeout
    const existingTimeout = alarmTimeouts.current.get(updatedAlarm.id);
    if (existingTimeout) clearTimeout(existingTimeout);
    
    // Reschedule if active and should trigger today
    if (shouldCustomAlarmTrigger(updatedAlarm)) {
      scheduleAlarmForTime(updatedAlarm.id, updatedAlarm.time, updatedAlarm.message);
      scheduleServerAlarm(updatedAlarm.id, updatedAlarm.time, updatedAlarm.message);
    }
  }, [alarms, shouldCustomAlarmTrigger]);

  const deleteCustomAlarm = useCallback((alarmId: string) => {
    const newAlarms = { 
      ...alarms, 
      customAlarms: (alarms.customAlarms || []).filter(alarm => alarm.id !== alarmId) 
    };
    setAlarms(newAlarms);
    
    // Clear timeout
    const existingTimeout = alarmTimeouts.current.get(alarmId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      alarmTimeouts.current.delete(alarmId);
    }
  }, [alarms]);

  const updateWorkDays = useCallback((workDays: WorkDay[]) => {
    const newAlarms = { ...alarms, workDays };
    setAlarms(newAlarms);
    
    // Reschedule all alarms based on new work days
    rescheduleAllAlarms();
  }, [alarms]);

  const rescheduleAllAlarms = useCallback(() => {
    // Clear all existing timeouts
    alarmTimeouts.current.forEach(timeout => clearTimeout(timeout));
    alarmTimeouts.current.clear();
    
    // Reschedule standard alarms if today is a work day
    if (isWorkDay()) {
      if (alarms.breakReminder) {
        scheduleAlarmForTime('break', alarms.breakReminder, 'Zeit für eine Pause! ☕');
      }
      if (alarms.endReminder) {
        scheduleAlarmForTime('end', alarms.endReminder, 'Feierabend! Vergiss nicht auszustempeln 🏠');
      }
    }
    
    // Reschedule custom alarms
    (alarms.customAlarms || []).forEach(alarm => {
      if (shouldCustomAlarmTrigger(alarm)) {
        scheduleAlarmForTime(alarm.id, alarm.time, alarm.message);
      }
    });
  }, [alarms, isWorkDay, shouldCustomAlarmTrigger]);

  // Reschedule alarms when work days or custom alarms change
  useEffect(() => {
    rescheduleAllAlarms();
  }, [alarms.workDays, alarms.customAlarms]);

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
    addCustomAlarm,
    updateCustomAlarm,
    deleteCustomAlarm,
    updateWorkDays,
    dismissAlarm,
    snoozeAlarm,
    testAlarm,
    clearAlarm,
    isAudioSupported: !!audioContext,
    isPushSupported: !!pushSubscription
  };
};

export type { AlarmConfig, AlarmState } from '../types';
