/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          // Neutral
          'overlay':     '#1E2532',
          'navy':        '#1D264A',
          'secondary':   '#5E6580',
          'accent-gray': '#7B8197',
          'mid-gray':    '#9A9FB0',
          'action':      '#BEC4D5',
          'radio':       '#D9DEEB',
          'border':      '#E7EAF4',
          'nav-hover':   '#EFF2F9',
          'bg-light':    '#F7F9FC',
          'white':       '#FFFFFF',
          // Blue
          'blue-text':   '#123F73',
          'blue':        '#0374CE',
          'blue-accent': '#57AFF5',
          'blue-light':  '#96CEFA',
          'blue-bg':     '#C2E4FE',
          'blue-bg2':    '#D7EEFF',
          'blue-bg3':    '#EAF6FF',
          'blue-bg4':    '#F3FAFF',
          // Green
          'green-text':  '#277078',
          'green':       '#2E9E5D',
          'green-success':'#509887',
          'green-accent':'#76B0B6',
          'green-light': '#96CACC',
          'green-bg':    '#B0DFDD',
          'green-bg2':   '#C6E8E6',
          'green-bg3':   '#DAF0EF',
          'green-bg4':   '#EDF8F7',
          'green-hover': '#1F7A45',
          'green-action':'#39C674',
          // Orange
          'error':       '#E42309',
          'orange':      '#FF6737',
          'orange-2':    '#FF7E45',
          'orange-bg':   '#FF934F',
          'orange-light':'#FDB88C',
          'orange-bg2':  '#FCD7BF',
          'orange-bg3':  '#FFF0E5',
          'orange-bg4':  '#FFFCFA',
          // Beige
          'beige':       '#684A33',
          'beige-2':     '#886952',
          'beige-accent':'#AE9684',
          'beige-light': '#CFC1B6',
          'beige-bg':    '#E6DDD7',
          'beige-bg2':   '#F1ECE8',
          'beige-bg3':   '#F6F2EF',
          'beige-bg4':   '#FAF7F5',
          // Slate
          'slate':       '#3C5F88',
          'slate-2':     '#6B89AE',
          'slate-light': '#9BB5D5',
        },
      },
    },
  },
  plugins: [],
};
