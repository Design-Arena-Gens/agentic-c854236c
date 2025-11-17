import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type HistoryItem = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT =
  "నీ పేరు దీప్తి. నువ్వు తెలుగులో నైజంగా మాట్లాడే సహాయక AI. వినియోగదారుడికి శ్రద్ధగా, వినయంగా, స్పష్టంగా సమాధానం ఇవ్వాలి. అవసరమైతే చిన్న చిన్న తెలుగు-ఆంగ్ల మిశ్రమ పదాలు వాడవచ్చు కానీ మొత్తం స్పందన తెలుగులోనే ఇవ్వాలి. తప్పులు ఉన్నట్లు అనిపిస్తే స్పష్టం చేయాలి. సంభాషణ సాగదీయడానికి ప్రశ్నలకు ఉత్తేజంగా స్పందించు.";

const FALLBACK_RESPONSE =
  "క్షమించండి, ప్రస్తుతం AI సేవ అందుబాటులో లేదు. కొంతసేపు తర్వాత మళ్లీ ప్రయత్నించండి లేదా అభివృద్ధిపరులు API కీను సరిచూడండి.";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { history?: HistoryItem[] } | null;
    const history = body?.history?.filter((entry) => entry.content?.trim()) ?? [];

    if (!openai) {
      return NextResponse.json({ reply: FALLBACK_RESPONSE }, { status: 200 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.75,
      top_p: 0.95,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        ...history
      ],
      max_tokens: 700
    });

    const reply = completion.choices[0]?.message?.content ?? FALLBACK_RESPONSE;

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "దురదృష్టవశాత్తు, ప్రస్తుతం అభ్యర్థనను చేతగానాం. దయచేసి కొద్దిసేపు తర్వాత ప్రయత్నించండి."
      },
      { status: 500 }
    );
  }
}
