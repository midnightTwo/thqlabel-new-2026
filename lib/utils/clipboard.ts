/**
 * Копирует текст в буфер обмена с fallback для случаев, когда документ не в фокусе
 */
export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Пробуем современный API
      if (navigator.clipboard && document.hasFocus()) {
        navigator.clipboard.writeText(text)
          .then(() => resolve(true))
          .catch(() => {
            // Fallback к старому методу
            fallbackCopy(text);
            resolve(true);
          });
      } else {
        // Используем fallback метод
        fallbackCopy(text);
        resolve(true);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      resolve(false);
    }
  });
}

function fallbackCopy(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.top = '0';
  textarea.style.left = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  
  document.body.removeChild(textarea);
}
