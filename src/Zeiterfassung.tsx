import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Clock, Bell } from 'lucide-react';
import { useAlarmManager } from './hooks/useAlarmManager';
import AlarmDialog from './components/AlarmDialog';
import AlarmSettings from './components/AlarmSettings';
import { Order, Settings as SettingsType } from './types';

const TimeTrackingApp = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SettingsType>(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem('zeiterfassung-settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch {
        // If parsing fails, use defaults
      }
    }
    return {
      timeGrade: 1.2,
      breaks: [
        { start: '09:00', end: '09:20' },
        { start: '12:00', end: '12:20' }
      ]
    };
  });
  const [workStartTime, setWorkStartTime] = useState('');
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlarmSettings, setShowAlarmSettings] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
const [alarmTimeout, setAlarmTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Use the professional alarm manager
const {
  alarms,
  activeAlarm,
  setBreakAlarm,
  setEndAlarm,
  setMaxHoursWarning,
  addCustomAlarm,        // NEU
  updateCustomAlarm,     // NEU
  deleteCustomAlarm,     // NEU
  updateWorkDays,        // NEU
  dismissAlarm,
  snoozeAlarm,
  testAlarm,
  clearAlarm,
  isAudioSupported,
  isPushSupported
} = useAlarmManager();
  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      setCurrentTime(timeStr);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('zeiterfassung-settings', JSON.stringify(settings));
  }, [settings]);

  // Add initial order
  useEffect(() => {
    if (orders.length === 0) {
      addOrder();
    }
  }, []);

  const addOrder = () => {
    const newOrder = {
      id: Date.now(),
      name: '',
      hours: 0
    };
    setOrders([...orders, newOrder]);
  };

  const removeOrder = (id: number) => {
  setOrders(orders.filter(order => order.id !== id));
};

const updateOrder = (id: number, field: keyof Order, value: string | number) => {
  console.log('updateOrder called:', { id, field, value, type: typeof value });
  
  setOrders(orders.map(order => {
    if (order.id === id) {
      if (field === 'hours') {
        // Während der Eingabe als String belassen
        if (typeof value === 'string') {
          const result = { ...order, [field]: value === '' ? 0 : value };
          console.log('String input result:', result);
          return result;
        }
        // Numerische Werte direkt übernehmen
        const result = { ...order, [field]: Number(value) };
        console.log('Number input result:', result);
        return result;
      }
      return { ...order, [field]: value };
    }
    return order;
  }));
};
  
 const getTotalHours = () => {
  return orders.reduce((total, order) => total + (order.hours || 0), 0);
};

  const getEffectiveStartTime = () => {
    if (useCurrentTime) {
      return currentTime;
    }
    return workStartTime || '';
  };

 const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

  // KORRIGIERT: Präzise Rundung für minutesToTime
  const minutesToTime = (totalMinutes: number) => {
    const minutes = Math.round(totalMinutes);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours % 24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // KORRIGIERT: Präzise Stunden-zu-Minuten Konvertierung
  const hoursToMinutes = (hours: number) => {
    // Runde auf 2 Dezimalstellen und dann erst umrechnen
    const preciseHours = Math.round(hours * 100) / 100;
    return Math.round(preciseHours * 60);
  };

  // Calculate end time with break considerations
  const endTime = React.useMemo(() => {
    const totalHours = getTotalHours();
    const startTime = getEffectiveStartTime();
    
    if (!startTime || totalHours <= 0) return '--:--';
    
    const startMinutes = timeToMinutes(startTime);
    // KORRIGIERT: Verwende präzise Konvertierung
    const workMinutes = hoursToMinutes(totalHours / settings.timeGrade);
    let endMinutes = startMinutes + workMinutes;
    
    // Add breaks that fall within working hours and adjust end time
    settings.breaks.forEach(breakPeriod => {
      if (breakPeriod.start && breakPeriod.end) {
        const breakStartMinutes = timeToMinutes(breakPeriod.start);
        const breakEndMinutes = timeToMinutes(breakPeriod.end);
        
        // If break starts during work time, add break duration
        if (breakStartMinutes >= startMinutes && breakStartMinutes < endMinutes) {
          const breakDuration = breakEndMinutes - breakStartMinutes;
          endMinutes += breakDuration;
        }
        
        // If end time falls within a break, move it to after the break + remaining work time
        if (endMinutes > breakStartMinutes && endMinutes <= breakEndMinutes) {
          const remainingWorkTime = endMinutes - breakStartMinutes;
          endMinutes = breakEndMinutes + remainingWorkTime;
        }
      }
    });
    
    return minutesToTime(endMinutes);
  }, [orders, useCurrentTime, workStartTime, settings.timeGrade, currentTime, settings.breaks]);

  const totalHours = getTotalHours();
  const startTime = getEffectiveStartTime();

  // Legacy alarm system (keep for backward compatibility with existing users)
  useEffect(() => {
    if (alarmTimeout) {
      clearTimeout(alarmTimeout);
    }

    if (alarmEnabled) {
      if (endTime !== '--:--') {
        const now = new Date();
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const alarmDate = new Date();
        alarmDate.setHours(endHour, endMinute, 0, 0);

        if (alarmDate <= now) {
          alarmDate.setDate(alarmDate.getDate() + 1);
        }

        const timeUntil = alarmDate.getTime() - now.getTime();

        if (timeUntil > 0) {
          const timeout = setTimeout(() => {
            triggerLegacyAlarm(endTime);
          }, timeUntil);
          setAlarmTimeout(timeout);
        }
      }
    }

    return () => {
      if (alarmTimeout) clearTimeout(alarmTimeout);
    };
  }, [alarmEnabled, orders, useCurrentTime, workStartTime, settings, endTime]);

  const triggerLegacyAlarm = (endTime: string) => {
    // Visual alarm
    document.body.style.backgroundColor = '#FEE2E2';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 3000);

    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Arbeitszeit beendet!', {
        body: `Geplante Endzeit ${endTime} erreicht`,
        requireInteraction: true
      });
    }

    alert(`Arbeitszeit beendet!\n\nGeplante Endzeit ${endTime} erreicht.`);
  };

  const toggleAlarm = async () => {
    if (!alarmEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Benachrichtigungen sind erforderlich für den Alarm.');
          return;
        }
      }
      setAlarmEnabled(true);
    } else {
      setAlarmEnabled(false);
      if (alarmTimeout) {
        clearTimeout(alarmTimeout);
        setAlarmTimeout(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-800">Zeiterfassung PWA</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAlarmSettings(!showAlarmSettings)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showAlarmSettings 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Bell size={20} />
                Alarme
                {Object.keys(alarms).length > 0 && (
                  <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {Object.keys(alarms).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings size={20} />
                Einstellungen
              </button>
            </div>
          </div>

         {/* Professional Alarm Settings */}
{showAlarmSettings && (
  <AlarmSettings
    alarms={alarms}
    onSetBreakAlarm={setBreakAlarm}
    onSetEndAlarm={setEndAlarm}
    onSetMaxHoursWarning={setMaxHoursWarning}
    onTestAlarm={testAlarm}
    onClearAlarm={clearAlarm}
    onAddCustomAlarm={addCustomAlarm}           // NEU
    onUpdateCustomAlarm={updateCustomAlarm}     // NEU
    onDeleteCustomAlarm={deleteCustomAlarm}     // NEU
    onUpdateWorkDays={updateWorkDays}           // NEU
    isAudioSupported={isAudioSupported}
    isPushSupported={isPushSupported}
  />
)}

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Einstellungen</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Zeitgrad</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.timeGrade}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeGrade: parseFloat(e.target.value) || 1 
                  }))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pausenzeiten</label>
                {settings.breaks.map((breakPeriod, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="time"
                      value={breakPeriod.start}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        breaks: prev.breaks.map((b, i) => 
                          i === index ? { ...b, start: e.target.value } : b
                        )
                      }))}
                      className="p-2 border rounded"
                    />
                    <span>bis</span>
                    <input
                      type="time"
                      value={breakPeriod.end}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        breaks: prev.breaks.map((b, i) => 
                          i === index ? { ...b, end: e.target.value } : b
                        )
                      }))}
                      className="p-2 border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy Alarm Section (for backward compatibility) */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Bell size={24} />
                  Einfacher Arbeitszeit-Alarm
                </h3>
                <p className="text-orange-700 mt-1">Benachrichtigung zur geplanten Endzeit</p>
              </div>
              <button
                onClick={toggleAlarm}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  alarmEnabled 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {alarmEnabled ? 'Alarm deaktivieren' : 'Alarm aktivieren'}
              </button>
            </div>
          </div>

          {/* Work Time Configuration */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Arbeitszeit festlegen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Summe Auftragsstunden</div>
                <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(2)}h</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-2">Startzeit</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={useCurrentTime}
                      onChange={() => setUseCurrentTime(true)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Jetzt ({currentTime})</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!useCurrentTime}
                      onChange={() => setUseCurrentTime(false)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Zeit eingeben</span>
                  </label>
                  {!useCurrentTime && (
                    <input
                      type="time"
                      value={workStartTime}
                      onChange={(e) => setWorkStartTime(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Geplante Endzeit</div>
                <div className="text-2xl font-bold text-green-600">{endTime}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Zeitgrad: {settings.timeGrade}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Aufträge</h2>
            <div className="bg-white rounded-lg overflow-hidden border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Name (optional)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Auftragsstunden
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Auftragsname..."
                          value={order.name}
                          onChange={(e) => updateOrder(order.id, 'name', e.target.value)}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="0.00"
                            value={order.hours === 0 ? '' : String(order.hours)}
                            onChange={(e) => {
                              console.log('Input onChange:', e.target.value);
                              const rawValue = e.target.value;
                              
                              // Erlaube leeren String
                              if (rawValue === '') {
                                updateOrder(order.id, 'hours', '');
                                return;
                              }
                              
                              // Erlaube nur gültige Zahlen-Eingaben
                              if (/^[0-9]*[.,]?[0-9]*$/.test(rawValue)) {
                                // Speichere als String während der Eingabe
                                updateOrder(order.id, 'hours', rawValue);
                              }
                            }}
                            onBlur={(e) => {
                              console.log('Input onBlur:', e.target.value);
                              const value = e.target.value.replace(',', '.');
                              if (value === '') {
                                updateOrder(order.id, 'hours', 0);
                              } else if (!isNaN(parseFloat(value))) {
                                const numValue = parseFloat(value);
                                console.log('Parsed value:', numValue);
                                updateOrder(order.id, 'hours', numValue);
                              }
                            }}
                            className="w-24 p-2 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="text-xs text-gray-400">
                            Wert: {JSON.stringify(order.hours)}
                          </div>
                        </div>
                        <span className="ml-1 text-sm text-gray-500">h</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeOrder(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-blue-50 px-4 py-3">
                <button
                  onClick={addOrder}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Plus size={20} />
                  Neuen Auftrag hinzufügen
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Zusammenfassung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">Summe Auftragsstunden</div>
                <div className="text-2xl font-bold text-gray-800">{totalHours.toFixed(2)}h</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">Startzeit</div>
                <div className="text-2xl font-bold text-blue-600">{startTime || '--:--'}</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">Geplante Endzeit</div>
                <div className="text-2xl font-bold text-green-600">{endTime}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Alarm Dialog */}
      <AlarmDialog 
        alarm={activeAlarm}
        onDismiss={dismissAlarm}
        onSnooze={snoozeAlarm}
      />
    </div>
  );
};

export default TimeTrackingApp;
