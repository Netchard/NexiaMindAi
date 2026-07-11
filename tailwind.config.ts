import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: "#10b981",
        // Identité sombre de la maquette de référence (docs/Maquette-ux-NexiaMind AI.html)
        // (voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04/DESIGN.md)
        // Thème unique (plus de variante claire/`dark:`) — surface-card est le fond
        // *recessé* des champs de saisie (plus sombre que `surface`, le panneau).
        auth: {
          primary: '#F4693F',
          'primary-hover': '#FF845E',
          'primary-active': '#E64F2B',
          'on-primary': '#FFFFFF',
          'accent-blue-from': '#5B8DEF',
          'accent-blue-to': '#2F66DF',
          ink: '#EEF2F8',
          'ink-strong': '#F2F5FA',
          'ink-muted': '#B7C3D6',
          'ink-subtle': '#8D9CB5',
          'ink-faint': '#647697',
          'ink-ghost': '#4F627E',
          surface: '#0E1B2E',
          'surface-radial-from': '#12233D',
          'surface-page': '#0A1524',
          'surface-card': '#0A1524',
          border: '#2C3E5C',
          'border-panel': '#223350',
          ring: 'rgba(244, 105, 63, .15)',
          error: '#FF5A46',
          'error-soft': '#FF7A68',
          'error-surface': 'rgba(255, 90, 70, .1)',
          'error-border': 'rgba(255, 90, 70, .4)',
          success: '#2F9E6A',
          'success-surface': 'rgba(47, 158, 106, .1)',
          'success-border': 'rgba(47, 158, 106, .4)',
          'blob-teal': '#2EE6D6',
          'blob-orange': '#F4693F',
          'blob-violet': '#7C3AED',
        },
        // Palette de l'interface de chat + app-shell global (header/nav/avatar)
        // (voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md)
        // Mêmes valeurs que `auth` mais namespace séparé — DESIGN.md du chat est
        // un fichier indépendant du spine auth, ne pas coupler les deux surfaces.
        chat: {
          primary: '#F4693F',
          'primary-hover': '#FF845E',
          'primary-active': '#E64F2B',
          'on-primary': '#FFFFFF',
          ink: '#EEF2F8',
          'ink-strong': '#F2F5FA',
          'ink-muted': '#B7C3D6',
          'ink-subtle': '#8D9CB5',
          'ink-faint': '#647697',
          surface: '#0A1524',
          'surface-header': '#0C1829',
          'surface-panel': '#0E1B2E',
          'surface-card': '#0A1524',
          // Survol des items interactifs (conversations, actions de menu) — même
          // teinte corail translucide que suggested-prompt-chip.hoverBackground
          // (DESIGN.md), réutilisée pour rester cohérent avec le seul hover
          // déjà documenté sur cette surface (ST-306).
          'surface-hover': 'rgba(244,105,63,.08)',
          border: '#2C3E5C',
          'border-soft': '#2A3B58',
          'border-header': '#1C2A42',
          'border-panel': '#1F2E48',
          'nav-active': '#182842',
          ring: '#F4693F',
          error: '#FF5A46',
          'error-soft': '#FF7A68',
          'error-surface': 'rgba(255, 90, 70, .1)',
          'error-border': 'rgba(255, 90, 70, .4)',
          'assistant-bg': '#E9EEF6',
          'assistant-text': '#17233A',
          'dot-muted': '#9AA7BD',
        },
      },
      fontFamily: {
        display: ['var(--font-newsreader)', 'Georgia', 'serif'],
      },
      borderRadius: {
        'auth-sm': '9px',
        'auth-md': '13px',
        'auth-lg': '14px',
        'auth-xl': '26px',
        'chat-sm': '9px',
        'chat-md': '13px',
        'chat-lg': '14px',
        'chat-xl': '20px',
      },
      keyframes: {
        nmFloat1: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(6%,-5%) scale(1.12)' } },
        nmFloat2: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(-7%,6%) scale(1.15)' } },
        nmFloat3: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(5%,7%) scale(1.1)' } },
      },
      animation: {
        nmFloat1: 'nmFloat1 14s ease-in-out infinite',
        nmFloat2: 'nmFloat2 17s ease-in-out infinite',
        nmFloat3: 'nmFloat3 19s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;