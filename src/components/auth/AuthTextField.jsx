import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AuthTextField({ id, label, icon: Icon, hint, ...inputProps }) {
  return (
    <div className="ex-auth-field">
      <Label htmlFor={id}>{label}</Label>
      <div className="ex-auth-input">
        {Icon && <Icon size={17} />}
        <Input id={id} {...inputProps} />
      </div>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}