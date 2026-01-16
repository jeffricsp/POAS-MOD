import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BookOpen, Link2 } from "lucide-react";
import type { Course, ProgramOutcome } from "@shared/schema";

export default function CoursesPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", credits: 3 });
  const [selectedPOs, setSelectedPOs] = useState<number[]>([]);

  const { data: courses = [], isLoading, isError } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: pos = [] } = useQuery<ProgramOutcome[]>({
    queryKey: ["/api/program-outcomes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { code: string; name: string; credits: number }) => {
      return apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCreateOpen(false);
      setFormData({ code: "", name: "", credits: 3 });
      toast({ title: "Course created successfully" });
    },
    onError: () => toast({ title: "Failed to create course", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Course> }) => {
      return apiRequest("PUT", `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsEditOpen(false);
      setSelectedCourse(null);
      toast({ title: "Course updated successfully" });
    },
    onError: () => toast({ title: "Failed to update course", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete course", variant: "destructive" }),
  });

  const mappingMutation = useMutation({
    mutationFn: async ({ courseId, poIds }: { courseId: number; poIds: number[] }) => {
      return apiRequest("PUT", `/api/courses/${courseId}/pos`, { poIds });
    },
    onSuccess: () => {
      setIsMappingOpen(false);
      setSelectedCourse(null);
      toast({ title: "PO mappings updated successfully" });
    },
    onError: () => toast({ title: "Failed to update mappings", variant: "destructive" }),
  });

  const openMapping = async (course: Course) => {
    setSelectedCourse(course);
    try {
      const res = await fetch(`/api/courses/${course.id}/pos`);
      const poIds = await res.json();
      setSelectedPOs(poIds);
    } catch {
      setSelectedPOs([]);
    }
    setIsMappingOpen(true);
  };

  const openEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormData({ code: course.code, name: course.name, credits: course.credits });
    setIsEditOpen(true);
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
          Failed to load courses. Please try again.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Course Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-course">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="code">Course Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CS101"
                  data-testid="input-course-code"
                />
              </div>
              <div>
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Introduction to Computing"
                  data-testid="input-course-name"
                />
              </div>
              <div>
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  data-testid="input-course-credits"
                />
              </div>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.code || !formData.name}
                className="w-full"
                data-testid="button-submit-course"
              >
                {createMutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} data-testid={`card-course-${course.id}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                {course.code}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2" data-testid={`text-course-name-${course.id}`}>
                {course.name}
              </p>
              <p className="text-xs text-muted-foreground mb-4">Credits: {course.credits}</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openMapping(course)}
                  data-testid={`button-map-pos-${course.id}`}
                >
                  <Link2 className="w-3 h-3 mr-1" />
                  Map POs
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(course)}
                  data-testid={`button-edit-course-${course.id}`}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this course?")) {
                      deleteMutation.mutate(course.id);
                    }
                  }}
                  data-testid={`button-delete-course-${course.id}`}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No courses found. Create your first course to get started.
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-code">Course Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                data-testid="input-edit-course-code"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Course Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-course-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-credits">Credits</Label>
              <Input
                id="edit-credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                data-testid="input-edit-course-credits"
              />
            </div>
            <Button
              onClick={() => selectedCourse && updateMutation.mutate({ id: selectedCourse.id, data: formData })}
              disabled={updateMutation.isPending}
              className="w-full"
              data-testid="button-update-course"
            >
              {updateMutation.isPending ? "Updating..." : "Update Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Program Outcomes to {selectedCourse?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Select which Program Outcomes this course contributes to:
            </p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pos.map((po) => (
                <div key={po.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`po-${po.id}`}
                    checked={selectedPOs.includes(po.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPOs([...selectedPOs, po.id]);
                      } else {
                        setSelectedPOs(selectedPOs.filter((id) => id !== po.id));
                      }
                    }}
                    data-testid={`checkbox-po-${po.id}`}
                  />
                  <label htmlFor={`po-${po.id}`} className="text-sm cursor-pointer">
                    <span className="font-medium">{po.code}</span>: {po.description}
                  </label>
                </div>
              ))}
            </div>
            <Button
              onClick={() => selectedCourse && mappingMutation.mutate({ courseId: selectedCourse.id, poIds: selectedPOs })}
              disabled={mappingMutation.isPending}
              className="w-full"
              data-testid="button-save-mappings"
            >
              {mappingMutation.isPending ? "Saving..." : "Save Mappings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
