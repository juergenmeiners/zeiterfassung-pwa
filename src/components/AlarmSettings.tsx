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

  const handleWorkDayToggle = (day: WorkDay) => {
    const currentWorkDays = alarms.workDays || Object.keys(workDayLabels) as WorkDay[];
    const newWorkDays = currentWorkDays.includes(day) 
      ? currentWorkDays.filter(d => d !== day)
      : [...currentWorkDays, day];
    onUpdateWorkDays(newWorkDays);
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

      {/* Überstunden-Warnung */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
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
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmSettings;
