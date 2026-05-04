-- ============================================================
-- Atualização: Função Cancelar Presença (Z-API)
-- Modificada para retornar o telefone do usuário promovido.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_attendance(p_session_id UUID, p_student_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_existing RECORD;
  v_session_datetime TIMESTAMP;
  v_promoted_id UUID;
  v_promoted_name TEXT;
  v_promoted_phone TEXT;
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
    SELECT a.id, p.name, p.phone INTO v_promoted_id, v_promoted_name, v_promoted_phone
    FROM attendances a
    JOIN profiles p ON p.id = a.student_id
    WHERE a.session_id = p_session_id AND a.status = 'waitlist'
    ORDER BY a.created_at ASC
    LIMIT 1;

    IF v_promoted_id IS NOT NULL THEN
      UPDATE attendances SET status = 'confirmed' WHERE id = v_promoted_id;
      RETURN jsonb_build_object(
        'success', true,
        'promoted', v_promoted_name,
        'promoted_phone', v_promoted_phone
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'promoted', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
