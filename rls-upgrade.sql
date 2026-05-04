-- ============================================================
-- 1. Remoção das políticas antigas (permissivas)
-- ============================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON classes;

DROP POLICY IF EXISTS "Enable read access for all users" ON enrollments;

DROP POLICY IF EXISTS "Enable read access for all users" ON sessions;

DROP POLICY IF EXISTS "Enable read access for all users" ON attendances;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON attendances;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON attendances;

DROP POLICY IF EXISTS "Enable read access for all users" ON renewals;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON renewals;

-- (Políticas de admin criadas anteriormente em admin-policies.sql não precisam ser dropadas, 
-- mas podemos garantir que elas estejam de acordo)


-- ============================================================
-- 2. Novas Políticas de Leitura Restritivas (Alunos)
-- ============================================================

-- PROFILES: Aluno só vê seu próprio perfil
CREATE POLICY "Students can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- CLASSES: Todos autenticados podem ver as turmas disponíveis (necessário para listar)
CREATE POLICY "Anyone authenticated can view classes" 
ON classes FOR SELECT 
USING (auth.role() = 'authenticated');

-- ENROLLMENTS: Aluno só vê suas próprias matrículas
CREATE POLICY "Students can view their own enrollments" 
ON enrollments FOR SELECT 
USING (auth.uid() = student_id);

-- SESSIONS: Aluno só vê sessões das turmas em que está matriculado
CREATE POLICY "Students can view sessions of their classes" 
ON sessions FOR SELECT 
USING (
  class_id IN (
    SELECT class_id FROM enrollments WHERE student_id = auth.uid()
  )
);

-- ATTENDANCES: Aluno só vê e insere/atualiza suas próprias presenças
CREATE POLICY "Students can view their own attendances" 
ON attendances FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own attendances" 
ON attendances FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own attendances" 
ON attendances FOR UPDATE 
USING (auth.uid() = student_id);

-- RENEWALS: Aluno só vê e insere suas próprias mensalidades
CREATE POLICY "Students can view their own renewals" 
ON renewals FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own renewals" 
ON renewals FOR INSERT 
WITH CHECK (auth.uid() = student_id);


-- ============================================================
-- 3. Políticas de Leitura para Admin
-- ============================================================

-- Admin pode ler TUDO
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can view all enrollments" ON enrollments FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can view all sessions" ON sessions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can view all attendances" ON attendances FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can view all renewals" ON renewals FOR SELECT USING (public.is_admin());
