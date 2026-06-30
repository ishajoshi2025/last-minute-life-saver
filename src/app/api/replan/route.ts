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
      completedTasks,
      blockedTask,
      remainingTasks,
      taskDescription,
      energyLevel,
      deadline,
      persona,
    } = await request.json() as {
      completedTasks: string[];
      blockedTask: string;
      remainingTasks: string[];
      taskDescription: string;
      energyLevel: number;
      deadline: string;
      persona?: Persona;
    };

    // 2. Input validation
    if (typeof taskDescription !== 'string' || !taskDescription.trim() || taskDescription.length > 2000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (blockedTask && (typeof blockedTask !== 'string' || blockedTask.length > 2000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (deadline && (typeof deadline !== 'string' || deadline.length > 2000)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (completedTasks && (!Array.isArray(completedTasks) || completedTasks.some(t => typeof t !== 'string' || t.length > 2000))) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (remainingTasks && (!Array.isArray(remainingTasks) || remainingTasks.some(t => typeof t !== 'string' || t.length > 2000))) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Exact system prompt formatting requested by the user
    const systemPrompt = `You are an elite productivity coach running an adaptive planning agent. The user is working on: {taskDescription}. Energy level: {energyLevel}/10. Deadline: {deadline}. They have already completed: {completedTasks}. They are STUCK on: '{blockedTask}'. Remaining tasks to re-schedule: {remainingTasks}. Generate a revised, realistic, motivating plan for the remaining tasks. Acknowledge their progress in one sentence, skip the blocked task and give a workaround strategy for it, then list the remaining micro-tasks as a clean bullet list. Keep it concise.`
      .replace('{taskDescription}', taskDescription || 'no task description')
      .replace('{energyLevel}', String(energyLevel || 5))
      .replace('{deadline}', deadline || 'no deadline specified')
      .replace('{completedTasks}', (completedTasks && completedTasks.length > 0) ? completedTasks.join(', ') : 'none')
      .replace('{blockedTask}', blockedTask || 'none')
      .replace('{remainingTasks}', (remainingTasks && remainingTasks.length > 0) ? remainingTasks.join(', ') : 'none');

    const formattedPrompt = `${PERSONA_CONFIG[persona ?? 'supportive'].systemNote}\n\n` + systemPrompt;

    // Call Gemini API using the official client initialized in src/lib/gemini.ts
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate my adaptive re-plan.',
      config: {
        systemInstruction: formattedPrompt,
      }
    });

    const planText = response.text || 'Could not generate a revised roadmap. Keep pushing forward!';

    return NextResponse.json({ revisedPlan: planText });
  } catch (error: any) {
    console.error('Error calling Gemini Replan API:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
