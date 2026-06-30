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
    const { taskDescription, energyLevel, minutesIdle, persona } = await request.json() as {
      taskDescription: string;
      energyLevel: number;
      minutesIdle: number;
      persona?: Persona;
    };

    // 2. Input validation
    if (typeof taskDescription !== 'string' || !taskDescription.trim() || taskDescription.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    let basePrompt = '';
    if (persona === 'savage') {
      basePrompt = `You are a brutally direct AI productivity coach. The user is working on: '{taskDescription}'. Their energy level is {energyLevel}/10. The user has been IDLE for {minutesIdle} minutes. They are procrastinating. Roast them for it — be specific about their task and call out the laziness directly. Make them laugh but also cringe at themselves. End with one sharp action command.`;
    } else {
      basePrompt = `You are a warm but firm AI productivity coach. The user is working on: '{taskDescription}'. Their energy level is {energyLevel}/10. They have been IDLE for {minutesIdle} minutes — they are probably procrastinating. Write exactly ONE motivational nudge: 2 sentences max. Be specific to their actual task (mention it by name). Acknowledge it might be hard but create urgency. No generic quotes. No fluff. Start with an action verb.`;
    }

    const systemPrompt = `${PERSONA_CONFIG[persona ?? 'supportive'].systemNote}\n\n` + basePrompt
      .replace('{taskDescription}', taskDescription || 'your objective')
      .replace('{energyLevel}', String(energyLevel || 5))
      .replace('{minutesIdle}', String(minutesIdle || 5));

    // Call Gemini API model using the client setup in src/lib/gemini.ts
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate my voice productivity reminder.',
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const rawMessage = response.text || 'Focus on your task and push through!';
    
    // Strip markdown characters to ensure safe screen-reader voice rendering
    const strippedMessage = rawMessage.replace(/[*_`#\-]/g, '').trim();

    return NextResponse.json({ message: strippedMessage });
  } catch (error: any) {
    console.error('Error in AI nudge route:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
