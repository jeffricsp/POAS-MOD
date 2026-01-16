import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, ClipboardList, X } from "lucide-react";
import type { Survey, Course, ProgramOutcome } from "@shared/schema";

interface Question {
  text: string;
  type: "scale" | "text";
  linkedPoId?: number | null;
}

export default function SurveysManagePage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetRole: "student" as "student" | "graduate" | "employer",
    isActive: true,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);

  const { data: surveys = [], isLoading, isError } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: pos = [] } = useQuery<ProgramOutcome[]>({
    queryKey: ["/api/program-outcomes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/surveys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Survey created successfully" });
    },
    onError: () => toast({ title: "Failed to create survey", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/surveys/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setIsEditOpen(false);
      setSelectedSurvey(null);
      resetForm();
      toast({ title: "Survey updated successfully" });
    },
    onError: () => toast({ title: "Failed to update survey", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Survey deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete survey", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", targetRole: "student", isActive: true });
    setQuestions([]);
    setSelectedCourses([]);
  };

  const openEdit = async (survey: Survey) => {
    try {
      const res = await fetch(`/api/surveys/${survey.id}`);
      const fullSurvey = await res.json();
      setSelectedSurvey(fullSurvey);
      setFormData({
        title: fullSurvey.title,
        description: fullSurvey.description || "",
        targetRole: fullSurvey.targetRole,
        isActive: fullSurvey.isActive,
      });
      setQuestions(
        fullSurvey.questions.map((q: any) => ({
          text: q.text,
          type: q.type,
          linkedPoId: q.linkedPoId,
        }))
      );
      setSelectedCourses(fullSurvey.courseIds || []);
      setIsEditOpen(true);
    } catch {
      toast({ title: "Failed to load survey", variant: "destructive" });
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "scale", linkedPoId: null }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  };

  const handleCreate = () => {
    if (!formData.title || questions.length === 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...formData,
      questions,
      courseIds: selectedCourses,
    });
  };

  const handleUpdate = () => {
    if (!selectedSurvey) return;
    updateMutation.mutate({
      id: selectedSurvey.id,
      data: {
        ...formData,
        questions,
        courseIds: selectedCourses,
      },
    });
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Failed to load surveys. Please try again.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Survey Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-survey">
              <Plus className="w-4 h-4 mr-2" />
              Create Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Survey</DialogTitle>
            </DialogHeader>
            <SurveyForm
              formData={formData}
              setFormData={setFormData}
              questions={questions}
              setQuestions={setQuestions}
              selectedCourses={selectedCourses}
              setSelectedCourses={setSelectedCourses}
              courses={courses}
              pos={pos}
              addQuestion={addQuestion}
              removeQuestion={removeQuestion}
              updateQuestion={updateQuestion}
              onSubmit={handleCreate}
              isSubmitting={createMutation.isPending}
              submitLabel="Create Survey"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {surveys.map((survey) => (
          <Card key={survey.id} data-testid={`card-survey-${survey.id}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-muted-foreground" />
                {survey.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{survey.description}</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge variant="secondary">{survey.targetRole}</Badge>
                <Badge variant={survey.isActive ? "default" : "outline"}>
                  {survey.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(survey)}
                  data-testid={`button-edit-survey-${survey.id}`}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this survey?")) {
                      deleteMutation.mutate(survey.id);
                    }
                  }}
                  data-testid={`button-delete-survey-${survey.id}`}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {surveys.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No surveys found. Create your first survey to get started.
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
          </DialogHeader>
          <SurveyForm
            formData={formData}
            setFormData={setFormData}
            questions={questions}
            setQuestions={setQuestions}
            selectedCourses={selectedCourses}
            setSelectedCourses={setSelectedCourses}
            courses={courses}
            pos={pos}
            addQuestion={addQuestion}
            removeQuestion={removeQuestion}
            updateQuestion={updateQuestion}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update Survey"
          />
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function SurveyForm({
  formData,
  setFormData,
  questions,
  selectedCourses,
  setSelectedCourses,
  courses,
  pos,
  addQuestion,
  removeQuestion,
  updateQuestion,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  formData: any;
  setFormData: (data: any) => void;
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  selectedCourses: number[];
  setSelectedCourses: (c: number[]) => void;
  courses: Course[];
  pos: ProgramOutcome[];
  addQuestion: () => void;
  removeQuestion: (i: number) => void;
  updateQuestion: (i: number, u: Partial<Question>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Survey Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., End of Course Evaluation"
            data-testid="input-survey-title"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the purpose of this survey..."
            data-testid="input-survey-description"
          />
        </div>
        <div>
          <Label>Target Audience</Label>
          <Select
            value={formData.targetRole}
            onValueChange={(value) => setFormData({ ...formData, targetRole: value })}
          >
            <SelectTrigger data-testid="select-target-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="graduate">Graduates</SelectItem>
              <SelectItem value="employer">Employers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="checkbox-is-active"
          />
          <Label htmlFor="isActive">Survey is active</Label>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Link to Courses (optional)</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {courses.map((course) => (
            <div key={course.id} className="flex items-center gap-2">
              <Checkbox
                id={`course-${course.id}`}
                checked={selectedCourses.includes(course.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCourses([...selectedCourses, course.id]);
                  } else {
                    setSelectedCourses(selectedCourses.filter((id) => id !== course.id));
                  }
                }}
                data-testid={`checkbox-course-${course.id}`}
              />
              <Label htmlFor={`course-${course.id}`} className="text-sm">
                {course.code}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Questions</Label>
          <Button type="button" size="sm" variant="outline" onClick={addQuestion} data-testid="button-add-question">
            <Plus className="w-3 h-3 mr-1" />
            Add Question
          </Button>
        </div>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="border rounded p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Question {i + 1}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeQuestion(i)}
                  data-testid={`button-remove-question-${i}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                value={q.text}
                onChange={(e) => updateQuestion(i, { text: e.target.value })}
                placeholder="Enter question text"
                data-testid={`input-question-${i}`}
              />
              <div className="flex gap-4 flex-wrap">
                <Select
                  value={q.type}
                  onValueChange={(value: "scale" | "text") => updateQuestion(i, { type: value })}
                >
                  <SelectTrigger className="w-32" data-testid={`select-question-type-${i}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">Likert Scale</SelectItem>
                    <SelectItem value="text">Open Text</SelectItem>
                  </SelectContent>
                </Select>
                {q.type === "scale" && (
                  <Select
                    value={q.linkedPoId?.toString() || "none"}
                    onValueChange={(value) => updateQuestion(i, { linkedPoId: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger className="w-48" data-testid={`select-question-po-${i}`}>
                      <SelectValue placeholder="Link to PO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No PO Link</SelectItem>
                      {pos.map((po) => (
                        <SelectItem key={po.id} value={po.id.toString()}>
                          {po.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No questions added yet. Click "Add Question" to start.
          </p>
        )}
      </div>

      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !formData.title || questions.length === 0}
        className="w-full"
        data-testid="button-submit-survey"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
