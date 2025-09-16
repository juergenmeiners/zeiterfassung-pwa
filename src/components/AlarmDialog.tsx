import React from 'react';
import { Bell, Clock, X, Timer } from 'lucide-react';

interface AlarmState {
  isActive: boolean;
  type: string;
  message: string;
  time: string;
}

interface AlarmDialogProps {
  alarm: AlarmState | null;
  onDismiss: () => void;
  onSnooze: (minutes?: number) => void;
}

const AlarmDialog: React.FC<AlarmDialogProps> = ({ alarm, onDismiss, onSnooze }) => {
  if (!alarm?.isActive) return null;

  const getAlarmIcon = () => {
    switch (alarm.type) {
      case 'break':
        return '☕';
      case 'end':
        return '🏠';
      case 'TEST':
        return '🎉';
      default:
        return '🔔';
    }
  };

  const getAlarmColor = () => {
    switch (alarm.type) {
      case 'break':
        return 'from-orange-500 to-red-500';
      case 'end':
        return 'from-green-500 to-blue-500';
      case 'TEST':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-yellow-500 to-orange-500';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-pulse">
        {/* Dialog */}
        <div className={`bg-gradient-to-br ${getAlarmColor()} p-1 rounded-3xl shadow-2xl max-w-md w-full animate-bounce`}>
          <div className="bg-white rounded-3xl p-8 text-center">
            {/* Header */}
            <div className="mb-6">
              <div className="text-6xl mb-4 animate-pulse">
                {getAlarmIcon()}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Bell className="text-red-500 animate-bounce" size={24} />
                <h2 className="text-3xl font-bold text-gray-800">ALARM!</h2>
                <Bell className="text-red-500 animate-bounce" size={24} />
              </div>
              <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
                <Clock size={20} />
                <span>{alarm.time} Uhr</span>
              </div>
            </div>

            {/* Message */}
            <div className="mb-8">
              <p className="text-xl font-semibold text-gray-700 leading-relaxed">
                {alarm.message}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {alarm.type !== 'TEST' && (
                <>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onSnooze(5)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Timer size={20} />
                      Timer 5 Min
                    </button>
                    <button
                      onClick={() => onSnooze(10)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Timer size={20} />
                      Timer 10 Min
                    </button>
                  </div>
                </>
              )}
              
              <button
                onClick={onDismiss}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <X size={24} />
                {alarm.type === 'TEST' ? 'Test beendet' : 'Alarm stoppen'}
              </button>
            </div>

            {/* Additional Info */}
            {alarm.type === 'end' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700 font-medium">
                  💡 Tipp: Vergiss nicht deine Arbeitszeit zu dokumentieren!
                </p>
              </div>
            )}
            
            {alarm.type === 'break' && (
              <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                <p className="text-sm text-orange-700 font-medium">
                  🌱 Eine kurze Pause hilft dabei, produktiv zu bleiben
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AlarmDialog;
