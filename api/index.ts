import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

// API Route: Backend Proxy for Gemini
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { passage, userApiKey } = req.body;
    
    // Prioritize userApiKey only if it's a non-empty string
    const apiKey = (userApiKey && userApiKey.trim() !== "") ? userApiKey : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ 
        error: "API Key is missing. Please set GEMINI_API_KEY in Vercel environment variables or provide your own in the app settings." 
      });
    }

    if (!passage) {
      return res.status(400).json({ error: "Passage is required." });
    }

    const genAI = new GoogleGenAI({ apiKey });

    const systemInstruction = `당신은 고등학교 영어 교사를 돕는 전문 퀴즈 생성기입니다.
사용자가 입력한 영어 지문을 바탕으로 다음을 수행하세요:
1. 고등학생이 꼭 알아야 할 핵심 어휘 5개를 선정하세요.
2. 두 가지 종류의 퀴즈 세트를 생성하세요:
   - 세트 A (Context-based): 입력된 지문의 문맥과 문장을 그대로 활용하여 빈칸 퀴즈 생성.
   - 세트 B (New Sentences): 같은 단어들을 활용하되, 지문과는 다른 완전히 새로운 예문으로 빈칸 퀴즈 생성.
3. 각 퀴즈는 단어 위치를 기준으로 '앞부분(sentenceBefore)'과 '뒷부분(sentenceAfter)'으로 나누어 제공하세요.
4. 'fullSentence' 필드에는 빈칸이 채워진 전체 문장을 제공하세요.
5. 핵심 어휘의 선정 순서와 퀴즈의 순서를 매번 랜덤하게 섞으세요.
6. 출력은 반드시 JSON 형식이어야 합니다.`;

    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: passage }] }],
      config: {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        responseMimeType: "application/json",
      }
    });

    const result = await response;
    const text = result.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("Gemini Error Details:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: `Gemini call failed: ${errorMessage}`,
      suggestion: "Please verify your API Key in Vercel settings and ensure the model 'gemini-3-flash-preview' is available for your project."
    });
  }
});

export default app;
