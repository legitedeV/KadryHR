import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function LoginHelpPage() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: () => apiClient.forgotPassword(email),
    onSuccess: (data) => {
      setSuccessMessage(data.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    forgotPasswordMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Odzyskiwanie hasła</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {forgotPasswordMutation.isError && (
              <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
                {forgotPasswordMutation.error?.message || 'Nie udało się wysłać wiadomości. Spróbuj ponownie.'}
              </div>
            )}

            {successMessage && (
              <div className="bg-success-50 text-success-700 p-3 rounded-md text-sm">
                {successMessage}
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

            <Button
              type="submit"
              className="w-full"
              isLoading={forgotPasswordMutation.isPending}
            >
              Wyślij link resetu
            </Button>

            <div className="text-center text-sm text-secondary-600">
              <Link to="/login" className="text-primary-600 hover:underline">
                Wróć do logowania
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
