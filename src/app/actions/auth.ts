'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Preencha todos os campos.' };
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: 'Erro de configuração do servidor. Contate o administrador.' };
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            console.log('[LOGIN ACTION DEBUG] Setting cookies:', cookiesToSet.map(c => c.name));
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log(`[LOGIN ACTION DEBUG] Setting cookie ${name} with options:`, options);
              // Forçar algumas opções para garantir compatibilidade no Railway
              cookieStore.set(name, value, { 
                ...options,
                secure: process.env.NODE_ENV === 'production' || true,
                sameSite: 'lax',
                path: '/'
              });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === "Email not confirmed") {
        return { success: false, error: "Você precisa confirmar seu e-mail antes de entrar. Verifique sua caixa de entrada." };
      } else if (error.message === "Invalid login credentials") {
        return { success: false, error: "Email ou senha incorretos." };
      } else {
        const msg = error.message && error.message !== '{}' && error.message.trim() !== ''
          ? error.message
          : 'Serviço temporariamente indisponível. Aguarde alguns segundos e tente novamente.';
        return { success: false, error: msg };
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: `Erro de conexão com o servidor: ${message}` };
  }
}
