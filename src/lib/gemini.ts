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

export async function generateQuiz(passage: string, userApiKey?: string): Promise<QuizResult | null> {
  try {
    const response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passage, userApiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Server Error:", errorData.error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Quiz generation failed:", error);
    return null;
  }
}
