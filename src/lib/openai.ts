import OpenAI from "openai";
import type {
  UserProfile,
  CrawledArticle,
  TopicRecommendation,
  Research,
  UserLearningData,
} from "./types";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI 모델
export const MODEL_PRIMARY = "gpt-5.4" as const; // 리서치/분석/글쓰기
export const MODEL_FAST = "gpt-5.4-mini" as const; // 채팅/빠른 응답

// ===== 블로그 컨텍스트 빌더 =====
export function buildBlogContext(
  profile: UserProfile | null,
  crawledContent: CrawledArticle[],
  learningData?: UserLearningData
): string {
  const parts: string[] = [];

  if (profile) {
    parts.push(`## 블로그 정보
- URL: ${profile.blogUrl}
- 이름: ${profile.blogName}
- 플랫폼: ${profile.platform}
- 목적: ${profile.purpose}
- 목표: ${profile.goals.join(", ")}
- 대상 독자: ${profile.targetAudience}
- 최종 목표: ${profile.finalObjective}`);

    if (profile.analyticsSummary) {
      parts.push(`\n## 통계 분석 요약\n${profile.analyticsSummary}`);
    }
  }

  if (crawledContent.length > 0) {
    const articleList = crawledContent
      .slice(0, 30)
      .map((a, i) => `${i + 1}. [${a.title}](${a.url})\n   ${a.description}`)
      .join("\n");
    parts.push(`\n## 기존 블로그 글 (${crawledContent.length}개)\n${articleList}`);
  }

  if (learningData?.insightSummary) {
    parts.push(`\n## 사용자 인사이트\n${learningData.insightSummary}`);
  }

  return parts.join("\n");
}

// ===== 플랫폼별 글 형식 지시 =====
function getPlatformWritingGuide(platform: string): string {
  switch (platform) {
    case "naver":
      return `네이버 블로그 에디터에 붙여넣기 가능한 HTML로 작성하세요.
- 인라인 스타일 사용 (외부 CSS 불가)
- <div>, <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <blockquote> 태그 활용
- 이미지 위치에 [이미지: 설명] 플레이스홀더 삽입
- 구분선에 <hr> 사용
- 깔끔하고 가독성 높은 레이아웃`;
    case "wordpress":
      return `WordPress Gutenberg 블록 HTML로 작성하세요.
- <!-- wp:paragraph -->, <!-- wp:heading --> 등 블록 코멘트 포함
- wp:list, wp:quote, wp:separator 블록 활용
- 클래스명은 WordPress 기본 클래스 사용`;
    case "tistory":
      return `티스토리 에디터 호환 HTML로 작성하세요.
- 인라인 스타일 사용
- <div>, <p>, <h2>, <h3> 중심 구조
- 깔끔한 카드형 레이아웃 선호`;
    default:
      return `범용 HTML/CSS로 작성하세요.
- 인라인 스타일 사용 (이식성)
- 반응형 고려
- 깔끔한 타이포그래피와 여백`;
  }
}

// ===== 프롬프트 빌더 =====

export function getOnboardingPrompt(
  crawledArticles: CrawledArticle[]
): string {
  const articleSummary =
    crawledArticles.length > 0
      ? crawledArticles
          .slice(0, 20)
          .map((a) => `- ${a.title}`)
          .join("\n")
      : "(크롤링된 글 없음)";

  return `당신은 블로그 전략 코파일럿입니다. 사용자의 블로그를 분석하고 최적의 콘텐츠 전략을 수립하는 전문가입니다.

## 크롤링된 블로그 글 목록
${articleSummary}

## 대화 규칙
1. 한국어로 대화합니다.
2. 4~6회 이내로 대화를 완료합니다. 절대 길게 끌지 마세요.
3. 첫 메시지에서: 크롤링 결과를 요약하고, 블로그의 주요 주제/패턴을 분석한 결과를 공유합니다.
4. 반드시 파악해야 할 정보:
   - 블로그 운영 목적 (수익화, 브랜딩, 정보 공유 등)
   - 대상 독자
   - 단기/장기 목표
   - 블로그 플랫폼 (네이버, 워드프레스, 티스토리 등)
5. 통계 데이터가 필요하면 사용자에게 요청합니다:
   "구글 애널리틱스, 네이버 블로그 통계, 또는 워드프레스 통계에서 최근 30일 데이터를 복사해서 붙여넣어 주세요."
   (양식 없이, 사용자가 있는 그대로 복사-붙여넣기 할 수 있게)
6. 데이터가 부족하면 추가 질문합니다.
7. 충분한 정보를 수집하면, 마지막 메시지에 분석 결과를 요약하고 다음 형식의 마커를 포함합니다:

---ONBOARDING_COMPLETE---
{
  "blogName": "블로그 이름",
  "platform": "naver|wordpress|tistory|other",
  "purpose": "블로그 목적",
  "goals": ["목표1", "목표2"],
  "targetAudience": "대상 독자",
  "finalObjective": "최종 목표",
  "analyticsSummary": "통계 분석 요약 (없으면 빈 문자열)",
  "clusters": [
    {"name": "클러스터명", "color": "#hex", "articleCount": 3}
  ]
}

중요: 마커와 JSON은 반드시 마지막 메시지의 맨 끝에 위치해야 합니다. JSON 앞뒤에 다른 텍스트를 넣지 마세요.`;
}

export function getTopicPrompt(
  profile: UserProfile,
  crawledContent: CrawledArticle[],
  learningData?: UserLearningData
): string {
  const context = buildBlogContext(profile, crawledContent, learningData);

  return `당신은 블로그 토픽 추천 전문가입니다.

${context}

## 토픽 추천 규칙
1. 반드시 위 블로그의 기존 콘텐츠와 관련된 토픽만 추천합니다.
2. 각 토픽에 대해 반드시 타겟 페르소나를 명시합니다.
3. 최신 트렌드와 날짜 관련성을 반영합니다.
4. 기존 글과 중복되지 않는 새로운 각도의 토픽을 제안합니다.
5. 사용자의 블로그 목적과 대상 독자에 맞는 토픽을 추천합니다.

## 응답 형식 (JSON)
{
  "topics": [
    {
      "id": "고유ID",
      "title": "토픽 제목",
      "keyword": "타겟 키워드",
      "searchVolume": 예상검색량,
      "difficulty": "쉬움|보통|어려움",
      "cluster": "클러스터명",
      "priority": 1 또는 2,
      "reasoning": "추천 이유",
      "lsiKeywords": ["관련키워드1", "관련키워드2"],
      "viralScore": 0-100,
      "targetPersona": "타겟 페르소나",
      "personaDescription": "이 페르소나가 관심 가지는 이유",
      "dateRelevance": "시의성 설명",
      "status": "recommended"
    }
  ]
}`;
}

export function getResearchPrompt(
  topic: TopicRecommendation,
  profile: UserProfile
): string {
  return `당신은 블로그 글 작성을 위한 심층 리서치 전문가입니다.

## 리서치 대상
- 토픽: ${topic.title}
- 키워드: ${topic.keyword}
- 타겟 페르소나: ${topic.targetPersona}
- 블로그 목적: ${profile.purpose}
- 대상 독자: ${profile.targetAudience}

## 리서치 규칙
1. 해당 키워드로 철저하게 검색하고 분석합니다.
2. 팩트, 통계, 전문가 의견을 수집합니다.
3. E-E-A-T(경험, 전문성, 권위성, 신뢰성) 관점에서 콘텐츠를 강화할 자료를 제공합니다.
4. SEO 전략을 수립합니다 (주요 키워드, 보조 키워드, 검색 의도, 경쟁 분석).
5. 글쓰기 가이드를 생성합니다 (이 토픽에 맞는 구체적인 작성 지침).

## 응답 형식 (JSON)
{
  "facts": [
    {"id": "f1", "content": "팩트 내용", "source": "출처", "verified": null, "category": "카테고리"}
  ],
  "controversies": [
    {"id": "c1", "topic": "논쟁점", "proArguments": ["찬성1"], "conArguments": ["반대1"]}
  ],
  "experienceSuggestions": [
    {"id": "e1", "type": "체험기|사례연구|인터뷰|데이터분석", "description": "설명", "placement": "배치 위치"}
  ],
  "seoStrategy": {
    "primaryKeyword": "주요 키워드",
    "secondaryKeywords": ["보조1", "보조2"],
    "searchIntent": "검색 의도 분석",
    "suggestedTitleVariants": ["제목 후보1", "제목 후보2"],
    "metaDescriptionDraft": "메타 설명 초안",
    "internalLinkSuggestions": ["내부링크 제안1"],
    "competitorAnalysis": "경쟁 분석"
  },
  "writingGuide": "이 토픽에 맞는 글쓰기 가이드 (톤, 구조, 핵심 포인트 등)"
}`;
}

export function getWritingPrompt(
  research: Research,
  profile: UserProfile,
  existingArticles: { url: string; title: string; keyword: string }[]
): string {
  const platformGuide = getPlatformWritingGuide(profile.platform);
  const internalLinks =
    existingArticles.length > 0
      ? existingArticles
          .map((a) => `- [${a.title}](${a.url}) (키워드: ${a.keyword})`)
          .join("\n")
      : "(기존 글 없음)";

  return `당신은 한국어 블로그 콘텐츠 작성 전문가입니다.

## 리서치 결과
${JSON.stringify(research.facts.slice(0, 10), null, 2)}

## SEO 전략
${JSON.stringify(research.seoStrategy, null, 2)}

## 글쓰기 가이드
${research.writingGuide || "SEO 최적화된 자연스러운 블로그 글을 작성하세요."}

## 내부링크 후보 (자연스럽게 본문에 삽입)
${internalLinks}

## 플랫폼 출력 형식
${platformGuide}

## 작성 규칙
1. 대상 독자: ${profile.targetAudience}
2. 블로그 목적: ${profile.purpose}
3. SEO 키워드를 자연스럽게 포함합니다.
4. 내부링크를 관련 맥락에서 자연스럽게 삽입합니다.
5. 본문을 HTML로 작성합니다 (위 플랫폼 형식 준수).
6. 2000~4000자 분량으로 작성합니다.
7. 매력적인 도입부와 명확한 결론을 포함합니다.`;
}

export function getChatPrompt(
  profile: UserProfile | null,
  crawledContent: CrawledArticle[],
  learningData?: UserLearningData
): string {
  const context = buildBlogContext(profile, crawledContent, learningData);

  return `당신은 한국어 블로그 콘텐츠 전략가이자 작성 도우미입니다.
SEO 최적화, 클러스터 전략, 콘텐츠 품질 향상에 특화되어 있습니다.
항상 한국어로 응답하며, 실용적이고 구체적인 조언을 제공합니다.

사용자가 가설을 세우거나 분석을 요청하면 심층적으로 분석합니다.
사용자가 자유롭게 토픽을 탐색하거나 딥리서치를 요청할 수 있습니다.

${context}`;
}

export function getStyleCheckPrompt(): string {
  return `당신은 한국어 글쓰기 스타일 검사 전문가입니다.
문법, 맞춤법, 문체 일관성, 가독성, SEO 최적화를 검사합니다.
100점 만점으로 점수를 매기고 구체적인 개선 사항을 제안합니다.`;
}

// ===== OpenAI 유틸리티 =====

export async function searchWeb(query: string) {
  const response = await openai.responses.create({
    model: MODEL_PRIMARY,
    tools: [{ type: "web_search_preview" }],
    input: query,
  });
  return response.output;
}

export async function streamChat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  systemPrompt: string,
  model: string = MODEL_FAST
) {
  return openai.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.7,
    max_completion_tokens: 4096,
  });
}

export async function chat(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  systemPrompt: string,
  model: string = MODEL_PRIMARY
) {
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_completion_tokens: 4096,
  });
  return response.choices[0].message.content;
}

export async function chatJSON<T>(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  systemPrompt: string,
  model: string = MODEL_PRIMARY
): Promise<T> {
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_completion_tokens: 4096,
    response_format: { type: "json_object" },
  });
  return JSON.parse(response.choices[0].message.content || "{}") as T;
}
