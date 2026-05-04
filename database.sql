-- Execute isso no SQL Editor do seu painel do Supabase

-- Criar tipo customizado para o role do usuário
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE attendance_status AS ENUM ('confirmed', 'waitlist', 'cancelled');
CREATE TYPE renewal_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. Tabela: Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela: Classes (As turmas fixas)
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_of_week TEXT NOT NULL, -- 'Segunda-feira', 'Terça-feira', etc.
  time TEXT NOT NULL,        -- '08:30', '17:00'
  capacity INTEGER NOT NULL, -- 8, 16, 24, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela: Enrollments (A matrícula fixa do aluno na turma)
CREATE TABLE enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, class_id)
);

-- 4. Tabela: Sessions (As aulas que vão acontecer em dias específicos)
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL, -- ex: '2024-05-13'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(class_id, date)
);

-- 5. Tabela: Attendances (Presenças na aula específica)
CREATE TABLE attendances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status attendance_status DEFAULT 'confirmed'::attendance_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, student_id)
);

-- 6. Tabela: Renewals (Comprovantes de Mensalidade)
CREATE TABLE renewals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL, -- Ex: '2024-05-01' (Sempre o primeiro dia do mês de referência)
  receipt_url TEXT,
  status renewal_status DEFAULT 'pending'::renewal_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Segurança)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE renewals ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso básicas (Por enquanto, permitindo tudo para facilitar o MVP. Recomendamos restringir antes do lançamento)
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on id" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON classes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON sessions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON attendances FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON attendances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on user_id" ON attendances FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Enable read access for all users" ON renewals FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON renewals FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Trigger para criar Profile ao fazer Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
