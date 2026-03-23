import { NextResponse } from "next/server";
import { streamChat } from "@/lib/openai";

const DRAFT_WRITER_PROMPT = `당신은 한국어 블로그 콘텐츠 작성 전문가입니다.
주어진 아웃라인과 리서치 자료를 바탕으로 자연스럽고 매력적인 본문을 작성합니다.
SEO 키워드를 자연스럽게 포함하면서도 독자에게 가치 있는 콘텐츠를 만듭니다.`;

export async function POST(request: Request) {
  try {
    const { section, research, keyword, tone, targetLength } =
      await request.json();

    if (!section || !section.text) {
      return NextResponse.json(
        { error: "section 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const userMessage = `다음 섹션의 본문을 작성해주세요:

섹션 레벨: ${section.level}
섹션 제목: ${section.text}
${keyword ? `타겟 키워드: ${keyword}` : ""}
${tone ? `문체/톤: ${tone}` : ""}
${targetLength ? `목표 글자 수: 약 ${targetLength}자` : ""}
${research ? `참고 리서치 자료:\n${research}` : ""}

자연스럽고 매력적인 한국어 블로그 본문을 작성해주세요.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const completion = await streamChat(
          [{ role: "user", content: userMessage }],
          DRAFT_WRITER_PROMPT
        );
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Draft API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "초안 작성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
