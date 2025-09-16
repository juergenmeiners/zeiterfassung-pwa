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

export interface AlarmConfig {
  breakReminder?: string;
  endReminder?: string;
  maxHoursWarning?: number;
  overtimeWarning?: boolean;
}
