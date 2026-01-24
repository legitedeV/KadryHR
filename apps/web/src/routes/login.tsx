import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleAuthUrl = `${import.meta.env.VITE_API_BASE ?? ''}/api/auth/google`;

  const loginMutation = useMutation({
    mutationFn: () => apiClient.login({ email, password }),
    onSuccess: () => {
      navigate({ to: '/panel/dashboard' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Zaloguj się do KadryHR</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full border border-secondary-200"
              onClick={() => {
                window.location.href = googleAuthUrl;
              }}
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary-600">
                G
              </span>
              Zaloguj się z Google
            </Button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-secondary-200" />
              <span className="mx-3 text-xs uppercase text-secondary-500">lub</span>
              <div className="flex-grow border-t border-secondary-200" />
            </div>

            {loginMutation.isError && (
              <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
                {loginMutation.error?.message || 'Logowanie nie powiodło się. Spróbuj ponownie.'}
              </div>
            )}

            <Input
              label="Adres email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Hasło"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loginMutation.isPending}
            >
              Zaloguj się
            </Button>

            <div className="text-center text-sm text-secondary-600">
              <Link to="/pomoc-logowanie" className="text-primary-600 hover:underline">
                Nie pamiętasz hasła?
              </Link>
            </div>

            <div className="text-center text-sm text-secondary-600">
              Nie masz konta?{' '}
              <Link to="/register" className="text-primary-600 hover:underline">
                Zarejestruj się
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
