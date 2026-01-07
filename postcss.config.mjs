const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Autoprefixer для поддержки старых браузеров
    autoprefixer: {
      // Поддержка последних 4 версий + IE11 + старые Safari
      overrideBrowserslist: [
        'last 4 versions',
        '> 1%',
        'IE 11',
        'Safari >= 9',
        'iOS >= 9',
        'Android >= 4.4',
        'not dead'
      ],
      grid: 'autoplace' // Включаем поддержку CSS Grid для IE
    },
  },
};

export default config;
