export interface Persona {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  color: string;
}

export interface UserProfile {
  name: string;
  interests: string[];
  customPersonas: Persona[];
}
