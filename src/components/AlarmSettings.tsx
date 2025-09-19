import React from 'react';
import { Bell, TestTube } from 'lucide-react';

interface AlarmSettings {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  days: number[];
}

interface AlarmSettingsProps {
  alarmSettings: AlarmSettings[];
  onToggleAlarm: (alarmId: string, enabled: boolean) => void;
  onTestAlarm: () => void;
  onUpdateAlarmTime: (alarmId: string, newTime: string) => void;
  onUpdateAlarmDays: (alarmId: string, days: number[]) => void;
}

const AlarmSettings: React.FC<AlarmSettingsProps> = ({
  alarmSettings,
  onToggleAlarm,
  onTestAlarm,
  onUpdateAlarmTime,
  onUpdateAlarmDays
}) => {
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const formatTime = (time: string) => {
    if (!time) return '00:00';
    return time;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Alarm-Einstellungen</h3>
      </div>

      {alarmSettings.map((alarm) => (
        <div key={alarm.id} className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Bell className="text-blue-600" size={16} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{alarm.label}</h4>
                <p className="text-sm text-gray-500">
                  {formatTime(alarm.time)}
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alarm.enabled}
                onChange={(e) => onToggleAlarm(alarm.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {alarm.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alarm-Zeit
                </label>
                <input
                  type="time"
                  value={alarm.time}
                  onChange={(e) => onUpdateAlarmTime(alarm.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aktive Tage
                </label>
                <div className="flex gap-2 flex-wrap">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newDays = alarm.days.includes(index)
                          ? alarm.days.filter(d => d !== index)
                          : [...alarm.days, index].sort();
                        onUpdateAlarmDays(alarm.id, newDays);
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        alarm.days.includes(index)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

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
