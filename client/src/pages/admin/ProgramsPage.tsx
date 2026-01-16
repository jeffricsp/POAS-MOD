import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Target, Award } from "lucide-react";
import type { Program, ProgramOutcome, User, BoardExamResult } from "@shared/schema";

export default function ProgramsPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPOOpen, setIsPOOpen] = useState(false);
  const [isBoardExamOpen, setIsBoardExamOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programPOs, setProgramPOs] = useState<ProgramOutcome[]>([]);
  const [boardExams, setBoardExams] = useState<BoardExamResult[]>([]);
  const [editingPO, setEditingPO] = useState<ProgramOutcome | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "non_board" as "board" | "non_board",
    programHeadId: "",
  });
  const [poForm, setPoForm] = useState({ code: "", description: "" });
  const [examForm, setExamForm] = useState({
    examName: "",
    examDate: "",
    passers: 0,
    takers: 0,
    notes: "",
  });

  const { data: programs = [], isLoading, isError } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const programHeads = users.filter((u) => u.role === "program_head" && u.id);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/programs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Program created successfully" });
    },
    onError: () => toast({ title: "Failed to create program", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/programs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setIsEditOpen(false);
      setSelectedProgram(null);
      toast({ title: "Program updated successfully" });
    },
    onError: () => toast({ title: "Failed to update program", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({ title: "Program deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete program", variant: "destructive" }),
  });

  const createPOMutation = useMutation({
    mutationFn: async ({ programId, data }: { programId: number; data: { code: string; description: string } }) => {
      return apiRequest("POST", `/api/programs/${programId}/pos`, data);
    },
    onSuccess: () => {
      if (selectedProgram) fetchProgramPOs(selectedProgram.id);
      setPoForm({ code: "", description: "" });
      toast({ title: "Program Outcome added" });
    },
    onError: () => toast({ title: "Failed to add PO", variant: "destructive" }),
  });

  const updatePOMutation = useMutation({
    mutationFn: async ({ programId, poId, data }: { programId: number; poId: number; data: { code: string; description: string } }) => {
      return apiRequest("PUT", `/api/programs/${programId}/pos/${poId}`, data);
    },
    onSuccess: () => {
      if (selectedProgram) fetchProgramPOs(selectedProgram.id);
      setEditingPO(null);
      setPoForm({ code: "", description: "" });
      toast({ title: "Program Outcome updated" });
    },
    onError: () => toast({ title: "Failed to update PO", variant: "destructive" }),
  });

  const deletePOMutation = useMutation({
    mutationFn: async ({ programId, poId }: { programId: number; poId: number }) => {
      return apiRequest("DELETE", `/api/programs/${programId}/pos/${poId}`);
    },
    onSuccess: () => {
      if (selectedProgram) fetchProgramPOs(selectedProgram.id);
      toast({ title: "Program Outcome deleted" });
    },
    onError: () => toast({ title: "Failed to delete PO", variant: "destructive" }),
  });

  const createExamMutation = useMutation({
    mutationFn: async ({ programId, data }: { programId: number; data: any }) => {
      return apiRequest("POST", `/api/programs/${programId}/board-exams`, data);
    },
    onSuccess: () => {
      if (selectedProgram) {
        fetchBoardExams(selectedProgram.id);
      }
      setExamForm({ examName: "", examDate: "", passers: 0, takers: 0, notes: "" });
      toast({ title: "Board exam result added" });
    },
    onError: () => toast({ title: "Failed to add exam result", variant: "destructive" }),
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/board-exams/${id}`);
    },
    onSuccess: () => {
      if (selectedProgram) {
        fetchBoardExams(selectedProgram.id);
      }
      toast({ title: "Board exam result deleted" });
    },
    onError: () => toast({ title: "Failed to delete exam result", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormData({ code: "", name: "", type: "non_board", programHeadId: "" });
  };

  const openEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      code: program.code,
      name: program.name,
      type: program.type as "board" | "non_board",
      programHeadId: program.programHeadId || "",
    });
    setIsEditOpen(true);
  };

  const fetchProgramPOs = async (programId: number) => {
    try {
      // Add cache-busting timestamp to bypass browser/server caching
      const res = await fetch(`/api/programs/${programId}/pos?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setProgramPOs(data);
    } catch (error) {
      console.error("Error fetching program POs:", error);
      setProgramPOs([]);
    }
  };

  const openPOManagement = async (program: Program) => {
    setSelectedProgram(program);
    await fetchProgramPOs(program.id);
    setPoForm({ code: "", description: "" });
    setEditingPO(null);
    setIsPOOpen(true);
  };

  const fetchBoardExams = async (programId: number) => {
    try {
      const res = await fetch(`/api/programs/${programId}/board-exams`);
      const data = await res.json();
      setBoardExams(data);
    } catch {
      setBoardExams([]);
    }
  };

  const openBoardExams = async (program: Program) => {
    setSelectedProgram(program);
    await fetchBoardExams(program.id);
    setIsBoardExamOpen(true);
  };

  const startEditPO = (po: ProgramOutcome) => {
    setEditingPO(po);
    setPoForm({ code: po.code, description: po.description });
  };

  const cancelEditPO = () => {
    setEditingPO(null);
    setPoForm({ code: "", description: "" });
  };

  const getProgramHeadName = (headId: string | null) => {
    if (!headId) return "Not assigned";
    const head = users.find((u) => u.id === headId);
    return head ? `${head.firstName || ""} ${head.lastName || ""}`.trim() || head.email : "Unknown";
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
          Failed to load programs. Please try again.
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Program Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-program">
              <Plus className="w-4 h-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="code">Program Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., BSIT"
                  data-testid="input-program-code"
                />
              </div>
              <div>
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bachelor of Science in Information Technology"
                  data-testid="input-program-name"
                />
              </div>
              <div>
                <Label>Program Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "board" | "non_board") => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-program-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_board">Non-Board Program</SelectItem>
                    <SelectItem value="board">Board Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Program Head</Label>
                <Select
                  value={formData.programHeadId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, programHeadId: value === "none" ? "" : value })}
                >
                  <SelectTrigger data-testid="select-program-head">
                    <SelectValue placeholder="Select program head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {programHeads.map((head) => (
                      <SelectItem key={head.id} value={head.id}>
                        {head.firstName || ""} {head.lastName || ""} ({head.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createMutation.mutate({
                  ...formData,
                  programHeadId: formData.programHeadId || null,
                })}
                disabled={createMutation.isPending || !formData.code || !formData.name}
                className="w-full"
                data-testid="button-submit-program"
              >
                {createMutation.isPending ? "Creating..." : "Create Program"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {programs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Program Head</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id} data-testid={`row-program-${program.id}`}>
                    <TableCell className="font-medium">{program.code}</TableCell>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>
                      <Badge variant={program.type === "board" ? "default" : "secondary"}>
                        {program.type === "board" ? "Board" : "Non-Board"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getProgramHeadName(program.programHeadId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(program)}
                          data-testid={`button-edit-program-${program.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {program.type === "board" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openBoardExams(program)}
                            data-testid={`button-board-exams-${program.id}`}
                          >
                            <Award className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this program? This will also delete all associated outcomes and exam results.")) {
                              deleteMutation.mutate(program.id);
                            }
                          }}
                          data-testid={`button-delete-program-${program.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No programs found. Add your first program to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-code">Program Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                data-testid="input-edit-program-code"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Program Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-program-name"
              />
            </div>
            <div>
              <Label>Program Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "board" | "non_board") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger data-testid="select-edit-program-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_board">Non-Board Program</SelectItem>
                  <SelectItem value="board">Board Program</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Program Head</Label>
              <Select
                value={formData.programHeadId || "none"}
                onValueChange={(value) => setFormData({ ...formData, programHeadId: value === "none" ? "" : value })}
              >
                <SelectTrigger data-testid="select-edit-program-head">
                  <SelectValue placeholder="Select program head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {programHeads.map((head) => (
                    <SelectItem key={head.id} value={head.id}>
                      {head.firstName || ""} {head.lastName || ""} ({head.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!selectedProgram) return;
                updateMutation.mutate({
                  id: selectedProgram.id,
                  data: {
                    ...formData,
                    programHeadId: formData.programHeadId || null,
                  },
                });
              }}
              disabled={updateMutation.isPending}
              className="w-full"
              data-testid="button-update-program"
            >
              {updateMutation.isPending ? "Updating..." : "Update Program"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPOOpen} onOpenChange={setIsPOOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Program Outcomes - {selectedProgram?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{editingPO ? "Edit Program Outcome" : "Add New Program Outcome"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor="poCode">Code</Label>
                    <Input
                      id="poCode"
                      value={poForm.code}
                      onChange={(e) => setPoForm({ ...poForm, code: e.target.value })}
                      placeholder="e.g., PO1"
                      data-testid="input-po-code"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor="poDescription">Description</Label>
                    <Textarea
                      id="poDescription"
                      value={poForm.description}
                      onChange={(e) => setPoForm({ ...poForm, description: e.target.value })}
                      placeholder="Describe the program outcome..."
                      className="resize-none"
                      data-testid="input-po-description"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingPO ? (
                    <>
                      <Button
                        onClick={() => {
                          if (!selectedProgram || !editingPO) return;
                          updatePOMutation.mutate({ programId: selectedProgram.id, poId: editingPO.id, data: poForm });
                        }}
                        disabled={updatePOMutation.isPending || !poForm.code || !poForm.description}
                        size="sm"
                        data-testid="button-update-po"
                      >
                        {updatePOMutation.isPending ? "Updating..." : "Update PO"}
                      </Button>
                      <Button onClick={cancelEditPO} variant="outline" size="sm" data-testid="button-cancel-edit-po">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!selectedProgram || !poForm.code || !poForm.description) return;
                        createPOMutation.mutate({ programId: selectedProgram.id, data: poForm });
                      }}
                      disabled={createPOMutation.isPending || !poForm.code || !poForm.description}
                      size="sm"
                      data-testid="button-add-po"
                    >
                      {createPOMutation.isPending ? "Adding..." : "Add PO"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {programPOs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programPOs.map((po) => (
                    <TableRow key={po.id} data-testid={`row-po-${po.id}`}>
                      <TableCell className="font-medium">{po.code}</TableCell>
                      <TableCell className="text-sm">{po.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditPO(po)}
                            data-testid={`button-edit-po-${po.id}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (!selectedProgram) return;
                              if (window.confirm("Are you sure you want to delete this program outcome?")) {
                                deletePOMutation.mutate({ programId: selectedProgram.id, poId: po.id });
                              }
                            }}
                            data-testid={`button-delete-po-${po.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No program outcomes defined yet. Add your first PO above.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBoardExamOpen} onOpenChange={setIsBoardExamOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Board Exam Results - {selectedProgram?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Add New Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="examName">Exam Name</Label>
                    <Input
                      id="examName"
                      value={examForm.examName}
                      onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                      placeholder="e.g., October 2025"
                      data-testid="input-exam-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="examDate">Exam Date</Label>
                    <Input
                      id="examDate"
                      value={examForm.examDate}
                      onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                      placeholder="e.g., 2025-10-15"
                      data-testid="input-exam-date"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="passers">Passers</Label>
                    <Input
                      id="passers"
                      type="number"
                      value={examForm.passers}
                      onChange={(e) => setExamForm({ ...examForm, passers: parseInt(e.target.value) || 0 })}
                      data-testid="input-passers"
                    />
                  </div>
                  <div>
                    <Label htmlFor="takers">Takers</Label>
                    <Input
                      id="takers"
                      type="number"
                      value={examForm.takers}
                      onChange={(e) => setExamForm({ ...examForm, takers: parseInt(e.target.value) || 0 })}
                      data-testid="input-takers"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={examForm.notes}
                    onChange={(e) => setExamForm({ ...examForm, notes: e.target.value })}
                    placeholder="Optional notes"
                    data-testid="input-exam-notes"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!selectedProgram || !examForm.examName) return;
                    createExamMutation.mutate({ 
                      programId: selectedProgram.id, 
                      data: {
                        examName: examForm.examName,
                        examDate: examForm.examDate,
                        passers: Number(examForm.passers),
                        takers: Number(examForm.takers),
                        notes: examForm.notes
                      }
                    });
                  }}
                  disabled={createExamMutation.isPending || !examForm.examName}
                  size="sm"
                  data-testid="button-add-exam"
                >
                  {createExamMutation.isPending ? "Adding..." : "Add Result"}
                </Button>
              </CardContent>
            </Card>

            {boardExams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Passers</TableHead>
                    <TableHead>Takers</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boardExams.map((exam) => (
                    <TableRow key={exam.id} data-testid={`row-exam-${exam.id}`}>
                      <TableCell>{exam.examName}</TableCell>
                      <TableCell>{exam.examDate || "-"}</TableCell>
                      <TableCell>{exam.passers}</TableCell>
                      <TableCell>{exam.takers}</TableCell>
                      <TableCell>
                        <Badge variant={exam.takers > 0 ? (exam.passers / exam.takers >= 0.5 ? "default" : "destructive") : "secondary"}>
                          {exam.takers > 0 ? `${((exam.passers / exam.takers) * 100).toFixed(1)}%` : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this board exam result?")) {
                              deleteExamMutation.mutate(exam.id);
                            }
                          }}
                          data-testid={`button-delete-exam-${exam.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No board exam results recorded yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
