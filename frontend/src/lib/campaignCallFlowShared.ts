import type {
  AgentSoundboardBundle,
  RegenerableSoundboardSection,
  SoundboardPanel,
} from '../types/app'

export const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
  'Europe/London',
] as const

/** Section order aligned with agent soundboard UI (same as create wizard). */
export const CALL_FLOW_SECTIONS: { id: RegenerableSoundboardSection; heading: string }[] = [
  { id: 'intro', heading: 'Introduction' },
  { id: 'pitch', heading: 'Pitch' },
  { id: 'rebuttals', heading: 'Rebuttals' },
  { id: 'faqs', heading: 'FAQs' },
  { id: 'conversation', heading: 'Conversation fillers' },
  { id: 'closing', heading: 'Closing' },
  { id: 'dispositions', heading: 'Dispositions' },
  { id: 'pageMessages', heading: 'Page / hold messages' },
  { id: 'dtmf', heading: 'DTMF' },
]

export function updateSoundboardLine(
  bundle: AgentSoundboardBundle,
  section: RegenerableSoundboardSection,
  index: number,
  text: string,
): AgentSoundboardBundle {
  const panel = bundle[section] as SoundboardPanel | undefined
  if (!panel?.items[index]) return bundle
  const items = panel.items.map((line, i) => (i === index ? { ...line, text } : line))
  return { ...bundle, [section]: { ...panel, items } } as AgentSoundboardBundle
}
