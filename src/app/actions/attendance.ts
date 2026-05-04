'use server';

import { createClient } from '@/lib/supabase-server';
import { sendWhatsAppMessage } from '@/lib/zapi';

export async function cancelAttendanceAction(
  sessionId: string, 
  studentId: string, 
  classDay: string, 
  classTime: string
) {
  const supabase = createClient();

  // Call the database function to cancel attendance and promote next in line
  const { data, error } = await supabase.rpc('cancel_attendance', {
    p_session_id: sessionId,
    p_student_id: studentId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data && !data.success) {
    return { success: false, error: data.error || 'Erro desconhecido.' };
  }

  // Check if someone was promoted from the waitlist
  if (data?.promoted && data?.promoted_phone) {
    const message = `Olá ${data.promoted.split(' ')[0]}! 🎉 Uma vaga abriu na turma de ${classDay} às ${classTime} e sua presença foi confirmada automaticamente! Nos vemos na areia! 🏐`;
    
    // Send WhatsApp message in the background (we don't wait/block the UI)
    sendWhatsAppMessage(data.promoted_phone, message).catch(err => {
      console.error('Failed to send WhatsApp message to promoted student:', err);
    });
  }

  return { 
    success: true, 
    promoted: data?.promoted 
  };
}
