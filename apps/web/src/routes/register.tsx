import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const googleAuthUrl = `${import.meta.env.VITE_API_BASE ?? ''}/api/auth/google`;

  const registerMutation = useMutation({
    mutationFn: () => apiClient.register({ email, password, name, orgName }),
    onSuccess: () => {
      navigate({ to: '/panel/dashboard' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Utwórz konto</CardTitle>
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
              Kontynuuj z Google
            </Button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-secondary-200" />
              <span className="mx-3 text-xs uppercase text-secondary-500">lub</span>
              <div className="flex-grow border-t border-secondary-200" />
            </div>

            {registerMutation.isError && (
              <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
                {registerMutation.error?.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.'}
              </div>
            )}

            <Input
              label="Imię i nazwisko"
              type="text"
              placeholder="Jan Kowalski"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Nazwa organizacji"
              type="text"
              placeholder="Acme Sp. z o.o."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />

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
              minLength={8}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={registerMutation.isPending}
            >
              Utwórz konto
            </Button>

            <div className="text-center text-sm text-secondary-600">
              Masz już konto?{' '}
              <Link to="/login" className="text-primary-600 hover:underline">
                Zaloguj się
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
