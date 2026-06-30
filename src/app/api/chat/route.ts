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
    const {
      message,
      planContext,
      taskDescription,
      energyLevel,
      deadline,
      chatHistory,
      persona,
    } = await request.json() as {
      message: string;
      planContext: string;
      taskDescription: string;
      energyLevel: number;
      deadline: string;
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
      persona?: Persona;
    };

    // 2. Input validation
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (planContext && (typeof planContext !== 'string' || planContext.length > 10000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (taskDescription && (typeof taskDescription !== 'string' || taskDescription.length > 2000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (deadline && (typeof deadline !== 'string' || deadline.length > 2000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (chatHistory && (!Array.isArray(chatHistory) || chatHistory.some(m => !m || typeof m.content !== 'string' || m.content.length > 2000))) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const systemPrompt = `You are an expert productivity coach. The user has generated this execution plan: [planContext]. The original task was: [taskDescription]. Their energy level: [energyLevel]/10. Deadline: [deadline]. Answer their follow-up questions helpfully and specifically. You can suggest modifications, alternatives, shortcuts, or explanations. Keep answers concise — 2–4 sentences max unless a detailed breakdown is needed. If they ask to simplify or modify a task, give a concrete revised version.`
      .replace('[planContext]', planContext || 'No plan details available.')
      .replace('[taskDescription]', taskDescription || 'No description.')
      .replace('[energyLevel]', String(energyLevel || 5))
      .replace('[deadline]', deadline || 'no deadline set');

    const formattedPrompt = `${PERSONA_CONFIG[persona ?? 'supportive'].systemNote}\n\n` + systemPrompt;

    // Convert assistant role names to Gemini model role structures
    const contents = (chatHistory || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Append the active message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API using model: 'gemini-2.5-flash'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: formattedPrompt,
      }
    });

    const reply = response.text || 'Sorry, I could not generate a reply.';
    const cleanedReply = reply.replace(/[*_`#]/g, '').trim();

    return NextResponse.json({ reply: cleanedReply });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
