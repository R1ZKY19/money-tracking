import ExecutiveAuthShell from '@/components/auth/ExecutiveAuthShell';

export default function LoginLayout({ children, english = false }) {
  return <ExecutiveAuthShell mode="login" english={english}>{children}</ExecutiveAuthShell>;
}