// ============================================================
// Tipos centrais do Arena PLP
// Substituem todos os `any` do projeto
// ============================================================

export interface Profile {
  id: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'student';
  created_at: string;
}

export interface Class {
  id: string;
  day_of_week: string;
  time: string;
  capacity: number;
  created_at: string;
}

export interface SessionWithClass {
  id: string;
  class_id: string;
  date: string;
  created_at: string;
  classes: {
    day_of_week: string;
    time: string;
    capacity: number;
  };
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  created_at: string;
  profiles?: { name: string };
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  created_at: string;
  profiles?: { name: string };
  classes?: { day_of_week: string; time: string };
}

export interface Renewal {
  id: string;
  student_id: string;
  month: string;
  receipt_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: { name: string };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Feedback toast type
export interface FeedbackMessage {
  type: 'success' | 'error';
  message: string;
}

// Dias da semana (constante útil)
export const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const;
