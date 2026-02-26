import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

// Генерация 6-значного OTP кода
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  console.log('=== SEND-VERIFICATION-EMAIL API CALLED ===');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_FROM:', process.env.SMTP_FROM);
  console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS);
  
  try {
    const { email, password, nickname, telegram } = await request.json();
    console.log('Request data - email:', email, 'nickname:', nickname, 'telegram:', telegram);
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    // Создаем admin клиент
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Проверяем существует ли пользователь
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Ошибка получения списка пользователей:', listError);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
    
    const existingUser = users?.find(u => u.email === email);
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Этот email уже зарегистрирован' 
      }, { status: 400 });
    }

    // Генерируем 6-значный OTP код
    const otpCode = generateOTP();
    const verificationToken = randomUUID(); // оставляем для совместимости
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
    
    // Удаляем старые токены для этого email
    await supabase
      .from('email_tokens')
      .delete()
      .eq('email', email)
      .eq('token_type', 'verification');
    
    // Сохраняем токен + OTP код в базу данных
    const { error: insertError } = await supabase
      .from('email_tokens')
      .insert({
        token: verificationToken,
        token_type: 'verification',
        email,
        password_hash: password,
        nickname: nickname || email.split('@')[0],
        telegram: telegram || null,
        expires_at: expiresAt.toISOString(),
        otp_code: otpCode,
      });
    
    if (insertError) {
      console.error('Ошибка сохранения токена:', insertError);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
    
    console.log('Создан OTP код для:', email);
    
    // Очищаем истекшие токены (фоновая очистка)
    supabase
      .from('email_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .then(() => console.log('Очищены истекшие токены'));
    
    // Получаем URL хоста динамически
    const host = request.headers.get('host') || 'localhost:3000';
    
    // Проверяем наличие SMTP настроек
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP настройки не указаны');
      return NextResponse.json({ error: 'Ошибка конфигурации email' }, { status: 500 });
    }

    // Отправляем email через SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    // Разбиваем код на цифры для красивого отображения
    const codeDigits = otpCode.split('');
    
    const mailOptions = {
      from: `"thqlabel" <${fromEmail}>`,
      to: email,
      replyTo: fromEmail,
      subject: `${otpCode} — код подтверждения thqlabel`,
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Код подтверждения — thqlabel</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0c0c0e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 0 80px rgba(96, 80, 186, 0.15);">
                            
                            <!-- Шапка -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #6050ba 0%, #9d8df1 100%); padding: 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); letter-spacing: -1px;">
                                        thqlabel
                                    </h1>
                                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">
                                        Music Label
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Контент -->
                            <tr>
                                <td style="padding: 40px 30px; text-align: center;">
                                    <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.5); font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Ваш код подтверждения</p>
                                    <h2 style="margin: 0 0 30px 0; color: white; font-size: 20px; font-weight: 700;">
                                        Введите его на странице регистрации
                                    </h2>
                                    
                                    <!-- Блок с кодом -->
                                    <table role="presentation" style="border-collapse: separate; border-spacing: 8px; margin: 0 auto 30px auto;">
                                        <tr>
                                            ${codeDigits.map(d => `
                                            <td style="
                                                width: 60px; height: 70px;
                                                background: linear-gradient(135deg, rgba(96,80,186,0.3) 0%, rgba(157,141,241,0.2) 100%);
                                                border: 2px solid rgba(157,141,241,0.5);
                                                border-radius: 14px;
                                                text-align: center;
                                                vertical-align: middle;
                                                font-size: 36px;
                                                font-weight: 900;
                                                color: #fff;
                                                font-family: 'Courier New', monospace;
                                                box-shadow: 0 4px 20px rgba(96,80,186,0.3);
                                            ">${d}</td>`).join('')}
                                        </tr>
                                    </table>
                                    
                                    <!-- Информация -->
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin: 0 0 20px 0;">
                                        <tr>
                                            <td style="padding: 20px; color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.6; text-align: left;">
                                                <p style="margin: 0 0 8px 0;">⏱ Код действителен <strong style="color: #9d8df1;">15 минут</strong></p>
                                                <p style="margin: 0 0 8px 0;">🔒 Никому не сообщайте этот код</p>
                                                <p style="margin: 0;">✉️ Если вы не регистрировались — проигнорируйте письмо</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Подвал -->
                            <tr>
                                <td style="background: rgba(255, 255, 255, 0.02); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                                    <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
                                        © 2026 thqlabel. Все права защищены.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    console.log('OTP код отправлен на:', email);
    
    return NextResponse.json({ 
      success: true,
      message: 'Код подтверждения отправлен на почту' 
    });

  } catch (error: any) {
    console.error('Ошибка отправки письма:', error);
    return NextResponse.json({ 
      error: error.message || 'Не удалось отправить письмо' 
    }, { status: 500 });
  }
}
