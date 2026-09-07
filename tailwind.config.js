/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Vollständig gesetzt statt über `extend`: ein kleinerer Haltepunkt landet dort am
    // Ende der Liste, und die Reihenfolge entscheidet, welche Regel gewinnt.
    // `xs` liegt bei 420 px, weil eine Kampfwert-Kachel 160 px braucht und zwei Spalten
    // damit erst ab 412 px Fensterbreite passen.
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        // Pergament-Farbpalette (Erdtöne + Bronze/Gold)
        parchment: {
          50: '#fdfbf7',
          100: '#f6f1e8',
          200: '#e8dac5',
          300: '#d4bd9a',
          400: '#b8976b',  // Pergament
          500: '#9d7a4a',  // Bronze
          600: '#7d5e34',  // Dunkles Bronze
          700: '#5e4527',  // Leder
          800: '#3f2e1b',  // Dunkelbraun
          900: '#2a1f13',  // Fast Schwarz
        },
        
        // Magie-Farben
        magic: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#6d28d9',
        },

        // Karma-Farben – himmelblau, die einzige freie Hue-Familie neben Bronze,
        // Violett und dem Krit-Bernstein
        karma: {
          DEFAULT: '#4f83cc',
          light: '#8fb3e8',
          dark: '#2f5da8',
        },
        
        // Erfolg/Fehler einheitlich
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        failure: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        critical: {
          DEFAULT: '#fbbf24',
          light: '#fcd34d',
          dark: '#f59e0b',
        },
        
        // Shadcn Theme Variablen
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(139, 92, 246, 0.3)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-lg': '0 0 30px rgba(139, 92, 246, 0.5)',
        'success': '0 0 20px rgba(16, 185, 129, 0.4)',
        'failure': '0 0 20px rgba(239, 68, 68, 0.4)',
        'critical': '0 0 20px rgba(251, 191, 36, 0.4)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 2px currentColor)' },
          '50%': { filter: 'drop-shadow(0 0 8px currentColor)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '50%': { transform: 'translateX(6px)' },
          '75%': { transform: 'translateX(-3px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}