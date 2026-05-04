import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/lib/zapi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Security check for Vercel Cron (Optional but recommended)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  // Use service role to bypass RLS for cron jobs
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // Calculate the target hour (2 hours from now)
    now.setHours(now.getHours() + 2);
    const targetHourStr = now.getHours().toString().padStart(2, '0') + ':00';
    // For a real app, you might want to check a window (e.g., between 2:00 and 2:59 hours from now)
    
    // Find sessions occurring today
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id, date, class_id, classes!inner(id, time, day_of_week)')
      .eq('date', currentDate);

    if (sessionError || !sessions) throw sessionError;

    const messagesSent = [];

    // Filter sessions that happen in exactly 2 hours
    const targetSessions = sessions.filter(session => {
      const classTimeStr = (session.classes as any).time; // e.g., "14:30" or "14:00"
      const classHour = parseInt(classTimeStr.split(':')[0]);
      return classHour === now.getHours();
    });

    for (const session of targetSessions) {
      const classDetails = session.classes as any;
      
      // Get all students enrolled in this class
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, profiles(name, phone)')
        .eq('class_id', session.class_id);

      if (!enrollments) continue;

      // Get all attendances for this session
      const { data: attendances } = await supabase
        .from('attendances')
        .select('student_id')
        .eq('session_id', session.id);

      const attendanceStudentIds = new Set(attendances?.map(a => a.student_id) || []);

      // Find students who haven't confirmed nor cancelled
      for (const enrollment of enrollments) {
        if (!attendanceStudentIds.has(enrollment.student_id)) {
          const profile = enrollment.profiles as any;
          if (profile && profile.phone) {
            const message = `⏳ Faltam 2 horas para sua aula de futevôlei (${classDetails.day_of_week} às ${classDetails.time})! Você ainda não confirmou nem cancelou sua presença no aplicativo Arena PLP. Por favor, acesse o app e confirme se você vai!`;
            
            await sendWhatsAppMessage(profile.phone, message);
            messagesSent.push(profile.name);
          }
        }
      }
    }

    return NextResponse.json({ success: true, messagesSent });
  } catch (error) {
    console.error('Error in attendance reminder cron:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
