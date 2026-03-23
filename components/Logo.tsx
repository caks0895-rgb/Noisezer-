import { cn } from '@/lib/utils';

export function NoisezerLogo({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-12 h-12 flex items-center justify-center", className)}>
      {/* Outer ring (clock-like) */}
      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30"></div>
      <div className="absolute inset-1 rounded-full border border-indigo-500/10"></div>
      
      {/* Abstract 'N' with time-like elements */}
      <div className="relative w-6 h-6">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500 origin-left rotate-45"></div>
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-indigo-500 origin-right rotate-45"></div>
        <div className="absolute top-0 right-0 w-0.5 h-full bg-indigo-500 origin-top -rotate-45"></div>
      </div>
      
      {/* 'Time' tick */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-indigo-500 rounded-full"></div>
    </div>
  );
}
