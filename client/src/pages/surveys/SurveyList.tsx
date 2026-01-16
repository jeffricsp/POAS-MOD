import { Shell } from "@/components/layout/Shell";
import { useMySurveys } from "@/hooks/use-surveys";
import { Link } from "wouter";
import { FileText, ArrowRight, Loader2 } from "lucide-react";

export default function SurveyList() {
  const { data: surveys, isLoading } = useMySurveys();

  return (
    <Shell>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Available Surveys</h1>
        <p className="text-muted-foreground mt-2">Participate in program assessment by providing your feedback.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys?.map((survey) => (
            <div key={survey.id} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{survey.title}</h3>
              <p className="text-muted-foreground text-sm flex-1">{survey.description}</p>
              
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs font-medium px-2 py-1 bg-muted rounded text-muted-foreground capitalize">
                  For: {survey.targetRole}
                </span>
                {(survey as any).hasResponded ? (
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    Completed
                    <FileText className="w-4 h-4" />
                  </span>
                ) : (
                  <Link 
                    href={`/surveys/${survey.id}`}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline group"
                  >
                    Take Survey
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {surveys?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>No active surveys available at the moment.</p>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
