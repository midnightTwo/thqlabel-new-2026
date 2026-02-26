import { NextResponse } from 'next/server';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import ContractPDF from '@/lib/templates/ContractPDF';

// 1x1 transparent PNG fallback
const TRANSPARENT_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

function base64ToBuffer(dataUrl: string | undefined | null): Buffer | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/i);
  if (!match) return null;
  try {
    return Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
}

function safeFilename(orderId: string): string {
  return (orderId || 'contract').replace(/[^a-zA-Z\u0400-\u04FF0-9_-]/g, '_');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, signatureBase64, plotnikovSignatureBase64, format = 'pdf' } = body;

    if (!data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // DOCX generation path
    if (format === 'docx') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PizZip = require('pizzip');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Docxtemplater = require('docxtemplater');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ImageModule = require('docxtemplater-image-module-free');

      const templatePath = path.join(process.cwd(), 'lib', 'templates', 'contract_template.docx');
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: 'DOCX template not found' }, { status: 500 });
      }

      const userSigBuf = base64ToBuffer(signatureBase64);
      const plotnikovSigBuf = base64ToBuffer(plotnikovSignatureBase64);

      const zip = new PizZip(fs.readFileSync(templatePath));
      const imageModuleInstance = new ImageModule({
        centered: false,
        getImage(_tagValue: string, tagName: string): Buffer {
          if (tagName === 'signature') return userSigBuf ?? TRANSPARENT_1PX;
          if (tagName === 'plotnikov_signature') return plotnikovSigBuf ?? TRANSPARENT_1PX;
          return TRANSPARENT_1PX;
        },
        getSize(_img: Buffer, _tagValue: string, tagName: string): [number, number] {
          if (tagName === 'signature') return userSigBuf ? [220, 70] : [1, 1];
          if (tagName === 'plotnikov_signature') return plotnikovSigBuf ? [220, 70] : [1, 1];
          return [1, 1];
        },
      });

      const doc = new Docxtemplater(zip, {
        modules: [imageModuleInstance],
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.render({ ...data, signature: 'sig', plotnikov_signature: 'plotnikov_sig' });

      const filledDocxBuffer: Buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      return new NextResponse(filledDocxBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="Dogovor_${safeFilename(data.orderId)}.docx"`,
        },
      });
    }

    // PDF generation via @react-pdf/renderer (fast, pure JS, ~300ms)
    const start = Date.now();
    console.log('[contracts/generate] Generating PDF via @react-pdf/renderer...');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(ContractPDF, {
        data,
        signatureBase64: signatureBase64 ?? null,
        plotnikovSignatureBase64: plotnikovSignatureBase64 ?? null,
      }) as any
    );

    const elapsed = Date.now() - start;
    console.log(`[contracts/generate] PDF ready in ${elapsed}ms, size=${pdfBuffer.length}`);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Dogovor_${safeFilename(data.orderId)}.pdf"`,
        'X-Generation-Ms': String(elapsed),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('[contracts/generate] Error:', msg, '\n', stack);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
