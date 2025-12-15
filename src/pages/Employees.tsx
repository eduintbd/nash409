import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { mockEmployees } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Phone, Calendar, Clock, IndianRupee } from 'lucide-react';

const roleColors = {
  guard: 'bg-primary/10 text-primary border-primary/20',
  cleaner: 'bg-success/10 text-success border-success/20',
  caretaker: 'bg-warning/10 text-warning border-warning/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const Employees = () => {
  return (
    <MainLayout>
      <Header 
        title="Employees" 
        subtitle="Manage building staff and personnel"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex justify-end">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {mockEmployees.map((employee) => (
            <Card key={employee.id} className="stat-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base">{employee.name}</CardTitle>
                    <Badge variant="outline" className={roleColors[employee.role]}>
                      {employee.role}
                    </Badge>
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
                  Joined {new Date(employee.joinDate).toLocaleDateString()}
                </div>
                <div className="pt-2 border-t flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-success" />
                  <span className="font-semibold text-foreground">
                    {employee.salary.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Employees;
