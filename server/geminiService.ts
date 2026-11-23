import {GoogleGenAI, Type} from '@google/genai';

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface SolveQuestionInput {
  questionText?: string;
  subject?: string;
  studentClass?: string;
  boardMedium?: 'up_hindi' | 'english';
  imageBase64?: string;
  imageMimeType?: string;
}

export async function solveQuestionWithGemini(input: SolveQuestionInput) {
  const ai = getClient();
  if (!ai) {
    return {
      ok: false as const,
      reason: 'NO_API_KEY' as const,
      error: 'Server GEMINI_API_KEY configured nahi hai.',
    };
  }

  const langLabel =
    input.boardMedium === 'up_hindi'
      ? 'Simple Hindi + Hinglish (UP Board Hindi Medium style, easy mathematical & scientific terms)'
      : 'Clear English (with concise Hindi/Hinglish helper where helpful)';

  const prompt = `You are Smart Buddy, an expert tutor for Indian students (UP Board / CBSE Class ${input.studentClass || '11'} and NDA Defence exam).
Solve the student's question accurately and completely across ANY subject (Mathematics, Physics, Chemistry, Biology, English, Hindi, Social Science, NDA GAT).
Preferred Language: ${langLabel}
Selected Subject Hint: ${input.subject || 'Auto-detect'}
Student Question Text: ${input.questionText?.trim() || '(Read question carefully from the attached image)'}

Provide:
1. Exact detected subject name.
2. Concept / formula used.
3. Step-by-step clear derivation or explanation (3 to 8 crisp steps).
4. Exact final answer.
5. One short exam tip or memory trick.`;

  const parts: Array<{text?: string; inlineData?: {mimeType: string; data: string}}> = [];
  if (input.imageBase64 && input.imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: input.imageMimeType,
        data: input.imageBase64,
      },
    });
  }
  parts.push({text: prompt});

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {parts},
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: {type: Type.STRING},
          conceptUsed: {type: Type.STRING},
          steps: {
            type: Type.ARRAY,
            items: {type: Type.STRING},
          },
          finalAnswer: {type: Type.STRING},
          tip: {type: Type.STRING},
        },
        required: ['subject', 'conceptUsed', 'steps', 'finalAnswer', 'tip'],
      },
    },
  });

  const raw = (response.text ?? '{}').trim();
  const parsed = JSON.parse(raw) as {
    subject?: string;
    conceptUsed?: string;
    steps?: string[];
    finalAnswer?: string;
    tip?: string;
  };

  return {
    ok: true as const,
    result: {
      subject: parsed.subject || input.subject || 'General',
      conceptUsed: parsed.conceptUsed || 'Core Concept',
      steps: Array.isArray(parsed.steps) && parsed.steps.length > 0 ? parsed.steps : ['Solution ready.'],
      finalAnswer: parsed.finalAnswer || 'See steps above',
      tip: parsed.tip || 'Formula revise karke 2 similar questions practice karein.',
    },
  };
}

export interface TimetableOcrInput {
  imageBase64?: string;
  imageMimeType?: string;
  rawText?: string;
  studentClass?: string;
  studyTrack?: string;
  availableSubjects?: string[];
}

export async function extractTimetableWithGemini(input: TimetableOcrInput) {
  const ai = getClient();
  if (!ai) {
    return {
      ok: false as const,
      reason: 'NO_API_KEY' as const,
      error: 'Server GEMINI_API_KEY configured nahi hai.',
    };
  }

  const prompt = `Extract a clean daily/weekly study timetable from the provided notebook photo or text.
Student Class: ${input.studentClass || '11'}, Track: ${input.studyTrack || 'class_11_nda'}
Available Subjects: ${(input.availableSubjects || []).join(', ')}
Extra text if any: ${input.rawText || ''}

Rules:
- Convert times strictly into 24-hour "HH:MM" format (e.g. "06:00", "14:30").
- day must be one of: "Daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" (default "Daily" if daily schedule).
- subjectHint should match the closest subject name (Maths, Physics, Chemistry, English, Hindi, Biology, GAT, Science, Social Science).
- task should be a short readable label of what to study in that slot.`;

  const parts: Array<{text?: string; inlineData?: {mimeType: string; data: string}}> = [];
  if (input.imageBase64 && input.imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: input.imageMimeType,
        data: input.imageBase64,
      },
    });
  }
  parts.push({text: prompt});

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {parts},
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: {type: Type.STRING},
            start: {type: Type.STRING},
            end: {type: Type.STRING},
            subjectHint: {type: Type.STRING},
            task: {type: Type.STRING},
          },
          required: ['day', 'start', 'end', 'subjectHint', 'task'],
        },
      },
    },
  });

  const raw = (response.text ?? '[]').trim();
  const slots = JSON.parse(raw) as Array<{
    day: string;
    start: string;
    end: string;
    subjectHint: string;
    task: string;
  }>;

  return {
    ok: true as const,
    slots: Array.isArray(slots) ? slots : [],
  };
}

export interface SundayTestInput {
  notesTextList?: string[];
  noteImages?: Array<{base64: string; mimeType: string}>;
  studiedTopics?: string[];
  studentClass?: string;
  studyTrack?: string;
  boardMedium?: 'up_hindi' | 'english';
  questionCount?: number;
}

export async function generateSundayTestWithGemini(input: SundayTestInput) {
  const ai = getClient();
  if (!ai) {
    return {
      ok: false as const,
      reason: 'NO_API_KEY' as const,
      error: 'Server GEMINI_API_KEY configured nahi hai.',
    };
  }

  const count = Math.min(15, Math.max(5, Number(input.questionCount || 10)));
  const langLabel =
    input.boardMedium === 'up_hindi'
      ? 'Hindi / Hinglish (UP Board Hindi Medium compatible)'
      : 'English';

  const prompt = `Create a Sunday Weekly Revision Mock Test with exactly ${count} MCQs based on the student's uploaded handwritten notes, weekly live classes, and self-study topics.
Student Class: ${input.studentClass || '11'}, Track: ${input.studyTrack || 'class_11_nda'}
Language: ${langLabel}
Weekly Notes Text: ${(input.notesTextList || []).join(' | ') || 'None'}
Studied Topics This Week: ${(input.studiedTopics || []).join(' | ') || 'General class curriculum'}

Each question MUST have 4 distinct options, 0-based correctIndex (0..3), subject name, and a brief clear explanation.`;

  const parts: Array<{text?: string; inlineData?: {mimeType: string; data: string}}> = [];
  for (const img of (input.noteImages || []).slice(0, 4)) {
    if (img.base64 && img.mimeType) {
      parts.push({inlineData: {mimeType: img.mimeType, data: img.base64}});
    }
  }
  parts.push({text: prompt});

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {parts},
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          testTitle: {type: Type.STRING},
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: {type: Type.STRING},
                question: {type: Type.STRING},
                options: {
                  type: Type.ARRAY,
                  items: {type: Type.STRING},
                },
                correctIndex: {type: Type.INTEGER},
                explanation: {type: Type.STRING},
              },
              required: ['subject', 'question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
        required: ['testTitle', 'questions'],
      },
    },
  });

  const raw = (response.text ?? '{}').trim();
  const parsed = JSON.parse(raw) as {
    testTitle?: string;
    questions?: Array<{
      subject: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;
  };

  return {
    ok: true as const,
    testTitle: parsed.testTitle || 'Sunday Weekly Revision Test',
    questions: (parsed.questions || []).map((q, idx) => ({
      id: `stq_${Date.now()}_${idx}`,
      subject: q.subject || 'General',
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex) || 0)),
      explanation: q.explanation || '',
    })),
  };
}
