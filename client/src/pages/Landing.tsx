import { GraduationCap, CheckCircle, BarChart3, Users } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">PO Assessment</span>
          </div>
          <nav>
            <Link href="/login" className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-32 px-6">
        <div className="container mx-auto max-w-5xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            OBE Compliant System
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground">
            Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Program Outcomes</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A comprehensive platform to track, measure, and analyze student achievement against program outcomes using real-time data from grades and surveys.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all">
              Get Started
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-card border border-border text-foreground font-bold text-lg rounded-xl hover:bg-muted transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Outcome Tracking</h3>
            <p className="text-muted-foreground">Map courses to outcomes and track achievement levels automatically.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Smart Analytics</h3>
            <p className="text-muted-foreground">Visual reports and dashboards for Program Heads to make data-driven decisions.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Stakeholder Surveys</h3>
            <p className="text-muted-foreground">Gather feedback from Students, Graduates, and Employers seamlessly.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
