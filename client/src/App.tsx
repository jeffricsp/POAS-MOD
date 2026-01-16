import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import ProgramOutcomesPage from "@/pages/admin/ProgramOutcomesPage";
import UsersPage from "@/pages/admin/UsersPage";
import CoursesPage from "@/pages/admin/CoursesPage";
import ProgramsPage from "@/pages/admin/ProgramsPage";
import SurveysManagePage from "@/pages/admin/SurveysManagePage";
import GradesPage from "@/pages/admin/GradesPage";
import NotificationsPage from "@/pages/admin/NotificationsPage";
import CompetenciesPage from "@/pages/admin/CompetenciesPage";
import SurveyList from "@/pages/surveys/SurveyList";
import TakeSurvey from "@/pages/surveys/TakeSurvey";
import Reports from "@/pages/analytics/Reports";
import FeedbackPage from "@/pages/employer/FeedbackPage";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType, roles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (roles && !roles.includes((user as any).role) && (user as any).role !== 'admin') {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={user ? Dashboard : Landing} />
      
      {/* Public Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Survey Routes - Accessible to all (TakeSurvey handles anon/auth logic internally) */}
      <Route path="/surveys">
        <ProtectedRoute component={SurveyList} roles={['student', 'graduate', 'employer', 'program_head', 'admin']} />
      </Route>
      <Route path="/surveys/:id">
        <ProtectedRoute component={TakeSurvey} roles={['student', 'graduate', 'employer', 'program_head', 'admin']} />
      </Route>

      {/* Admin / Program Head Routes */}
      <Route path="/admin/outcomes">
        <ProtectedRoute component={ProgramOutcomesPage} roles={['program_head']} />
      </Route>
      <Route path="/admin/courses">
        <ProtectedRoute component={CoursesPage} roles={['program_head']} />
      </Route>
      <Route path="/admin/programs">
        <ProtectedRoute component={ProgramsPage} roles={['program_head']} />
      </Route>
      <Route path="/admin/surveys">
        <ProtectedRoute component={SurveysManagePage} roles={['program_head']} />
      </Route>
      <Route path="/admin/grades">
        <ProtectedRoute component={GradesPage} roles={['program_head']} />
      </Route>
      <Route path="/admin/competencies">
        <ProtectedRoute component={CompetenciesPage} roles={['program_head']} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={UsersPage} roles={['admin']} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Reports} roles={['program_head']} />
      </Route>
      <Route path="/employer/feedback">
        <ProtectedRoute component={FeedbackPage} roles={['employer', 'program_head']} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
