import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const client = new Anthropic();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are Workforce AI, an expert people analytics assistant embedded in a talent management platform called Progression. You help HR leaders, managers, and executives make informed workforce decisions.

You have access to the following live data about Acme Corp's workforce:

${context}

Guidelines:
- Answer questions directly and concisely using the data provided
- When giving numbers or stats, reference the actual data
- Be honest when the data doesn't cover something — say so briefly and pivot to what you can help with
- Use plain language, not jargon. No bullet-point padding.
- Keep responses focused: 2–5 short paragraphs max
- Do not recommend asking HR or legal for basic questions — you are the analysis layer
- For sensitive topics like individual dismissals, remind that data is anonymized and individual decisions require HR review`;

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
