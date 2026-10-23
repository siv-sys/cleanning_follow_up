import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import { AuthLayout, authStyles } from './AuthLayout';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) setError(friendlyError(error));
    else setSent(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {sent ? (
        <Alert tone="success">If an account exists for {email.trim()}, a reset link is on its way.</Alert>
      ) : (
        <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email" required>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" block loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;

  if (!session) {
    return (
      <AuthLayout title="Link expired" footer={<Link to="/forgot-password">Request a new link</Link>}>
        <Alert tone="error">This reset link is invalid or has expired.</Alert>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(friendlyError(error));
      return;
    }
    toast.success('Password updated');
    navigate('/', { replace: true });
  };

  return (
    <AuthLayout title="Choose a new password">
      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        <Field label="New password" required error={error} hint="At least 8 characters.">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" block loading={submitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
