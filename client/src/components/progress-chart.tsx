
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import type { Subject, Task } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface ProgressChartProps {
  subjects: Subject[];
}

export default function ProgressChart({ subjects = [] }: ProgressChartProps) {
  const allTasksQueries = subjects.map(subject => 
    useQuery<Task[]>({
      queryKey: ["/api/subjects", subject.id, "tasks"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/subjects/${subject.id}/tasks`);
        return res.json();
      }
    })
  );

  const isLoading = allTasksQueries.some(query => query.isLoading);

  const data = useMemo(() => {
    if (isLoading) return [];
    
    const totalTasks = allTasksQueries.reduce((acc, query) => 
      acc + (query.data?.length || 0), 0);
    
    const completedTasks = allTasksQueries.reduce((acc, query) => 
      acc + (query.data?.filter(task => task.completed)?.length || 0), 0);

    const completedSubjects = subjects.filter(s => s.completed).length;
    const totalSubjects = subjects.length;

    const overallProgress = totalTasks === 0 ? 0 : 
      Math.round((completedTasks + (completedSubjects * totalTasks/totalSubjects)) / (totalTasks * 2) * 100);
      
    return [
      { name: 'Completed', value: overallProgress },
      { name: 'Pending', value: 100 - overallProgress }
    ];
  }, [subjects, allTasksQueries, isLoading]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ value }) => `${value}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
