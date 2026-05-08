'use server';

import { createClient } from '@/lib/supabase-server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Preencha todos os campos.' };
  }

  const supabase = await createClient();

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
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}
