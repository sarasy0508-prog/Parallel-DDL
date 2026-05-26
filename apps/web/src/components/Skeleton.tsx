export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-[shimmer_1.6s_infinite] bg-[length:200%_100%] bg-[linear-gradient(90deg,#EFEEE8_25%,#F8F7F2_50%,#EFEEE8_75%)] rounded ${className}`}
    />
  );
}
