-- ============================================================
-- Execute isso no SQL Editor do Supabase
-- Gera automaticamente as próximas sessões (aulas) com base
-- nas turmas cadastradas. Não precisa mais criar aula manualmente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_upcoming_sessions(weeks_ahead INTEGER DEFAULT 4)
RETURNS jsonb AS $$
DECLARE
  v_class RECORD;
  v_target_dow INTEGER;
  v_current_date DATE;
  v_end_date DATE;
  v_check_date DATE;
  v_created INTEGER := 0;
BEGIN
  v_current_date := CURRENT_DATE;
  v_end_date := v_current_date + (weeks_ahead * 7);

  FOR v_class IN SELECT id, day_of_week FROM classes LOOP
    -- Mapear dia da semana em português para número (ISO: Seg=1 ... Dom=7)
    v_target_dow := CASE v_class.day_of_week
      WHEN 'Segunda-feira' THEN 1
      WHEN 'Terça-feira' THEN 2
      WHEN 'Quarta-feira' THEN 3
      WHEN 'Quinta-feira' THEN 4
      WHEN 'Sexta-feira' THEN 5
      WHEN 'Sábado' THEN 6
      WHEN 'Domingo' THEN 7
      ELSE NULL
    END;

    IF v_target_dow IS NULL THEN
      CONTINUE;
    END IF;

    -- Percorrer cada dia do período e criar sessão se for o dia certo
    v_check_date := v_current_date;
    WHILE v_check_date <= v_end_date LOOP
      IF EXTRACT(ISODOW FROM v_check_date) = v_target_dow THEN
        -- Inserir sessão se não existir (ON CONFLICT ignora duplicatas)
        INSERT INTO sessions (class_id, date)
        VALUES (v_class.id, v_check_date)
        ON CONFLICT (class_id, date) DO NOTHING;

        IF FOUND THEN
          v_created := v_created + 1;
        END IF;
      END IF;

      v_check_date := v_check_date + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'sessions_created', v_created,
    'period_start', v_current_date,
    'period_end', v_end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
