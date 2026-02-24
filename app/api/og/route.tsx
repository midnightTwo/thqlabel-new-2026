import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #08080a 0%, #1a1530 50%, #08080a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Свечение 1 */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,80,186,0.4) 0%, transparent 70%)',
            top: -50,
            left: 50,
          }}
        />
        {/* Свечение 2 */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(157,141,241,0.3) 0%, transparent 70%)',
            bottom: -30,
            right: 100,
          }}
        />

        {/* Логотип-круг */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6050ba, #9d8df1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
            boxShadow: '0 0 60px rgba(96,80,186,0.5)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 42, fontWeight: 'bold' }}>T</span>
        </div>

        {/* Название */}
        <span
          style={{
            color: '#ffffff',
            fontSize: 72,
            fontWeight: 'bold',
            letterSpacing: '6px',
          }}
        >
          thqlabel
        </span>

        {/* Подзаголовок */}
        <span
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 28,
            marginTop: 16,
          }}
        >
          музыкальный лейбл
        </span>

        {/* Линия */}
        <div
          style={{
            width: 400,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(157,141,241,0.6), transparent)',
            marginTop: 30,
          }}
        />

        {/* URL */}
        <span
          style={{
            color: 'rgba(157,141,241,0.8)',
            fontSize: 22,
            marginTop: 20,
          }}
        >
          thqlabel.ru
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
