import { ErrorBoundary } from './components/ErrorBoundary';
import { FinanceApp } from './components/FinanceApp';

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceApp />
    </ErrorBoundary>
  );
}

