import React, { useState } from 'react';

interface ContractStepProps {
  agreedToContract: boolean;
  setAgreedToContract: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ContractStep({ agreedToContract, setAgreedToContract, onNext, onBack }: ContractStepProps) {
  const [showContractModal, setShowContractModal] = useState(false);
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-300">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Договор</h2>
            <p className="text-sm text-zinc-500 mt-1">Ознакомьтесь с условиями распространения</p>
          </div>
        </div>
      </div>
      <div className="relative p-10 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 border border-green-500/20 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-50"/>
        <div className="relative">
          <button 
            onClick={() => setShowContractModal(true)}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center ring-1 ring-green-400/30 hover:scale-105 transition-transform cursor-pointer"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-green-300" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </button>
          <p className="text-center text-zinc-300 mb-6 text-lg font-medium">Отправляя релиз, вы соглашаетесь с условиями thqlabel</p>
          <label className="flex items-center gap-4 p-5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-white/10 hover:border-green-500/40 hover:shadow-xl hover:shadow-green-500/10 group">
            <input 
              type="checkbox" 
              checked={agreedToContract}
              onChange={(e) => setAgreedToContract(e.target.checked)}
              className="w-6 h-6 rounded-lg accent-green-500" 
            />
            <span className="text-sm font-medium group-hover:text-white transition-colors">Я принимаю условия пользовательского соглашения</span>
          </label>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={onNext}
          disabled={!agreedToContract}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>

      {/* Модальное окно с договором */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8 animate-fade-in" onClick={() => setShowContractModal(false)}>
          <div className="bg-[#0d0d0f] border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0d0d0f]">
              <h3 className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Договор о релизе</h3>
              <button 
                onClick={() => setShowContractModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Содержимое договора */}
            <div className="p-5 overflow-y-auto max-h-[55vh] text-xs leading-relaxed space-y-3 text-zinc-300 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <p className="font-semibold text-white text-sm">
                ООО «Звезда» (далее — Исполнитель) предлагает договор о релизе для физических и юридических лиц (далее — Заказчик) о нижеследующем.
              </p>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white mt-4">1. Термины и определения</h4>
                
                <p>1.1 Договор — документ «Договор о релизе музыкального контента», опубликованный на сайте Исполнителя <a href="http://www.zwezda.ru" target="_blank" className="text-green-400 hover:text-green-300 underline">http://www.zwezda.ru/</a>.</p>
                
                <p>1.2. Договор Оферты — договор между Исполнителем и Заказчиком об оказании услуг, который заключается через сайт Оферты.</p>
                
                <p>1.3. Акцепт Оферты — принятие Оферты Заказчиком, когда он обращается к Исполнителю за оказанием услуг. Акцептом Оферты считается нажатие Заказчиком кнопки «Оплатить» под сформированным заказом на сайте <a href="http://www.zwezda.ru" target="_blank" className="text-green-400 hover:text-green-300 underline">http://www.zwezda.ru/</a>.</p>
                
                <p>1.4. Тарифы — перечень услуг Исполнителя с ценами, указанными в Прайс-листе на сайте <a href="http://www.zwezda.ru" target="_blank" className="text-green-400 hover:text-green-300 underline">http://www.zwezda.ru/</a>.</p>
                
                <p>1.5. Заказчик — лицо, совершившее Акцепт Оферты.</p>
                
                <p>1.6. Исполнитель — ООО «Звезда».</p>
                
                <p>1.7. Договор не требует скрепления печатями и/или подписания Заказчиком и Исполнителем.</p>

                <h4 className="text-sm font-bold text-white mt-4">2. Предмет Договора</h4>
                
                <p>2.1. Исполнитель оказывает Заказчику услуги в соответствии с условиями Договора Оферты и текущими Тарифами, опубликованными на сайте <a href="http://www.zwezda.ru" target="_blank" className="text-green-400 hover:text-green-300 underline">http://www.zwezda.ru/</a>.</p>
                
                <p>2.2. Заказчик принимает услуги Исполнителя и полностью их оплачивает.</p>
                
                <p>2.3. Если заказчик оставляет отзыв о приобретенных услугах в соцсетях Исполнителя или на его сайте, он дает согласие на размещение персональных данных в отзывах: имени и фамилии.</p>
                
                <p>2.4. Заказчик соглашается, что совершая Акцепт Договора он подтверждает, что ознакомлен, согласен, полностью и безоговорочно принимает все условия Договора Оферты.</p>

                <h4 className="text-sm font-bold text-white mt-4">3. Срок действия Договора</h4>
                
                <p>3.1. Договор вступает в силу со дня акцепта заказчиком и действует до полного исполнения сторонами обязательств по Договору.</p>
              </div>
            </div>

            {/* Футер */}
            <div className="p-4 border-t border-white/10 bg-[#0d0d0f]">
              <button 
                onClick={() => setShowContractModal(false)}
                className="w-full px-6 py-2 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition-colors text-sm"
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
