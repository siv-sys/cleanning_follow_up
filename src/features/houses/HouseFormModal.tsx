import { useEffect, useState, type FormEvent } from 'react';
import type { House } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { createHouse, renameHouse } from '../../services/houses';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/ToastProvider';

interface Props {
  open: boolean;
  /** Rename this house; create a new one when omitted. */
  house?: House | null;
  onClose: () => void;
  onSaved: () => void;
}

export function HouseFormModal({ open, house, onClose, onSaved }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(house?.name ?? '');
      setError(null);
      setFormError(null);
    }
  }, [open, house]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 60) {
      setError('Use 1–60 characters.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (house) await renameHouse(house.id, trimmed);
      else await createHouse(trimmed);
      toast.success(house ? 'House renamed' : 'House created', trimmed);
      onSaved();
      onClose();
    } catch (err) {
      const msg = friendlyError(err);
      setFormError(/duplicate|unique/i.test(msg) ? 'A house with this name already exists.' : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={house ? 'Rename house' : 'Create house'}
      onClose={onClose}
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="house-form" loading={saving}>
            {house ? 'Save' : 'Create house'}
          </Button>
        </>
      }
    >
      <form id="house-form" className="stack" onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="House name" required error={error} hint="For example: House 1">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} />
        </Field>
      </form>
    </Modal>
  );
}
