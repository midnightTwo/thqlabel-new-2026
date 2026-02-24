"use client";

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function ConsentPage() {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/auth');
  };

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
            СОГЛАСИЕ
          </h1>
          <p className="text-base" style={{ color: textSecondary }}>
            на обработку персональных данных
          </p>
        </header>

        {/* Содержание документа */}
        <article className="space-y-8" style={{ color: textSecondary }}>
          
          {/* Преамбула */}
          <section>
            <div className="text-sm leading-relaxed space-y-4">
              <p>
                Настоящим, действуя свободно, своей волей и в своем интересе, а также подтверждая свою дееспособность, 
                добровольно и осознавая значение своих действий, выражаю свое безусловное согласие Гражданину Российской 
                Федерации Плотникову Никите Владимировичу, физическому лицу, применяющему специальный налоговый режим 
                «Налог на профессиональный доход (НПД)» <strong>ИНН: 615531925831</strong>, именуемому далее «Оператор», 
                на обработку моих персональных данных в соответствии со ст. 9 Федерального закона от 27.07.2006 N 152-ФЗ 
                &quot;О персональных данных&quot;.
              </p>
            </div>
          </section>

          {/* Персональные данные */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              Согласие дается на обработку следующих Персональных данных:
            </h2>
            <div className="text-sm leading-relaxed pl-4 space-y-2">
              <p>• Фамилия, Имя, Отчество (если есть)</p>
              <p>• Электронная почта</p>
              <p>• Паспортные данные</p>
              <p>• Банковские реквизиты</p>
            </div>
          </section>

          {/* Цели обработки */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              Целью обработки Персональных данных является:
            </h2>
            <div className="text-sm leading-relaxed pl-4 space-y-2">
              <p>• Составление договора на дистрибуцию музыки</p>
              <p>• Установление и поддержание связи между мной и Операторами, включая консультирование</p>
              <p>• Заключение договоров и выполнение обязательств оператором перед клиентом</p>
              <p>• Улучшение качества обслуживания клиента и модернизации деятельности оператора</p>
              <p>• Статистические и другие исследования на основании обезличенной информации</p>
            </div>
          </section>

          {/* Согласие на обработку */}
          <section>
            <div className="text-sm leading-relaxed space-y-4">
              <p>
                Я даю свое согласие на обработку своих персональных данных Оператору, включая лиц, действующих по его 
                поручению или на основании Договора с Оператором, на осуществление автоматизированной и неавтоматизированной 
                обработки, включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), 
                использование, обезличивание, передачу (предоставление, доступ), удаление, уничтожение, блокирование.
              </p>
            </div>
          </section>

          {/* Подтверждения */}
          <section>
            <h2 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>
              Давая настоящее согласие, я подтверждаю, что:
            </h2>
            <div className="text-sm leading-relaxed pl-4 space-y-3">
              <p>
                • Персональные данные, указанные мной, предоставляемые с использованием информационно-телекоммуникационной 
                сети «Интернет» являются моими персональными данными. Обязуюсь в случае изменения моих персональных данных, 
                предоставить Оператору актуальные.
              </p>
              <p>
                • Ознакомился(-ась) с документами Оператора, определяющими их политику в отношении обработки персональных данных.
              </p>
              <p>
                • Настоящее Согласие действует до момента отзыва.
              </p>
              <p>
                • Настоящее согласие является подписанным мной электронной подписью путем заполнения формы или проставления 
                отметки («галочки») в поле «Я даю согласие на обработку персональных данных в соответствии с условиями политики» 
                и аналогичные формулировки, в местах на сайте, где размещена соответствующая форма.
              </p>
              <p>
                • Я подтверждаю, что уведомлен(-а) о том, что могу отозвать настоящее согласие самостоятельно или через своего 
                представителя путем направления заявления Оператору в форме электронного письма на адрес{' '}
                <a href="mailto:thqlabel@ya.ru" className="underline hover:opacity-80" style={{ color: accentColor }}>
                  thqlabel@ya.ru
                </a>, либо в письменной форме или подачей тикета на сайте.
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
                <strong>Исполнитель:</strong> Гражданин Российской Федерации Плотников Никита Владимирович, физическое лицо, 
                применяющее специальный налоговый режим «Налог на профессиональный доход (НПД)»
              </p>
              <p><strong>ИНН:</strong> 615531925831</p>
              <p><strong>Номер счёта:</strong> 40817810705892387715</p>
              <p><strong>БИК:</strong> 044525593</p>
              <p><strong>Банк получателя:</strong> АО «Альфа-Банк», г. Москва</p>
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
            onClick={handleBack}
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
            Последнее обновление: 23 февраля 2026 г.
          </p>
          <p className="text-[10px] mt-2" style={{ color: textMuted }}>
            © 2026 THQ Label. Все права защищены.
          </p>
        </footer>

      </div>
    </div>
  );
}
