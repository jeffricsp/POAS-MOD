import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileText, 
  BarChart2, 
  Settings,
  LogOut,
  FileSpreadsheet,
  ClipboardList,
  Bell,
  Building2,
  Folder,
  Target
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const role = user.role;
  const isAdmin = role === 'admin';
  const isProgramHead = role === 'program_head';
  const isEmployer = role === 'employer';
  const isStudentOrGraduate = role === 'student' || role === 'graduate';
  
  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart2,
      show: isAdmin || isProgramHead,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
      show: isAdmin,
    },
    {
      label: "Programs",
      href: "/admin/programs",
      icon: Folder,
      show: isAdmin,
    },
    {
      label: "Program Outcomes",
      href: "/admin/outcomes",
      icon: BookOpen,
      show: isAdmin || isProgramHead,
    },
    {
      label: "Courses",
      href: "/admin/courses",
      icon: GraduationCap,
      show: isAdmin || isProgramHead,
    },
    {
      label: "Grade Entry",
      href: "/admin/grades",
      icon: FileSpreadsheet,
      show: isAdmin || isProgramHead,
    },
    {
      label: "Manage Surveys",
      href: "/admin/surveys",
      icon: ClipboardList,
      show: isAdmin || isProgramHead,
    },
    {
      label: "Competencies",
      href: "/admin/competencies",
      icon: Target,
      show: isAdmin,
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      show: isAdmin || isProgramHead,
    },
    {
      label: "Employer Feedback",
      href: "/employer/feedback",
      icon: Building2,
      show: isAdmin || isProgramHead || isEmployer,
    },
    {
      label: "Take Surveys",
      href: "/surveys",
      icon: FileText,
      show: isStudentOrGraduate || isEmployer,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      show: true,
    },
  ];

  const filteredNavItems = navItems.filter(item => item.show);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">PO Assessment</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full border border-border" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
              {user.firstName?.[0] || user.username?.[0] || "U"}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.firstName || user.username}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
