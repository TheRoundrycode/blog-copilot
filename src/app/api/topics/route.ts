import { NextResponse } from "next/server";
import { chatJSON, SYSTEM_PROMPTS } from "@/lib/openai";
import type { TopicRecommendation } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { blogUrl, clusters, existingTopics } = await request.json();

    if (!blogUrl) {
      return NextResponse.json(
        { error: "blogUrl이 필요합니다." },
        { status: 400 }
      );
    }

    const userMessage = `블로그 URL: ${blogUrl}
클러스터: ${(clusters || []).join(", ")}
기존 토픽: ${(existingTopics || []).join(", ")}

위 블로그의 클러스터 전략과 기존 토픽을 분석하고, 검색 트렌드를 고려하여 새로운 토픽을 추천해주세요.
각 토픽에 대해 다음 정보를 포함해주세요:
- id: 고유 ID (uuid 형식 문자열)
- title: 토픽 제목
- keyword: 타겟 키워드
- searchVolume: 예상 월간 검색량
- difficulty: 경쟁 난이도 ("쉬움" | "보통" | "어려움")
- cluster: 해당 클러스터명
- priority: 우선순위 (1 또는 2)
- reasoning: 추천 이유
- lsiKeywords: 관련 LSI 키워드 배열
- viralScore: 바이럴 가능성 점수 (0-100)

JSON 형식으로 { "topics": [...] } 구조로 응답해주세요.`;

    const result = await chatJSON<{ topics: TopicRecommendation[] }>(
      [{ role: "user", content: userMessage }],
      SYSTEM_PROMPTS.topicRecommendation
    );

    return NextResponse.json(result.topics);
  } catch (error) {
    console.error("Topics API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "토픽 추천 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
