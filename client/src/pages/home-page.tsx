import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { BookOpen, Calendar, Clock, Brain } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Smart Study Planning",
      description: "AI-powered study schedules tailored to your exam dates"
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Subject Management",
      description: "Track progress across multiple subjects and topics"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Pomodoro Timer",
      description: "Stay focused with timed study sessions and breaks"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Study Assistant",
      description: "Get instant help with your study-related questions"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Smart Study Planner</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to Your Study Journey</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Let's make your exam preparation more effective and organized
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/planner")}
            className="bg-primary hover:bg-primary/90"
          >
            Start Planning
          </Button>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="mb-2 text-primary">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Success Stories</h3>
            <div className="grid gap-4">
              <img
                src="https://images.unsplash.com/photo-1455849318743-b2233052fcff"
                alt="Student Success"
                className="rounded-lg object-cover h-64 w-full"
              />
              <p className="text-muted-foreground">
                Join thousands of students who have improved their study habits with our platform
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Study Environment</h3>
            <div className="grid gap-4">
              <img
                src="https://images.unsplash.com/photo-1488998427799-e3362cec87c3"
                alt="Study Setup"
                className="rounded-lg object-cover h-64 w-full"
              />
              <p className="text-muted-foreground">
                Create your perfect study environment with our tools and guidance
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
