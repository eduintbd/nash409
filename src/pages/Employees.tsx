import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeForm } from '@/components/forms/EmployeeForm';
import { Plus, Phone, Calendar, Clock, Trash2, Edit } from 'lucide-react';
import { formatBDT } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const roleColors = {
  guard: 'bg-primary/10 text-primary border-primary/20',
  cleaner: 'bg-success/10 text-success border-success/20',
  caretaker: 'bg-warning/10 text-warning border-warning/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const Employees = () => {
  const { t, language } = useLanguage();
  const { data: employees, isLoading } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const roleLabels = {
    guard: t.employees.roleGuard,
    cleaner: t.employees.roleCleaner,
    caretaker: t.employees.roleCaretaker,
    other: t.employees.roleOther,
  };

  const handleEdit = (employee: any) => {
    setEditData(employee);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteEmployee.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US');
  };

  return (
    <MainLayout>
      <Header 
        title={t.employees.title}
        subtitle={t.employees.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex justify-end">
          <Button onClick={() => { setEditData(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t.employees.addEmployee}
          </Button>
        </div>

        {/* Employee Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : employees?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t.employees.noEmployees}</p>
            <p className="text-sm mt-1">{t.employees.addEmployeeHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {employees?.map((employee) => (
              <Card key={employee.id} className="stat-card border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{employee.name}</CardTitle>
                      <Badge variant="outline" className={roleColors[employee.role]}>
                        {roleLabels[employee.role]}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {employee.phone}
                  </div>
                  {employee.shift && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {employee.shift}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {t.employees.joined}: {formatDate(employee.join_date)}
                  </div>
                  <div className="pt-2 border-t flex items-center gap-2">
                    <span className="font-semibold text-foreground text-success">
                      {formatBDT(employee.salary)}
                    </span>
                    <span className="text-muted-foreground">{t.common.perMonth}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EmployeeForm 
        open={formOpen} 
        onOpenChange={setFormOpen}
        editData={editData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.common.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Employees;
