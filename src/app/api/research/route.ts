import { NextResponse } from "next/server";
import { searchWeb, chatJSON, getResearchPrompt } from "@/lib/openai";
import type { Research } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { topic, profile } = await request.json();

    if (!topic || !profile) {
      return NextResponse.json(
        { error: "topic과 profile이 필요합니다." },
        { status: 400 }
      );
    }

    const systemPrompt = getResearchPrompt(topic, profile);

    // Step 1: 다중 웹 검색
    const queries = [
      `${topic.keyword} 최신 정보 통계`,
      `${topic.keyword} ${topic.targetPersona} 가이드`,
      `${topic.keyword} 전문가 의견 분석`,
    ];

    const searchResults = await Promise.all(
      queries.map((q) => searchWeb(q).catch(() => null))
    );

    const validResults = searchResults.filter(Boolean);

    // Step 2: AI 분석
    const userMessage = `웹 검색 결과:
${JSON.stringify(validResults, null, 2)}

위 검색 결과를 분석하여 리서치 결과를 JSON으로 정리해주세요.`;

    type ResearchResult = Omit<Research, "id" | "topicId" | "progress" | "status" | "created_at">;

    const result = await chatJSON<ResearchResult>(
      [{ role: "user", content: userMessage }],
      systemPrompt
    );

    return NextResponse.json({
      facts: result.facts || [],
      controversies: result.controversies || [],
      experienceSuggestions: result.experience_suggestions || [],
      seoStrategy: result.seoStrategy || null,
      writingGuide: result.writingGuide || "",
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "리서치 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
