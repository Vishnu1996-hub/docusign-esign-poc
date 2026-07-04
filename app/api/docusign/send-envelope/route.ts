import { NextRequest, NextResponse } from 'next/server';
import { sendEnvelope } from '@/services/docusign.service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requiredFields = [
      'signerName',
      'signerEmail',
      'subject',
      'documentBase64',
      'fileName',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const result = await sendEnvelope(body);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to send envelope',
      },
      { status: 500 }
    );
  }
}