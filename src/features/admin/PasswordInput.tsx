import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './UsersPage.module.scss';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/** Password input with a show / hide toggle. */
export function PasswordInput({ value, onChange, ...aria }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.passwordRow}>
      <input
        {...aria}
        className="input"
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className={styles.iconBtn}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
