import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Calendar, BarChart3, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-secondary-900 mb-6">
            KadryHR v2
          </h1>
          <p className="text-xl text-secondary-600 mb-8">
            Kompleksowe rozwiązanie HR dla nowoczesnych zespołów. Zarządzaj pracownikami, grafikami i dostępnością w jednym miejscu.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button size="lg">Zacznij teraz</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Zaloguj się</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
          Wszystko, czego potrzebujesz do zarządzania zespołem
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Zarządzanie zespołem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Zarządzaj danymi pracowników, stanowiskami i tagami w jednym miejscu.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Inteligentne grafiki</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Twórz i publikuj grafiki z łatwością. Zarządzaj zmianami i dostępnością.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Śledzenie dostępności</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Automatycznie śledź dostępność i wnioski urlopowe pracowników.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Analityka</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Zyskaj wgląd w wydajność zespołu i schematy planowania.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Gotowy, aby usprawnić procesy HR?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Dołącz do zespołów, które ufają KadryHR w zarządzaniu personelem.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Rozpocznij darmowy okres próbny
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
