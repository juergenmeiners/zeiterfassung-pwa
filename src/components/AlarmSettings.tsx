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
import React, { useState } from 'react';
import { Bell, Clock, Coffee, Home, Volume2, Smartphone, TestTube, Settings, X, Plus, Edit, Trash2 } from 'lucide-react';
import { AlarmConfig, CustomAlarm, WorkDay } from '../types';

interface AlarmSettingsProps {
  alarms: AlarmConfig;
  onSetBreakAlarm: (time: string) => void;
  onSetEndAlarm: (time: string) => void;
  onSetMaxHoursWarning: (hours: number) => void;
  onTestAlarm: () => void;
  onClearAlarm: (type: string) => void;
  onAddCustomAlarm: (alarm: CustomAlarm) => void;
  onUpdateCustomAlarm: (alarm: CustomAlarm) => void;
  onDeleteCustomAlarm: (id: string) => void;
  onUpdateWorkDays: (workDays: WorkDay[]) => void;
  isAudioSupported: boolean;
  isPushSupported: boolean;
}

const workDayLabels: Record<WorkDay, string> = {
  monday: 'Mo',
  tuesday: 'Di', 
  wednesday: 'Mi',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So'
};

const AlarmSettings: React.FC<AlarmSettingsProps> = ({
  alarms,
  onSetBreakAlarm,
  onSetEndAlarm,
  onSetMaxHoursWarning,
  onTestAlarm,
  onClearAlarm,
  onAddCustomAlarm,
  onUpdateCustomAlarm,
  onDeleteCustomAlarm,
  onUpdateWorkDays,
  isAudioSupported,
  isPushSupported
}) => {
  const [breakTime, setBreakTime] = useState(alarms.breakReminder || '12:00');
  const [endTime, setEndTime] = useState(alarms.endReminder || '17:00');
  const [maxHours, setMaxHours] = useState(alarms.maxHoursWarning || 8);

  // Custom Alarm Form State
  const [showCustomAlarmForm, setShowCustomAlarmForm] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<CustomAlarm | null>(null);
  const [customAlarmForm, setCustomAlarmForm] = useState({
    name: '',
    time: '09:30',
    message: '',
    activeDays: [] as WorkDay[]
  });

  const handleCustomAlarmSubmit = () => {
    if (!customAlarmForm.name || !customAlarmForm.time) {
      alert('Bitte Name und Zeit ausfüllen');
      return;
    }

    const newAlarm: CustomAlarm = {
      id: editingAlarm?.id || `custom_${Date.now()}`,
      name: customAlarmForm.name,
      time: customAlarmForm.time,
      message: customAlarmForm.message || `Zeit für ${customAlarmForm.name}!`,
      activeDays: customAlarmForm.activeDays,
      isActive: true
    };

    if (editingAlarm) {
      onUpdateCustomAlarm(newAlarm);
    } else {
      onAddCustomAlarm(newAlarm);
    }

    // Reset form
    setCustomAlarmForm({ name: '', time: '09:30', message: '', activeDays: [] });
    setShowCustomAlarmForm(false);
    setEditingAlarm(null);
  };

  const handleEditCustomAlarm = (alarm: CustomAlarm) => {
    setEditingAlarm(alarm);
    setCustomAlarmForm({
      name: alarm.name,
      time: alarm.time,
      message: alarm.message,
      activeDays: alarm.activeDays
    });
    setShowCustomAlarmForm(true);
  };

  const handleWorkDayToggle = (day: WorkDay) => {
    const currentWorkDays = alarms.workDays || Object.keys(workDayLabels) as WorkDay[];
    const newWorkDays = currentWorkDays.includes(day) 
      ? currentWorkDays.filter(d => d !== day)
      : [...currentWorkDays, day];
    onUpdateWorkDays(newWorkDays);
  };

  const handleCustomAlarmDayToggle = (day: WorkDay) => {
    const currentDays = customAlarmForm.activeDays;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setCustomAlarmForm({ ...customAlarmForm, activeDays: newDays });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Bell className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Erweiterte Alarme</h2>
            <p className="text-gray-600">Professionelle Benachrichtigungen für deine Arbeitszeit</p>
          </div>
        </div>
        
        {/* Feature Status */}
        <div className="flex gap-2">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isAudioSupported ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <Volume2 size={14} />
            Audio {isAudioSupported ? 'Aktiv' : 'Nicht verfügbar'}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isPushSupported ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <Smartphone size={14} />
            Push {isPushSupported ? 'Aktiv' : 'Nicht verfügbar'}
          </div>
        </div>
      </div>

      {/* Work Days Selection */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Settings className="text-blue-600" size={16} />
          </div>
          <h4 className="font-medium text-gray-800">Arbeitstage</h4>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {Object.entries(workDayLabels).map(([day, label]) => {
            const workDay = day as WorkDay;
            const isActive = alarms.workDays?.includes(workDay) ?? true;
            return (
              <label key={day} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => handleWorkDayToggle(workDay)}
                  className="sr-only"
                />
                <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}>
                  {label}
                </div>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Alarme werden nur an den ausgewählten Arbeitstagen ausgelöst
        </p>
      </div>

      {/* Standard Alarm Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Break Reminder */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Coffee className="text-orange-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Pausenerinnerung</h3>
            {alarms.breakReminder && (
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                Aktiv um {alarms.breakReminder}
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tägliche Pausenzeit
              </label>
              <input
                type="time"
                value={breakTime}
                onChange={(e) => setBreakTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onSetBreakAlarm(breakTime)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Pausenalarm setzen
              </button>
              {alarms.breakReminder && (
                <button
                  onClick={() => onClearAlarm('breakReminder')}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* End of Work Reminder */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Home className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Feierabend-Erinnerung</h3>
            {alarms.endReminder && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                Aktiv um {alarms.endReminder}
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fester Feierabend
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onSetEndAlarm(endTime)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Feierabend-Alarm setzen
              </button>
              {alarms.endReminder && (
                <button
                  onClick={() => onClearAlarm('endReminder')}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Alarms Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Coffee className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Benutzerdefinierte Alarme</h3>
          </div>
          
          <button
            onClick={() => {
              setShowCustomAlarmForm(!showCustomAlarmForm);
              setEditingAlarm(null);
              setCustomAlarmForm({ name: '', time: '09:30', message: '', activeDays: [] });
            }}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            Neuer Alarm
          </button>
        </div>

        {/* Custom Alarm Form */}
        {showCustomAlarmForm && (
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">
              {editingAlarm ? 'Alarm bearbeiten' : 'Neuen Alarm erstellen'}
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="z.B. Frühstückspause"
                  value={customAlarmForm.name}
                  onChange={(e) => setCustomAlarmForm({ ...customAlarmForm, name: e.target.value })}
                  className="p-2 border rounded-lg"
                />
                <input
                  type="time"
                  value={customAlarmForm.time}
                  onChange={(e) => setCustomAlarmForm({ ...customAlarmForm, time: e.target.value })}
                  className="p-2 border rounded-lg"
                />
              </div>
              
              <input
                type="text"
                placeholder="Benutzerdefinierte Nachricht (optional)"
                value={customAlarmForm.message}
                onChange={(e) => setCustomAlarmForm({ ...customAlarmForm, message: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
              
              <div>
                <label className="block text-sm font-medium mb-2">Aktive Tage:</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(workDayLabels).map(([day, label]) => {
                    const workDay = day as WorkDay;
                    const isActive = customAlarmForm.activeDays.includes(workDay);
                    return (
                      <label key={day} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => handleCustomAlarmDayToggle(workDay)}
                          className="sr-only"
                        />
                        <div className={`px-2 py-1 rounded text-sm transition-colors ${
                          isActive 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}>
                          {label}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCustomAlarmSubmit}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {editingAlarm ? 'Speichern' : 'Alarm erstellen'}
                </button>
                <button
                  onClick={() => {
                    setShowCustomAlarmForm(false);
                    setEditingAlarm(null);
                    setCustomAlarmForm({ name: '', time: '09:30', message: '', activeDays: [] });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Alarms List */}
        {alarms.customAlarms && alarms.customAlarms.length > 0 && (
          <div className="space-y-3">
            {alarms.customAlarms.map((alarm) => (
              <div key={alarm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{alarm.name}</h5>
                    <span className="text-sm text-gray-600">{alarm.time}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alarm.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {alarm.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {alarm.activeDays.length > 0 
                      ? alarm.activeDays.map(day => workDayLabels[day]).join(', ')
                      : 'Alle Tage'
                    }
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditCustomAlarm(alarm)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteCustomAlarm(alarm.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Settings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        
        {/* Max Hours Warning */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Clock className="text-red-600" size={16} />
            </div>
            <h4 className="font-medium text-gray-800">Überstunden-Warnung</h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Warnung nach (Stunden)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                max="16"
                value={maxHours}
                onChange={(e) => setMaxHours(parseFloat(e.target.value) || 8)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
            
            <button
              onClick={() => onSetMaxHoursWarning(maxHours)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
            >
              Warnung aktivieren
            </button>
          </div>
        </div>

        {/* Test Alarm */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TestTube className="text-purple-600" size={16} />
            </div>
            <h4 className="font-medium text-gray-800">Alarm testen</h4>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Teste alle Alarm-Features
            </p>
            <button
              onClick={onTestAlarm}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
            >
              Test starten
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Settings className="text-blue-600" size={16} />
            </div>
            <h4 className="font-medium text-gray-800">System Status</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Browser Audio:</span>
              <span className={isAudioSupported ? 'text-green-600 font-medium' : 'text-red-600'}>
                {isAudioSupported ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Push Notifications:</span>
              <span className={isPushSupported ? 'text-green-600 font-medium' : 'text-red-600'}>
                {isPushSupported ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Custom Alarms:</span>
              <span className="text-blue-600 font-medium">
                {alarms.customAlarms?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
            <Bell className="text-blue-600" size={16} />
          </div>
          <div className="text-sm">
            <h5 className="font-medium text-blue-800 mb-1">Wie funktionieren die Alarme?</h5>
            <ul className="text-blue-700 space-y-1">
              <li>• <strong>App geöffnet:</strong> Laute Alarme mit Ton und Vibration</li>
              <li>• <strong>App geschlossen:</strong> Push-Benachrichtigungen vom Server</li>
              <li>• <strong>Arbeitstage:</strong> Alarme werden nur an ausgewählten Tagen ausgelöst</li>
              <li>• <strong>Custom Alarms:</strong> Frühstück, Snacks, Termine - komplett flexibel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmSettings;
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
