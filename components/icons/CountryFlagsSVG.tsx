import React from 'react';

// SVG ФЛАГИ СТРАН - 200+ флагов для Windows совместимости
const FlagSVGs: { [key: string]: React.FC<{ className?: string }> } = {
  // ===== СНГ =====
  'Россия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#fff"/><rect y="2" width="9" height="2" fill="#0039A6"/><rect y="4" width="9" height="2" fill="#D52B1E"/></svg>),
  'Украина': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#005BBB"/><rect y="3" width="9" height="3" fill="#FFD500"/></svg>),
  'Беларусь': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="4" fill="#C8313E"/><rect y="4" width="9" height="2" fill="#4AA657"/><rect width="1.5" height="6" fill="#fff"/></svg>),
  'Казахстан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00AFCA"/><circle cx="4.5" cy="3" r="1.2" fill="#FEC50C"/></svg>),
  'Узбекистан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#1EB53A"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#0099B5"/></svg>),
  'Киргизия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#E8112D"/><circle cx="4.5" cy="3" r="1.5" fill="#FFEF00"/></svg>),
  'Таджикистан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CC0000"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#006600"/></svg>),
  'Туркменистан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00843D"/><rect x="1.5" width="1.5" height="6" fill="#C01C28"/></svg>),
  'Азербайджан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#0092BC"/><rect y="2" width="9" height="2" fill="#E00034"/><rect y="4" width="9" height="2" fill="#00AE65"/></svg>),
  'Армения': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#D90012"/><rect y="2" width="9" height="2" fill="#0033A0"/><rect y="4" width="9" height="2" fill="#F2A800"/></svg>),
  'Грузия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><rect x="4" width="1" height="6" fill="#FF0000"/><rect y="2.5" width="9" height="1" fill="#FF0000"/></svg>),
  'Молдова': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#003DA5"/><rect x="3" width="3" height="6" fill="#FFD200"/><rect x="6" width="3" height="6" fill="#CC0033"/></svg>),
  // ===== ЗАПАДНАЯ ЕВРОПА =====
  'Германия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#000"/><rect y="2" width="9" height="2" fill="#DD0000"/><rect y="4" width="9" height="2" fill="#FFCE00"/></svg>),
  'Франция': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#002654"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#CE1126"/></svg>),
  'Великобритания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#012169"/><path d="M0,0 L9,6 M9,0 L0,6" stroke="#fff" strokeWidth="1"/><path d="M4.5,0 V6 M0,3 H9" stroke="#fff" strokeWidth="1.5"/><path d="M4.5,0 V6 M0,3 H9" stroke="#C8102E" strokeWidth="0.9"/></svg>),
  'Италия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#009246"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#CE2B37"/></svg>),
  'Испания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#AA151B"/><rect y="1.5" width="9" height="3" fill="#F1BF00"/><rect y="4.5" width="9" height="1.5" fill="#AA151B"/></svg>),
  'Португалия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3.5" height="6" fill="#006600"/><rect x="3.5" width="5.5" height="6" fill="#FF0000"/></svg>),
  'Нидерланды': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#AE1C28"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#21468B"/></svg>),
  'Бельгия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#000"/><rect x="3" width="3" height="6" fill="#FFD90C"/><rect x="6" width="3" height="6" fill="#F31830"/></svg>),
  'Швейцария': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#FF0000"/><rect x="3.75" y="1.5" width="1.5" height="3" fill="#fff"/><rect x="3" y="2.25" width="3" height="1.5" fill="#fff"/></svg>),
  'Австрия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#ED2939"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#ED2939"/></svg>),
  'Люксембург': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#ED2939"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#00A1DE"/></svg>),
  'Монако': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#CE1126"/><rect y="3" width="9" height="3" fill="#fff"/></svg>),
  'Лихтенштейн': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#002B7F"/><rect y="3" width="9" height="3" fill="#CE1126"/></svg>),
  'Андорра': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#0032A0"/><rect x="3" width="3" height="6" fill="#FEDF00"/><rect x="6" width="3" height="6" fill="#D1001F"/></svg>),
  'Сан-Марино': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#fff"/><rect y="3" width="9" height="3" fill="#5EB6E4"/></svg>),
  'Мальта': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="4.5" height="6" fill="#fff"/><rect x="4.5" width="4.5" height="6" fill="#C01C28"/></svg>),
  'Ватикан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="4.5" height="6" fill="#FFE000"/><rect x="4.5" width="4.5" height="6" fill="#fff"/></svg>),
  // ===== ЦЕНТРАЛЬНАЯ И ВОСТОЧНАЯ ЕВРОПА =====
  'Польша': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#fff"/><rect y="3" width="9" height="3" fill="#DC143C"/></svg>),
  'Чехия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#fff"/><rect y="3" width="9" height="3" fill="#D7141A"/><polygon points="0,0 4.5,3 0,6" fill="#11457E"/></svg>),
  'Словакия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#fff"/><rect y="2" width="9" height="2" fill="#0B4EA2"/><rect y="4" width="9" height="2" fill="#EE1C25"/></svg>),
  'Венгрия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE2939"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#477050"/></svg>),
  'Румыния': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#002B7F"/><rect x="3" width="3" height="6" fill="#FCD116"/><rect x="6" width="3" height="6" fill="#CE1126"/></svg>),
  'Болгария': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#fff"/><rect y="2" width="9" height="2" fill="#00966E"/><rect y="4" width="9" height="2" fill="#D62612"/></svg>),
  'Греция': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#0D5EAF"/><rect y="0.67" width="9" height="0.67" fill="#fff"/><rect y="2" width="9" height="0.67" fill="#fff"/><rect y="3.33" width="9" height="0.67" fill="#fff"/><rect y="4.67" width="9" height="0.67" fill="#fff"/><rect width="3.33" height="3.33" fill="#0D5EAF"/><rect x="1.33" width="0.67" height="3.33" fill="#fff"/><rect y="1.33" width="3.33" height="0.67" fill="#fff"/></svg>),
  'Кипр': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><ellipse cx="4.5" cy="3" rx="2" ry="1" fill="#D47600"/></svg>),
  'Турция': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#E30A17"/><circle cx="3.5" cy="3" r="1.5" fill="#fff"/><circle cx="4" cy="3" r="1.2" fill="#E30A17"/></svg>),
  // ===== БАЛКАНЫ =====
  'Сербия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#C6363C"/><rect y="2" width="9" height="2" fill="#0C4076"/><rect y="4" width="9" height="2" fill="#fff"/></svg>),
  'Хорватия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#FF0000"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#171796"/></svg>),
  'Словения': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#fff"/><rect y="2" width="9" height="2" fill="#003DA5"/><rect y="4" width="9" height="2" fill="#D50000"/></svg>),
  'Босния и Герцеговина': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#001489"/><polygon points="2,0 7,6 7,0" fill="#FECB00"/></svg>),
  'Черногория': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#C40308"/><rect x="0.3" y="0.3" width="8.4" height="5.4" fill="none" stroke="#D4AF37" strokeWidth="0.6"/></svg>),
  'Северная Македония': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#D20000"/><rect x="4" width="1" height="6" fill="#FFE600"/><rect y="2.5" width="9" height="1" fill="#FFE600"/></svg>),
  'Албания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#E41E20"/></svg>),
  'Косово': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#244AA5"/></svg>),
  // ===== СЕВЕРНАЯ ЕВРОПА =====
  'Швеция': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#006AA7"/><rect x="2.5" width="1" height="6" fill="#FECC00"/><rect y="2.5" width="9" height="1" fill="#FECC00"/></svg>),
  'Норвегия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#EF2B2D"/><rect x="2.25" width="1.5" height="6" fill="#fff"/><rect y="2.25" width="9" height="1.5" fill="#fff"/><rect x="2.5" width="1" height="6" fill="#002868"/><rect y="2.5" width="9" height="1" fill="#002868"/></svg>),
  'Финляндия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><rect x="2.5" width="1" height="6" fill="#003580"/><rect y="2.5" width="9" height="1" fill="#003580"/></svg>),
  'Дания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#C60C30"/><rect x="2.5" width="1" height="6" fill="#fff"/><rect y="2.5" width="9" height="1" fill="#fff"/></svg>),
  'Исландия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#02529C"/><rect x="2.25" width="1.5" height="6" fill="#fff"/><rect y="2.25" width="9" height="1.5" fill="#fff"/><rect x="2.5" width="1" height="6" fill="#DC1E35"/><rect y="2.5" width="9" height="1" fill="#DC1E35"/></svg>),
  'Эстония': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#0072CE"/><rect y="2" width="9" height="2" fill="#000"/><rect y="4" width="9" height="2" fill="#fff"/></svg>),
  'Латвия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2.4" fill="#9E3039"/><rect y="2.4" width="9" height="1.2" fill="#fff"/><rect y="3.6" width="9" height="2.4" fill="#9E3039"/></svg>),
  'Литва': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#FDB913"/><rect y="2" width="9" height="2" fill="#006A44"/><rect y="4" width="9" height="2" fill="#C1272D"/></svg>),
  'Ирландия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#169B62"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#FF883E"/></svg>),
  // ===== СЕВЕРНАЯ АМЕРИКА =====
  'США': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#B22234"/><rect y="0.46" width="9" height="0.46" fill="#fff"/><rect y="1.38" width="9" height="0.46" fill="#fff"/><rect y="2.31" width="9" height="0.46" fill="#fff"/><rect y="3.23" width="9" height="0.46" fill="#fff"/><rect y="4.15" width="9" height="0.46" fill="#fff"/><rect y="5.08" width="9" height="0.46" fill="#fff"/><rect width="3.6" height="3.23" fill="#3C3B6E"/></svg>),
  'Канада': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="2.25" height="6" fill="#FF0000"/><rect x="2.25" width="4.5" height="6" fill="#fff"/><rect x="6.75" width="2.25" height="6" fill="#FF0000"/></svg>),
  'Мексика': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#006847"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#CE1126"/></svg>),
  // ===== ЦЕНТРАЛЬНАЯ АМЕРИКА =====
  'Гватемала': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#4997D0"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#4997D0"/></svg>),
  'Белиз': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#003DA5"/><rect y="0.5" width="9" height="0.5" fill="#CE1126"/><rect y="5" width="9" height="0.5" fill="#CE1126"/></svg>),
  'Гондурас': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#0073CF"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#0073CF"/></svg>),
  'Сальвадор': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#0047AB"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#0047AB"/></svg>),
  'Никарагуа': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#000099"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000099"/></svg>),
  'Коста-Рика': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1" fill="#002B7F"/><rect y="1" width="9" height="1" fill="#fff"/><rect y="2" width="9" height="2" fill="#CE1126"/><rect y="4" width="9" height="1" fill="#fff"/><rect y="5" width="9" height="1" fill="#002B7F"/></svg>),
  'Панама': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="4.5" height="3" fill="#fff"/><rect x="4.5" width="4.5" height="3" fill="#DA121A"/><rect y="3" width="4.5" height="3" fill="#0049A1"/><rect x="4.5" y="3" width="4.5" height="3" fill="#fff"/></svg>),
  // ===== КАРИБЫ =====
  'Куба': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.2" fill="#002A8F"/><rect y="1.2" width="9" height="1.2" fill="#fff"/><rect y="2.4" width="9" height="1.2" fill="#002A8F"/><rect y="3.6" width="9" height="1.2" fill="#fff"/><rect y="4.8" width="9" height="1.2" fill="#002A8F"/><polygon points="0,0 4,3 0,6" fill="#CB1515"/></svg>),
  'Ямайка': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#009B3A"/><polygon points="0,0 4.5,3 0,6" fill="#000"/><polygon points="9,0 4.5,3 9,6" fill="#000"/><polygon points="0,0 9,0 4.5,3" fill="#FED100"/><polygon points="0,6 9,6 4.5,3" fill="#FED100"/></svg>),
  'Гаити': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#00209F"/><rect y="3" width="9" height="3" fill="#D21034"/></svg>),
  'Доминиканская Республика': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#002D62"/><rect y="2" width="9" height="2" fill="#fff"/><rect x="3.5" width="2" height="6" fill="#fff"/><rect x="4" y="2.5" width="1" height="1" fill="#CE1126"/></svg>),
  'Багамы': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#00ABC9"/><rect y="2" width="9" height="2" fill="#FAE042"/><rect y="4" width="9" height="2" fill="#00ABC9"/><polygon points="0,0 3.5,3 0,6" fill="#000"/></svg>),
  'Барбадос': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#00267F"/><rect x="3" width="3" height="6" fill="#FFC726"/><rect x="6" width="3" height="6" fill="#00267F"/></svg>),
  'Тринидад и Тобаго': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#CE1126"/><polygon points="0,0 3,0 9,6 6,6" fill="#fff"/><polygon points="0.5,0 2.5,0 9,5.5 9,6 7,6" fill="#000"/></svg>),
  'Пуэрто-Рико': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.2" fill="#CE1126"/><rect y="1.2" width="9" height="1.2" fill="#fff"/><rect y="2.4" width="9" height="1.2" fill="#CE1126"/><rect y="3.6" width="9" height="1.2" fill="#fff"/><rect y="4.8" width="9" height="1.2" fill="#CE1126"/><polygon points="0,0 4,3 0,6" fill="#0050F0"/></svg>),
  // ===== ЮЖНАЯ АМЕРИКА =====
  'Бразилия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#009B3A"/><polygon points="4.5,0.5 8.5,3 4.5,5.5 0.5,3" fill="#FEDF00"/><circle cx="4.5" cy="3" r="1.2" fill="#002776"/></svg>),
  'Аргентина': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#74ACDF"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#74ACDF"/><circle cx="4.5" cy="3" r="0.6" fill="#F6B40E"/></svg>),
  'Чили': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#fff"/><rect y="3" width="9" height="3" fill="#D52B1E"/><rect width="3" height="3" fill="#0039A6"/></svg>),
  'Колумбия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#FCD116"/><rect y="3" width="9" height="1.5" fill="#003893"/><rect y="4.5" width="9" height="1.5" fill="#CE1126"/></svg>),
  'Перу': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#D91023"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#D91023"/></svg>),
  'Венесуэла': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#FCE700"/><rect y="2" width="9" height="2" fill="#003893"/><rect y="4" width="9" height="2" fill="#CE1126"/></svg>),
  'Эквадор': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#FFD100"/><rect y="3" width="9" height="1.5" fill="#003893"/><rect y="4.5" width="9" height="1.5" fill="#CE1126"/></svg>),
  'Боливия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#D52B1E"/><rect y="2" width="9" height="2" fill="#F9E300"/><rect y="4" width="9" height="2" fill="#007934"/></svg>),
  'Парагвай': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#D52B1E"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#0038A8"/></svg>),
  'Уругвай': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><rect y="0.67" width="9" height="0.67" fill="#0038A8"/><rect y="2" width="9" height="0.67" fill="#0038A8"/><rect y="3.33" width="9" height="0.67" fill="#0038A8"/><rect y="4.67" width="9" height="0.67" fill="#0038A8"/><rect width="3" height="3" fill="#fff"/><circle cx="1.5" cy="1.5" r="0.8" fill="#FCB514"/></svg>),
  'Гайана': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#009E49"/><polygon points="0,0 9,3 0,6" fill="#FCD116"/><polygon points="0,0 4.5,3 0,6" fill="#fff"/><polygon points="0,0 4,3 0,6" fill="#000"/><polygon points="0,0.5 3,3 0,5.5" fill="#CE1126"/></svg>),
  'Суринам': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.2" fill="#377E3F"/><rect y="1.2" width="9" height="1.2" fill="#fff"/><rect y="2.4" width="9" height="1.2" fill="#B40A2D"/><rect y="3.6" width="9" height="1.2" fill="#fff"/><rect y="4.8" width="9" height="1.2" fill="#377E3F"/></svg>),
  // ===== ВОСТОЧНАЯ АЗИЯ =====
  'Китай': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#DE2910"/><polygon points="1.5,1 1.7,1.6 2.3,1.6 1.8,2 2,2.6 1.5,2.2 1,2.6 1.2,2 0.7,1.6 1.3,1.6" fill="#FFDE00"/></svg>),
  'Япония': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><circle cx="4.5" cy="3" r="1.5" fill="#BC002D"/></svg>),
  'Южная Корея': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><circle cx="4.5" cy="3" r="1.5" fill="#C60C30"/><path d="M4.5,1.5 A1.5,1.5 0 0,1 4.5,4.5" fill="#003478"/></svg>),
  'КНДР': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1" fill="#024FA2"/><rect y="1" width="9" height="0.3" fill="#fff"/><rect y="1.3" width="9" height="3.4" fill="#ED1C27"/><rect y="4.7" width="9" height="0.3" fill="#fff"/><rect y="5" width="9" height="1" fill="#024FA2"/></svg>),
  'Тайвань': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#FE0000"/><rect width="4.5" height="3" fill="#000095"/></svg>),
  'Гонконг': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#DE2910"/></svg>),
  'Макао': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00785E"/></svg>),
  'Монголия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#C4272E"/><rect x="3" width="3" height="6" fill="#015197"/><rect x="6" width="3" height="6" fill="#C4272E"/></svg>),
  // ===== ЮГО-ВОСТОЧНАЯ АЗИЯ =====
  'Таиланд': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1" fill="#ED1C24"/><rect y="1" width="9" height="1" fill="#fff"/><rect y="2" width="9" height="2" fill="#241D4F"/><rect y="4" width="9" height="1" fill="#fff"/><rect y="5" width="9" height="1" fill="#ED1C24"/></svg>),
  'Вьетнам': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#DA251D"/><polygon points="4.5,1.2 5.1,3.1 3.9,3.1" fill="#FFFF00"/></svg>),
  'Индонезия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#FF0000"/><rect y="3" width="9" height="3" fill="#fff"/></svg>),
  'Малайзия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#CC0001"/><rect y="0.43" width="9" height="0.43" fill="#fff"/><rect y="1.29" width="9" height="0.43" fill="#fff"/><rect y="2.14" width="9" height="0.43" fill="#fff"/><rect y="3" width="9" height="0.43" fill="#fff"/><rect y="3.86" width="9" height="0.43" fill="#fff"/><rect y="4.71" width="9" height="0.43" fill="#fff"/><rect width="4.5" height="3.43" fill="#010066"/></svg>),
  'Сингапур': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#ED2939"/><rect y="3" width="9" height="3" fill="#fff"/></svg>),
  'Филиппины': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#0038A8"/><rect y="3" width="9" height="3" fill="#CE1126"/><polygon points="0,0 4.5,3 0,6" fill="#fff"/></svg>),
  'Мьянма': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#FECB00"/><rect y="2" width="9" height="2" fill="#34B233"/><rect y="4" width="9" height="2" fill="#EA2839"/></svg>),
  'Камбоджа': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#032EA1"/><rect y="1.5" width="9" height="3" fill="#E00025"/><rect y="4.5" width="9" height="1.5" fill="#032EA1"/></svg>),
  'Лаос': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#CE1126"/><rect y="1.5" width="9" height="3" fill="#002868"/><rect y="4.5" width="9" height="1.5" fill="#CE1126"/><circle cx="4.5" cy="3" r="1" fill="#fff"/></svg>),
  'Бруней': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#F7E017"/><polygon points="0,0.5 9,3 0,5.5" fill="#fff"/><polygon points="0,1 9,3 0,5" fill="#000"/></svg>),
  'Восточный Тимор': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#DC241F"/><polygon points="0,0 5,3 0,6" fill="#FFC726"/><polygon points="0,0 3,3 0,6" fill="#000"/></svg>),
  // ===== ЮЖНАЯ АЗИЯ =====
  'Индия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#FF9933"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#138808"/><circle cx="4.5" cy="3" r="0.6" fill="#000080"/></svg>),
  'Пакистан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="2.25" height="6" fill="#fff"/><rect x="2.25" width="6.75" height="6" fill="#01411C"/></svg>),
  'Бангладеш': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#006A4E"/><circle cx="4" cy="3" r="1.5" fill="#F42A41"/></svg>),
  'Шри-Ланка': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#8D153A"/><rect width="1" height="6" fill="#FF7700"/><rect x="1" width="1" height="6" fill="#FFBE29"/><rect x="6" width="3" height="6" fill="#FFBE29"/></svg>),
  'Непал': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><polygon points="0,0 0,6 5,3.5 0,1" fill="#DC143C"/><polygon points="0,0 0,3.5 5,3.5" fill="#DC143C"/></svg>),
  'Бутан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,6 0,6" fill="#FF4E12"/><polygon points="0,0 9,0 9,6" fill="#FFD520"/></svg>),
  'Мальдивы': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#D21034"/><rect x="1.5" y="1" width="6" height="4" fill="#007E3A"/></svg>),
  'Афганистан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#000"/><rect x="3" width="3" height="6" fill="#BE0000"/><rect x="6" width="3" height="6" fill="#009900"/></svg>),
  // ===== БЛИЖНИЙ ВОСТОК =====
  'Саудовская Аравия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#006C35"/></svg>),
  'ОАЭ': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#00732F"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000"/><rect width="2" height="6" fill="#FF0000"/></svg>),
  'Катар': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#8D1B3D"/><rect width="3" height="6" fill="#fff"/></svg>),
  'Кувейт': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#007A3D"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#CE1126"/><polygon points="0,0 3,3 0,6" fill="#000"/></svg>),
  'Бахрейн': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#CE1126"/><polygon points="0,0 3,0 3.5,0.67 3,1.33 3.5,2 3,2.67 3.5,3.33 3,4 3.5,4.67 3,5.33 3.5,6 3,6 0,6" fill="#fff"/></svg>),
  'Оман': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#fff"/><rect y="2" width="9" height="2" fill="#CE1126"/><rect y="4" width="9" height="2" fill="#009A00"/><rect width="2.5" height="6" fill="#CE1126"/></svg>),
  'Йемен': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE1126"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000"/></svg>),
  'Израиль': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#fff"/><rect y="0.75" width="9" height="0.75" fill="#0038B8"/><rect y="4.5" width="9" height="0.75" fill="#0038B8"/></svg>),
  'Палестина': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#000"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#009736"/><polygon points="0,0 4,3 0,6" fill="#CE1126"/></svg>),
  'Иордания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#000"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#007A3D"/><polygon points="0,0 4.5,3 0,6" fill="#CE1126"/></svg>),
  'Ливан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#ED1C24"/><rect y="1.5" width="9" height="3" fill="#fff"/><rect y="4.5" width="9" height="1.5" fill="#ED1C24"/><rect x="3.5" y="1.5" width="2" height="3" fill="#00A651"/></svg>),
  'Сирия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE1126"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000"/></svg>),
  'Ирак': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE1126"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000"/></svg>),
  'Иран': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#239F40"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#DA0000"/></svg>),
  // ===== СЕВЕРНАЯ АФРИКА =====
  'Египет': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE1126"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000"/></svg>),
  'Марокко': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#C1272D"/></svg>),
  'Алжир': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="4.5" height="6" fill="#006633"/><rect x="4.5" width="4.5" height="6" fill="#fff"/></svg>),
  'Тунис': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#E70013"/><circle cx="4.5" cy="3" r="1.5" fill="#fff"/><circle cx="4.8" cy="3" r="1.2" fill="#E70013"/></svg>),
  'Ливия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#E70013"/><rect y="1.5" width="9" height="3" fill="#000"/><rect y="4.5" width="9" height="1.5" fill="#239E46"/></svg>),
  'Судан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#D21034"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#000"/><polygon points="0,0 3,3 0,6" fill="#007229"/></svg>),
  'Южный Судан': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#000"/><rect y="1.5" width="9" height="0.3" fill="#fff"/><rect y="1.8" width="9" height="2.4" fill="#DA121A"/><rect y="4.2" width="9" height="0.3" fill="#fff"/><rect y="4.5" width="9" height="1.5" fill="#078930"/><polygon points="0,0 4,3 0,6" fill="#0F47AF"/></svg>),
  // ===== ЗАПАДНАЯ АФРИКА =====
  'Нигерия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#008751"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#008751"/></svg>),
  'Гана': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE1126"/><rect y="2" width="9" height="2" fill="#FCD116"/><rect y="4" width="9" height="2" fill="#006B3F"/></svg>),
  'Сенегал': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#00853F"/><rect x="3" width="3" height="6" fill="#FDEF42"/><rect x="6" width="3" height="6" fill="#E31B23"/></svg>),
  'Кот-д\'Ивуар': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#F77F00"/><rect x="3" width="3" height="6" fill="#fff"/><rect x="6" width="3" height="6" fill="#009E60"/></svg>),
  'Мали': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#14B53A"/><rect x="3" width="3" height="6" fill="#FCD116"/><rect x="6" width="3" height="6" fill="#CE1126"/></svg>),
  'Буркина-Фасо': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#EF2B2D"/><rect y="3" width="9" height="3" fill="#009E49"/></svg>),
  'Нигер': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#E05206"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#0DB02B"/><circle cx="4.5" cy="3" r="0.5" fill="#E05206"/></svg>),
  'Гвинея': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#CE1126"/><rect x="3" width="3" height="6" fill="#FCD116"/><rect x="6" width="3" height="6" fill="#009460"/></svg>),
  'Бенин': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#008751"/><rect x="3" width="6" height="3" fill="#FCD116"/><rect x="3" y="3" width="6" height="3" fill="#E8112D"/></svg>),
  'Того': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.2" fill="#006A4E"/><rect y="1.2" width="9" height="1.2" fill="#FFCE00"/><rect y="2.4" width="9" height="1.2" fill="#006A4E"/><rect y="3.6" width="9" height="1.2" fill="#FFCE00"/><rect y="4.8" width="9" height="1.2" fill="#006A4E"/><rect width="3.6" height="3.6" fill="#D21034"/></svg>),
  'Сьерра-Леоне': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#1EB53A"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#0072C6"/></svg>),
  'Либерия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#BF0A30"/><rect y="0.55" width="9" height="0.55" fill="#fff"/><rect y="1.64" width="9" height="0.55" fill="#fff"/><rect y="2.73" width="9" height="0.55" fill="#fff"/><rect y="3.82" width="9" height="0.55" fill="#fff"/><rect y="4.91" width="9" height="0.55" fill="#fff"/><rect width="3.27" height="3.27" fill="#002868"/></svg>),
  'Гамбия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#CE1126"/><rect y="2" width="9" height="0.4" fill="#fff"/><rect y="2.4" width="9" height="1.2" fill="#0C1C8C"/><rect y="3.6" width="9" height="0.4" fill="#fff"/><rect y="4" width="9" height="2" fill="#3A7728"/></svg>),
  'Гвинея-Бисау': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#CE1126"/><rect x="3" width="6" height="3" fill="#FCD116"/><rect x="3" y="3" width="6" height="3" fill="#009E49"/></svg>),
  'Кабо-Верде': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#003893"/><rect y="2.5" width="9" height="0.5" fill="#fff"/><rect y="3" width="9" height="1" fill="#CF2027"/><rect y="4" width="9" height="0.5" fill="#fff"/></svg>),
  'Мавритания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00A95C"/></svg>),
  // ===== ВОСТОЧНАЯ АФРИКА =====
  'Эфиопия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#078930"/><rect y="2" width="9" height="2" fill="#FCDD09"/><rect y="4" width="9" height="2" fill="#DA121A"/></svg>),
  'Кения': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#000"/><rect y="1.8" width="9" height="2.4" fill="#BB0000"/><rect y="4.5" width="9" height="1.5" fill="#006600"/></svg>),
  'Танзания': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#1EB53A"/><polygon points="0,6 9,0 9,6" fill="#00A3DD"/><polygon points="0,0 0,6 9,0" fill="#FCD116"/><polygon points="0,5 8,0 9,0 9,1 1,6 0,6" fill="#000"/></svg>),
  'Уганда': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1" fill="#000"/><rect y="1" width="9" height="1" fill="#FCDC04"/><rect y="2" width="9" height="1" fill="#D90000"/><rect y="3" width="9" height="1" fill="#000"/><rect y="4" width="9" height="1" fill="#FCDC04"/><rect y="5" width="9" height="1" fill="#D90000"/></svg>),
  'Руанда': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#00A1DE"/><rect y="3" width="9" height="1.5" fill="#FAD201"/><rect y="4.5" width="9" height="1.5" fill="#20603D"/></svg>),
  'Бурунди': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#CE1126"/><polygon points="0,0 4.5,3 0,6" fill="#1EB53A"/><polygon points="9,0 4.5,3 9,6" fill="#1EB53A"/><circle cx="4.5" cy="3" r="1.5" fill="#fff"/></svg>),
  'Сомали': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#4189DD"/></svg>),
  'Джибути': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,0 9,3 0,6" fill="#6AB2E7"/><polygon points="0,0 9,3 9,6 0,6" fill="#12AD2B"/><polygon points="0,0 0,6 4,3" fill="#fff"/></svg>),
  'Эритрея': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,0 9,3" fill="#4189DD"/><polygon points="0,6 9,3 9,6" fill="#12AD2B"/><polygon points="0,0 0,6 9,3" fill="#EA0437"/></svg>),
  'Мадагаскар': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#fff"/><rect x="3" width="6" height="3" fill="#FC3D32"/><rect x="3" y="3" width="6" height="3" fill="#007E3A"/></svg>),
  'Маврикий': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#EA2839"/><rect y="1.5" width="9" height="1.5" fill="#1A206D"/><rect y="3" width="9" height="1.5" fill="#FFD500"/><rect y="4.5" width="9" height="1.5" fill="#00A551"/></svg>),
  'Сейшелы': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#003F87"/><polygon points="0,6 4.5,6 9,0 9,3" fill="#FCD856"/><polygon points="0,6 9,0 9,3" fill="#D62828"/><polygon points="0,6 4.5,6 0,3" fill="#fff"/><polygon points="0,3 0,6 9,6" fill="#007A3D"/></svg>),
  'Коморы': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#FFC61E"/><rect y="1.5" width="9" height="1.5" fill="#fff"/><rect y="3" width="9" height="1.5" fill="#CE1126"/><rect y="4.5" width="9" height="1.5" fill="#003DA5"/><polygon points="0,0 4,3 0,6" fill="#3D8E33"/></svg>),
  // ===== ЦЕНТРАЛЬНАЯ АФРИКА =====
  'ДР Конго': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#007FFF"/><polygon points="0,0 2,0 9,5 9,6 7,6 0,1" fill="#F7D618"/><polygon points="0,0 9,6 7,6 0,1" fill="#CE1021"/></svg>),
  'Конго': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,6 0,6" fill="#009543"/><polygon points="0,0 9,0 9,6" fill="#DC241F"/><polygon points="0,2 0,6 7,6 2,2" fill="#FBDE4A"/></svg>),
  'Камерун': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#007A5E"/><rect x="3" width="3" height="6" fill="#CE1126"/><rect x="6" width="3" height="6" fill="#FCD116"/></svg>),
  'ЦАР': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#003082"/><rect y="1.5" width="9" height="1.5" fill="#fff"/><rect y="3" width="9" height="1.5" fill="#289728"/><rect y="4.5" width="9" height="1.5" fill="#FFCE00"/><rect x="4" width="1" height="6" fill="#D21034"/></svg>),
  'Чад': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="3" height="6" fill="#002664"/><rect x="3" width="3" height="6" fill="#FECB00"/><rect x="6" width="3" height="6" fill="#C60C30"/></svg>),
  'Габон': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#009E60"/><rect y="2" width="9" height="2" fill="#FCD116"/><rect y="4" width="9" height="2" fill="#3A75C4"/></svg>),
  'Экваториальная Гвинея': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#3E9A00"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#E32118"/><polygon points="0,0 3,3 0,6" fill="#0073CE"/></svg>),
  'Сан-Томе и Принсипи': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#12AD2B"/><rect y="2" width="9" height="2" fill="#FFCE00"/><rect y="4" width="9" height="2" fill="#12AD2B"/><polygon points="0,0 3,3 0,6" fill="#D21034"/></svg>),
  // ===== ЮЖНАЯ АФРИКА =====
  'ЮАР': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#DE3831"/><rect y="4" width="9" height="2" fill="#002395"/><polygon points="0,0 3,3 0,6" fill="#007A4D"/><polygon points="0,0.5 2.5,3 0,5.5" fill="#FFB612"/><rect y="2.5" width="9" height="1" fill="#007A4D"/><rect y="2" width="9" height="0.5" fill="#fff"/><rect y="3.5" width="9" height="0.5" fill="#fff"/></svg>),
  'Ангола': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#CE1126"/><rect y="3" width="9" height="3" fill="#000"/></svg>),
  'Мозамбик': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#009A44"/><rect y="2" width="9" height="0.4" fill="#fff"/><rect y="2.4" width="9" height="1.2" fill="#000"/><rect y="3.6" width="9" height="0.4" fill="#fff"/><rect y="4" width="9" height="2" fill="#FCE100"/><polygon points="0,0 4,3 0,6" fill="#D21034"/></svg>),
  'Зимбабве': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="0.86" fill="#006400"/><rect y="0.86" width="9" height="0.86" fill="#FFD200"/><rect y="1.72" width="9" height="0.86" fill="#D40000"/><rect y="2.58" width="9" height="0.86" fill="#000"/><rect y="3.44" width="9" height="0.86" fill="#D40000"/><rect y="4.3" width="9" height="0.86" fill="#FFD200"/><rect y="5.16" width="9" height="0.86" fill="#006400"/><polygon points="0,0 4,3 0,6" fill="#fff"/></svg>),
  'Замбия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#198A00"/><rect x="5" width="1.33" height="4" fill="#EF7D00"/><rect x="6.33" width="1.33" height="4" fill="#000"/><rect x="7.66" width="1.34" height="4" fill="#DE2010"/></svg>),
  'Малави': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2" fill="#000"/><rect y="2" width="9" height="2" fill="#CE1126"/><rect y="4" width="9" height="2" fill="#339E35"/></svg>),
  'Намибия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,0 0,6" fill="#003580"/><polygon points="9,0 9,6 0,6" fill="#009A44"/><polygon points="0,1 8,0 9,0 9,1 1,6 0,6 0,5" fill="#fff"/><polygon points="0,1.5 7.5,0 8.5,0 9,0.5 1.5,6 0.5,6 0,5.5" fill="#C8102E"/></svg>),
  'Ботсвана': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="2.25" fill="#75AADB"/><rect y="2.25" width="9" height="0.3" fill="#fff"/><rect y="2.55" width="9" height="0.9" fill="#000"/><rect y="3.45" width="9" height="0.3" fill="#fff"/><rect y="3.75" width="9" height="2.25" fill="#75AADB"/></svg>),
  'Эсватини': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1" fill="#3E5EB9"/><rect y="1" width="9" height="0.5" fill="#FFD900"/><rect y="1.5" width="9" height="3" fill="#B10C0C"/><rect y="4.5" width="9" height="0.5" fill="#FFD900"/><rect y="5" width="9" height="1" fill="#3E5EB9"/></svg>),
  'Лесото': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="1.5" fill="#00209F"/><rect y="1.5" width="9" height="3" fill="#fff"/><rect y="4.5" width="9" height="1.5" fill="#009543"/></svg>),
  // ===== ОКЕАНИЯ =====
  'Австралия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00008B"/><rect width="4.5" height="3" fill="#00008B"/><path d="M0,0 L4.5,3 M4.5,0 L0,3" stroke="#fff" strokeWidth="0.5"/><path d="M2.25,0 V3 M0,1.5 H4.5" stroke="#fff" strokeWidth="0.8"/><path d="M2.25,0 V3 M0,1.5 H4.5" stroke="#C8102E" strokeWidth="0.4"/></svg>),
  'Новая Зеландия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00247D"/><rect width="4.5" height="3" fill="#00247D"/><path d="M0,0 L4.5,3 M4.5,0 L0,3" stroke="#fff" strokeWidth="0.5"/><path d="M2.25,0 V3 M0,1.5 H4.5" stroke="#fff" strokeWidth="0.8"/></svg>),
  'Фиджи': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#68BFE5"/><rect width="4.5" height="3" fill="#00247D"/></svg>),
  'Папуа — Новая Гвинея': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,0 0,6" fill="#000"/><polygon points="9,0 9,6 0,6" fill="#CE1126"/></svg>),
  'Самоа': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#CE1126"/><rect width="4.5" height="3" fill="#002B7F"/></svg>),
  'Тонга': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#C10000"/><rect width="3" height="3" fill="#fff"/><rect x="1" y="1" width="1" height="1" fill="#C10000"/></svg>),
  'Вануату': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#D21034"/><rect y="3" width="9" height="3" fill="#009543"/><polygon points="0,0 4,3 0,6" fill="#000"/></svg>),
  'Соломоновы Острова': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><polygon points="0,0 9,0 0,6" fill="#0051BA"/><polygon points="9,0 9,6 0,6" fill="#215B33"/><polygon points="0,0 9,6 9,5 1,0" fill="#FCD116"/></svg>),
  'Кирибати': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="3" fill="#CE1126"/><rect y="3" width="9" height="3" fill="#003F87"/><path d="M0,3 Q2.25,2.5 4.5,3 T9,3" fill="#003F87" stroke="#fff" strokeWidth="0.3"/></svg>),
  'Маршалловы Острова': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#003893"/><polygon points="0,6 9,0 9,2" fill="#DD7500"/><polygon points="0,6 9,2 9,3.5" fill="#fff"/></svg>),
  'Микронезия': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#75B2DD"/></svg>),
  'Палау': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#4AADD6"/><circle cx="4" cy="3" r="1.8" fill="#FFDE00"/></svg>),
  'Науру': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#002B7F"/><rect y="2.7" width="9" height="0.6" fill="#FFC61E"/></svg>),
  'Тувалу': ({ className }) => (<svg viewBox="0 0 9 6" className={className}><rect width="9" height="6" fill="#00247D"/><rect width="4.5" height="3" fill="#00247D"/></svg>),
};

// ISO коды стран
export const countryISOCodes: Record<string, string> = {
  'Россия': 'RU', 'Украина': 'UA', 'Беларусь': 'BY', 'Казахстан': 'KZ',
  'Узбекистан': 'UZ', 'Кыргызстан': 'KG', 'Таджикистан': 'TJ', 'Туркменистан': 'TM',
  'Армения': 'AM', 'Азербайджан': 'AZ', 'Грузия': 'GE', 'Молдова': 'MD',
  'Германия': 'DE', 'Франция': 'FR', 'Великобритания': 'GB', 'Италия': 'IT',
  'Испания': 'ES', 'Португалия': 'PT', 'Нидерланды': 'NL', 'Бельгия': 'BE',
  'Австрия': 'AT', 'Швейцария': 'CH', 'Люксембург': 'LU', 'Монако': 'MC',
  'Лихтенштейн': 'LI', 'Андорра': 'AD', 'Мальта': 'MT', 'Ирландия': 'IE',
  'Польша': 'PL', 'Чехия': 'CZ', 'Словакия': 'SK', 'Венгрия': 'HU',
  'Румыния': 'RO', 'Болгария': 'BG', 'Словения': 'SI', 'Хорватия': 'HR',
  'Эстония': 'EE', 'Латвия': 'LV', 'Литва': 'LT', 'Сербия': 'RS',
  'Черногория': 'ME', 'Босния и Герцеговина': 'BA', 'Северная Македония': 'MK',
  'Албания': 'AL', 'Косово': 'XK', 'Греция': 'GR',
  'Финляндия': 'FI', 'Швеция': 'SE', 'Норвегия': 'NO', 'Дания': 'DK',
  'Исландия': 'IS', 'Гренландия': 'GL', 'Фарерские острова': 'FO',
  'Шпицберген': 'SJ', 'Аландские острова': 'AX',
  'США': 'US', 'Канада': 'CA', 'Мексика': 'MX',
  'Гватемала': 'GT', 'Белиз': 'BZ', 'Гондурас': 'HN', 'Сальвадор': 'SV',
  'Никарагуа': 'NI', 'Коста-Рика': 'CR', 'Панама': 'PA',
  'Куба': 'CU', 'Ямайка': 'JM', 'Гаити': 'HT', 'Доминиканская Республика': 'DO',
  'Пуэрто-Рико': 'PR', 'Багамы': 'BS', 'Тринидад и Тобаго': 'TT', 'Барбадос': 'BB',
  'Бразилия': 'BR', 'Аргентина': 'AR', 'Колумбия': 'CO', 'Чили': 'CL',
  'Перу': 'PE', 'Венесуэла': 'VE', 'Эквадор': 'EC', 'Боливия': 'BO',
  'Парагвай': 'PY', 'Уругвай': 'UY', 'Гайана': 'GY', 'Суринам': 'SR',
  'Китай': 'CN', 'Япония': 'JP', 'Южная Корея': 'KR', 'Северная Корея': 'KP',
  'Тайвань': 'TW', 'Гонконг': 'HK', 'Макао': 'MO', 'Монголия': 'MN',
  'Вьетнам': 'VN', 'Таиланд': 'TH', 'Малайзия': 'MY', 'Сингапур': 'SG',
  'Индонезия': 'ID', 'Филиппины': 'PH', 'Мьянма': 'MM', 'Камбоджа': 'KH',
  'Лаос': 'LA', 'Бруней': 'BN', 'Восточный Тимор': 'TL',
  'Индия': 'IN', 'Пакистан': 'PK', 'Бангладеш': 'BD', 'Шри-Ланка': 'LK',
  'Непал': 'NP', 'Бутан': 'BT', 'Мальдивы': 'MV', 'Афганистан': 'AF',
  'Турция': 'TR', 'Иран': 'IR', 'Ирак': 'IQ', 'Сирия': 'SY',
  'Ливан': 'LB', 'Иордания': 'JO', 'Израиль': 'IL', 'Палестина': 'PS',
  'Саудовская Аравия': 'SA', 'ОАЭ': 'AE', 'Катар': 'QA', 'Кувейт': 'KW',
  'Бахрейн': 'BH', 'Оман': 'OM', 'Йемен': 'YE', 'Кипр': 'CY',
  'Египет': 'EG', 'Ливия': 'LY', 'Тунис': 'TN', 'Алжир': 'DZ',
  'Марокко': 'MA', 'Западная Сахара': 'EH', 'Судан': 'SD',
  'Нигерия': 'NG', 'Гана': 'GH', 'Сенегал': 'SN', 'Кот-д\'Ивуар': 'CI',
  'Мали': 'ML', 'Буркина-Фасо': 'BF', 'Нигер': 'NE', 'Гвинея': 'GN',
  'Бенин': 'BJ', 'Того': 'TG', 'Сьерра-Леоне': 'SL', 'Либерия': 'LR',
  'Гвинея-Бисау': 'GW', 'Гамбия': 'GM', 'Кабо-Верде': 'CV', 'Мавритания': 'MR',
  'Эфиопия': 'ET', 'Кения': 'KE', 'Танзания': 'TZ', 'Уганда': 'UG',
  'Руанда': 'RW', 'Бурунди': 'BI', 'Сомали': 'SO', 'Джибути': 'DJ',
  'Эритрея': 'ER', 'Мадагаскар': 'MG', 'Маврикий': 'MU', 'Сейшелы': 'SC', 'Коморы': 'KM',
  'ДР Конго': 'CD', 'Конго': 'CG', 'Камерун': 'CM', 'ЦАР': 'CF',
  'Чад': 'TD', 'Габон': 'GA', 'Экваториальная Гвинея': 'GQ', 'Сан-Томе и Принсипи': 'ST',
  'ЮАР': 'ZA', 'Ангола': 'AO', 'Мозамбик': 'MZ', 'Зимбабве': 'ZW',
  'Замбия': 'ZM', 'Малави': 'MW', 'Намибия': 'NA', 'Ботсвана': 'BW',
  'Эсватини': 'SZ', 'Лесото': 'LS',
  'Австралия': 'AU', 'Новая Зеландия': 'NZ', 'Фиджи': 'FJ',
  'Папуа — Новая Гвинея': 'PG', 'Самоа': 'WS', 'Тонга': 'TO',
  'Вануату': 'VU', 'Соломоновы Острова': 'SB', 'Кирибати': 'KI',
  'Маршалловы Острова': 'MH', 'Микронезия': 'FM', 'Палау': 'PW',
  'Науру': 'NR', 'Тувалу': 'TV'
};

// Дефолтный флаг с ISO кодом
const DefaultFlagWithCode: React.FC<{ code: string; className?: string }> = ({ code, className }) => (
  <svg viewBox="0 0 9 6" className={className}>
    <rect width="9" height="6" fill="#E5E7EB" rx="0.3"/>
    <text x="4.5" y="3.8" fontSize="2" textAnchor="middle" fill="#6B7280" fontFamily="sans-serif" fontWeight="bold">
      {code}
    </text>
  </svg>
);

// Основной компонент флага
export const CountryFlag: React.FC<{ country: string; className?: string }> = ({ country, className = 'w-6 h-4' }) => {
  const FlagComponent = FlagSVGs[country];
  if (FlagComponent) {
    return <FlagComponent className={className} />;
  }
  
  const isoCode = countryISOCodes[country] || country.substring(0, 2).toUpperCase();
  return <DefaultFlagWithCode code={isoCode} className={className} />;
};

// Страны по регионам (детально)
export const allCountriesByRegion: Record<string, string[]> = {
  'СНГ': ['Россия', 'Украина', 'Беларусь', 'Казахстан', 'Узбекистан', 'Кыргызстан', 'Таджикистан', 'Туркменистан', 'Армения', 'Азербайджан', 'Грузия', 'Молдова'],
  'Западная Европа': ['Германия', 'Франция', 'Великобритания', 'Италия', 'Испания', 'Португалия', 'Нидерланды', 'Бельгия', 'Австрия', 'Швейцария', 'Люксембург', 'Монако', 'Лихтенштейн', 'Андорра', 'Мальта', 'Ирландия'],
  'Центральная и Восточная Европа': ['Польша', 'Чехия', 'Словакия', 'Венгрия', 'Румыния', 'Болгария', 'Словения', 'Хорватия', 'Эстония', 'Латвия', 'Литва'],
  'Балканы': ['Сербия', 'Черногория', 'Босния и Герцеговина', 'Северная Македония', 'Албания', 'Косово', 'Греция'],
  'Северная Европа': ['Финляндия', 'Швеция', 'Норвегия', 'Дания', 'Исландия'],
  'Северная Америка': ['США', 'Канада', 'Мексика'],
  'Центральная Америка': ['Гватемала', 'Белиз', 'Гондурас', 'Сальвадор', 'Никарагуа', 'Коста-Рика', 'Панама'],
  'Карибы': ['Куба', 'Ямайка', 'Гаити', 'Доминиканская Республика', 'Пуэрто-Рико', 'Багамы', 'Тринидад и Тобаго', 'Барбадос'],
  'Южная Америка': ['Бразилия', 'Аргентина', 'Колумбия', 'Чили', 'Перу', 'Венесуэла', 'Эквадор', 'Боливия', 'Парагвай', 'Уругвай', 'Гайана', 'Суринам'],
  'Восточная Азия': ['Китай', 'Япония', 'Южная Корея', 'Северная Корея', 'Тайвань', 'Гонконг', 'Макао', 'Монголия'],
  'Юго-Восточная Азия': ['Вьетнам', 'Таиланд', 'Малайзия', 'Сингапур', 'Индонезия', 'Филиппины', 'Мьянма', 'Камбоджа', 'Лаос', 'Бруней', 'Восточный Тимор'],
  'Южная Азия': ['Индия', 'Пакистан', 'Бангладеш', 'Шри-Ланка', 'Непал', 'Бутан', 'Мальдивы', 'Афганистан'],
  'Ближний Восток': ['Турция', 'Иран', 'Ирак', 'Сирия', 'Ливан', 'Иордания', 'Израиль', 'Палестина', 'Саудовская Аравия', 'ОАЭ', 'Катар', 'Кувейт', 'Бахрейн', 'Оман', 'Йемен', 'Кипр'],
  'Северная Африка': ['Египет', 'Ливия', 'Тунис', 'Алжир', 'Марокко', 'Судан'],
  'Западная Африка': ['Нигерия', 'Гана', 'Сенегал', 'Кот-д\'Ивуар', 'Мали', 'Буркина-Фасо', 'Нигер', 'Гвинея', 'Бенин', 'Того', 'Сьерра-Леоне', 'Либерия', 'Гвинея-Бисау', 'Гамбия', 'Кабо-Верде', 'Мавритания'],
  'Восточная Африка': ['Эфиопия', 'Кения', 'Танзания', 'Уганда', 'Руанда', 'Бурунди', 'Сомали', 'Джибути', 'Эритрея', 'Мадагаскар', 'Маврикий', 'Сейшелы', 'Коморы'],
  'Центральная Африка': ['ДР Конго', 'Конго', 'Камерун', 'ЦАР', 'Чад', 'Габон', 'Экваториальная Гвинея', 'Сан-Томе и Принсипи'],
  'Южная Африка': ['ЮАР', 'Ангола', 'Мозамбик', 'Зимбабве', 'Замбия', 'Малави', 'Намибия', 'Ботсвана', 'Эсватини', 'Лесото'],
  'Океания': ['Австралия', 'Новая Зеландия', 'Фиджи', 'Папуа — Новая Гвинея', 'Самоа', 'Тонга', 'Вануату', 'Соломоновы Острова', 'Кирибати', 'Маршалловы Острова', 'Микронезия', 'Палау', 'Науру', 'Тувалу']
};

// Группы регионов для вкладок (4 вкладки)
export const regionGroups: Record<string, string[]> = {
  'Европа': ['СНГ', 'Западная Европа', 'Центральная и Восточная Европа', 'Балканы', 'Северная Европа'],
  'Америка': ['Северная Америка', 'Центральная Америка', 'Карибы', 'Южная Америка'],
  'Азия': ['Восточная Азия', 'Юго-Восточная Азия', 'Южная Азия', 'Ближний Восток'],
  'Африка и Океания': ['Северная Африка', 'Западная Африка', 'Восточная Африка', 'Центральная Африка', 'Южная Африка', 'Океания']
};

// Получить все страны группы регионов
export const getCountriesByRegionGroup = (groupName: string): string[] => {
  const subRegions = regionGroups[groupName] || [];
  return subRegions.flatMap(region => allCountriesByRegion[region] || []);
};

// Данные регионов для интерфейса
export const regionsData = Object.entries(allCountriesByRegion).map(([region, countries]) => ({
  name: region,
  countries
}));

// Функции-хелперы
export const getAllCountries = (): string[] => Object.values(allCountriesByRegion).flat();
export const getCountriesByRegion = (region: string): string[] => allCountriesByRegion[region] || [];
export const hasFlag = (country: string): boolean => country in FlagSVGs;

export default CountryFlag;
