/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        audiowide: ['Audiowide', 'normal'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
