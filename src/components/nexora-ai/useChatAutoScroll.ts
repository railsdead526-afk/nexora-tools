'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useChatAutoScroll<T>(items: T[], activeKey: string, enabled = true) {
  const scrollRef = useRef<HTMLElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const [showLatest, setShowLatest] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const onScroll = () => {
      const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
      const atBottom = distance < 80;
      shouldFollowRef.current = atBottom;
      setShowLatest(!atBottom);
    };

    element.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => element.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!enabled || !shouldFollowRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [items, activeKey, enabled]);

  const scrollToLatest = useCallback(() => {
    shouldFollowRef.current = true;
    setShowLatest(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const resumeFollowing = useCallback(() => {
    shouldFollowRef.current = true;
    setShowLatest(false);
  }, []);

  return { scrollRef, bottomRef, showLatest, scrollToLatest, resumeFollowing };
}
