-- Função para calcular a posição do aluno na lista de espera de uma sessão
CREATE OR REPLACE FUNCTION get_waitlist_position(p_session_id UUID, p_student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position INTEGER;
BEGIN
  -- Se não existir a presença como waitlist, retorna 0
  IF NOT EXISTS (
    SELECT 1 FROM attendances 
    WHERE session_id = p_session_id AND student_id = p_student_id AND status = 'waitlist'
  ) THEN
    RETURN 0;
  END IF;

  -- Conta quantos alunos na mesma sessão entraram na lista de espera ANTES desse aluno
  SELECT COUNT(*) + 1 INTO v_position
  FROM attendances
  WHERE session_id = p_session_id
    AND status = 'waitlist'
    AND created_at < (
      SELECT created_at 
      FROM attendances 
      WHERE session_id = p_session_id AND student_id = p_student_id
    );

  RETURN v_position;
END;
$$;
