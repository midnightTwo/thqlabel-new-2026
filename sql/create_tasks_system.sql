-- ============================================
-- THQ Label - Tasks Management System
-- Создание системы управления задачами
-- ============================================

-- 1. Создание основной таблицы задач
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Основная информация
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'documentation')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'review', 'done', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Связи
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  related_release_id UUID REFERENCES releases(id) ON DELETE SET NULL,
  
  -- Метаданные
  tags TEXT[],
  components TEXT[],
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Вложения (JSON массив с объектами {name, url, type, size})
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Отслеживание времени
  estimated_hours INTEGER,
  actual_hours INTEGER,
  
  -- Проверки
  CONSTRAINT valid_estimated_hours CHECK (estimated_hours >= 0),
  CONSTRAINT valid_actual_hours CHECK (actual_hours >= 0)
);

-- 2. Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_tasks_creator ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_related_release ON tasks(related_release_id);

-- 3. Таблица комментариев к задачам
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Для упоминаний пользователей
  mentioned_users UUID[],
  
  -- Для редактирования
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON task_comments(created_at DESC);

-- 4. Таблица истории изменений задач
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- Для группировки изменений в одном действии
  change_group_id UUID
);

CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created ON task_history(created_at DESC);

-- 5. Таблица наблюдателей задач
CREATE TABLE IF NOT EXISTS task_watchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Уникальная пара задача-пользователь
  UNIQUE(task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_watchers_task ON task_watchers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_watchers_user ON task_watchers(user_id);

-- 6. Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- 7. Триггер для записи истории изменений
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
DECLARE
  change_group UUID;
BEGIN
  change_group := uuid_generate_v4();
  
  -- Логируем изменение title
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO task_history (task_id, user_id, field, old_value, new_value, change_group_id)
    VALUES (NEW.id, auth.uid(), 'title', OLD.title, NEW.title, change_group);
  END IF;
  
  -- Логируем изменение status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_history (task_id, user_id, field, old_value, new_value, change_group_id)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status, NEW.status, change_group);
  END IF;
  
  -- Логируем изменение priority
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO task_history (task_id, user_id, field, old_value, new_value, change_group_id)
    VALUES (NEW.id, auth.uid(), 'priority', OLD.priority, NEW.priority, change_group);
  END IF;
  
  -- Логируем изменение assignee
  IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
    INSERT INTO task_history (task_id, user_id, field, old_value, new_value, change_group_id)
    VALUES (NEW.id, auth.uid(), 'assignee_id', OLD.assignee_id::TEXT, NEW.assignee_id::TEXT, change_group);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_task_changes
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_changes();

-- 8. RLS (Row Level Security) политики
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_watchers ENABLE ROW LEVEL SECURITY;

-- Политики для tasks
-- Все могут видеть задачи
CREATE POLICY "Tasks are viewable by everyone" ON tasks
  FOR SELECT USING (true);

-- Только авторизованные пользователи могут создавать задачи
CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Создатель или исполнитель могут обновлять задачу
CREATE POLICY "Users can update own or assigned tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = creator_id OR 
    auth.uid() = assignee_id
  );

-- Создатель может удалять свои задачи
CREATE POLICY "Creators can delete own tasks" ON tasks
  FOR DELETE USING (
    auth.uid() = creator_id
  );

-- Политики для task_comments
CREATE POLICY "Comments are viewable by everyone" ON task_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON task_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для task_history
CREATE POLICY "History is viewable by everyone" ON task_history
  FOR SELECT USING (true);

-- Политики для task_watchers
CREATE POLICY "Watchers are viewable by everyone" ON task_watchers
  FOR SELECT USING (true);

CREATE POLICY "Users can watch tasks" ON task_watchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unwatch tasks" ON task_watchers
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Функции для работы с задачами

-- Получить статистику задач
CREATE OR REPLACE FUNCTION get_tasks_statistics()
RETURNS TABLE (
  total_tasks BIGINT,
  open_tasks BIGINT,
  in_progress_tasks BIGINT,
  done_tasks BIGINT,
  critical_priority BIGINT,
  high_priority BIGINT,
  avg_completion_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'open') as open_tasks,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
    COUNT(*) FILTER (WHERE status = 'done') as done_tasks,
    COUNT(*) FILTER (WHERE priority = 'critical') as critical_priority,
    COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
    AVG(updated_at - created_at) FILTER (WHERE status = 'done') as avg_completion_time
  FROM tasks;
END;
$$ LANGUAGE plpgsql;

-- Получить задачи пользователя
CREATE OR REPLACE FUNCTION get_user_tasks(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  status TEXT,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.type,
    t.status,
    t.priority,
    t.created_at,
    t.due_date
  FROM tasks t
  WHERE t.assignee_id = user_uuid
    OR t.creator_id = user_uuid
    OR EXISTS (
      SELECT 1 FROM task_watchers tw
      WHERE tw.task_id = t.id AND tw.user_id = user_uuid
    )
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. Вставка примеров типов задач (справочная информация)
COMMENT ON TABLE tasks IS 'Основная таблица для хранения задач системы';
COMMENT ON COLUMN tasks.type IS 'Тип задачи: bug - исправление ошибки, feature - новая функциональность, improvement - улучшение, documentation - документация';
COMMENT ON COLUMN tasks.status IS 'Статус: open - открыто, in_progress - в работе, review - на проверке, done - выполнено, closed - закрыто';
COMMENT ON COLUMN tasks.priority IS 'Приоритет: critical - критичный, high - высокий, medium - средний, low - низкий';

-- Готово!
SELECT 'Tasks management system successfully created!' as message;
