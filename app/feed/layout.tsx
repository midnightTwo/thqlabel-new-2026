import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Лента — thqlabel | Дистрибуция и продвижение музыки',
  description:
    'thqlabel — выгрузите музыку на Spotify, Apple Music, Яндекс Музыку и 100+ платформ. Дистрибуция треков, продвижение артистов, питчинг плейлистов. Быстрая загрузка трека и распространение музыки по всему миру.',
  keywords: [
    'дистрибуция музыки',
    'выгрузить музыку на платформы',
    'загрузить трек на Spotify',
    'загрузить трек на Apple Music',
    'распространение треков',
    'музыкальный лейбл Россия',
    'продвижение музыки',
    'выгрузить трек',
    'питчинг плейлистов',
    'thqlabel',
    'дистрибуция треков',
    'загрузить музыку',
  ],
  openGraph: {
    title: 'thqlabel — Дистрибуция и продвижение музыки',
    description:
      'Выгрузите свою музыку на все мировые платформы: Spotify, Apple Music, Яндекс Музыка, ВКонтакте и ещё 100+. Дистрибуция треков без скрытых комиссий.',
    url: 'https://thqlabel.ru/feed',
    type: 'website',
    images: [
      {
        url: 'https://thqlabel.ru/og-image.png',
        width: 1200,
        height: 630,
        alt: 'thqlabel — музыкальная дистрибуция',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'thqlabel — Дистрибуция музыки',
    description: 'Загрузите треки на Spotify, Apple Music и 100+ платформ. Быстрая дистрибуция, продвижение, питчинг плейлистов.',
    images: ['https://thqlabel.ru/og-image.png'],
  },
  alternates: {
    canonical: 'https://thqlabel.ru/feed',
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
