import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Loader2, Target } from "lucide-react";
import type { Program, ProgramOutcome } from "@shared/schema";

export default function ProgramOutcomesPage() {
  const { toast } = useToast();
  const [filterProgramId, setFilterProgramId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createProgramId, setCreateProgramId] = useState<string>("");
  const [createForm, setCreateForm] = useState({ code: "", description: "" });
  const [editingPO, setEditingPO] = useState<ProgramOutcome | null>(null);
  const [editForm, setEditForm] = useState({ programId: "", code: "", description: "" });

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: allPOs = [], isLoading: posLoading } = useQuery<ProgramOutcome[]>({
    queryKey: ["/api/program-outcomes"],
  });

  const filteredPOs = filterProgramId
    ? allPOs.filter((po) => po.programId === parseInt(filterProgramId))
    : allPOs;

  const createMutation = useMutation({
    mutationFn: async (data: { programId: number; code: string; description: string }) => {
      return apiRequest("POST", `/api/programs/${data.programId}/pos`, {
        code: data.code,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-outcomes"] });
      setIsCreateOpen(false);
      setCreateProgramId("");
      setCreateForm({ code: "", description: "" });
      toast({ title: "Program Outcome created successfully" });
    },
    onError: () => toast({ title: "Failed to create PO", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ programId, poId, data }: { programId: number; poId: number; data: { code: string; description: string } }) => {
      return apiRequest("PUT", `/api/programs/${programId}/pos/${poId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-outcomes"] });
      setEditingPO(null);
      setEditForm({ programId: "", code: "", description: "" });
      toast({ title: "Program Outcome updated" });
    },
    onError: () => toast({ title: "Failed to update PO", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ programId, poId }: { programId: number; poId: number }) => {
      // Use the generic program outcome delete route from shared routes
      return apiRequest("DELETE", `/api/programs/${programId}/pos/${poId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/program-outcomes"] });
      toast({ title: "Program Outcome deleted" });
    },
    onError: () => toast({ title: "Failed to delete PO", variant: "destructive" }),
  });

  const startEdit = (po: ProgramOutcome) => {
    setEditingPO(po);
    setEditForm({
      programId: po.programId?.toString() || "",
      code: po.code,
      description: po.description,
    });
  };

  const cancelEdit = () => {
    setEditingPO(null);
    setEditForm({ programId: "", code: "", description: "" });
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setCreateProgramId("");
      setCreateForm({ code: "", description: "" });
    }
  };

  const getProgramName = (programId: number | null) => {
    if (!programId) return "Unknown";
    const program = programs.find((p) => p.id === programId);
    return program ? program.code : "Unknown";
  };

  const isLoading = programsLoading || posLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Program Outcomes</h1>
          <p className="text-muted-foreground text-sm mt-1">View and filter program outcomes by program</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-po" disabled={programs.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Outcome
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Program Outcome</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Program</Label>
                <Select
                  value={createProgramId}
                  onValueChange={setCreateProgramId}
                >
                  <SelectTrigger data-testid="select-create-program">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.code} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder="e.g., PO1"
                  data-testid="input-po-code"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe the program outcome..."
                  className="resize-none"
                  data-testid="input-po-description"
                />
              </div>
              <Button
                onClick={() => {
                  if (!createProgramId || !createForm.code || !createForm.description) return;
                  createMutation.mutate({
                    programId: parseInt(createProgramId),
                    code: createForm.code,
                    description: createForm.description,
                  });
                }}
                disabled={createMutation.isPending || !createProgramId || !createForm.code || !createForm.description}
                className="w-full"
                data-testid="button-submit-po"
              >
                {createMutation.isPending ? "Creating..." : "Create Outcome"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <Label>Filter by Program:</Label>
            </div>
            <Select
              value={filterProgramId || "all"}
              onValueChange={(value) => setFilterProgramId(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-64" data-testid="select-filter-program">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.code} - {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filteredPOs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => (
                  <TableRow key={po.id} data-testid={`row-po-${po.id}`}>
                    <TableCell className="font-medium">{getProgramName(po.programId)}</TableCell>
                    <TableCell>{po.code}</TableCell>
                    <TableCell className="max-w-md">{po.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(po)}
                          data-testid={`button-edit-po-${po.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this program outcome?")) {
                              deleteMutation.mutate({ programId: po.programId || 0, poId: po.id });
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
            <p className="text-center text-muted-foreground py-8">
              {filterProgramId
                ? "No program outcomes found for this program."
                : "No program outcomes defined yet. Create programs first, then add outcomes."}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingPO} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Program</Label>
              <Select
                value={editForm.programId}
                onValueChange={(value) => setEditForm({ ...editForm, programId: value })}
              >
                <SelectTrigger data-testid="select-edit-po-program">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.code} - {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                data-testid="input-edit-po-code"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="resize-none"
                data-testid="input-edit-po-description"
              />
            </div>
            <Button
              onClick={() => {
                if (!editingPO || !editForm.programId || !editForm.code || !editForm.description) return;
                updateMutation.mutate({
                  programId: parseInt(editForm.programId),
                  poId: editingPO.id,
                  data: {
                    code: editForm.code,
                    description: editForm.description,
                  },
                });
              }}
              disabled={updateMutation.isPending || !editForm.programId || !editForm.code || !editForm.description}
              className="w-full"
              data-testid="button-update-po"
            >
              {updateMutation.isPending ? "Updating..." : "Update Outcome"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
