import { Persona, UserProfile } from '../types';
import { DEFAULT_PERSONA_ID } from '../data/personas';

const KEYS = {
  profile: 'voicechat_profile',
  selectedPersona: 'voicechat_selected_persona',
};

const defaultProfile: UserProfile = {
  name: '',
  interests: [],
  customPersonas: [],
};

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(KEYS.profile);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultProfile };
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export function loadSelectedPersonaId(): string {
  return localStorage.getItem(KEYS.selectedPersona) || DEFAULT_PERSONA_ID;
}

export function saveSelectedPersonaId(id: string): void {
  localStorage.setItem(KEYS.selectedPersona, id);
}
