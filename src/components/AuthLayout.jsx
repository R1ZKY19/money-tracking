import { useLanguage } from '@/lib/LanguageContext';
import ExecutiveAuthShell from '@/components/auth/ExecutiveAuthShell';

export default function AuthLayout({ children }) {
  const { language } = useLanguage();
  return <ExecutiveAuthShell mode="register" english={language === 'en'}>{children}</ExecutiveAuthShell>;
}

export const fieldStyle = () => ({});
export const primaryBtn = {};
export const accentBtn = {};