import { NextResponse } from "next/server";
import { chatJSON, getTopicPrompt } from "@/lib/openai";
import type { TopicRecommendation } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { profile, crawledContent, existingTopics, learningData } =
      await request.json();

    if (!profile) {
      return NextResponse.json(
        { error: "profile이 필요합니다." },
        { status: 400 }
      );
    }

    const systemPrompt = getTopicPrompt(
      profile,
      crawledContent || [],
      learningData
    );

    const userMessage = `기존 토픽: ${(existingTopics || []).map((t: TopicRecommendation) => t.title).join(", ") || "없음"}

위 블로그 데이터를 분석하여 새로운 토픽을 추천해주세요.
각 토픽에는 반드시 타겟 페르소나와 시의성 설명을 포함해주세요.
JSON 형식으로 { "topics": [...] } 구조로 응답해주세요.`;

    const result = await chatJSON<{ topics: TopicRecommendation[] }>(
      [{ role: "user", content: userMessage }],
      systemPrompt
    );

    return NextResponse.json(result.topics);
  } catch (error) {
    console.error("Topics API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "토픽 추천 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
