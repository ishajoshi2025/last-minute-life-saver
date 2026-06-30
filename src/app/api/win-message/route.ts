import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { PERSONA_CONFIG, Persona } from '@/lib/persona';
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
    const { taskDescription, totalTasks, persona } = await request.json() as {
      taskDescription: string;
      totalTasks: number;
      persona?: Persona;
    };

    // 2. Input validation
    if (typeof taskDescription !== 'string' || !taskDescription.trim() || taskDescription.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const systemPrompt = `The user just completed ALL their tasks for: "{taskDescription}". They finished {totalTasks} micro-tasks. Write ONE sentence of genuine, specific, energetic praise that references their actual task topic. Do NOT use generic phrases like "great job" or "well done". Be creative and specific. Start with an exclamation. Max 20 words.`
      .replace('{taskDescription}', taskDescription || 'their tasks')
      .replace('{totalTasks}', String(totalTasks || 5));

    const formattedPrompt = `${PERSONA_CONFIG[persona ?? 'supportive'].systemNote}\n\n` + systemPrompt;

    // Call Gemini API model using the client setup in src/lib/gemini.ts
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Write my victory message.',
      config: {
        systemInstruction: formattedPrompt,
      }
    });

    const rawMessage = response.text || 'Incredible effort pushing through this goal!';
    const cleanedMessage = rawMessage.replace(/[*_`#]/g, '').trim();

    return NextResponse.json({ message: cleanedMessage });
  } catch (error: any) {
    console.error('Error in win-message route:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
