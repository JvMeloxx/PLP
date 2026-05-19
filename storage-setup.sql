-- 1. Cria o bucket público chamado "receipts" (comprovantes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permite que usuários logados façam upload de arquivos
CREATE POLICY "Permitir upload para usuarios autenticados"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
);

-- 3. Permite que qualquer pessoa (incluindo o admin e os alunos) possa ver e baixar os arquivos
CREATE POLICY "Permitir leitura de arquivos"
ON storage.objects FOR SELECT 
USING (bucket_id = 'receipts');

-- 4. Permite que usuários atualizem seus próprios arquivos caso mandem duas vezes
CREATE POLICY "Permitir atualizacao do proprio arquivo"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (bucket_id = 'receipts');
