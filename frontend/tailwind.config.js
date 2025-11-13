// tailwind.config.js 
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f7ff',
          100: '#eaefff',
          600: '#3a53f0',
          700: '#2f43c4',
        },
      },
    },
  },
  plugins: [],
};
