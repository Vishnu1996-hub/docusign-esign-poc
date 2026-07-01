import { NextRequest, NextResponse } from 'next/server';
import docusign from 'docusign-esign';
import { getDocusignClient } from '@/lib/docusign';

// Explicitly ensure runtime evaluates only in native Node.js environments
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { signerEmail, signerName } = await req.json();

    if (!signerEmail || !signerName) {
      return NextResponse.json({ error: 'Missing signerEmail or signerName.' }, { status: 400 });
    }

    // Resolve authenticated SDK pipeline client
    const { apiClient, accountId } = await getDocusignClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    // 1. Generate core base64 contract file structural payload
    const documentHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #1a365d;">Proof of Concept Agreement</h1>
          <p>This document verifies working eSignature integration pipelines within a Next.js framework.</p>
          <p><strong>Signer:</strong> ${signerName} (${signerEmail})</p>
          <br/><br/>
          <p>Please sign below:</p>
          <p style="color: #ffffff;">/sn1/</p>
        </body>
      </html>
    `;
    const docBase64 = Buffer.from(documentHtml).toString('base64');

    const document: docusign.Document = {
      documentBase64: docBase64,
      name: 'NextJS_POC_Agreement.html',
      fileExtension: 'html',
      documentId: '1',
    };

    // 2. Setup standard remote recipient configuration parameters
    const signHere: docusign.SignHere = {
      anchorString: '/sn1/',
      anchorUnits: 'pixels',
      anchorYOffset: '0',
      anchorXOffset: '0',
    };

    const tabs: docusign.Tabs = {
      signHereTabs: [signHere],
    };

    const signer: docusign.Signer = {
      email: signerEmail,
      name: signerName,
      recipientId: '1',
      routingOrder: '1',
      tabs,
    };

    // 3. Wrap elements securely inside structural Envelope envelope definitions
    const recipients: docusign.Recipients = {
      signers: [signer],
    };

    const envelope: docusign.EnvelopeDefinition = {
      emailSubject: 'Next.js App Router eSignature POC Demo',
      documents: [document],
      recipients,
      status: 'sent', // Sets to 'sent' to fire out emails immediately
    };

    // 5. Fire transaction out to the remote platform endpoint
    const response = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envelope });

    return NextResponse.json({ success: true, envelopeId: response.envelopeId });
  } catch (error: any) {
    console.error('Server side capture exception caught:', error);
    return NextResponse.json(
      { error: error.message || 'Internal pipeline processing failure.' },
      { status: 500 }
    );
  }
}
