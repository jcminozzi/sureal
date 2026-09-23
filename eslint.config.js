import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.npm-cache', 'src/layouts', 'src/context', 'src/hooks', 'src/utils', 'src/components/AdvancedDashboard.jsx', 'src/components/CommonComponents.jsx', 'src/components/ReportsModal.jsx', 'src/components/AddCardModal.tsx', 'src/components/DayDetailsModal.tsx', 'src/components/GastinhosInsights.tsx', 'src/components/SmartTips.tsx', 'src/components/SubscriptionModal.tsx', 'src/components/UnifiedTransactionForm.tsx', 'src/components/WelcomeModal.tsx', 'src/types/api.ts', 'src/types/components.ts', 'src/types/hooks.ts', 'src/types/utils.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.js', 'netlify/functions/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
