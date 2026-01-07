-- ============================================
-- СИСТЕМА ОТЧЕТОВ ПО РОЯЛТИ (ROYALTY REPORTS)
-- ============================================
-- Таблицы для хранения статистики прослушиваний, доходов и выплат по артистам

-- 1. Таблица загруженных отчетов
CREATE TABLE IF NOT EXISTS royalty_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Информация о квартале
  quarter TEXT NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
  year INTEGER NOT NULL,
  quarter_key TEXT GENERATED ALWAYS AS (quarter || ' ' || year::TEXT) STORED,
  
  -- Период отчета
  period_start DATE,
  period_end DATE,
  
  -- Статус обработки
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processing_progress INTEGER DEFAULT 0, -- 0-100
  
  -- Статистика обработки
  total_files INTEGER DEFAULT 0,
  processed_files INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  matched_tracks INTEGER DEFAULT 0,
  unmatched_tracks INTEGER DEFAULT 0,
  total_revenue NUMERIC(15, 6) DEFAULT 0,
  total_streams INTEGER DEFAULT 0,
  
  -- Метаданные
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  error_log TEXT
);

-- Индексы для royalty_reports
CREATE INDEX IF NOT EXISTS idx_royalty_reports_quarter ON royalty_reports(quarter, year);
CREATE INDEX IF NOT EXISTS idx_royalty_reports_status ON royalty_reports(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_royalty_reports_quarter_unique ON royalty_reports(quarter, year);

-- 2. Таблица статистики по трекам
CREATE TABLE IF NOT EXISTS track_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Привязка к отчету и периоду
  report_id UUID REFERENCES royalty_reports(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  -- Идентификация трека
  isrc TEXT,
  upc TEXT,
  track_title TEXT NOT NULL,
  release_title TEXT,
  artist_name TEXT NOT NULL,
  
  -- Привязка к системе (если найден)
  release_id UUID, -- Ссылка на releases_basic или releases_exclusive
  release_type TEXT CHECK (release_type IN ('basic', 'exclusive')),
  user_id UUID REFERENCES auth.users(id),
  track_index INTEGER, -- Индекс трека в массиве tracks релиза
  is_matched BOOLEAN DEFAULT FALSE,
  
  -- Финансовые данные
  streams INTEGER DEFAULT 0,
  net_revenue NUMERIC(15, 6) DEFAULT 0,
  currency TEXT DEFAULT 'RUB',
  
  -- Агрегированные данные
  UNIQUE(isrc, quarter, year),
  UNIQUE(upc, track_title, quarter, year)
);

-- Индексы для track_statistics
CREATE INDEX IF NOT EXISTS idx_track_statistics_report ON track_statistics(report_id);
CREATE INDEX IF NOT EXISTS idx_track_statistics_isrc ON track_statistics(isrc);
CREATE INDEX IF NOT EXISTS idx_track_statistics_upc ON track_statistics(upc);
CREATE INDEX IF NOT EXISTS idx_track_statistics_user ON track_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_track_statistics_release ON track_statistics(release_id);
CREATE INDEX IF NOT EXISTS idx_track_statistics_matched ON track_statistics(is_matched);

-- 3. Таблица статистики по странам
CREATE TABLE IF NOT EXISTS country_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Привязка
  track_stat_id UUID REFERENCES track_statistics(id) ON DELETE CASCADE,
  report_id UUID REFERENCES royalty_reports(id) ON DELETE CASCADE,
  
  -- Страна
  country_code TEXT,
  country_name TEXT NOT NULL,
  
  -- Статистика
  streams INTEGER DEFAULT 0,
  net_revenue NUMERIC(15, 6) DEFAULT 0,
  
  UNIQUE(track_stat_id, country_name)
);

-- Индексы для country_statistics
CREATE INDEX IF NOT EXISTS idx_country_statistics_track ON country_statistics(track_stat_id);
CREATE INDEX IF NOT EXISTS idx_country_statistics_country ON country_statistics(country_name);

-- 4. Таблица статистики по платформам
CREATE TABLE IF NOT EXISTS platform_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Привязка
  track_stat_id UUID REFERENCES track_statistics(id) ON DELETE CASCADE,
  report_id UUID REFERENCES royalty_reports(id) ON DELETE CASCADE,
  
  -- Платформа
  platform_name TEXT NOT NULL,
  
  -- Статистика
  streams INTEGER DEFAULT 0,
  net_revenue NUMERIC(15, 6) DEFAULT 0,
  
  UNIQUE(track_stat_id, platform_name)
);

-- Индексы для platform_statistics
CREATE INDEX IF NOT EXISTS idx_platform_statistics_track ON platform_statistics(track_stat_id);
CREATE INDEX IF NOT EXISTS idx_platform_statistics_platform ON platform_statistics(platform_name);

-- 5. Таблица истории выплат роялти
CREATE TABLE IF NOT EXISTS royalty_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Привязка
  report_id UUID REFERENCES royalty_reports(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Сумма и период
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC(15, 6) NOT NULL,
  currency TEXT DEFAULT 'RUB',
  
  -- Статус
  status TEXT DEFAULT 'credited' CHECK (status IN ('pending', 'credited', 'failed')),
  
  -- Детали
  tracks_count INTEGER DEFAULT 0,
  total_streams INTEGER DEFAULT 0,
  notes TEXT
);

-- Индексы для royalty_payouts
CREATE INDEX IF NOT EXISTS idx_royalty_payouts_user ON royalty_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_royalty_payouts_report ON royalty_payouts(report_id);
CREATE INDEX IF NOT EXISTS idx_royalty_payouts_period ON royalty_payouts(quarter, year);

-- 6. Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_royalty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
DROP TRIGGER IF EXISTS update_royalty_reports_updated_at ON royalty_reports;
CREATE TRIGGER update_royalty_reports_updated_at
    BEFORE UPDATE ON royalty_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_royalty_updated_at();

DROP TRIGGER IF EXISTS update_track_statistics_updated_at ON track_statistics;
CREATE TRIGGER update_track_statistics_updated_at
    BEFORE UPDATE ON track_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_royalty_updated_at();

-- 7. RLS Политики
ALTER TABLE royalty_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_payouts ENABLE ROW LEVEL SECURITY;

-- Политики для royalty_reports (только админы)
DROP POLICY IF EXISTS "Admins can manage royalty_reports" ON royalty_reports;
CREATE POLICY "Admins can manage royalty_reports" ON royalty_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);

-- Политики для track_statistics
DROP POLICY IF EXISTS "Users can view own track_statistics" ON track_statistics;
DROP POLICY IF EXISTS "Admins can manage track_statistics" ON track_statistics;
CREATE POLICY "Users can view own track_statistics" ON track_statistics FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can manage track_statistics" ON track_statistics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);

-- Политики для country_statistics
DROP POLICY IF EXISTS "Users can view own country_statistics" ON country_statistics;
DROP POLICY IF EXISTS "Admins can manage country_statistics" ON country_statistics;
CREATE POLICY "Users can view own country_statistics" ON country_statistics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM track_statistics 
    WHERE track_statistics.id = country_statistics.track_stat_id 
    AND (track_statistics.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner')))
  )
);
CREATE POLICY "Admins can manage country_statistics" ON country_statistics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);

-- Политики для platform_statistics
DROP POLICY IF EXISTS "Users can view own platform_statistics" ON platform_statistics;
DROP POLICY IF EXISTS "Admins can manage platform_statistics" ON platform_statistics;
CREATE POLICY "Users can view own platform_statistics" ON platform_statistics FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM track_statistics 
    WHERE track_statistics.id = platform_statistics.track_stat_id 
    AND (track_statistics.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner')))
  )
);
CREATE POLICY "Admins can manage platform_statistics" ON platform_statistics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);

-- Политики для royalty_payouts
DROP POLICY IF EXISTS "Users can view own royalty_payouts" ON royalty_payouts;
DROP POLICY IF EXISTS "Admins can manage royalty_payouts" ON royalty_payouts;
CREATE POLICY "Users can view own royalty_payouts" ON royalty_payouts FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);
CREATE POLICY "Admins can manage royalty_payouts" ON royalty_payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'owner'))
);

-- 8. Функция поиска трека по ISRC или UPC
CREATE OR REPLACE FUNCTION find_track_by_isrc_upc(
  p_isrc TEXT,
  p_upc TEXT,
  p_track_title TEXT,
  p_artist_name TEXT
)
RETURNS TABLE (
  release_id UUID,
  release_type TEXT,
  user_id UUID,
  track_index INTEGER,
  found_by TEXT
) AS $$
DECLARE
  v_release RECORD;
  v_track RECORD;
  v_idx INTEGER;
BEGIN
  -- Сначала ищем по ISRC в releases_basic
  IF p_isrc IS NOT NULL AND p_isrc != '' THEN
    FOR v_release IN 
      SELECT rb.id, rb.user_id, rb.tracks, 'basic' as rel_type
      FROM releases_basic rb
      WHERE rb.status IN ('approved', 'published', 'distributed', 'pending')
    LOOP
      v_idx := 0;
      FOR v_track IN SELECT * FROM jsonb_array_elements(v_release.tracks)
      LOOP
        IF v_track.value->>'isrc' = p_isrc THEN
          RETURN QUERY SELECT v_release.id, v_release.rel_type, v_release.user_id, v_idx, 'isrc'::TEXT;
          RETURN;
        END IF;
        v_idx := v_idx + 1;
      END LOOP;
    END LOOP;
    
    -- Ищем в releases_exclusive
    FOR v_release IN 
      SELECT re.id, re.user_id, re.tracks, 'exclusive' as rel_type
      FROM releases_exclusive re
      WHERE re.status IN ('approved', 'published', 'distributed', 'pending')
    LOOP
      v_idx := 0;
      FOR v_track IN SELECT * FROM jsonb_array_elements(v_release.tracks)
      LOOP
        IF v_track.value->>'isrc' = p_isrc THEN
          RETURN QUERY SELECT v_release.id, v_release.rel_type, v_release.user_id, v_idx, 'isrc'::TEXT;
          RETURN;
        END IF;
        v_idx := v_idx + 1;
      END LOOP;
    END LOOP;
  END IF;
  
  -- Затем ищем по UPC
  IF p_upc IS NOT NULL AND p_upc != '' THEN
    -- В releases_basic
    SELECT rb.id, 'basic', rb.user_id, 0, 'upc'
    INTO release_id, release_type, user_id, track_index, found_by
    FROM releases_basic rb
    WHERE rb.upc = p_upc AND rb.status IN ('approved', 'published', 'distributed', 'pending')
    LIMIT 1;
    
    IF FOUND THEN
      RETURN NEXT;
      RETURN;
    END IF;
    
    -- В releases_exclusive
    SELECT re.id, 'exclusive', re.user_id, 0, 'upc'
    INTO release_id, release_type, user_id, track_index, found_by
    FROM releases_exclusive re
    WHERE re.upc = p_upc AND re.status IN ('approved', 'published', 'distributed', 'pending')
    LIMIT 1;
    
    IF FOUND THEN
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Наконец ищем по названию трека и артисту
  IF p_track_title IS NOT NULL AND p_artist_name IS NOT NULL THEN
    -- В releases_basic
    FOR v_release IN 
      SELECT rb.id, rb.user_id, rb.tracks, rb.artist_name, 'basic' as rel_type
      FROM releases_basic rb
      WHERE rb.status IN ('approved', 'published', 'distributed', 'pending')
      AND (LOWER(rb.artist_name) = LOWER(p_artist_name) OR rb.artist_name ILIKE '%' || p_artist_name || '%')
    LOOP
      v_idx := 0;
      FOR v_track IN SELECT * FROM jsonb_array_elements(v_release.tracks)
      LOOP
        IF LOWER(v_track.value->>'title') = LOWER(p_track_title) THEN
          RETURN QUERY SELECT v_release.id, v_release.rel_type, v_release.user_id, v_idx, 'title'::TEXT;
          RETURN;
        END IF;
        v_idx := v_idx + 1;
      END LOOP;
    END LOOP;
    
    -- В releases_exclusive
    FOR v_release IN 
      SELECT re.id, re.user_id, re.tracks, re.artist_name, 'exclusive' as rel_type
      FROM releases_exclusive re
      WHERE re.status IN ('approved', 'published', 'distributed', 'pending')
      AND (LOWER(re.artist_name) = LOWER(p_artist_name) OR re.artist_name ILIKE '%' || p_artist_name || '%')
    LOOP
      v_idx := 0;
      FOR v_track IN SELECT * FROM jsonb_array_elements(v_release.tracks)
      LOOP
        IF LOWER(v_track.value->>'title') = LOWER(p_track_title) THEN
          RETURN QUERY SELECT v_release.id, v_release.rel_type, v_release.user_id, v_idx, 'title'::TEXT;
          RETURN;
        END IF;
        v_idx := v_idx + 1;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Проверка
SELECT 'Royalty Reports tables created successfully!' as status;
