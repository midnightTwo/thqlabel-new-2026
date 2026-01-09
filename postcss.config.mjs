/**
 * PostCSS Configuration - PRODUCTION GPU OPTIMIZATION
 * 
 * ⚠️ КРИТИЧНО: Эта конфигурация защищает GPU-хаки от удаления минификатором.
 * 
 * Проблема: cssnano (встроенный в Next.js) считает "бесполезными":
 * - transform: translateZ(0)
 * - transform: translate3d(0,0,0)
 * - backface-visibility: hidden
 * - contain: strict
 * 
 * Эти свойства критичны для изоляции GPU-слоёв и предотвращения
 * каскадной перерисовки всего DOM.
 * 
 * Без них: Dev = 10% GPU, Production = 90% GPU (перегрев)
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    
    // Автопрефиксер для кроссбраузерности
    "autoprefixer": {},
    
    // Минификация только в production с ЗАЩИТОЙ GPU-хаков
    ...(process.env.NODE_ENV === 'production' && {
      "cssnano": {
        preset: [
          "default",
          {
            // ❌ ОТКЛЮЧАЕМ удаление "бесполезных" transform
            // cssnano по умолчанию удаляет translateZ(0), translate3d(0,0,0)
            // которые критичны для GPU-изоляции слоёв
            reduceTransforms: false,
            
            // ❌ ОТКЛЮЧАЕМ нормализацию whitespace в комментариях
            // Сохраняем метки /* cssnano: keep */
            discardComments: {
              removeAll: false,
              remove: (comment) => !comment.includes('cssnano: keep')
            },
            
            // ✅ Оставляем полезные оптимизации
            normalizeWhitespace: true,
            discardDuplicates: true,
            discardEmpty: true,
            
            // ❌ ОТКЛЮЧАЕМ слияние правил - может сломать специфичность
            mergeLonghand: false,
            mergeRules: false,
            
            // ❌ ОТКЛЮЧАЕМ удаление неиспользуемых @keyframes
            // Анимации могут добавляться динамически через JS
            discardUnused: false,
            
            // ❌ ОТКЛЮЧАЕМ нормализацию значений
            // Может изменить rgba() -> hex и сломать opacity
            normalizePositions: false,
            normalizeRepeatStyle: false,
            normalizeTimingFunctions: false,
            normalizeUnicode: false,
            normalizeUrl: false,
            
            // ❌ ОТКЛЮЧАЕМ сворачивание calc()
            // Может сломать CSS переменные
            calc: false,
            
            // ❌ ОТКЛЮЧАЕМ оптимизацию z-index
            // Может нарушить stacking context
            zindex: false,
          }
        ]
      }
    })
  },
};

export default config;
