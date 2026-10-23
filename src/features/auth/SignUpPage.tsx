import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { AuthLayout, authStyles } from './AuthLayout';

type Errors = Partial<Record<'fullName' | 'email' | 'password' | 'confirm', string>>;

export function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = 'Enter your full name.';
    else if (fullName.trim().length > 120) next.fullName = 'Keep it under 120 characters.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    return next;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    // Only the display name goes in metadata. The role is always assigned
    // by the database ('student') and can only be changed by an admin.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyError(error));
      return;
    }
    // With email confirmation on, no session is returned until the link is clicked.
    if (!data.session) setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <AuthLayout title="Check your email" footer={<Link to="/login">Back to sign in</Link>}>
        <Alert tone="success">
          We sent a confirmation link to <strong>{email.trim()}</strong>. Open it to activate your
          account, then sign in.
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="New accounts start as students. An administrator can assign teacher or admin access."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Full name" required error={errors.fullName}>
          <input className="input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required error={errors.password} hint="At least 8 characters.">
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" required error={errors.confirm}>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" block loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
