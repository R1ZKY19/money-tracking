// Cute cat illustrations as SVG for decorative use
export const CatSaving = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <circle cx="60" cy="65" r="30" fill="#AFCFBE" />
    <circle cx="60" cy="62" r="28" fill="#F4EFE5" />
    {/* Ears */}
    <polygon points="38,42 44,28 52,42" fill="#AFCFBE" />
    <polygon points="68,42 76,28 82,42" fill="#AFCFBE" />
    <polygon points="40,42 44,32 50,42" fill="#EC4899" opacity="0.5" />
    <polygon points="70,42 76,32 80,42" fill="#EC4899" opacity="0.5" />
    {/* Face */}
    <circle cx="50" cy="58" r="4" fill="#0B5D75" />
    <circle cx="70" cy="58" r="4" fill="#0B5D75" />
    <circle cx="51.5" cy="56.5" r="1.5" fill="white" />
    <circle cx="71.5" cy="56.5" r="1.5" fill="white" />
    {/* Nose */}
    <ellipse cx="60" cy="65" rx="3" ry="2" fill="#EC4899" opacity="0.7" />
    {/* Whiskers */}
    <line x1="30" y1="64" x2="52" y2="66" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <line x1="30" y1="68" x2="52" y2="68" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <line x1="68" y1="66" x2="90" y2="64" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <line x1="68" y1="68" x2="90" y2="68" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    {/* Smile */}
    <path d="M55 70 Q60 75 65 70" stroke="#0B5D75" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Piggy bank */}
    <ellipse cx="60" cy="100" rx="22" ry="16" fill="#78A898" />
    <rect x="56" y="84" width="8" height="4" rx="2" fill="#0B5D75" />
    <circle cx="76" cy="96" r="4" fill="#AFCFBE" />
    <line x1="52" y1="112" x2="48" y2="118" stroke="#0B5D75" strokeWidth="3" strokeLinecap="round" />
    <line x1="60" y1="114" x2="60" y2="120" stroke="#0B5D75" strokeWidth="3" strokeLinecap="round" />
    <line x1="68" y1="112" x2="72" y2="118" stroke="#0B5D75" strokeWidth="3" strokeLinecap="round" />
    <text x="56" y="102" fontSize="10" fill="white" fontWeight="bold">₿</text>
  </svg>
);

export const CatBudget = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <circle cx="60" cy="62" r="28" fill="#F4EFE5" />
    {/* Ears */}
    <polygon points="38,42 44,28 52,42" fill="#78A898" />
    <polygon points="68,42 76,28 82,42" fill="#78A898" />
    <polygon points="40,42 44,32 50,42" fill="#EC4899" opacity="0.5" />
    <polygon points="70,42 76,32 80,42" fill="#EC4899" opacity="0.5" />
    {/* Face */}
    <circle cx="50" cy="58" r="4" fill="#0B5D75" />
    <circle cx="70" cy="58" r="4" fill="#0B5D75" />
    <circle cx="51.5" cy="56.5" r="1.5" fill="white" />
    <circle cx="71.5" cy="56.5" r="1.5" fill="white" />
    <ellipse cx="60" cy="65" rx="3" ry="2" fill="#EC4899" opacity="0.7" />
    <line x1="30" y1="64" x2="52" y2="66" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <line x1="68" y1="66" x2="90" y2="64" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <path d="M55 70 Q60 75 65 70" stroke="#0B5D75" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Clipboard */}
    <rect x="32" y="82" width="56" height="34" rx="4" fill="#AFCFBE" />
    <rect x="48" y="78" width="24" height="8" rx="4" fill="#0B5D75" />
    <rect x="38" y="92" width="44" height="3" rx="1.5" fill="#78A898" />
    <rect x="38" y="99" width="34" height="3" rx="1.5" fill="#78A898" />
    <rect x="38" y="106" width="24" height="3" rx="1.5" fill="#78A898" />
    <rect x="72" y="99" width="10" height="3" rx="1.5" fill="#0B5D75" />
    <rect x="62" y="106" width="16" height="3" rx="1.5" fill="#10B981" />
  </svg>
);

export const CatMoney = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <circle cx="60" cy="60" r="28" fill="#F4EFE5" />
    <polygon points="38,42 44,28 52,42" fill="#AFCFBE" />
    <polygon points="68,42 76,28 82,42" fill="#AFCFBE" />
    <polygon points="40,42 44,32 50,42" fill="#EC4899" opacity="0.5" />
    <polygon points="70,42 76,32 80,42" fill="#EC4899" opacity="0.5" />
    <circle cx="50" cy="56" r="4" fill="#0B5D75" />
    <circle cx="70" cy="56" r="4" fill="#0B5D75" />
    <circle cx="51.5" cy="54.5" r="1.5" fill="white" />
    <circle cx="71.5" cy="54.5" r="1.5" fill="white" />
    <ellipse cx="60" cy="63" rx="3" ry="2" fill="#EC4899" opacity="0.7" />
    <line x1="30" y1="62" x2="52" y2="64" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <line x1="68" y1="64" x2="90" y2="62" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <path d="M55 68 Q60 73 65 68" stroke="#0B5D75" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Coins */}
    <circle cx="40" cy="95" r="12" fill="#F59E0B" />
    <circle cx="40" cy="95" r="9" fill="#FCD34D" />
    <text x="36" y="99" fontSize="11" fill="#92400E" fontWeight="bold">$</text>
    <circle cx="65" cy="98" r="10" fill="#F59E0B" />
    <circle cx="65" cy="98" r="7.5" fill="#FCD34D" />
    <text x="62" y="101" fontSize="9" fill="#92400E" fontWeight="bold">$</text>
    <circle cx="87" cy="93" r="11" fill="#F59E0B" />
    <circle cx="87" cy="93" r="8.5" fill="#FCD34D" />
    <text x="83" y="97" fontSize="10" fill="#92400E" fontWeight="bold">$</text>
  </svg>
);

export const CatDebt = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
    <circle cx="60" cy="60" r="28" fill="#F4EFE5" />
    <polygon points="38,40 44,26 52,40" fill="#AFCFBE" />
    <polygon points="68,40 76,26 82,40" fill="#AFCFBE" />
    <polygon points="40,40 44,30 50,40" fill="#EC4899" opacity="0.5" />
    <polygon points="70,40 76,30 80,40" fill="#EC4899" opacity="0.5" />
    {/* Worried eyes */}
    <ellipse cx="50" cy="56" rx="4" ry="4.5" fill="#0B5D75" />
    <ellipse cx="70" cy="56" rx="4" ry="4.5" fill="#0B5D75" />
    <circle cx="51.5" cy="54.5" r="1.5" fill="white" />
    <circle cx="71.5" cy="54.5" r="1.5" fill="white" />
    {/* Worried brows */}
    <path d="M46 49 Q50 46 54 49" stroke="#0B5D75" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M66 49 Q70 46 74 49" stroke="#0B5D75" strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="60" cy="63" rx="3" ry="2" fill="#EC4899" opacity="0.7" />
    <line x1="30" y1="62" x2="52" y2="63" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    <line x1="68" y1="63" x2="90" y2="62" stroke="#0B5D75" strokeWidth="1" opacity="0.4" />
    {/* Sad mouth */}
    <path d="M55 70 Q60 66 65 70" stroke="#0B5D75" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
    {/* Calendar with debt */}
    <rect x="35" y="84" width="50" height="32" rx="4" fill="#FEE2E2" />
    <rect x="35" y="84" width="50" height="10" rx="4" fill="#EF4444" />
    <text x="48" y="93" fontSize="8" fill="white" fontWeight="bold">DUE DATE</text>
    <text x="42" y="108" fontSize="14" fill="#EF4444" fontWeight="bold">!</text>
    <text x="54" y="108" fontSize="10" fill="#0B5D75">Hutang</text>
  </svg>
);

export default CatSaving;