import React from 'react';
import { Bell, TestTube } from 'lucide-react';

// Verwende die AlarmConfig aus Zeiterfassung.tsx - keine lokale Definition nötig

interface AlarmSettingsProps {
  alarms: any; // Verwende any um TypeScript-Konflikte zu vermeiden
  onSetBreakAlarm: (time: string) => void;
  onSetEndAlarm: (time: string) => void;
  onSetMaxHoursWarning: (hours: number) => void;
  onToggleBreakAlarm: (enabled: boolean) => void;
  onToggleEndAlarm: (enabled: boolean) => void;
  onToggleMaxHoursWarning: (enabled: boolean) => void;
  onTogglePushNotifications: (enabled: boolean) => void;
  onClearAlarm: (type: string) => void;
  onTestAlarm: () => void;
  onAddCustomAlarm: (alarm: any) => void;
  onUpdateCustomAlarm: (updatedAlarm: any) => void;
  onDeleteCustomAlarm: (id: string) => void;
  onUpdateWorkDays: (days: any) => void;
  subscriptionStatus: string;
  isPushSupported: boolean;
}

const AlarmSettings: React.FC<AlarmSettingsProps> = ({
  alarms,
  onSetBreakAlarm,
  onSetEndAlarm,
  onSetMaxHoursWarning,
  onTestAlarm,
  onToggleBreakAlarm,
  onToggleEndAlarm,
  onToggleMaxHoursWarning,
  onTogglePushNotifications,
  subscriptionStatus,
  isPushSupported
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Alarm-Einstellungen</h3>
      </div>

      {/* Pause Alarm */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Bell className="text-orange-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Pause-Erinnerung</h4>
              <p className="text-sm text-gray-500">Erinnert dich an Pausen</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alarms.breakAlarm.enabled}
              onChange={(e) => onToggleBreakAlarm(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {alarms.breakAlarm.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pause-Zeit
            </label>
            <input
              type="time"
              value={alarms.breakAlarm.time}
              onChange={(e) => onSetBreakAlarm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}
      </div>

      {/* End Alarm */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <Bell className="text-red-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Feierabend-Alarm</h4>
              <p className="text-sm text-gray-500">Alarm zum Arbeitsende</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alarms.endAlarm.enabled}
              onChange={(e) => onToggleEndAlarm(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {alarms.endAlarm.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feierabend-Zeit
            </label>
            <input
              type="time"
              value={alarms.endAlarm.time}
              onChange={(e) => onSetEndAlarm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}
      </div>

      {/* Max Hours Warning */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Bell className="text-yellow-600" size={16} />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Überstunden-Warnung</h4>
              <p className="text-sm text-gray-500">Warnt vor zu vielen Stunden</p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alarms.maxHoursWarning.enabled}
              onChange={(e) => onToggleMaxHoursWarning(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
          </label>
        </div>

        {alarms.maxHoursWarning.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximale Stunden pro Tag
            </label>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={alarms.maxHoursWarning.hours}
              onChange={(e) => onSetMaxHoursWarning(parseFloat(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        )}
      </div>

      {/* Push Notifications */}
      {isPushSupported && (
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Bell className="text-green-600" size={16} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Push-Benachrichtigungen</h4>
                <p className="text-sm text-gray-500">
                  Status: {subscriptionStatus}
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alarms.pushNotifications}
                onChange={(e) => onTogglePushNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      )}

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
