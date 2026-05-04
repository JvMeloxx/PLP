-- ============================================================
-- Atualização das funções de Presença para suportar Deadline
-- Deadline: 2 horas antes da aula
-- ============================================================

-- 1. FUNÇÃO: Confirmar presença
CREATE OR REPLACE FUNCTION public.confirm_attendance(p_session_id UUID, p_student_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_capacity INTEGER;
  v_session_datetime TIMESTAMP;
  v_confirmed_count INTEGER;
  v_status attendance_status;
  v_existing_id UUID;
BEGIN
  -- Buscar capacidade e data/hora da turma
  SELECT c.capacity, (s.date + c.time::time) INTO v_capacity, v_session_datetime
  FROM sessions s
  JOIN classes c ON c.id = s.class_id
  WHERE s.id = p_session_id;

  IF v_capacity IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sessão não encontrada.');
  END IF;

  -- Checar Deadline (2 horas de antecedência)
  IF v_session_datetime < (now() + interval '2 hours') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prazo encerrado. Alterações apenas até 2 horas antes da aula.');
  END IF;

  -- Contar confirmados atuais
  SELECT COUNT(*) INTO v_confirmed_count
  FROM attendances
  WHERE session_id = p_session_id AND status = 'confirmed';

  -- Definir status
  IF v_confirmed_count < v_capacity THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'waitlist';
  END IF;

  -- Verificar se já existe registro (pode ser cancelled)
  SELECT id INTO v_existing_id
  FROM attendances
  WHERE session_id = p_session_id AND student_id = p_student_id;

  IF v_existing_id IS NOT NULL THEN
    UPDATE attendances SET status = v_status WHERE id = v_existing_id;
  ELSE
    INSERT INTO attendances (session_id, student_id, status)
    VALUES (p_session_id, p_student_id, v_status);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status::text,
    'confirmed_count', CASE WHEN v_status = 'confirmed' THEN v_confirmed_count + 1 ELSE v_confirmed_count END,
    'capacity', v_capacity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FUNÇÃO: Cancelar presença
CREATE OR REPLACE FUNCTION public.cancel_attendance(p_session_id UUID, p_student_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_existing RECORD;
  v_session_datetime TIMESTAMP;
  v_promoted_id UUID;
  v_promoted_name TEXT;
BEGIN
  -- Buscar data/hora da sessão
  SELECT (s.date + c.time::time) INTO v_session_datetime
  FROM sessions s
  JOIN classes c ON c.id = s.class_id
  WHERE s.id = p_session_id;

  -- Checar Deadline (2 horas de antecedência)
  IF v_session_datetime < (now() + interval '2 hours') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prazo encerrado. Alterações apenas até 2 horas antes da aula.');
  END IF;

  -- Buscar presença atual
  SELECT id, status INTO v_existing
  FROM attendances
  WHERE session_id = p_session_id AND student_id = p_student_id;

  IF v_existing.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presença não encontrada.');
  END IF;

  -- Cancelar
  UPDATE attendances SET status = 'cancelled' WHERE id = v_existing.id;

  -- Se era confirmado, promover primeiro da lista de espera
  IF v_existing.status = 'confirmed' THEN
    SELECT a.id, p.name INTO v_promoted_id, v_promoted_name
    FROM attendances a
    JOIN profiles p ON p.id = a.student_id
    WHERE a.session_id = p_session_id AND a.status = 'waitlist'
    ORDER BY a.created_at ASC
    LIMIT 1;

    IF v_promoted_id IS NOT NULL THEN
      UPDATE attendances SET status = 'confirmed' WHERE id = v_promoted_id;
      RETURN jsonb_build_object(
        'success', true,
        'promoted', v_promoted_name
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'promoted', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
