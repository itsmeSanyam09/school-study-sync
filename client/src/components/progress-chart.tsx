
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import type { Subject, Task } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProgressChartProps {
  subjects: Subject[];
}

export default function ProgressChart({ subjects }: ProgressChartProps) {
  // Fetch all tasks for all subjects
  const allTasksQueries = subjects.map(subject => 
    useQuery<Task[]>({
      queryKey: ["/api/subjects", subject.id, "tasks"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/subjects/${subject.id}/tasks`);
        return res.json();
      }
    })
  );

  const data = useMemo(() => {
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
  }, [subjects, allTasksQueries]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
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
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
