import { NextRequest, NextResponse } from 'next/server';
import { getEnvelopeStatus } from '@/services/docusign.service';

export const runtime = 'nodejs';

type Params = {
  params: Promise<{
    envelopeId: string;
  }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { envelopeId } = await params;

    if (!envelopeId) {
      return NextResponse.json(
        { error: 'envelopeId is required' },
        { status: 400 }
      );
    }

    const result = await getEnvelopeStatus(envelopeId);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch envelope status',
      },
      { status: 500 }
    );
  }
}