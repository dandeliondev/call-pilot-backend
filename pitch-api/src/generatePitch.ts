import OpenAI from 'openai'

export interface ScriptLineItem {
  shortcut: string
  text: string
  tag?: string
}

export interface ScriptCategory {
  id: string
  title: string
  items: ScriptLineItem[]
}

interface SegmentRaw {
  title: string
  lines: Array<{
    shortcut?: string
    text?: string
    tag?: string
  }>
}

interface ResponseRaw {
  segments?: SegmentRaw[]
}

const SYSTEM = `You are an expert outbound-call script writer. You respond with ONLY valid JSON (no markdown, no code fences).

The JSON must match this shape:
{
  "segments": [
    {
      "title": "Short section title the agent sees (e.g. Greeting, Introduction, Offer)",
      "lines": [
        { "shortcut": "0", "text": "What the agent says or cue text.", "tag": "[1]" }
      ]
    }
  ]
}

Rules:
- Decide how many segments (typically 2–5) and what to label them based ONLY on the user's campaign name and description. Examples: greeting/opening, company or product introduction, service value, donation tiers or pricing asks, closing/next step—include only what fits that campaign.
- Each "lines" entry is one speakable line or bullet for the agent. Keep lines concise for live calls.
- "shortcut" is a short key (digits like 0–9, 10, 11… or letters); unique within each segment.
- "tag" is optional; use "[1]" only when you want a variant marker like the user's reference UI.
- You may use placeholders like {{first_name}}, {{company}}, {{agent_name}} where natural.
- Output must be valid JSON: double quotes, no trailing commas.`

export async function generatePitchCategories(input: {
  name: string
  description: string
}): Promise<ScriptCategory[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const client = new OpenAI({ apiKey })

  const userMsg = `Campaign name: ${input.name.trim()}

Campaign description:
${input.description.trim()}

Generate the pitch script segments JSON as specified. Focus on pitch content only—no FAQs, rebuttals, or objection libraries.`

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userMsg },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65,
    max_tokens: 2000,
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('Empty response from model')

  let parsed: ResponseRaw
  try {
    parsed = JSON.parse(raw) as ResponseRaw
  } catch {
    throw new Error('Model returned non-JSON')
  }

  const segments = parsed.segments
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('Invalid segments array from model')
  }

  const categories: ScriptCategory[] = segments.map((seg, i) => {
    const title =
      typeof seg.title === 'string' && seg.title.trim()
        ? seg.title.trim()
        : `Segment ${i + 1}`
    const linesIn = Array.isArray(seg.lines) ? seg.lines : []
    const items: ScriptLineItem[] = linesIn.map((line, j) => {
      const text =
        typeof line.text === 'string' && line.text.trim()
          ? line.text.trim()
          : '(empty line)'
      const shortcut =
        typeof line.shortcut === 'string' && line.shortcut.trim()
          ? line.shortcut.trim()
          : String(j)
      const tag =
        typeof line.tag === 'string' && line.tag.trim()
          ? line.tag.trim()
          : undefined
      return tag ? { shortcut, text, tag } : { shortcut, text }
    })

    return {
      id: `pitch-${i}`,
      title,
      items: items.length > 0 ? items : [{ shortcut: '0', text: '(no lines)' }],
    }
  })

  return categories
}
