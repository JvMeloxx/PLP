-- Execute isso no SQL Editor do Supabase para dar permissões de admin

-- Função helper para checar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CLASSES: Admin pode criar, editar e deletar
CREATE POLICY "Admin can insert classes" ON classes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update classes" ON classes FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete classes" ON classes FOR DELETE USING (public.is_admin());

-- ENROLLMENTS: Admin pode matricular e remover alunos
CREATE POLICY "Admin can insert enrollments" ON enrollments FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete enrollments" ON enrollments FOR DELETE USING (public.is_admin());

-- SESSIONS: Admin pode criar e deletar sessões
CREATE POLICY "Admin can insert sessions" ON sessions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can delete sessions" ON sessions FOR DELETE USING (public.is_admin());

-- ATTENDANCES: Admin pode gerenciar presenças
CREATE POLICY "Admin can update attendances" ON attendances FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete attendances" ON attendances FOR DELETE USING (public.is_admin());

-- RENEWALS: Admin pode atualizar status das mensalidades
CREATE POLICY "Admin can update renewals" ON renewals FOR UPDATE USING (public.is_admin());

-- PROFILES: Admin pode atualizar qualquer perfil (ex: mudar role)
CREATE POLICY "Admin can update all profiles" ON profiles FOR UPDATE USING (public.is_admin());
