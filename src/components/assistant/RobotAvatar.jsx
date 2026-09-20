// Robot maskot gemes untuk tombol asisten AI — animasi mengambang, mata berkedip, antena berdenyut.
export default function RobotAvatar({ size = 40, waving = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={waving ? 'robot-bob' : ''}>
      <g className="robot-antenna">
        <line x1="32" y1="10" x2="32" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="8" r="3.4" fill="#65BCE2" className="robot-blip" />
      </g>
      <rect x="12" y="17" width="40" height="31" rx="12" fill="#1683B8" />
      <rect x="16" y="21" width="32" height="20" rx="9" fill="#0B1623" />
      <circle cx="25" cy="31" r="3.6" fill="#65BCE2" className="robot-eye" />
      <circle cx="39" cy="31" r="3.6" fill="#65BCE2" className="robot-eye" />
      <path d="M28 37.5c1.6 1.6 6.8 1.6 8.4 0" stroke="#65BCE2" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="6" y="28" width="5" height="11" rx="2.5" fill="#65BCE2" className="robot-arm" />
      <rect x="53" y="28" width="5" height="11" rx="2.5" fill="#65BCE2" />
      <rect x="22" y="48" width="20" height="6" rx="3" fill="#0F5F86" />
      <style>{`
        .robot-bob { animation: robotBob 2.6s ease-in-out infinite; }
        .robot-blip { animation: robotBlip 1.6s ease-in-out infinite; }
        .robot-eye { animation: robotBlink 4s ease-in-out infinite; transform-origin: center; }
        .robot-arm { animation: robotWave 2.2s ease-in-out infinite; transform-origin: 8px 39px; }
        @keyframes robotBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
        @keyframes robotBlip { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes robotBlink { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(.15); } }
        @keyframes robotWave { 0%,100% { transform: rotate(0deg); } 45% { transform: rotate(-26deg); } }
        @media (prefers-reduced-motion: reduce) {
          .robot-bob, .robot-blip, .robot-eye, .robot-arm { animation: none; }
        }
      `}</style>
    </svg>
  );
}