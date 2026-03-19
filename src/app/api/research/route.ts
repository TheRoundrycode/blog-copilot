import { NextResponse } from "next/server";
import { searchWeb, chat, SYSTEM_PROMPTS } from "@/lib/openai";
import type { ResearchFact, Controversy, ExperienceSuggestion } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { topic, keyword, outline } = await request.json();

    if (!topic || !keyword) {
      return NextResponse.json(
        { error: "topic과 keyword가 필요합니다." },
        { status: 400 }
      );
    }

    // Step 1: Web search for gathering facts
    const searchQuery = `${topic} ${keyword} 최신 정보 통계 전문가 의견`;
    const searchResults = await searchWeb(searchQuery);

    // Step 2: Analyze search results with chat
    const analysisPrompt = `다음은 "${topic}" (키워드: ${keyword})에 대한 웹 검색 결과입니다:

${JSON.stringify(searchResults, null, 2)}

${outline ? `아웃라인:\n${outline}\n` : ""}

위 검색 결과를 분석하여 다음 JSON 형식으로 정리해주세요:
{
  "facts": [
    { "id": "고유ID", "content": "팩트 내용", "source": "출처", "verified": null, "category": "카테고리" }
  ],
  "controversies": [
    { "id": "고유ID", "topic": "논쟁 주제", "proArguments": ["찬성 근거들"], "conArguments": ["반대 근거들"] }
  ],
  "experienceSuggestions": [
    { "id": "고유ID", "type": "경험 유형", "description": "설명", "placement": "배치 위치" }
  ]
}

E-E-A-T 관점에서 콘텐츠를 강화할 수 있는 자료를 포함해주세요.
반드시 유효한 JSON만 응답해주세요.`;

    const analysisResult = await chat(
      [{ role: "user", content: analysisPrompt }],
      SYSTEM_PROMPTS.deepResearch
    );

    const parsed = JSON.parse(analysisResult || "{}") as {
      facts: ResearchFact[];
      controversies: Controversy[];
      experienceSuggestions: ExperienceSuggestion[];
    };

    return NextResponse.json({
      facts: parsed.facts || [],
      controversies: parsed.controversies || [],
      experienceSuggestions: parsed.experienceSuggestions || [],
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "리서치 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
