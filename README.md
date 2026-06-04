# Cold Email Generator

Web-App zum Erstellen personalisierter Cold Emails mit der OpenAI API. Du gibst deinen Namen, deine Firma und eine Beschreibung des Empfängers ein – die KI generiert Betreff und Nachrichtentext auf Deutsch.

## Voraussetzungen

- [Node.js](https://nodejs.org/) 18 oder neuer
- Ein [OpenAI API Key](https://platform.openai.com/api-keys)

## Installation

```bash
npm install
```

## Konfiguration

1. `.env.example` nach `.env.local` kopieren:

   ```bash
   copy .env.example .env.local
   ```

   (macOS/Linux: `cp .env.example .env.local`)

2. In `.env.local` deinen API-Schlüssel eintragen:

   ```
   OPENAI_API_KEY=sk-...
   ```

Der Schlüssel wird nur serverseitig in der API-Route verwendet und erscheint nicht im Browser.

## Entwicklung starten

```bash
npm run dev
```

Die App läuft unter [http://localhost:3000](http://localhost:3000).

## Produktion

```bash
npm run build
npm start
```

## Projektstruktur

| Pfad | Beschreibung |
|------|--------------|
| `app/page.tsx` | Startseite |
| `components/ColdEmailGenerator.tsx` | Formular und Ergebnisanzeige |
| `app/api/generate/route.ts` | OpenAI-Anbindung (POST) |

## Technologie

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [OpenAI Node SDK](https://github.com/openai/openai-node)
