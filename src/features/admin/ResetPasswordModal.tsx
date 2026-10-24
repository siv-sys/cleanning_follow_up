import { useEffect, useState, type FormEvent } from 'react';
import type { Profile } from '../../lib/database.types';
import { resetUserPassword } from '../../services/users';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/ToastProvider';
import { PasswordInput } from './PasswordInput';

export function ResetPasswordModal({ user, onClose }: { user: Profile | null; onClose: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPassword('');
      setError(null);
      setFormError(null);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (password.length < 8 || password.length > 72) {
      setError('Use 8–72 characters.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await resetUserPassword(user.id, password);
      toast.success('Password updated', `${user.full_name} can now sign in with the new password.`);
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={user !== null}
      title={`Reset password · ${user?.full_name ?? ''}`}
      onClose={onClose}
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="reset-password-form" loading={saving}>
            Set new password
          </Button>
        </>
      }
    >
      <form id="reset-password-form" className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}
        <p className="muted">The user's current password stops working immediately.</p>
        <Field label="New password" required error={error} hint="At least 8 characters.">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
      </form>
    </Modal>
  );
}
