import { NextRequest, NextResponse } from 'next/server';
import { createRecipientView } from '@/services/docusign.service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const requiredFields = [
      'envelopeId',
      'signerName',
      'signerEmail',
      'clientUserId',
      'returnUrl',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const result = await createRecipientView(body);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to create embedded signing URL',
      },
      { status: 500 }
    );
  }
}