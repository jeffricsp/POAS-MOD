import { useAuth } from "@/hooks/use-auth";
import { Shell } from "@/components/layout/Shell";
import { StatCard } from "@/components/ui/StatCard";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Users, BookOpen, GraduationCap, ArrowRight, Bell, ClipboardList, FileSpreadsheet, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useProgramOutcomes } from "@/hooks/use-program";
import type { Course, Survey, Notification } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: pos } = useProgramOutcomes();
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: surveys } = useQuery<Survey[]>({ queryKey: ["/api/surveys"] });
  const { data: notifications } = useQuery<Notification[]>({ queryKey: ["/api/notifications"] });

  if (!user) return null;

  const isAdmin = user.role === "admin" || user.role === "program_head";
  const isEmployer = user.role === "employer";
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <Shell>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-welcome">
            Welcome back, {user.firstName || user.email || 'User'}
          </h1>
          <p className="text-muted-foreground mt-2">Here's an overview of the program assessment status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-lg" data-testid="link-notifications">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full capitalize">
            Role: {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Program Outcomes"
          value={pos?.length || 0}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          title="Courses"
          value={courses?.length || 0}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatCard
          title="Active Surveys"
          value={surveys?.filter(s => s.isActive).length || 0}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          title="Notifications"
          value={unreadCount}
          icon={<Bell className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
              <h3 className="font-semibold text-lg">Quick Actions</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/surveys" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-surveys">
                <ClipboardList className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Take Surveys</p>
                  <p className="text-sm text-muted-foreground">Complete pending assessments</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>

              {isAdmin && (
                <Link href="/analytics" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-analytics">
                  <BarChart className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-sm text-muted-foreground">PO achievement reports</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link href="/admin/courses" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-courses">
                    <GraduationCap className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Manage Courses</p>
                      <p className="text-sm text-muted-foreground">Add courses & map POs</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </Link>

                  <Link href="/admin/grades" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-grades">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Grade Entry</p>
                      <p className="text-sm text-muted-foreground">Upload or enter grades</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </Link>

                  <Link href="/admin/surveys" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-manage-surveys">
                    <ClipboardList className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Manage Surveys</p>
                      <p className="text-sm text-muted-foreground">Create & edit surveys</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </Link>

                  <Link href="/admin/outcomes" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-outcomes">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Program Outcomes</p>
                      <p className="text-sm text-muted-foreground">Define & manage POs</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </Link>
                </>
              )}

              {(isEmployer || isAdmin) && (
                <Link href="/employer/feedback" className="flex items-center gap-4 p-4 rounded-lg border hover-elevate" data-testid="link-feedback">
                  <Building2 className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">Employer Feedback</p>
                    <p className="text-sm text-muted-foreground">Rate graduate performance</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
            <h3 className="font-bold text-lg mb-2">Take Survey</h3>
            <p className="text-primary-foreground/80 text-sm mb-6">
              Your feedback is crucial for our program assessment. Please complete any pending surveys.
            </p>
            <Link href="/surveys" className="inline-flex items-center justify-center w-full bg-white text-primary font-semibold py-2.5 rounded-lg hover:bg-white/90 transition-colors" data-testid="button-view-surveys">
              View Pending Surveys
            </Link>
          </div>

          {isAdmin && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold mb-4">Admin Tools</h3>
              <nav className="space-y-2">
                <Link href="/admin/users" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" data-testid="link-users">
                  Manage Users
                </Link>
                <Link href="/notifications" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" data-testid="link-send-notifications">
                  Send Notifications
                </Link>
                <Link href="/analytics" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" data-testid="link-reports">
                  View Reports
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
