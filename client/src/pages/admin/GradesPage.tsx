import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Upload, Plus, FileSpreadsheet, GraduationCap } from "lucide-react";
import type { Course, Enrollment } from "@shared/schema";
import * as XLSX from "xlsx";

export default function GradesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [formData, setFormData] = useState({ studentId: "", courseId: "", grade: 0, academicYear: "", term: "" });
  const [previewData, setPreviewData] = useState<any[]>([]);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments = [], isLoading, isError } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/enrollments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      setIsManualOpen(false);
      setFormData({ studentId: "", courseId: "", grade: 0, academicYear: "", term: "" });
      toast({ title: "Grade entry saved successfully" });
    },
    onError: () => toast({ title: "Failed to save grade", variant: "destructive" }),
  });

  const bulkMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return apiRequest("POST", "/api/enrollments/bulk", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      setIsUploadOpen(false);
      setPreviewData([]);
      toast({ title: "Grades uploaded successfully" });
    },
    onError: () => toast({ title: "Failed to upload grades", variant: "destructive" }),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const parsed = jsonData.map((row: any) => {
          const studentId = String(row.studentId || row.student_id || row.StudentID || row.ID || "");
          const courseCode = String(row.courseCode || row.course_code || row.CourseCode || row.Code || "").trim();
          const rawCourseId = row.courseId || row.course_id || row.CourseID;
          const courseIdFromExcel = rawCourseId ? parseInt(String(rawCourseId)) : 0;
          
          let courseId = isNaN(courseIdFromExcel) ? 0 : courseIdFromExcel;
          if (!courseId && courseCode) {
            const course = courses.find(c => c.code.toLowerCase().trim() === courseCode.toLowerCase());
            if (course) courseId = course.id;
          }

          return {
            userId: studentId,
            courseId: courseId || 0,
            grade: parseInt(String(row.grade || row.Grade || row.score || row.Score || "0")) || 0,
            academicYear: String(row.academicYear || row.academic_year || row.Year || row.year || ""),
            term: String(row.term || row.Term || row.semester || "First Semester"),
          };
        });
        
        setPreviewData(parsed);
        toast({ title: `Loaded ${parsed.length} records from file` });
      } catch (error) {
        toast({ title: "Failed to parse Excel file", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getCourseCode = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.code || `Course ${courseId}`;
  };

  const filteredEnrollments = selectedCourse && selectedCourse !== "all"
    ? enrollments.filter((e) => e.courseId === parseInt(selectedCourse))
    : enrollments;

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
          Failed to load grades. Please try again.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Grade Entry</h1>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-upload-grades">
                <Upload className="w-4 h-4 mr-2" />
                Upload Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Grades from Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an Excel file with columns: studentId, courseCode (or courseId), grade, academicYear, term
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-select-file"
                  >
                    Select File
                  </Button>
                </div>
                
                {previewData.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Preview ({previewData.length} records)</h4>
                    <div className="max-h-48 overflow-y-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Term</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.slice(0, 5).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell>{row.userId}</TableCell>
                              <TableCell>{getCourseCode(row.courseId)}</TableCell>
                              <TableCell>{row.grade}</TableCell>
                              <TableCell>{row.academicYear}</TableCell>
                              <TableCell>{row.term}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {previewData.length > 5 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ...and {previewData.length - 5} more records
                      </p>
                    )}
                    <Button
                      onClick={() => bulkMutation.mutate(previewData)}
                      disabled={bulkMutation.isPending}
                      className="w-full mt-4"
                      data-testid="button-confirm-upload"
                    >
                      {bulkMutation.isPending ? "Uploading..." : "Upload All Grades"}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-grade">
                <Plus className="w-4 h-4 mr-2" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Grade Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="Enter student ID number"
                    data-testid="input-student-id"
                  />
                </div>
                <div>
                  <Label>Course</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                  >
                    <SelectTrigger data-testid="select-course">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="grade">Grade (0-100)</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) || 0 })}
                    data-testid="input-grade"
                  />
                </div>
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="e.g. 2023-2024"
                    data-testid="input-academic-year"
                  />
                </div>
                <div>
                  <Label htmlFor="term">Term</Label>
                  <Input
                    id="term"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="e.g. First Semester"
                    data-testid="input-term"
                  />
                </div>
                <Button
                  onClick={() => {
                    const courseIdNum = parseInt(formData.courseId, 10);
                    if (!formData.studentId || isNaN(courseIdNum) || !formData.academicYear || !formData.term) return;
                    createMutation.mutate({
                      userId: formData.studentId,
                      courseId: courseIdNum,
                      grade: formData.grade,
                      academicYear: formData.academicYear,
                      term: formData.term,
                    });
                  }}
                  disabled={createMutation.isPending || !formData.studentId || !formData.courseId || !formData.academicYear || !formData.term}
                  className="w-full"
                  data-testid="button-submit-grade"
                >
                  {createMutation.isPending ? "Saving..." : "Save Grade"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Filter by Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-64" data-testid="select-filter-course">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredEnrollments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Term</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                    <TableCell>{enrollment.userId}</TableCell>
                    <TableCell>{getCourseCode(enrollment.courseId)}</TableCell>
                    <TableCell>{enrollment.grade}</TableCell>
                    <TableCell>{enrollment.academicYear}</TableCell>
                    <TableCell>{enrollment.term}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No grade entries found. Add grades manually or upload from Excel.
            </p>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
