import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/zapi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const now = new Date();
    // Only run this logic if it's the 28th of the month
    if (now.getDate() !== 28) {
       return NextResponse.json({ success: true, message: 'Not the 28th, skipping.' });
    }

    // Get all students
    const { data: students, error: studentError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('role', 'student');

    if (studentError || !students) throw studentError;

    // Get all approved renewals for the current month
    // Note: Assuming a simple logic where we check if they have any 'approved' renewal in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentRenewals } = await supabase
      .from('renewals')
      .select('student_id')
      .eq('status', 'approved')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const paidStudentIds = new Set(recentRenewals?.map(r => r.student_id) || []);
    const messagesSent = [];

    for (const student of students) {
      if (!paidStudentIds.has(student.id)) {
        if (student.phone) {
          const message = `🔔 Olá ${student.name.split(' ')[0]}! O mês está acabando. Lembre-se de enviar o comprovante da sua mensalidade no app Arena PLP para garantir sua vaga nas turmas do próximo mês! 🏐`;
          await sendWhatsAppMessage(student.phone, message);
          messagesSent.push(student.name);
        }
      }
    }

    return NextResponse.json({ success: true, messagesSent });
  } catch (error) {
    console.error('Error in renewal reminder cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
