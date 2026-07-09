import { RouterProvider } from 'react-router';
import { router } from './routes';
import ChatBot from '../components/ChatBot';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ChatBot />
    </>
  );
}