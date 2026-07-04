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
        // Palette de la refonte visuelle des pages d'authentification
        // (voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04/DESIGN.md)
        auth: {
          primary: '#EF6C4D',
          'primary-hover': '#E1552F',
          'primary-active': '#C8441F',
          'on-primary': '#FFFFFF',
          ink: '#1E2A3B',
          'ink-muted': '#6B7280',
          surface: '#FAFAFA',
          'surface-card': '#FFFFFF',
          border: '#E5E7EB',
          ring: '#F2A084',
          error: '#DC2626',
          'error-surface': '#FEF2F2',
          'error-border': '#FECACA',
          success: '#16A34A',
          'success-surface': '#F0FDF4',
          'gradient-cyan': '#5CE1E6',
          'gradient-pink': '#F472B6',
          'gradient-violet': '#6B2D5C',
          'gradient-coral': '#EF6C4D',
          scrim: 'rgba(30, 42, 59, 0.28)',
          'ink-dark': '#F1F5F9',
          'ink-muted-dark': '#94A3B8',
          'surface-dark': '#0F172A',
          'surface-card-dark': '#1E293B',
          'border-dark': '#334155',
          'ring-dark': '#F2A084',
          'error-dark': '#F87171',
          'error-surface-dark': 'rgba(220, 38, 38, 0.12)',
        },
        // Palette de l'interface de chat (ST-303)
        // (voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md)
        // Mêmes valeurs que `auth` mais namespace séparé — DESIGN.md du chat est
        // un fichier indépendant du spine auth, ne pas coupler les deux surfaces.
        chat: {
          primary: '#EF6C4D',
          'primary-hover': '#E1552F',
          'primary-active': '#C8441F',
          'on-primary': '#FFFFFF',
          ink: '#1E2A3B',
          'ink-muted': '#6B7280',
          surface: '#FAFAFA',
          'surface-card': '#FFFFFF',
          border: '#E5E7EB',
          ring: '#F2A084',
          error: '#DC2626',
          'error-surface': '#FEF2F2',
          'error-border': '#FECACA',
          'ink-dark': '#F1F5F9',
          'ink-muted-dark': '#94A3B8',
          'surface-dark': '#0F172A',
          'surface-card-dark': '#1E293B',
          'border-dark': '#334155',
          'ring-dark': '#F2A084',
          'error-dark': '#F87171',
          'error-surface-dark': 'rgba(220, 38, 38, 0.12)',
        },
      },
      borderRadius: {
        'auth-sm': '8px',
        'auth-md': '10px',
        'auth-lg': '16px',
        'auth-xl': '24px',
        'chat-sm': '8px',
        'chat-md': '10px',
        'chat-lg': '16px',
      },
    },
  },
  plugins: [],
};
export default config;