import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { roleLabel } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Card, Field, PageHeader } from '../../components/ui/Layout';
import { useToast } from '../../components/ui/ToastProvider';

export function AccountPage() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setFullName(profile?.full_name ?? ''), [profile?.full_name]);

  if (!profile) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = fullName.trim();
    if (!name) return setError('Enter your full name.');
    if (name.length > 120) return setError('Keep it under 120 characters.');
    setError(null);
    setSaving(true);
    // Only full_name is updatable by users (column-level grant). Role is not.
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save', friendlyError(error));
      return;
    }
    await refreshProfile();
    toast.success('Profile updated');
  };

  return (
    <>
      <PageHeader title="Account" subtitle="Your profile details." />
      <div className="stack" style={{ maxWidth: 560 }}>
        <Card title="Profile">
          <form className="stack" onSubmit={handleSubmit} noValidate>
            <Field label="Full name" required error={error}>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Email" hint="Contact an administrator to change your email.">
              <input className="input" value={profile.email} disabled />
            </Field>
            <Field label="Role" hint="Roles are assigned by an administrator.">
              <input className="input" value={roleLabel[profile.role]} disabled />
            </Field>
            <div>
              <Button type="submit" loading={saving} disabled={fullName.trim() === profile.full_name}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
        <ChangePasswordCard email={profile.email} />
      </div>
    </>
  );
}

type PwErrors = Partial<Record<'current' | 'next' | 'confirm', string>>;

function ChangePasswordCard({ email }: { email: string }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<PwErrors>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: PwErrors = {};
    if (!current) errs.current = 'Enter your current password.';
    if (next.length < 8) errs.next = 'Use at least 8 characters.';
    else if (next.length > 72) errs.next = 'Use at most 72 characters.';
    else if (next === current) errs.next = 'Choose a password different from the current one.';
    if (confirmPw !== next) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    // Re-verify the current password before allowing the change.
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (verifyError) {
      setSaving(false);
      setErrors({ current: 'Current password is incorrect.' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      toast.error('Could not change password', friendlyError(error));
      return;
    }
    setCurrent('');
    setNext('');
    setConfirmPw('');
    toast.success('Password changed');
  };

  return (
    <Card title="Change password">
      <form className="stack" onSubmit={handleSubmit} noValidate>
        <Field label="Current password" required error={errors.current}>
          <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" required error={errors.next} hint="At least 8 characters.">
          <input className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirm new password" required error={errors.confirm}>
          <input className="input" type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
        </Field>
        <div>
          <Button type="submit" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
