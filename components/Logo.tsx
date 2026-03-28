export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Crescent Moon (Dark Blue) */}
      <path d="M100 20 C 50 20, 20 50, 20 100 C 20 150, 50 180, 100 180 C 140 180, 160 150, 160 100 C 160 50, 140 20, 100 20 Z" fill="#1e3a8a" />
      
      {/* Owl Body (Light Cream) */}
      <path d="M100 50 C 70 50, 60 80, 60 120 C 60 150, 80 170, 100 170 C 120 170, 140 150, 140 120 C 140 80, 130 50, 100 50 Z" fill="#fef3c7" />
      
      {/* Eyes (Yellow) */}
      <circle cx="85" cy="90" r="15" fill="#fbbf24" />
      <circle cx="115" cy="90" r="15" fill="#fbbf24" />
      
      {/* N/Z Integration */}
      <text x="50" y="190" fontFamily="sans-serif" fontSize="30" fontWeight="bold" fill="white">N/Z</text>
    </svg>
  );
}
