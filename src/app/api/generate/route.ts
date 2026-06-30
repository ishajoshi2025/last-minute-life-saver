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
    const { task, deadline, energy, useGrounding, persona } = await request.json() as {
      task: string;
      deadline: string;
      energy: number;
      useGrounding: boolean;
      persona?: Persona;
    };

    // 2. Input validation
    if (typeof task !== 'string' || !task.trim() || task.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (deadline && (typeof deadline !== 'string' || deadline.length > 2000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Include instructions on web search grounding and resource recommendations
    let systemPrompt = `You are an elite productivity coach. The user needs to complete: [TASK] by [DEADLINE]. Their current energy level is [ENERGY]/10. Give them a highly structured, bulleted execution plan. Break the task into 15-minute micro-steps. If their energy is low, suggest automated/easy tasks first. Format the response cleanly.`;
    
    if (useGrounding) {
      systemPrompt += ` You have access to Google Search. If the task involves studying a subject, learning a skill, completing a specific assignment, or anything where current resources would help, search for the most relevant tutorials, guides, or reference materials and weave specific resource recommendations into the plan. For example, if the task is 'study React hooks', search for the best current resources and include them as specific links or references in the relevant micro-tasks.`;
    }

    const formattedPrompt = (`${PERSONA_CONFIG[persona ?? 'supportive'].systemNote}\n\n` + systemPrompt)
      .replace('[TASK]', task)
      .replace('[DEADLINE]', deadline || 'no deadline specified')
      .replace('[ENERGY]', String(energy || 5));

    // Dynamic config container
    const config: any = {
      systemInstruction: formattedPrompt,
    };

    if (useGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    // Call Gemini API using model: 'gemini-2.5-flash'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Create my step-by-step roadmap.',
      config: config
    });

    const planText = response.text || 'Could not generate a plan. Please try again.';

    // Extract search grounding metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    let sources: Array<{ title: string; url: string }> | null = null;
    let wasGrounded = false;

    if (groundingMetadata) {
      wasGrounded = true;
      const chunks = groundingMetadata.groundingChunks || [];
      const extractedSources: Array<{ title: string; url: string }> = [];
      const seenUrls = new Set<string>();

      for (const chunk of chunks) {
        const web = chunk.web;
        if (web && web.uri) {
          const url = web.uri;
          const title = web.title || url;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            extractedSources.push({ title, url });
          }
        }
      }

      if (extractedSources.length > 0) {
        sources = extractedSources;
      }
    }

    return NextResponse.json({
      plan: planText,
      sources,
      wasGrounded
    });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    // Generic error boundary response
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
