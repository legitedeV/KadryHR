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
            Complete HR management solution for modern teams. Manage employees, schedules, and availability in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
          Everything you need to manage your team
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Manage employee data, positions, and tags in one central location.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Create and publish schedules with ease. Handle shifts and availability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Availability Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Track employee availability and time-off requests automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary-600 mb-2" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-600">
                Get insights into your team performance and scheduling patterns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to streamline your HR processes?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join teams that trust KadryHR to manage their workforce.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
