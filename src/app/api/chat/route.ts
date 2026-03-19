import { NextResponse } from "next/server";
import { streamChat, SYSTEM_PROMPTS } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages 배열이 필요합니다." },
        { status: 400 }
      );
    }

    let systemPrompt = SYSTEM_PROMPTS.blogCopilot;
    if (context) {
      systemPrompt += `\n\n블로그 컨텍스트:\n${context}`;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const completion = await streamChat(messages, systemPrompt);
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
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "채팅 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
