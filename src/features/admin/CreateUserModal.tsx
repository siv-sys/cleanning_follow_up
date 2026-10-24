import { useEffect, useState, type FormEvent } from 'react';
import { isHouseMemberRole, type AppRole, type House } from '../../lib/database.types';
import { createUser } from '../../services/users';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/ToastProvider';
import { PasswordInput } from './PasswordInput';

type Errors = Partial<Record<'fullName' | 'email' | 'password', string>>;

interface Props {
  open: boolean;
  houses: Pick<House, 'id' | 'name'>[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ open, houses, onClose, onCreated }: Props) {
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('student');
  const [houseId, setHouseId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName('');
      setEmail('');
      setRole('student');
      setHouseId('');
      setPassword('');
      setErrors({});
      setFormError(null);
    }
  }, [open]);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = 'Enter the full name.';
    else if (fullName.trim().length > 120) next.fullName = 'Keep it under 120 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    else if (password.length > 72) next.password = 'Use at most 72 characters.';
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await createUser({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        password,
        house_id: isHouseMemberRole(role) && houseId ? houseId : null,
      });
      toast.success('User created', `${fullName.trim()} can now sign in with ${email.trim()}.`);
      onCreated();
      onClose();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create user"
      onClose={onClose}
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" loading={saving}>
            Create user
          </Button>
        </>
      }
    >
      <form id="create-user-form" className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Full name" required error={errors.fullName}>
          <input className="input" autoComplete="off" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        </Field>
        <Field label="Email" required error={errors.email} hint="Used to sign in.">
          <input className="input" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Role" required>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
            <option value="student">Student</option>
            <option value="supervisor">Supervisor</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Administrator</option>
          </select>
        </Field>
        {isHouseMemberRole(role) && (
          <Field
            label="House"
            hint={
              houses.length === 0
                ? 'No houses yet. You can add them to one later.'
                : role === 'supervisor'
                  ? 'The supervisor will see the photos of everyone in this house.'
                  : 'Optional. You can change this later.'
            }
          >
            <select className="select" value={houseId} onChange={(e) => setHouseId(e.target.value)} disabled={!houses.length}>
              <option value="">No house</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Password" required error={errors.password} hint="At least 8 characters.">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
      </form>
    </Modal>
  );
}
