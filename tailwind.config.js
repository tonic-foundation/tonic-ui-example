const { emerald, red } = require('tailwindcss/colors');
const colors = require('tailwindcss/colors');

// shut up warnings
delete colors['lightBlue'];
delete colors['warmGray'];
delete colors['trueGray'];
delete colors['coolGray'];
delete colors['blueGray'];

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        primary: ['Lexend', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        number: ['Lato', 'monospace'],
        logo: ['Lexend', 'sans-serif'],
      },
      colors: {
        ...colors,
        up: {
          DEFAULT: emerald[300],
          light: emerald[100],
          dark: emerald[400],
          extraDark: emerald[500],
        },
        down: {
          DEFAULT: red[400],
          light: red[200],
          dark: red[500],
          extraDark: red[600],
        },
      },
    },
  },
  plugins: [],
};
