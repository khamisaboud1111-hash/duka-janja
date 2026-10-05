// Runs before paint to apply the persisted theme and avoid a flash of the
// wrong color scheme. Reads the same zustand-persist key used by useThemeStore.
const THEME_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('duka-janja-theme');
    var theme = raw ? JSON.parse(raw).state.theme : 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {
    // Silently fail - theme will be applied after hydration
  }
})();

// Global error handler to catch unhandled errors
(function () {
  var originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', message, source, lineno, colno, error);
    // Call original handler if exists
    if (originalOnError) {
      return originalOnError.apply(this, arguments);
    }
    return false;
  };

  var originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event) {
    console.error('Unhandled rejection caught:', event.reason);
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.apply(this, arguments);
    }
    return false;
  };
})();
`

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
}