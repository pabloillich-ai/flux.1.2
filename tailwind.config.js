/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', /* slate-950 */
        sidebar: '#1e293b',    /* slate-800 */
        card: '#334155',       /* slate-700 */
        accent: '#38bdf8',     /* sky-400 */
        text: {
          main: '#f8fafc',     /* slate-50 */
          muted: '#94a3b8'     /* slate-400 */
        }
      }
    },
  },
  plugins: [],
}
