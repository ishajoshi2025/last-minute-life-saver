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
    const { rawTranscript } = await request.json() as {
      rawTranscript: string;
    };

    // 2. Input validation
    if (typeof rawTranscript !== 'string' || !rawTranscript.trim() || rawTranscript.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const promptText = `The following is a raw voice transcript of a user describing their task: '{rawTranscript}'. Clean it up into a clear, concise task description suitable for a productivity app. Fix any speech-to-text errors. Remove filler words like 'um', 'uh', 'like'. Keep it under 100 words. Return ONLY the cleaned task description, nothing else.`
      .replace('{rawTranscript}', rawTranscript);

    // Call Gemini API using model: 'gemini-2.5-flash'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Execute raw text transcription cleanup.',
      config: {
        systemInstruction: promptText,
      }
    });

    const cleanedText = response.text || rawTranscript;

    return NextResponse.json({ cleanedText: cleanedText.trim() });
  } catch (error: any) {
    console.error('Error in clean-voice API route:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
