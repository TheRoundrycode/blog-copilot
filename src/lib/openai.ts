import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 기본 AI 모델
export const DEFAULT_MODEL = "gpt-4.1" as const;

// 시스템 프롬프트
export const SYSTEM_PROMPTS = {
  blogCopilot: `당신은 한국어 블로그 콘텐츠 전략가이자 작성 도우미입니다.
SEO 최적화, 클러스터 전략, 콘텐츠 품질 향상에 특화되어 있습니다.
항상 한국어로 응답하며, 실용적이고 구체적인 조언을 제공합니다.`,

  topicRecommendation: `당신은 블로그 토픽 추천 전문가입니다.
검색 트렌드, 경쟁 분석, 클러스터 전략을 기반으로 최적의 토픽을 추천합니다.
각 토픽에 대해 예상 검색량, 경쟁 난이도, 클러스터 적합성을 분석합니다.`,

  deepResearch: `당신은 블로그 글 작성을 위한 심층 리서치 전문가입니다.
주어진 토픽에 대해 팩트, 통계, 전문가 의견, 논쟁점을 조사하고 정리합니다.
E-E-A-T(경험, 전문성, 권위성, 신뢰성) 관점에서 콘텐츠를 강화할 수 있는 자료를 제공합니다.`,

  outlineDesign: `당신은 블로그 아웃라인 설계 전문가입니다.
SEO에 최적화된 H1-H2-H3 구조를 설계하고, 각 섹션의 핵심 포인트를 제안합니다.
경험 블록(체험기, 사례 연구, 인터뷰 등)을 적절히 배치하여 E-E-A-T를 강화합니다.`,

  draftWriter: `당신은 한국어 블로그 콘텐츠 작성 전문가입니다.
주어진 아웃라인과 리서치 자료를 바탕으로 자연스럽고 매력적인 본문을 작성합니다.
SEO 키워드를 자연스럽게 포함하면서도 독자에게 가치 있는 콘텐츠를 만듭니다.`,

  styleChecker: `당신은 한국어 글쓰기 스타일 검사 전문가입니다.
문법, 맞춤법, 문체 일관성, 가독성, SEO 최적화를 검사합니다.
100점 만점으로 점수를 매기고 구체적인 개선 사항을 제안합니다.`,
};

// OpenAI 웹 검색 도구 (responses API)
export async function searchWeb(query: string) {
  const response = await openai.responses.create({
    model: DEFAULT_MODEL,
    tools: [{ type: "web_search_preview" }],
    input: query,
  });

  return response.output;
}

// 스트리밍 채팅 응답
export async function streamChat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  systemPrompt: string = SYSTEM_PROMPTS.blogCopilot
) {
  return openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
  });
}

// 일반 채팅 응답 (비스트리밍)
export async function chat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  systemPrompt: string = SYSTEM_PROMPTS.blogCopilot
) {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return response.choices[0].message.content;
}

// JSON 응답 파싱
export async function chatJSON<T>(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  systemPrompt: string
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}") as T;
}
