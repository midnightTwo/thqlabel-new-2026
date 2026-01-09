"use client";

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function OfferPage() {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  const accentColor = isLight ? '#6050ba' : '#a78bfa';
  const textPrimary = isLight ? '#1f1f1f' : '#f4f4f5';
  const textSecondary = isLight ? '#374151' : '#d4d4d8';
  const textMuted = isLight ? '#6b7280' : '#a1a1aa';

  return (
    <div 
      className="min-h-screen"
      style={{
        background: isLight ? '#ffffff' : '#0a0a0b',
      }}
    >
      {/* Документ */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-12 pt-16 sm:pt-20 pb-8 sm:pb-12">
        
        {/* Заголовок документа */}
        <header className="text-center mb-10 pb-8" style={{ borderBottom: `1px solid ${isLight ? '#e5e7eb' : '#27272a'}` }}>
          <div 
            className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4"
            style={{ color: textMuted }}
          >
            Официальный документ
          </div>
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: textPrimary }}
          >
            ПУБЛИЧНАЯ ОФЕРТА
          </h1>
          <p className="text-base" style={{ color: textSecondary }}>
            о заключении договора оказания услуг
          </p>
        </header>

        {/* Преамбула */}
        <div 
          className="mb-8 p-4 rounded-lg text-sm leading-relaxed"
          style={{ 
            background: isLight ? '#f9fafb' : '#18181b',
            border: `1px solid ${isLight ? '#e5e7eb' : '#27272a'}`,
            color: textSecondary 
          }}
        >
          Настоящий документ является официальным предложением (публичной офертой) 
          в соответствии со статьями 435–437 Гражданского кодекса Российской Федерации.
        </div>

        {/* Содержание документа */}
        <article className="space-y-8" style={{ color: textSecondary }}>
          
          {/* Раздел 1 */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              1. Общие положения
            </h2>
            <div className="space-y-3 text-sm leading-relaxed pl-4">
              <p>
                <span style={{ color: accentColor }}>1.1.</span> Настоящая оферта адресована неопределенному кругу лиц.
              </p>
              <p>
                <span style={{ color: accentColor }}>1.2.</span> Акцепт оферты означает полное и безоговорочное принятие 
                условий настоящего договора. Самозанятый (далее — Исполнитель) предлагает договор о релизе для 
                физических и юридических лиц (далее — Заказчик) о нижеследующем.
              </p>
            </div>
          </section>

          {/* Раздел 2 */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              2. Термины и определения
            </h2>
            <div className="space-y-3 text-sm leading-relaxed pl-4">
              <p>
                <span style={{ color: accentColor }}>2.1.</span> <strong>Договор</strong> — документ «Договор о релизе 
                музыкального контента», опубликованный на сайте Исполнителя{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
              <p>
                <span style={{ color: accentColor }}>2.2.</span> <strong>Договор Оферты</strong> — договор между 
                Исполнителем и Заказчиком об оказании услуг, который заключается через сайт Оферты.
              </p>
              <p>
                <span style={{ color: accentColor }}>2.3.</span> <strong>Акцепт Оферты</strong> — принятие Оферты 
                Заказчиком, когда он обращается к Исполнителю за оказанием услуг. Акцептом Оферты считается нажатие 
                Заказчиком кнопки «Оплатить» под сформированным заказом на сайте{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
              <p>
                <span style={{ color: accentColor }}>2.4.</span> <strong>Тарифы</strong> — перечень услуг Исполнителя 
                с ценами, указанными в Прайс-листе на сайте{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
              <p>
                <span style={{ color: accentColor }}>2.5.</span> <strong>Заказчик</strong> — лицо, совершившее 
                Акцепт Оферты.
              </p>
              <p>
                <span style={{ color: accentColor }}>2.6.</span> <strong>Исполнитель</strong> —{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
              <p>
                <span style={{ color: accentColor }}>2.7.</span> Договор не требует скрепления печатями и/или 
                подписания Заказчиком и Исполнителем.
              </p>
            </div>
          </section>

          {/* Раздел 3 */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              3. Предмет Договора
            </h2>
            <div className="space-y-3 text-sm leading-relaxed pl-4">
              <p>
                <span style={{ color: accentColor }}>3.1.</span> Исполнитель оказывает Заказчику услуги в соответствии 
                с условиями Договора Оферты и текущими Тарифами, опубликованными на сайте{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
              <p>
                <span style={{ color: accentColor }}>3.2.</span> Заказчик принимает услуги Исполнителя и полностью 
                их оплачивает.
              </p>
              <p>
                <span style={{ color: accentColor }}>3.3.</span> Если заказчик оставляет отзыв о приобретенных услугах 
                в соцсетях Исполнителя или на его сайте, он дает согласие на размещение персональных данных в отзывах: 
                имени и фамилии.
              </p>
              <p>
                <span style={{ color: accentColor }}>3.4.</span> Заказчик соглашается, что совершая Акцепт Договора он 
                подтверждает, что ознакомлен, согласен, полностью и безоговорочно принимает все условия Договора Оферты.
              </p>
            </div>
          </section>

          {/* Раздел 4 */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              4. Срок действия Договора
            </h2>
            <div className="space-y-3 text-sm leading-relaxed pl-4">
              <p>
                <span style={{ color: accentColor }}>4.1.</span> Договор вступает в силу со дня акцепта заказчиком 
                и действует до полного исполнения сторонами обязательств по Договору.
              </p>
            </div>
          </section>

          {/* Контактная информация */}
          <section className="pt-6" style={{ borderTop: `1px solid ${isLight ? '#e5e7eb' : '#27272a'}` }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              Контактная информация
            </h2>
            <div className="text-sm leading-relaxed pl-4 space-y-2">
              <p>
                <strong>Исполнитель:</strong>{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
              <p>
                <strong>Сайт:</strong>{' '}
                <a href="https://thqlabel.ru" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:opacity-80" style={{ color: accentColor }}>
                  https://thqlabel.ru
                </a>
              </p>
            </div>
          </section>

        </article>

        {/* Подвал документа */}
        <footer className="mt-12 pt-6 text-center" style={{ borderTop: `1px solid ${isLight ? '#e5e7eb' : '#27272a'}` }}>
          {/* Кнопка назад */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-80"
            style={{ 
              background: isLight ? '#f3f4f6' : '#27272a',
              color: textPrimary,
              border: `1px solid ${isLight ? '#e5e7eb' : '#3f3f46'}`,
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Вернуться назад
          </button>
          
          <p className="text-xs mt-6" style={{ color: textMuted }}>
            Последнее обновление: 9 января 2026 г.
          </p>
          <p className="text-[10px] mt-2" style={{ color: textMuted }}>
            © 2026 thqlabel. Все права защищены.
          </p>
        </footer>

      </div>
    </div>
  );
}
