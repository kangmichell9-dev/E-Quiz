import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface QuizQuestion {
  sentenceBefore: string;
  sentenceAfter: string;
  correctAnswer: string;
  fullSentence: string;
}

export interface QuizResult {
  contextQuestions: QuizQuestion[];
  newSentenceQuestions: QuizQuestion[];
  keyVocabulary: { word: string; meaning: string }[];
}

export async function generateQuiz(passage: string): Promise<QuizResult | null> {
  const systemInstruction = `당신은 고등학교 영어 교사를 돕는 전문 퀴즈 생성기입니다.
사용자가 입력한 영어 지문을 바탕으로 다음을 수행하세요:
1. 고등학생이 꼭 알아야 할 핵심 어휘 5개를 선정하세요.
2. 두 가지 종류의 퀴즈 세트를 생성하세요:
   - 세트 A (Context-based): 입력된 지문의 문맥과 문장을 그대로 활용하여 빈칸 퀴즈 생성.
   - 세트 B (New Sentences): 같은 단어들을 활용하되, 지문과는 다른 완전히 새로운 예문으로 빈칸 퀴즈 생성.
3. 각 퀴즈는 단어 위치를 기준으로 '앞부분(sentenceBefore)'과 '뒷부분(sentenceAfter)'으로 나누어 제공하세요.
4. 'fullSentence' 필드에는 빈칸이 채워진 전체 문장을 제공하세요.
5. 핵심 어휘의 선정 순서와 퀴즈의 순서를 매번 랜덤하게 섞으세요.
6. 출력은 반드시 JSON 형식이어야 합니다.

JSON 구조:
{
  "keyVocabulary": [{"word": "단어", "meaning": "뜻"}],
  "contextQuestions": [
    { "sentenceBefore": "...", "sentenceAfter": "...", "correctAnswer": "...", "fullSentence": "..." }
  ],
  "newSentenceQuestions": [
    { "sentenceBefore": "...", "sentenceAfter": "...", "correctAnswer": "...", "fullSentence": "..." }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: passage,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                },
                required: ["word", "meaning"],
              },
            },
            contextQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentenceBefore: { type: Type.STRING },
                  sentenceAfter: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  fullSentence: { type: Type.STRING },
                },
                required: ["sentenceBefore", "sentenceAfter", "correctAnswer", "fullSentence"],
              },
            },
            newSentenceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentenceBefore: { type: Type.STRING },
                  sentenceAfter: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  fullSentence: { type: Type.STRING },
                },
                required: ["sentenceBefore", "sentenceAfter", "correctAnswer", "fullSentence"],
              },
            },
          },
          required: ["keyVocabulary", "contextQuestions", "newSentenceQuestions"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return null;
  }
}
