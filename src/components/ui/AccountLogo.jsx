import { useState } from 'react';
import { getAccountBankData } from '@/lib/accountLogo';

/**
 * Shared component untuk menampilkan logo rekening secara konsisten.
 * Prioritas: account.icon (custom upload) → bank logo → initial letter
 */
export default function AccountLogo({ account, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  if (!account) return null;

  const bankData = getAccountBankData(account);
  const color = account.color || bankData?.color || '#0D4F6D';
  const logoSrc = (account.icon && account.icon.startsWith('http')) ? account.icon : bankData?.logo;
  const initial = (account.name || '?')[0].toUpperCase();

  const containerStyle = {
    width: size, height: size,
    background: '#ffffff',
    border: `1.5px solid ${color}40`,
    boxShadow: `0 2px 8px ${color}25`,
    borderRadius: Math.round(size * 0.28),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  };

  if (logoSrc && !imgError) {
    return (
      <div style={containerStyle}>
        <img
          src={logoSrc}
          alt={account.name}
          style={{ width: '85%', height: '85%', objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
      <span style={{ fontSize: size * 0.38, color: '#fff', fontWeight: 700, lineHeight: 1 }}>{initial}</span>
    </div>
  );
}