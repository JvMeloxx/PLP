import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Temporariamente usando getSession() para contornar o problema de rede (hang) no Railway.
  // getSession() valida o JWT localmente sem fazer requisição HTTP para o Supabase.
  console.log('[MIDDLEWARE DEBUG] Iniciando getSession()...');
  const {
    data: { session },
    error: userError,
  } = await supabase.auth.getSession();
  
  const user = session?.user;
  console.log('[MIDDLEWARE DEBUG] URL Configurada no Servidor:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[MIDDLEWARE DEBUG] Cookies recebidos do navegador:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  console.log('[MIDDLEWARE DEBUG] getSession() finalizado. User:', !!user, 'Error:', userError?.message);

  const pathname = request.nextUrl.pathname;

  // DEBUG: remover depois
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
  }

  // Rotas protegidas - redirecionar se não autenticado
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se já está logado e tenta acessar login/register, redireciona
  const authRoutes = ['/login', '/register'];
  if (user && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Proteção do admin: verificar role no banco
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
