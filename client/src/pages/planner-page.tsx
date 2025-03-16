import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubjectSchema, insertTaskSchema } from "@shared/schema";
import type { Subject, Task } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIChatbot from "@/components/ai-chatbot";
import PomodoroTimer from "@/components/pomodoro-timer";
import ProgressChart from "@/components/progress-chart";
import { Loader2, Plus, Calendar } from "lucide-react";
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";

export default function PlannerPage() {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/subjects", selectedSubject, "tasks"],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const res = await apiRequest("GET", `/api/subjects/${selectedSubject}/tasks`);
      return res.json();
    },
    enabled: !!selectedSubject,
  });

  const subjectForm = useForm({
    resolver: zodResolver(insertSubjectSchema),
    defaultValues: {
      name: "",
      examDate: new Date().toISOString().slice(0, 16)
    }
  });

  const taskForm = useForm({
    resolver: zodResolver(insertTaskSchema),
  });

  const subjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertSubjectSchema>) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      subjectForm.reset();
    },
  });

  const taskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTaskSchema>) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", selectedSubject, "tasks"] });
      taskForm.reset();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", selectedSubject, "tasks"] });
    },
  });

  const toggleSubjectMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/subjects/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
    },
  });

  const fetchChaptersMutation = useMutation({
    mutationFn: async (subjectId: number) => {
      const res = await apiRequest("POST", `/api/subjects/${subjectId}/fetch-chapters`);
      return res.json();
    },
    onSuccess: (_, subjectId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects", subjectId, "tasks"] });
      toast({
        id: crypto.randomUUID(),
        title: "Chapters fetched successfully",
        description: "Tasks have been created for each chapter",
      });
    },
    onError: (error) => {
      toast({
        id: crypto.randomUUID(),
        title: "Error fetching chapters",
        description: "Please make sure your grade is set in your profile",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...subjectForm}>
                    <form onSubmit={subjectForm.handleSubmit((data) => subjectMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={subjectForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={subjectForm.control}
                        name="examDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exam Date</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={subjectMutation.isPending}>
                        {subjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Add Subject
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <PomodoroTimer />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Subjects & Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {subjectsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={subject.completed || false}
                                onCheckedChange={(checked) =>
                                  toggleSubjectMutation.mutate({
                                    id: subject.id,
                                    completed: !!checked,
                                  })
                                }
                              />
                              <span className="font-medium">{subject.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchChaptersMutation.mutate(subject.id)}
                                disabled={fetchChaptersMutation.isPending}
                              >
                                {fetchChaptersMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Fetch Chapters"
                                )}
                              </Button>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(subject.examDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {selectedSubject === subject.id && tasks && (
                            <div className="pl-6 space-y-2">
                              {tasks.map((task) => (
                                <div key={task.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={task.completed || false}
                                    onCheckedChange={(checked) =>
                                      toggleTaskMutation.mutate({
                                        id: task.id,
                                        completed: !!checked,
                                      })
                                    }
                                  />
                                  <span>{task.description}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
                          >
                            {selectedSubject === subject.id ? "Hide Tasks" : "Show Tasks"}
                          </Button>
                          <Separator />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <ProgressChart subjects={subjects} />
            <AIChatbot />
          </div>
        </div>
      </div>
    </div>
  );
}