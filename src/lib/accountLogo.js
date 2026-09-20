/**
 * Utility untuk mendapatkan logo URL rekening secara konsisten di seluruh app.
 * Prioritas: custom icon (upload) → logo bank dari bankData → null
 */
import { getBankByName, BANKS } from '@/lib/bankData';

export function getAccountLogo(account) {
  if (!account) return null;
  // 1. Custom upload icon
  if (account.icon && account.icon.startsWith('http')) return account.icon;
  // 2. Bank logo dari nama
  const nameLower = account.name?.toLowerCase() || '';
  const bankData = getBankByName(account.name)
    || BANKS.find(b => nameLower === b.name.toLowerCase() || nameLower === b.fullName?.toLowerCase())
    || BANKS.find(b => b.name.length > 3 && nameLower.startsWith(b.name.toLowerCase()))
    || null;
  return bankData?.logo || null;
}

export function getAccountBankData(account) {
  if (!account) return null;
  const nameLower = account.name?.toLowerCase() || '';
  return getBankByName(account.name)
    || BANKS.find(b => nameLower === b.name.toLowerCase() || nameLower === b.fullName?.toLowerCase())
    || BANKS.find(b => b.name.length > 3 && nameLower.startsWith(b.name.toLowerCase()))
    || null;
}