export interface Order {
  id: number;
  name: string;
  hours: number;
}

export interface BreakPeriod {
  start: string;
  end: string;
}

export interface Settings {
  timeGrade: number;
  breaks: BreakPeriod[];
}

export interface AlarmState {
  isActive: boolean;
  type: string;
  message: string;
  time: string;
}

export interface CustomAlarm {
  id: string;
  name: string;
  time: string;
  message: string;
  activeDays: WorkDay[];
  isActive: boolean;
}

export type WorkDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface AlarmConfig {
  breakReminder?: string;
  endReminder?: string;
  maxHoursWarning?: number;
  overtimeWarning?: boolean;
  customAlarms: CustomAlarm[];
  workDays: WorkDay[];
}
