// Runs before paint to apply the persisted theme and avoid a flash of the
// wrong color scheme. Reads the same zustand-persist key used by useThemeStore.
const THEME_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('duka-janja-theme');
    var theme = raw ? JSON.parse(raw).state.theme : 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
}
