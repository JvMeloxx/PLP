import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `✅ ${supabaseUrl}` : '❌ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? `✅ ${supabaseKey.substring(0, 20)}...` : '❌ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV || 'unknown',
  };

  // Direct connectivity test to Supabase
  let connectivityTest = 'not tested';
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    connectivityTest = `✅ Status ${res.status} - Server reachable`;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    connectivityTest = `❌ FAILED: ${msg}`;
  }

  // Test auth endpoint specifically
  let authTest = 'not tested';
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseKey,
      },
    });
    const body = await res.text();
    authTest = `✅ Status ${res.status} - Auth endpoint reachable (${body.substring(0, 100)}...)`;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    authTest = `❌ FAILED: ${msg}`;
  }

  // Cookie details
  const authCookies = allCookies.filter(c => c.name.includes('auth'));
  const cookieInfo = authCookies.map(c => ({
    name: c.name,
    valueLength: c.value?.length || 0,
    valuePreview: c.value?.substring(0, 80) + '...',
  }));

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: 'black', minHeight: '100vh', wordBreak: 'break-all', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#ff3b30', fontSize: '24px', marginBottom: '20px' }}>🔍 Debug Page v2 - Arena PLP</h1>
      
      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>Environment Variables</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(envCheck, null, 2)}
      </pre>

      <h2 style={{ color: connectivityTest.includes('❌') ? '#ff3b30' : '#00ff88', marginTop: '20px' }}>🌐 Connectivity Test (REST API)</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {connectivityTest}
      </pre>

      <h2 style={{ color: authTest.includes('❌') ? '#ff3b30' : '#00ff88', marginTop: '20px' }}>🔐 Auth Endpoint Test</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {authTest}
      </pre>

      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>Cookies ({allCookies.length} total)</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(cookieInfo, null, 2)}
      </pre>
      
      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>getUser() Result</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(user ? { id: user.id, email: user.email } : null, null, 2)}
      </pre>

      <h2 style={{ color: userError ? '#ff3b30' : '#00ff88', marginTop: '20px' }}>getUser() Error</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(userError, null, 2)}
      </pre>

      <h2 style={{ color: '#00ff88', marginTop: '20px' }}>getSession() Result</h2>
      <pre style={{ backgroundColor: '#222', padding: '10px', borderRadius: '8px' }}>
        {JSON.stringify(session ? { user_id: session.user.id, expires_at: session.expires_at } : null, null, 2)}
      </pre>
    </div>
  );
}
