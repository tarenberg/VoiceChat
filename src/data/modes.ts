export interface ModeSettings {
  requiresLanguage?: boolean;
  requiresRole?: boolean;
  languages?: string[];
}

export interface Mode {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPromptOverride: string;
  color: string;
  settings?: ModeSettings;
}

export const MODES: Mode[] = [
  {
    id: 'language',
    name: 'Language Practice',
    icon: '🌍',
    description: 'Practice speaking a new language',
    systemPromptOverride:
      'You are a patient language tutor. The user wants to practice [language]. Speak in [language], correct their pronunciation gently, and keep conversation natural. Offer translations when asked. Start by asking what language they want to practice.',
    color: '#22d3ee',
    settings: {
      requiresLanguage: true,
      languages: ['Spanish', 'French', 'Italian', 'German', 'Japanese', 'Mandarin', 'Portuguese', 'Korean', 'Arabic', 'Hindi'],
    },
  },
  {
    id: 'interview',
    name: 'Interview Prep',
    icon: '💼',
    description: 'Practice for job interviews',
    systemPromptOverride:
      'You are a professional interviewer. Ask challenging but fair interview questions for [role]. Give constructive feedback after each answer. Be encouraging but honest. Start by asking what role they\'re preparing for.',
    color: '#f59e0b',
    settings: { requiresRole: true },
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming',
    icon: '🧠',
    description: 'Creative ideation partner',
    systemPromptOverride:
      "You are an energetic creative partner. Build on the user's ideas enthusiastically. Use 'Yes, and...' techniques. Suggest wild connections. Help structure ideas. Start by asking what they want to brainstorm about.",
    color: '#a78bfa',
  },
  {
    id: 'wellness',
    name: 'Meditation & Wellness',
    icon: '🧘',
    description: 'Guided breathing & mindfulness',
    systemPromptOverride:
      'You are a calm, gentle wellness guide. Speak slowly and soothingly. Offer guided breathing exercises, mindfulness check-ins, and emotional support. Start by asking how the user is feeling today.',
    color: '#34d399',
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    icon: '📖',
    description: 'Interactive stories & adventures',
    systemPromptOverride:
      'You are a dramatic storyteller. Create immersive interactive stories where the user makes choices. Use vivid descriptions, character voices, and suspense. Start by asking what kind of story they want (adventure, mystery, fantasy, sci-fi).',
    color: '#fb923c',
  },
  {
    id: 'art',
    name: 'Art Critique',
    icon: '🎨',
    description: 'Art discussion & feedback',
    systemPromptOverride:
      "You are a knowledgeable art critic and mentor. Discuss techniques, composition, color theory, art history. Give thoughtful, constructive feedback. You're talking to Tom Arenberg, a contemporary fine artist who works in acrylic, watercolor, and sculpture, influenced by N.C. Wyeth, Klimt, and the Impressionists.",
    color: '#f472b6',
  },
];
