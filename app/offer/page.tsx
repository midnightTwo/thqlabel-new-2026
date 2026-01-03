"use client";

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function OfferPage() {
  const router = useRouter();
  const { themeName } = useTheme();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Кнопка назад */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 group"
          style={{
            background: themeName === 'light'
              ? 'linear-gradient(135deg, rgba(96,80,186,0.15) 0%, rgba(157,141,241,0.1) 100%)'
              : 'linear-gradient(135deg, rgba(96,80,186,0.3) 0%, rgba(157,141,241,0.2) 100%)',
            color: themeName === 'light' ? '#6050ba' : '#9d8df1',
            border: themeName === 'light'
              ? '1px solid rgba(96,80,186,0.2)'
              : '1px solid rgba(157,141,241,0.3)',
            boxShadow: themeName === 'light'
              ? '0 2px 10px rgba(96,80,186,0.15)'
              : '0 4px 20px rgba(96,80,186,0.3)',
          }}
        >
          <svg 
            className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </button>

        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{
              background: 'linear-gradient(135deg, #6050ba 0%, #9d8df1 50%, #6050ba 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 5s ease infinite',
            }}
          >
            Договор о релизе
          </h1>
          <p 
            className="text-lg"
            style={{ color: themeName === 'light' ? '#666' : '#a1a1aa' }}
          >
            Условия оказания услуг ООО «Звезда»
          </p>
        </div>

        {/* Контент договора */}
        <div 
          className="rounded-3xl p-6 sm:p-8 lg:p-10"
          style={{
            background: themeName === 'light'
              ? 'rgba(255,255,255,0.8)'
              : 'rgba(20,20,25,0.8)',
            backdropFilter: 'blur(20px)',
            border: themeName === 'light'
              ? '1px solid rgba(96,80,186,0.1)'
              : '1px solid rgba(157,141,241,0.15)',
            boxShadow: themeName === 'light'
              ? '0 10px 40px rgba(0,0,0,0.1)'
              : '0 10px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div className="space-y-8" style={{ color: themeName === 'light' ? '#333' : '#e5e5e5' }}>
            {/* Преамбула */}
            <section>
              <p className="text-sm leading-relaxed" style={{ color: themeName === 'light' ? '#666' : '#a1a1aa' }}>
                ООО «Звезда» (далее — Исполнитель) предлагает договор о релизе для физических 
                и юридических лиц (далее — Заказчик) о нижеследующем.
              </p>
            </section>

            {/* Раздел 1 */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}>
                1. Термины и определения
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: themeName === 'light' ? '#555' : '#c5c5c5' }}>
                <p>
                  1.1. Договор — документ «Договор о релизе музыкального контента», опубликованный 
                  на сайте Исполнителя{' '}
                  <a 
                    href="http://www.zwezda.ru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}
                  >
                    http://www.zwezda.ru/
                  </a>.
                </p>
                <p>
                  1.2. Договор Оферты — договор между Исполнителем и Заказчиком об оказании услуг, 
                  который заключается через сайт Оферты.
                </p>
                <p>
                  1.3. Акцепт Оферты — принятие Оферты Заказчиком, когда он обращается к Исполнителю 
                  за оказанием услуг. Акцептом Оферты считается нажатие Заказчиком кнопки «Оплатить» 
                  под сформированным заказом на сайте{' '}
                  <a 
                    href="http://www.zwezda.ru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}
                  >
                    http://www.zwezda.ru/
                  </a>.
                </p>
                <p>
                  1.4. Тарифы — перечень услуг Исполнителя с ценами, указанными в Прайс-листе на сайте{' '}
                  <a 
                    href="http://www.zwezda.ru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}
                  >
                    http://www.zwezda.ru/
                  </a>.
                </p>
                <p>
                  1.5. Заказчик — лицо, совершившее Акцепт Оферты.
                </p>
                <p>
                  1.6. Исполнитель — ООО «Звезда».
                </p>
                <p>
                  1.7. Договор не требует скрепления печатями и/или подписания Заказчиком и Исполнителем.
                </p>
              </div>
            </section>

            {/* Раздел 2 */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}>
                2. Предмет Договора
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: themeName === 'light' ? '#555' : '#c5c5c5' }}>
                <p>
                  2.1. Исполнитель оказывает Заказчику услуги в соответствии с условиями Договора Оферты 
                  и текущими Тарифами, опубликованными на сайте{' '}
                  <a 
                    href="http://www.zwezda.ru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}
                  >
                    http://www.zwezda.ru/
                  </a>.
                </p>
                <p>
                  2.2. Заказчик принимает услуги Исполнителя и полностью их оплачивает.
                </p>
                <p>
                  2.3. Если заказчик оставляет отзыв о приобретенных услугах в соцсетях Исполнителя 
                  или на его сайте, он дает согласие на размещение персональных данных в отзывах: 
                  имени и фамилии.
                </p>
                <p>
                  2.4. Заказчик соглашается, что совершая Акцепт Договора он подтверждает, что ознакомлен, 
                  согласен, полностью и безоговорочно принимает все условия Договора Оферты.
                </p>
              </div>
            </section>

            {/* Раздел 3 */}
            <section>
              <h2 className="text-xl font-bold mb-4" style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}>
                3. Срок действия Договора
              </h2>
              <div className="space-y-3 text-sm leading-relaxed" style={{ color: themeName === 'light' ? '#555' : '#c5c5c5' }}>
                <p>
                  3.1. Договор вступает в силу со дня акцепта заказчиком и действует до полного 
                  исполнения сторонами обязательств по Договору.
                </p>
              </div>
            </section>

            {/* Контактная информация */}
            <section className="pt-6 border-t" style={{ borderColor: themeName === 'light' ? 'rgba(96,80,186,0.15)' : 'rgba(157,141,241,0.2)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}>
                Контактная информация
              </h2>
              <div className="space-y-2 text-sm" style={{ color: themeName === 'light' ? '#555' : '#c5c5c5' }}>
                <p><strong>Исполнитель:</strong> ООО «Звезда»</p>
                <p><strong>Сайт:</strong>{' '}
                  <a 
                    href="http://www.zwezda.ru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                    style={{ color: themeName === 'light' ? '#6050ba' : '#9d8df1' }}
                  >
                    http://www.zwezda.ru/
                  </a>
                </p>
              </div>
            </section>

            {/* Дата */}
            <div className="pt-6 text-center">
              <p className="text-xs" style={{ color: themeName === 'light' ? '#999' : '#666' }}>
                Последнее обновление: 1 января 2026 г.
              </p>
            </div>
          </div>
        </div>

        {/* Кнопка назад внизу */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6050ba 0%, #7c6dd6 50%, #9d8df1 100%)',
              color: '#fff',
              boxShadow: '0 10px 30px rgba(96,80,186,0.4)',
            }}
          >
            Вернуться назад
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
