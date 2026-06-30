import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  // 1. Rate limiting
  const ip = request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ?? 'unknown';
  const { allowed } = checkRateLimit(ip, 15, 60000);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429 }
    );
  }

  try {
    const {
      taskDescription,
      deadline,
      recipientType,
      riskScore,
      completedCount,
      totalCount,
    } = await request.json() as {
      taskDescription: string;
      deadline: string;
      recipientType: string;
      riskScore: number;
      completedCount: number;
      totalCount: number;
    };

    // 2. Input validation
    if (typeof taskDescription !== 'string' || !taskDescription.trim() || taskDescription.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (deadline && (typeof deadline !== 'string' || deadline.length > 2000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (typeof recipientType !== 'string' || !recipientType.trim() || recipientType.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const systemPrompt = `You are an expert at writing professional, believable, and slightly sympathetic extension request emails. Draft an email from a student or professional who needs more time for: '{taskDescription}'. Original deadline: {deadline}. They have completed {completedCount} of {totalCount} tasks. Their situation is genuinely urgent (risk score: {riskScore}/100). The email is addressed to: '{recipientType}'.

Rules:
- Start with a warm, professional greeting
- Reference the specific task/assignment by name
- Give a plausible, honest-sounding reason for needing more time (not 'I was sick' — be more creative and specific to the task)
- Propose a specific new deadline (add 2-3 days to the original)
- Show that real progress has been made ({completedCount} subtasks done)
- End professionally with appreciation and commitment
- Keep it under 150 words
- Tone: genuine, not grovelling, not dramatic
- Do NOT use placeholder brackets like [Your Name] — use natural language like 'I look forward to hearing from you'`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Draft my professional extension request email.',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            subject: { type: 'STRING' },
            body: { type: 'STRING' },
          },
          required: ['subject', 'body'],
        },
      },
    });

    const reply = response.text;
    if (!reply) {
      throw new Error('No content returned from Gemini.');
    }

    const emailJson = JSON.parse(reply);

    return NextResponse.json({
      subject: emailJson.subject || 'Extension Request',
      body: emailJson.body || 'Please review my extension request.',
    });
  } catch (error: any) {
    console.error('Error in negotiator route:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
