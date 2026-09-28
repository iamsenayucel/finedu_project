import { RouterProvider } from 'react-router';
import { router } from './routes';
import ChatBot from '../components/ChatBot';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ChatBot />
    </ErrorBoundary>
  );
}