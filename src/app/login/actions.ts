'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// ===========================================
// Login
// ===========================================

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Validate inputs
  if (!data.email || !data.password) {
    return { error: 'Email и пароль обязательны' };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  revalidatePath('/', 'layout');

  // Get redirect URL from form or default to dashboard
  const redirectTo = formData.get('redirect') as string || '/dashboard';
  redirect(redirectTo);
}

// ===========================================
// Signup
// ===========================================

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
  };

  // Validate inputs
  if (!data.email || !data.password) {
    return { error: 'Email и пароль обязательны' };
  }

  if (data.password.length < 6) {
    return { error: 'Пароль должен быть минимум 6 символов' };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName || null,
      },
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

// ===========================================
// Logout
// ===========================================

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

// ===========================================
// Error Messages
// ===========================================

function getAuthErrorMessage(message: string): string {
  const errors: Record<string, string> = {
    'Invalid login credentials': 'Неверный email или пароль',
    'Email not confirmed': 'Email не подтверждён. Проверьте почту.',
    'User already registered': 'Пользователь уже зарегистрирован',
    'Password should be at least 6 characters': 'Пароль должен быть минимум 6 символов',
    'Unable to validate email address: invalid format': 'Неверный формат email',
  };

  return errors[message] || message;
}
