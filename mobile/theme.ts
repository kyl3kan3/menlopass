/* The native shell wears the same system as the web app (styles.css):
   paper and ink, one vermilion for the thing to do next, rules instead of
   cards, Fraunces for display and Instrument Sans for the UI. The fonts are
   embedded by the expo-font config plugin (app.json), so they are available
   by PostScript name from the first frame without an async load. */
import { Platform } from 'react-native';

export const color = {
  paper: '#fbfbf9',
  ink: '#0c0c0d',
  grey: '#5f6066',
  grey2: '#8a8b91',
  rule: '#dad9d4',
  ruleLight: '#e6e5e0',
  tint: '#efeee9',
  vermilion: '#d13a16',
  vermilionText: '#c23412',
  vermilionSoft: '#fbe9e3',
  night: '#000000',
  nightInk: '#f3f2ee',
  nightGrey: '#9a9ba1',
  nightRule: '#2a2a2e',
} as const;

const embedded = Platform.OS === 'ios' || Platform.OS === 'android';

export const font = {
  serif: embedded ? 'Fraunces72pt-Regular' : 'Georgia',
  serifSemi: embedded ? 'Fraunces72pt-SemiBold' : 'Georgia',
  serifItalic: embedded ? 'Fraunces72pt-Italic' : 'Georgia',
  sans: embedded ? 'InstrumentSans-Regular' : 'System',
  sansMedium: embedded ? 'InstrumentSans-Medium' : 'System',
  sansSemi: embedded ? 'InstrumentSans-SemiBold' : 'System',
} as const;

/* Type scale shared by every native screen. Sizes match the web app. */
export const type = {
  wordmark: { fontFamily: font.serifItalic, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: color.ink },
  eyebrow: { fontFamily: font.sansMedium, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' as const, color: color.grey },
  display: { fontFamily: font.serif, fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: color.ink },
  title: { fontFamily: font.serif, fontSize: 24, lineHeight: 28, letterSpacing: -0.3, color: color.ink },
  body: { fontFamily: font.sans, fontSize: 16, lineHeight: 24, color: color.ink },
  bodyMuted: { fontFamily: font.sans, fontSize: 15, lineHeight: 22, color: color.grey },
  small: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: color.grey },
  label: { fontFamily: font.sansMedium, fontSize: 14, lineHeight: 18, color: color.ink },
  button: { fontFamily: font.sansMedium, fontSize: 15, lineHeight: 20, color: color.paper },
} as const;
