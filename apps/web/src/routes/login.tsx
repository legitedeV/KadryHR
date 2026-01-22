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
