import OpenAI from "openai";
import { NextResponse } from "next/server";

export type GenerateEmailRequest = {
  name: string;
  company: string;
  recipientDescription: string;
};

export type GenerateEmailResponse = {
  subject: string;
  body: string;
};

const SYSTEM_PROMPT = `Du bist ein erfahrener B2B-Vertriebsexperte für Cold Outreach.
Schreibe präzise, höfliche und personalisierte Cold Emails auf Deutsch.
Die E-Mail soll kurz sein (max. 150 Wörter im Body), einen klaren Mehrwert bieten und mit einer weichen Call-to-Action enden.
Keine übertriebenen Versprechen, keine Buzzword-Flut, kein aggressiver Verkaufston.
Antworte ausschließlich als gültiges JSON mit genau diesen Feldern:
{"subject": "Betreffzeile", "body": "E-Mail-Text mit Absätzen, getrennt durch \\n\\n"}`;

function buildUserPrompt(input: GenerateEmailRequest): string {
  return `Erstelle eine Cold Email mit folgenden Angaben:

Absender:
- Name: ${input.name}
- Firma: ${input.company}

Empfänger (Beschreibung):
${input.recipientDescription}

Die E-Mail soll so wirken, als kenne der Absender die Situation des Empfängers. Personalisiere auf Basis der Empfänger-Beschreibung.`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY ist nicht konfiguriert. Bitte in .env.local eintragen.",
      },
      { status: 500 },
    );
  }

  let body: GenerateEmailRequest;

  try {
    body = (await request.json()) as GenerateEmailRequest;
  } catch {
    return NextResponse.json(
      { error: "Ungültige Anfrage." },
      { status: 400 },
    );
  }

  const name = body.name?.trim();
  const company = body.company?.trim();
  const recipientDescription = body.recipientDescription?.trim();

  if (!name || !company || !recipientDescription) {
    return NextResponse.json(
      { error: "Bitte alle Felder ausfüllen." },
      { status: 400 },
    );
  }

  if (recipientDescription.length < 20) {
    return NextResponse.json(
      {
        error:
          "Die Empfänger-Beschreibung sollte mindestens 20 Zeichen lang sein.",
      },
      { status: 400 },
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt({ name, company, recipientDescription }),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Keine Antwort von der KI erhalten." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(content) as GenerateEmailResponse;

    if (!parsed.subject?.trim() || !parsed.body?.trim()) {
      return NextResponse.json(
        { error: "Ungültiges Antwortformat von der KI." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      subject: parsed.subject.trim(),
      body: parsed.body.trim(),
    } satisfies GenerateEmailResponse);
  } catch (error) {
    console.error("OpenAI error:", error);
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Generierung fehlgeschlagen: ${message}` },
      { status: 500 },
    );
  }
}
