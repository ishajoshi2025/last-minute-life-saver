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
    const { missions } = await request.json() as {
      missions: Array<{
        id: string;
        taskDescription: string;
        deadline: string;
        riskScore: number;
        completedCount: number;
        totalCount: number;
      }>;
    };

    // 2. Input validation
    if (!missions || !Array.isArray(missions) || missions.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (missions.some(m => !m || typeof m.taskDescription !== 'string' || m.taskDescription.length > 2000 || (m.deadline && (typeof m.deadline !== 'string' || m.deadline.length > 2000)))) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const systemPrompt = `You are a priority advisor. The user has these active deadlines:
${JSON.stringify(missions, null, 2)}

Analyze their deadlines, risk scores, and completion status.
Tell them in exactly 2 sentences which mission to focus on RIGHT NOW and why.
Be direct and specific. Reference the actual task names.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Which active mission should I focus on first?',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            advice: { type: 'STRING' },
          },
          required: ['advice'],
        },
      },
    });

    const reply = response.text;
    if (!reply) {
      throw new Error('No content returned from Gemini.');
    }

    const outputJson = JSON.parse(reply);

    return NextResponse.json({
      advice: outputJson.advice || 'Pick the closest deadline and make progress!',
    });
  } catch (error: any) {
    console.error('Error in prioritize advisor route:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
