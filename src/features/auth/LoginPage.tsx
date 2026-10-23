import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { friendlyError } from '../../lib/errors';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { AuthLayout, authStyles } from './AuthLayout';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    // On success, AuthProvider picks up the session and GuestOnly redirects by role.
    if (error) setError(friendlyError(error));
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your school account to continue."
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        {!supabaseConfigured && (
          <Alert tone="error">Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.</Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email" required>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" required>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Link to="/forgot-password" className={authStyles.inlineLink}>
          Forgot password?
        </Link>
        <Button type="submit" block loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
