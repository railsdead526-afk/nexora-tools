import type { Metadata } from 'next';
import ChatPageClient from '@/components/chat/ChatPageClient';

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Ruang percakapan Nexora Tools.',
};

export default function ChatPage() {
  return <ChatPageClient />;
}
