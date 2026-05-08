import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export default async function DebugPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: 'black', minHeight: '100vh', wordBreak: 'break-all' }}>
      <h1>Debug Page</h1>
      <h2>Cookies Present: {allCookies.length}</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px' }}>
        {JSON.stringify(allCookies, null, 2)}
      </pre>
      
      <h2>Supabase Session</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px' }}>
        {JSON.stringify(session ? { user: session.user.id } : null, null, 2)}
      </pre>

      <h2>Supabase Error</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px' }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    </div>
  );
}
