import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './mdx-components.tsx'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        audiowide: ['Audiowide', 'normal'],
      },
    },
  },
  plugins: [forms, typography],
};
