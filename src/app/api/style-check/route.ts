import { NextResponse } from "next/server";
import { chatJSON, getStyleCheckPrompt } from "@/lib/openai";
import type { StyleCheckResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { content, keyword } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "content가 필요합니다." },
        { status: 400 }
      );
    }

    const userMessage = `다음 블로그 콘텐츠를 검사해주세요:

${content}

${keyword ? `타겟 SEO 키워드: ${keyword}` : ""}

다음 JSON 형식으로 검사 결과를 응답해주세요:
{
  "score": 전체 점수 (0-100),
  "grammar": { "score": 0-100, "issues": ["이슈 목록"] },
  "readability": { "score": 0-100, "issues": ["이슈 목록"] },
  "seo": { "score": 0-100, "issues": ["이슈 목록"] },
  "tone": { "score": 0-100, "issues": ["이슈 목록"] },
  "suggestions": ["개선 제안 목록"]
}`;

    const result = await chatJSON<StyleCheckResult>(
      [{ role: "user", content: userMessage }],
      getStyleCheckPrompt()
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Style check API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "스타일 검사 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
