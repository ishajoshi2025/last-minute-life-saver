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
    const { imageBase64, mimeType } = await request.json() as {
      imageBase64: string;
      mimeType: string;
    };

    // 2. Input validation
    if (typeof imageBase64 !== 'string' || !imageBase64.trim() || typeof mimeType !== 'string' || !mimeType.trim()) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    if (imageBase64.length * 0.75 > 5000000) {
      return NextResponse.json({ error: 'Image too large, please use a smaller file.' }, { status: 400 });
    }

    const promptText = 
      "You are an expert task extractor. Look at this image carefully. It may " +
      "contain an assignment sheet, exam schedule, to-do list, whiteboard, or " +
      "handwritten notes. Extract ALL tasks, deliverables, or action items you " +
      "can see. Ignore decorative elements. Return ONLY a clean, plain-English " +
      "sentence describing all the tasks found, suitable to be used as a task " +
      "description input. For example: 'Complete a 2000-word essay on climate " +
      "change, solve 10 calculus problems, and review chapters 5-7 for tomorrow's " +
      "exam.' If no tasks are visible, return: 'Could not extract tasks from " +
      "this image.'";

    // Call Gemini (model: "gemini-1.5-flash") with both the inline image data and the text prompt
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        promptText
      ]
    });

    const extractedText = response.text || "Could not extract tasks from this image.";

    return NextResponse.json({ extractedText });
  } catch (error: any) {
    console.error("Error in vision task extraction route:", error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
