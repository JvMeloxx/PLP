import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const supabase = await createClient();
  
  // Use getUser() instead of getSession() for proper server-side validation
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Check environment variables
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV || 'unknown',
  };

  // Check cookie details
  const authCookies = allCookies.filter(c => c.name.includes('auth'));
  const cookieInfo = authCookies.map(c => ({
    name: c.name,
    valueLength: c.value?.length || 0,
    valuePreview: c.value?.substring(0, 50) + '...',
  }));

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: 'black', minHeight: '100vh', wordBreak: 'break-all', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#ff3b30', fontSize: '24px', marginBottom: '20px' }}>🔍 Debug Page - Arena PLP</h1>
      
      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>Environment Variables</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(envCheck, null, 2)}
      </pre>

      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>All Cookies ({allCookies.length} total)</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(allCookies.map(c => ({ name: c.name, length: c.value?.length })), null, 2)}
      </pre>

      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>Auth Cookies Detail</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(cookieInfo, null, 2)}
      </pre>
      
      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>getUser() Result</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(user ? { id: user.id, email: user.email, role: user.role } : null, null, 2)}
      </pre>

      <h2 style={{ color: userError ? '#ff3b30' : '#00ff88', marginTop: '20px' }}>getUser() Error</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(userError, null, 2)}
      </pre>

      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>getSession() Result</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(session ? { user_id: session.user.id, expires_at: session.expires_at } : null, null, 2)}
      </pre>

      <h2 style={{ color: sessionError ? '#ff3b30' : '#00ff88', marginTop: '20px' }}>getSession() Error</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(sessionError, null, 2)}
      </pre>

      <h2 style={{ color: '#ffcc00', marginTop: '20px' }}>Instructions</h2>
      <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        <p>1. Faça login em /login</p>
        <p>2. Depois volte aqui em /debug para ver os cookies</p>
        <p>3. Se os cookies existem mas user é null, o token está inválido</p>
        <p>4. Se não há cookies de auth, o login não está gravando cookies</p>
      </div>
    </div>
  );
}
