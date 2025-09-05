/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  important: true,
  theme: {
    extend: {
      animation: {
        'gentle-pulse': 'gentle-pulse 2s ease-in-out infinite',
        'pulse-pop': 'pulse-pop 1.5s ease-in-out infinite',
        'modal-appear': 'modal-appear 0.5s ease-out',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        'pulse-pop': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'modal-appear': {
          'from': { 
            opacity: '0', 
            transform: 'translateY(30px) scale(0.9)' 
          },
          'to': { 
            opacity: '1', 
            transform: 'translateY(0) scale(1)' 
          },
        },
      },
    },
  },
  plugins: [],
}