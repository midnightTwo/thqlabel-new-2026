'use client'

import { useState } from 'react'
import AnimatedBackground from '@/components/AnimatedBackground'

export default function ContactsPage() {
  const [copiedEmail, setCopiedEmail] = useState(false)

  const copyEmail = () => {
    navigator.clipboard.writeText('contact@thqlabel.com')
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Контакты
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Свяжитесь с нами удобным для вас способом
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://t.me/thqlabel"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10 hover:border-[#0088cc]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0088cc]/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0088cc]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
            
            <div className="relative flex items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#0088cc]/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.326.016.093.036.305.02.47z"/>
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Telegram</h3>
                <p className="text-[#0088cc] font-medium group-hover:underline">@thqlabel</p>
                <p className="text-white/50 text-sm mt-2">Самый быстрый способ связи</p>
              </div>

              <svg className="w-6 h-6 text-white/30 group-hover:text-[#0088cc] group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <a
            href="https://vk.com/thqlabel"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10 hover:border-[#0077FF]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#0077FF]/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0077FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
            
            <div className="relative flex items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0077FF] to-[#0077FF]/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.567-1.497c.579-.189 1.323 1.26 2.11 1.818.597.422 1.05.329 1.05.329l2.108-.03s1.103-.07.58-.968c-.043-.074-.305-.664-1.57-1.878-1.323-1.27-1.145-1.064.448-3.26.97-1.338 1.357-2.153 1.236-2.501-.115-.332-.827-.244-.827-.244l-2.374.015s-.176-.025-.307.056c-.128.079-.21.263-.21.263s-.375 1.036-.875 1.917c-1.054 1.856-1.476 1.954-1.648 1.838-.4-.267-.3-1.074-.3-1.647 0-1.791.262-2.536-.51-2.729-.257-.064-.446-.107-1.103-.114-.843-.009-1.556.003-1.96.207-.268.136-.475.439-.349.457.156.022.509.099.696.363.241.341.233 1.107.233 1.107s.139 2.109-.324 2.371c-.318.18-.754-.187-1.69-1.865-.479-.857-.841-1.805-.841-1.805s-.07-.177-.194-.272c-.151-.115-.362-.152-.362-.152l-2.256.015s-.339.01-.464.162c-.111.135-.009.414-.009.414s1.763 4.27 3.758 6.422c1.832 1.975 3.913 1.845 3.913 1.845h.943z"/>
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">ВКонтакте</h3>
                <p className="text-[#0077FF] font-medium group-hover:underline">vk.com/thqlabel</p>
                <p className="text-white/50 text-sm mt-2">Новости и обновления</p>
              </div>

              <svg className="w-6 h-6 text-white/30 group-hover:text-[#0077FF] group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <div className="md:col-span-2">
            <div
              onClick={copyEmail}
              className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              
              <div className="relative flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                  <p className="text-purple-400 font-medium group-hover:underline">contact@thqlabel.com</p>
                  <p className="text-white/50 text-sm mt-2">
                    {copiedEmail ? '✓ Скопировано!' : 'Нажмите, чтобы скопировать'}
                  </p>
                </div>

                <svg className="w-6 h-6 text-white/30 group-hover:text-purple-400 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-white/5 rounded-2xl px-8 py-6 border border-white/10">
            <p className="text-white/70 mb-2">Рабочие часы</p>
            <p className="text-white font-medium text-lg">Пн - Пт: 10:00 - 19:00 МСК</p>
            <p className="text-white/50 text-sm mt-2">Обычно отвечаем в течение 24 часов</p>
          </div>
        </div>
      </div>
    </div>
  )
}
