import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const zip = new PizZip(buffer);
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      return NextResponse.json({ error: 'Invalid DOCX file' }, { status: 400 });
    }
    let docXml = docFile.asText();

    // "Neural network" heuristic to find fields
    const fields = [];
    
    if (docXml.includes('Идентификатор заказа')) fields.push({ id: 'orderId', label: 'Идентификатор заказа' });
    if (docXml.includes('Дата заказа')) fields.push({ id: 'date', label: 'Дата заказа' });
    if (docXml.includes('Страна(Для России - упрощенно - РФ)')) fields.push({ id: 'country', label: 'Страна' });
    if (docXml.includes('ФИО в творительном падеже')) fields.push({ id: 'fio_tvor', label: 'ФИО в творительном падеже' });
    if (docXml.includes('ФИО')) fields.push({ id: 'fio', label: 'ФИО' });
    if (docXml.includes('Никнейм')) fields.push({ id: 'nickname', label: 'Никнейм' });
    if (docXml.includes('Паспорт: Серия и номер')) {
      fields.push({ id: 'passport_series', label: 'Серия паспорта' });
      fields.push({ id: 'passport_number', label: 'Номер паспорта' });
    }
    if (docXml.includes('Выдан: Кем выдан (как в паспорте) Код подразделения: (как в паспорте)')) {
      fields.push({ id: 'passport_issued_by', label: 'Кем выдан' });
      fields.push({ id: 'passport_code', label: 'Код подразделения' });
    }
    if (docXml.includes('Дата выдачи: (как в паспорте)')) fields.push({ id: 'passport_date', label: 'Дата выдачи' });
    if (docXml.includes('E-mail: актуальный e-mail')) fields.push({ id: 'email', label: 'E-mail' });
    if (docXml.includes('Номер счета: (в приложении банка)')) fields.push({ id: 'bank_account', label: 'Номер счета' });
    if (docXml.includes('Банк получателя: БИК: (в приложении банка)')) {
      fields.push({ id: 'bank_name', label: 'Банк получателя' });
      fields.push({ id: 'bik', label: 'БИК' });
    }
    if (docXml.includes('Корр. счет:(в приложении банка)')) fields.push({ id: 'corr_account', label: 'Корр. счет' });
    if (docXml.includes('ИЛИ номер карты')) fields.push({ id: 'card_number', label: 'Номер карты' });

    // Replace fields with tags
    docXml = docXml.replace(/Идентификатор заказа/g, '{orderId}');
    docXml = docXml.replace(/Дата заказа/g, '{date}');
    docXml = docXml.replace(/Страна\(Для России - упрощенно - РФ\)/g, '{country}');
    docXml = docXml.replace(/ФИО в творительном падеже/g, '{fio_tvor}');
    docXml = docXml.replace(/ФИО/g, '{fio}');
    docXml = docXml.replace(/Никнейм/g, '{nickname}');
    docXml = docXml.replace(/Паспорт: Серия и номер/g, 'Паспорт: {passport_series} {passport_number}');
    docXml = docXml.replace(/Выдан: Кем выдан \(как в паспорте\) Код подразделения: \(как в паспорте\)/g, 'Выдан: {passport_issued_by} Код подразделения: {passport_code}');
    docXml = docXml.replace(/Дата выдачи: \(как в паспорте\)/g, 'Дата выдачи: {passport_date}');
    docXml = docXml.replace(/E-mail: актуальный e-mail/g, 'E-mail: {email}');
    docXml = docXml.replace(/Номер счета: \(в приложении банка\)/g, 'Номер счета: {bank_account}');
    docXml = docXml.replace(/Банк получателя: БИК: \(в приложении банка\)/g, 'Банк получателя: {bank_name} БИК: {bik}');
    docXml = docXml.replace(/Корр\. счет:\(в приложении банка\)/g, 'Корр. счет: {corr_account}');
    docXml = docXml.replace(/ИЛИ номер карты/g, 'ИЛИ номер карты: {card_number}');
    docXml = docXml.replace(/\/ФИО\//g, '{%signature}');

    zip.file('word/document.xml', docXml);
    const templateBuffer = zip.generate({ type: 'nodebuffer' });

    // Return the fields and the template as base64
    return NextResponse.json({
      fields,
      template: templateBuffer.toString('base64'),
    });
  } catch (error) {
    console.error('Error analyzing docx:', error);
    return NextResponse.json({ error: 'Failed to analyze docx' }, { status: 500 });
  }
}
