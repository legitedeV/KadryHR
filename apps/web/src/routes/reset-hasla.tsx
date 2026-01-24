import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ResetPasswordPage() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetPasswordMutation = useMutation({
    mutationFn: () => apiClient.resetPassword(token, password),
    onSuccess: () => {
      setSuccessMessage('Hasło zostało zmienione. Możesz się zalogować.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    resetPasswordMutation.mutate();
  };

  const passwordsMatch = password === confirmPassword;
  const isTokenMissing = !token;

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Ustaw nowe hasło</CardTitle>
        </CardHeader>
        <CardContent>
          {isTokenMissing ? (
            <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
              Brak lub nieprawidłowy token resetu hasła.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {resetPasswordMutation.isError && (
                <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
                  {resetPasswordMutation.error?.message || 'Nie udało się zresetować hasła.'}
                </div>
              )}

              {successMessage && (
                <div className="bg-success-50 text-success-700 p-3 rounded-md text-sm">
                  {successMessage}
                </div>
              )}

              <Input
                label="Nowe hasło"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />

              <Input
                label="Potwierdź hasło"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />

              {!passwordsMatch && confirmPassword.length > 0 && (
                <div className="text-sm text-warning-700">Hasła nie są zgodne.</div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={resetPasswordMutation.isPending}
                disabled={!passwordsMatch || isTokenMissing}
              >
                Zapisz hasło
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-secondary-600">
            <Link to="/login" className="text-primary-600 hover:underline">
              Wróć do logowania
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
