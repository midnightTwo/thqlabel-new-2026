import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ContractStepProps {
  agreedToContract: boolean;
  setAgreedToContract: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  signatureDataUrl?: string;
  setSignatureDataUrl?: (value: string) => void;
}

export default function ContractStep({ agreedToContract, setAgreedToContract, onNext, onBack }: ContractStepProps) {
  const [showContractModal, setShowContractModal] = useState(false);
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  const accentColor = isLight ? '#6050ba' : '#a78bfa';

  return (
    <div className="animate-fade-up">
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ${isLight ? 'ring-green-500/20' : 'ring-white/10'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-green-600' : 'text-green-300'} sm:w-7 sm:h-7`}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>Публичная оферта</h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-0.5 sm:mt-1`}>Ознакомьтесь с условиями распространения</p>
          </div>
        </div>
      </div>
      
      {/* Основная карточка договора */}
      <div className={`relative p-5 sm:p-8 ${isLight ? 'bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200' : 'bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 border-green-500/20'} border rounded-2xl sm:rounded-3xl overflow-hidden`}>
        {/* Декоративный фон */}
        <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-br from-green-100/30 via-transparent to-emerald-100/30' : 'bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5'} opacity-50`}/>
        <div className={`absolute top-0 right-0 w-64 h-64 ${isLight ? 'bg-green-200/30' : 'bg-green-500/10'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}/>
        <div className={`absolute bottom-0 left-0 w-48 h-48 ${isLight ? 'bg-emerald-200/30' : 'bg-emerald-500/10'} rounded-full blur-3xl translate-y-1/2 -translate-x-1/2`}/>
        
        <div className="relative">
          {/* Иконка документа */}
          <button 
            onClick={() => setShowContractModal(true)}
            className={`group w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ${isLight ? 'ring-green-400/40 hover:ring-green-500/70' : 'ring-green-400/30 hover:ring-green-400/60'} hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-green-600 group-hover:text-green-700' : 'text-green-300 group-hover:text-green-200'} transition-colors relative z-10`} strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
          </button>
          
          <p className={`text-center ${isLight ? 'text-gray-700' : 'text-zinc-300'} mb-2 text-lg font-medium`}>Отправляя релиз, вы соглашаетесь с условиями</p>
          <button 
            onClick={() => setShowContractModal(true)}
            className={`block mx-auto mb-8 ${isLight ? 'text-green-600 hover:text-green-700 decoration-green-500/40 hover:decoration-green-600/60' : 'text-green-400 hover:text-green-300 decoration-green-400/40 hover:decoration-green-300/60'} font-semibold underline underline-offset-4 transition-all`}
          >
            Читать полный текст оферты →
          </button>
          
          {/* Чекбокс — без подписи, просто галочка */}
          <label 
            className={`group flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 max-w-xl mx-auto ${
              agreedToContract 
                ? `bg-gradient-to-r from-green-500/20 via-emerald-500/15 to-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20` 
                : isLight 
                  ? 'bg-white border-gray-200 hover:border-green-500/30 hover:bg-green-50/50'
                  : 'bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 hover:border-green-500/30 hover:bg-white/[0.07]'
            }`}
          >
            {/* Кастомный чекбокс */}
            <div className={`relative w-7 h-7 rounded-lg flex-shrink-0 transition-all duration-300 mt-0.5 ${
              agreedToContract 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/40' 
                : isLight
                  ? 'bg-gray-100 border-2 border-gray-300 group-hover:border-green-500/50'
                  : 'bg-white/10 border-2 border-white/20 group-hover:border-green-500/50'
            }`}>
              <input 
                type="checkbox" 
                checked={agreedToContract}
                onChange={(e) => setAgreedToContract(e.target.checked)}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
              {/* Анимированная галочка */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`absolute inset-0 w-full h-full p-1.5 text-white transition-all duration-300 ${
                  agreedToContract ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <span className={`block font-semibold transition-colors duration-300 ${
                agreedToContract 
                  ? isLight ? 'text-green-700' : 'text-green-300' 
                  : isLight ? 'text-gray-700 group-hover:text-gray-900' : 'text-zinc-300 group-hover:text-white'
              }`}>
                Я принимаю условия публичной оферты
              </span>
              {!agreedToContract && (
                <p className={`text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Нажмите, чтобы подтвердить согласие с офертой
                </p>
              )}
              {agreedToContract && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                  <span className={`text-sm font-medium ${isLight ? 'text-green-600' : 'text-green-400'}`}>Оферта принята</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>
      <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} flex justify-between`}>
        <button onClick={onBack} className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10'} rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={onNext}
          disabled={!agreedToContract}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation"
          style={{ color: 'white' }}
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" className="w-4 h-4"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>

      {/* Модальное окно с полным текстом оферты */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowContractModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className={`relative ${isLight ? 'bg-white border-gray-200' : 'bg-[#0d0d0f] border-white/10'} border rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-up [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`} onClick={(e) => e.stopPropagation()}>
            {/* Заголовок */}
            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isLight ? 'border-gray-200 bg-white' : 'border-white/10 bg-[#0d0d0f]'}`}>
              <h3 className={`text-lg font-bold bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>Публичная оферта</h3>
              <button 
                onClick={() => setShowContractModal(false)}
                className={`w-8 h-8 rounded-xl ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-white/5 hover:bg-white/10'} flex items-center justify-center transition-colors`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Содержимое оферты — текст с /offer */}
            <div className={`p-5 text-sm leading-relaxed space-y-6 ${isLight ? 'text-gray-600' : 'text-zinc-300'}`}>
              {/* Преамбула */}
              <div className={`p-4 rounded-lg ${isLight ? 'bg-gray-50 border border-gray-200' : 'bg-white/[0.03] border border-white/5'}`}>
                <p>Настоящий документ является официальным предложением (публичной офертой) 
                в соответствии со статьями 435–437 Гражданского кодекса Российской Федерации.</p>
              </div>

              {/* Раздел 1 */}
              <section>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>1. Общие положения</h4>
                <div className="space-y-2 pl-3">
                  <p><span style={{ color: accentColor }}>1.1.</span> Настоящая оферта адресована неопределенному кругу лиц.</p>
                  <p><span style={{ color: accentColor }}>1.2.</span> Акцепт оферты означает полное и безоговорочное принятие условий настоящего договора. Самозанятый (далее — Исполнитель) предлагает договор о релизе для физических и юридических лиц (далее — Заказчик) о нижеследующем.</p>
                  <p><span style={{ color: accentColor }}>1.3.</span> Настоящая публичная оферта регулирует отношения сторон, связанные с применением простой электронной подписи (ПЭП).</p>
                </div>
              </section>

              {/* Раздел 2 */}
              <section>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>2. Термины и определения</h4>
                <div className="space-y-2 pl-3">
                  <p><span style={{ color: accentColor }}>2.1.</span> <strong>Договор</strong> — документ «Договор о релизе музыкального контента», опубликованный на сайте Исполнителя <a href="https://thqlabel.ru/" target="_blank" rel="noopener noreferrer" className={`underline hover:opacity-80`} style={{ color: accentColor }}>https://thqlabel.ru</a></p>
                  <p><span style={{ color: accentColor }}>2.2.</span> <strong>Договор Оферты</strong> — договор между Исполнителем и Заказчиком об оказании услуг, который заключается через сайт Оферты.</p>
                  <p><span style={{ color: accentColor }}>2.3.</span> <strong>Акцепт Оферты</strong> — принятие Оферты Заказчиком, когда он обращается к Исполнителю за оказанием услуг. Акцептом Оферты считается нажатие Заказчиком кнопки «Оплатить» под сформированным заказом на сайте <a href="https://thqlabel.ru/" target="_blank" rel="noopener noreferrer" className={`underline hover:opacity-80`} style={{ color: accentColor }}>https://thqlabel.ru</a></p>
                  <p><span style={{ color: accentColor }}>2.4.</span> <strong>Тарифы</strong> — перечень услуг Исполнителя с ценами, указанными в Прайс-листе на сайте <a href="https://thqlabel.ru/" target="_blank" rel="noopener noreferrer" className={`underline hover:opacity-80`} style={{ color: accentColor }}>https://thqlabel.ru</a></p>
                  <p><span style={{ color: accentColor }}>2.5.</span> <strong>Заказчик</strong> — лицо, совершившее Акцепт Оферты.</p>
                  <p><span style={{ color: accentColor }}>2.6.</span> <strong>Исполнитель</strong> — Гражданин Российской Федерации Плотников Никита Владимирович, физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход (НПД)»<br/><strong>ИНН:</strong> 615531925831</p>
                  <p><span style={{ color: accentColor }}>2.7.</span> <strong>Простая электронная подпись (ПЭП)</strong> — электронный аналог личной подписи физического лица, использующей средства аутентификации и идентификации личности клиента (логин, пароль, SMS-код, почта).</p>
                  <p><span style={{ color: accentColor }}>2.8.</span> Договор не требует скрепления печатями и/или подписания Заказчиком и Исполнителем.</p>
                </div>
              </section>

              {/* Раздел 3 */}
              <section>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>3. Предмет Договора</h4>
                <div className="space-y-2 pl-3">
                  <p><span style={{ color: accentColor }}>3.1.</span> Исполнитель оказывает Заказчику услуги в соответствии с условиями Договора Оферты и текущими Тарифами, опубликованными на сайте <a href="https://thqlabel.ru/" target="_blank" rel="noopener noreferrer" className={`underline hover:opacity-80`} style={{ color: accentColor }}>https://thqlabel.ru</a></p>
                  <p><span style={{ color: accentColor }}>3.2.</span> Заказчик принимает услуги Исполнителя и полностью их оплачивает.</p>
                  <p><span style={{ color: accentColor }}>3.3.</span> Если заказчик оставляет отзыв о приобретенных услугах в соцсетях Исполнителя или на его сайте, он дает согласие на размещение персональных данных в отзывах: имени и фамилии.</p>
                  <p><span style={{ color: accentColor }}>3.4.</span> Заказчик соглашается, что совершая Акцепт Договора он подтверждает, что ознакомлен, согласен, полностью и безоговорочно принимает все условия Договора Оферты.</p>
                  <p><span style={{ color: accentColor }}>3.5.</span> Договор вступает в силу при наличии записи, подтверждающей добровольное согласие пользователя на применение данной формы подписи (отметка «Подтверждаю» при регистрации).</p>
                </div>
              </section>

              {/* Раздел 4 — ПЭП */}
              <section>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>4. Порядок использования ПЭП</h4>
                <div className="space-y-2 pl-3">
                  <p><span style={{ color: accentColor }}>4.1.</span> При выполнении вышеуказанных условий любое юридическое действие, произведённое клиентом на сайте, фиксируется как подписанное его ПЭП. Например:</p>
                  <ul className={`list-disc pl-6 space-y-1 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                    <li>Заполнение полей с персональными данными.</li>
                    <li>Нажатие кнопки «Подтвердить».</li>
                    <li>Создание подписи мышью («Рисование подписи»).</li>
                  </ul>
                  <p><span style={{ color: accentColor }}>4.2.</span> Эти действия будут признаны юридическим актом выражения воли пользователя и формальным выражением согласия с предлагаемым договором.</p>
                </div>
              </section>

              {/* Раздел 5 — Ответственность */}
              <section>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>5. Ответственность</h4>
                <div className="space-y-2 pl-3">
                  <p><span style={{ color: accentColor }}>5.1.</span> Пользователь несёт ответственность за сохранность своего аккаунта и конфиденциальность используемых для подписания данных (пароль, SMS-код и др.). Если произошло несанкционированное использование вашей ПЭП третьими лицами, немедленно сообщите нам любым доступным способом.</p>
                  <p><span style={{ color: accentColor }}>5.2.</span> Таким образом, если соблюдены указанные требования, ваше участие в операциях на нашем ресурсе будет считаться юридически значимым действием, равносильным подписанию договора собственной рукой.</p>
                </div>
              </section>

              {/* Раздел 6 */}
              <section>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>6. Срок действия Договора</h4>
                <div className="space-y-2 pl-3">
                  <p><span style={{ color: accentColor }}>6.1.</span> Договор вступает в силу со дня акцепта заказчиком и действует до полного исполнения сторонами обязательств по Договору.</p>
                </div>
              </section>

              {/* Контактная информация */}
              <section className={`pt-4 ${isLight ? 'border-t border-gray-200' : 'border-t border-white/10'}`}>
                <h4 className={`text-base font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-white'}`}>Контактная информация</h4>
                <div className="space-y-1.5 pl-3">
                  <p><strong>Исполнитель:</strong> Гражданин Российской Федерации Плотников Никита Владимирович, физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход (НПД)»</p>
                  <p><strong>ИНН:</strong> 615531925831</p>
                  <p><strong>Номер счёта:</strong> 40817810705892387715</p>
                  <p><strong>БИК:</strong> 044525593</p>
                  <p><strong>Банк получателя:</strong> АО «Альфа-Банк», г. Москва</p>
                  <p><strong>Сайт:</strong>{' '}<a href="https://thqlabel.ru/" target="_blank" rel="noopener noreferrer" className={`underline hover:opacity-80`} style={{ color: accentColor }}>https://thqlabel.ru</a></p>
                </div>
              </section>
            </div>

            {/* Футер */}
            <div className={`sticky bottom-0 p-4 border-t ${isLight ? 'border-gray-200 bg-white' : 'border-white/10 bg-[#0d0d0f]'}`}>
              <button 
                onClick={() => setShowContractModal(false)}
                className={`w-full px-6 py-2.5 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition-colors text-sm text-white`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

