import { NextResponse } from "next/server";
import { chatJSON, SYSTEM_PROMPTS } from "@/lib/openai";
import type { OutlineNode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { topic, keyword, research, clusters } = await request.json();

    if (!topic || !keyword) {
      return NextResponse.json(
        { error: "topic과 keyword가 필요합니다." },
        { status: 400 }
      );
    }

    const userMessage = `토픽: ${topic}
타겟 키워드: ${keyword}
${clusters ? `관련 클러스터: ${clusters.join(", ")}` : ""}
${research ? `리서치 자료:\n${research}` : ""}

위 정보를 바탕으로 SEO에 최적화된 블로그 아웃라인을 설계해주세요.
H1-H2-H3 계층 구조로 작성하고, 경험 블록(체험기, 사례 연구 등)을 적절히 배치해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "outline": [
    {
      "id": "고유ID",
      "level": "h1" | "h2" | "h3",
      "text": "제목 텍스트",
      "children": [...재귀적 하위 노드],
      "isExperienceBlock": true/false,
      "experienceType": "체험기/사례연구/인터뷰 등 (경험 블록일 때만)",
      "wordCount": 예상 단어 수
    }
  ]
}`;

    const result = await chatJSON<{ outline: OutlineNode[] }>(
      [{ role: "user", content: userMessage }],
      SYSTEM_PROMPTS.outlineDesign
    );

    return NextResponse.json(result.outline);
  } catch (error) {
    console.error("Outline API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "아웃라인 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
