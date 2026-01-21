import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: { id: string; name: string } | null;
  active: boolean;
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiClient.getEmployees() as Promise<{ data: Employee[] }>,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newEmployee) => apiClient.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setAddModalOpen(false);
      setNewEmployee({ name: '', email: '', phone: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newEmployee);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Team Management</h1>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No employees yet"
          description="Get started by adding your first team member."
          action={
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-secondary-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.phone || '-'}</TableCell>
                  <TableCell>{employee.position?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={employee.active ? 'success' : 'default'}>
                      {employee.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(employee.id)}
                      isLoading={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-error-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add New Employee"
        description="Enter employee details to add them to your team."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {createMutation.isError && (
            <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
              {createMutation.error?.message || 'Failed to create employee'}
            </div>
          )}

          <Input
            label="Full Name"
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            required
          />

          <Input
            label="Phone"
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
          />

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
