export type ThemeId =
  'midnight' | 'beast' | 'royale' | 'sakura' |
  'pixel'    | 'hustle' | 'vitality'

export interface ThemeConfig {
  id:       ThemeId
  name:     string
  emoji:    string
  tagline:  string
  accent:   string
  bg:       string
  surface:  string
}

export const THEMES: ThemeConfig[] = [
  { id:'midnight', name:'Midnight',   emoji:'🌙',
    tagline:'Dark hacker mode',
    accent:'#7c6af7', bg:'#0c0c11', surface:'#111116' },
  { id:'beast',    name:'Beast Mode', emoji:'💪',
    tagline:'No excuses. Pure grind.',
    accent:'#ef4444', bg:'#080808', surface:'#0f0f0f' },
  { id:'royale',   name:'Royale',     emoji:'👑',
    tagline:'You are the main character.',
    accent:'#d4af37', bg:'#0d0a0e', surface:'#130f1a' },
  { id:'sakura',   name:'Sakura',     emoji:'🌸',
    tagline:'Soft vibes, hard work!! 💕',
    accent:'#f472b6', bg:'#160d1e', surface:'#1f1228' },
  { id:'pixel',    name:'Pixelcraft', emoji:'⛏️',
    tagline:'PRESS START TO GRIND',
    accent:'#4ade80', bg:'#0d0d0d', surface:'#1a1a1a' },
  { id:'hustle',   name:'Hustle',     emoji:'💼',
    tagline:'Ship it. Measure it. Repeat.',
    accent:'#3b82f6', bg:'#0a0e1a', surface:'#0f1729' },
  { id:'vitality', name:'Vitality',   emoji:'🌿',
    tagline:'Grow through what you go through.',
    accent:'#22c55e', bg:'#0a1512', surface:'#0f1e18' },
]
export default THEMES;
