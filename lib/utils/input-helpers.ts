// Хелперы для работы с инпутами на мобильных устройствах

/**
 * Обработчик клавиатурных событий для закрытия клавиатуры
 * Добавьте на input/textarea для автоматического закрытия клавиатуры при:
 * - Нажатии Enter
 * - Нажатии Escape
 * 
 * Использование:
 * <input onKeyDown={handleInputKeyDown} />
 */
export const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  if (e.key === 'Enter' || e.key === 'Escape') {
    e.currentTarget.blur();
  }
};

/**
 * Обработчик для textarea - закрывает клавиатуру только на Escape
 * (Enter используется для новой строки)
 * 
 * Использование:
 * <textarea onKeyDown={handleTextareaKeyDown} />
 */
export const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Escape') {
    e.currentTarget.blur();
  }
};

/**
 * Универсальный обработчик blur для предотвращения багов с клавиатурой
 * 
 * Использование:
 * <input onBlur={handleInputBlur} />
 */
export const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  // Принудительно убираем фокус с элемента
  e.currentTarget.blur();
};

/**
 * Комбинированные пропсы для input с автозакрытием клавиатуры
 * 
 * Использование:
 * <input {...getInputProps()} />
 */
export const getInputProps = () => ({
  onKeyDown: handleInputKeyDown,
  onBlur: handleInputBlur,
});

/**
 * Комбинированные пропсы для textarea с автозакрытием клавиатуры
 * 
 * Использование:
 * <textarea {...getTextareaProps()} />
 */
export const getTextareaProps = () => ({
  onKeyDown: handleTextareaKeyDown,
  onBlur: handleInputBlur,
});
