'use client';

export default function AIThinkingIndicator() {
  return (
    <div className="inline-flex items-center gap-1.5 py-1" aria-label="NexoraAI sedang berpikir" role="status">
      <span className="h-1.5 w-1.5 animate-[nexora-wave_1.35s_ease-in-out_infinite] rounded-full bg-[#8b6ccf]" />
      <span className="h-1.5 w-1.5 animate-[nexora-wave_1.35s_ease-in-out_0.18s_infinite] rounded-full bg-[#b8a7df]" />
      <span className="h-1.5 w-1.5 animate-[nexora-wave_1.35s_ease-in-out_0.36s_infinite] rounded-full bg-[#d88957]" />
      <style jsx>{`@keyframes nexora-wave { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-4px); opacity: 1; } }`}</style>
    </div>
  );
}
