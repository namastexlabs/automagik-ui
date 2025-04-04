import { NotFoundHandler } from '@/components/not-found-handler';

export default function NotFound() {
  return (
    <NotFoundHandler href="/chat">
      This agent could not be found.
    </NotFoundHandler>
  );
}
