import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Капча не пройдена' }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // На localhost используем тестовый secret key Cloudflare
    const isLocalhost = req.headers.get('host')?.includes('localhost');
    const effectiveSecret = isLocalhost 
      ? '1x0000000000000000000000000000000AA' 
      : secretKey;

    if (!effectiveSecret) {
      console.error('TURNSTILE_SECRET_KEY не задан');
      return NextResponse.json({ success: false, error: 'Ошибка конфигурации капчи' }, { status: 500 });
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: effectiveSecret,
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error('Turnstile verification failed:', data);
      return NextResponse.json({ success: false, error: 'Проверка капчи не пройдена' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json({ success: false, error: 'Ошибка проверки капчи' }, { status: 500 });
  }
}
