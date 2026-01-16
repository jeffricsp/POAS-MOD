import { useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { useSurvey, useSubmitSurvey } from "@/hooks/use-surveys";
import { useForm } from "react-hook-form";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function TakeSurvey() {
  const [, params] = useRoute("/surveys/:id");
  const id = Number(params?.id);
  const { data: survey, isLoading } = useSurvey(id);
  const submitMutation = useSubmitSurvey(id);
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!survey) return <Shell>Survey not found</Shell>;

  if (submitted) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto text-center py-24">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
          <p className="text-muted-foreground mb-8">
            Your feedback has been recorded successfully. Your contribution helps us improve our educational program.
          </p>
          <a href="/surveys" className="text-primary font-medium hover:underline">
            Back to Surveys
          </a>
        </div>
      </Shell>
    );
  }

  const onSubmit = (data: any) => {
    // Transform form data to match API expectations
    const answers = survey.questions.map(q => {
      const val = data[`q_${q.id}`];
      return {
        questionId: q.id,
        answerValue: q.type === 'scale' ? Number(val) : undefined,
        answerText: q.type === 'text' ? val : undefined
      };
    });

    submitMutation.mutate({
      respondentName: user ? undefined : data.respondentName, // Only send name if anonymous/external
      answers
    }, {
      onSuccess: () => setSubmitted(true)
    });
  };

  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{survey.title}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{survey.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {!user && (
             <div className="bg-card p-6 rounded-xl border border-border">
               <label className="block text-sm font-medium mb-2">Your Name (Optional)</label>
               <input 
                 {...register("respondentName")}
                 className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                 placeholder="John Doe"
               />
             </div>
          )}

          {survey.questions.map((q, idx) => (
            <div key={q.id} className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <div className="flex gap-4 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0 text-sm">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-lg">{q.text}</p>
                  
                  {q.type === 'scale' ? (
                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
                        <span>Strongly Disagree</span>
                        <span>Strongly Agree</span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <label key={val} className="flex-1 cursor-pointer group">
                            <input
                              type="radio"
                              value={val}
                              {...register(`q_${q.id}`, { required: true })}
                              className="peer sr-only"
                            />
                            <div className="h-12 rounded-lg border-2 border-muted bg-muted/30 flex items-center justify-center font-bold text-muted-foreground peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all group-hover:border-primary/50">
                              {val}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <textarea
                        {...register(`q_${q.id}`, { required: true })}
                        className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px]"
                        placeholder="Type your answer here..."
                      />
                    </div>
                  )}
                  {errors[`q_${q.id}`] && (
                    <p className="text-destructive text-sm mt-2">This question is required</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all disabled:opacity-50 disabled:transform-none"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Survey"}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
