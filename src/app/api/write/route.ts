import { NextResponse } from "next/server";
import { streamChat, getWritingPrompt, MODEL_PRIMARY } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { research, profile, existingArticles } = await request.json();

    if (!research || !profile) {
      return NextResponse.json(
        { error: "research와 profile이 필요합니다." },
        { status: 400 }
      );
    }

    const systemPrompt = getWritingPrompt(
      research,
      profile,
      existingArticles || []
    );

    const userMessage = `위 리서치 결과와 SEO 전략을 기반으로 완성된 블로그 글을 HTML로 작성해주세요.
내부링크를 자연스럽게 본문에 삽입해주세요.
${profile.platform} 플랫폼에 최적화된 형식으로 출력해주세요.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const completion = await streamChat(
          [{ role: "user", content: userMessage }],
          systemPrompt,
          MODEL_PRIMARY
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
    console.error("Write API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "글 작성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
