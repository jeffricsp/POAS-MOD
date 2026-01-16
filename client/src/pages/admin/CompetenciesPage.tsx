import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Target } from "lucide-react";
import type { Program, ProgramOutcome, Competency } from "@shared/schema";

export default function CompetenciesPage() {
  const { toast } = useToast();
  const [filterProgramId, setFilterProgramId] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createProgramId, setCreateProgramId] = useState<string>("");
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [selectedPoIds, setSelectedPoIds] = useState<number[]>([]);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [editForm, setEditForm] = useState({ programId: "", name: "", description: "" });
  const [editPoIds, setEditPoIds] = useState<number[]>([]);

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: allCompetencies = [], isLoading: competenciesLoading } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
  });

  const { data: allPOs = [] } = useQuery<ProgramOutcome[]>({
    queryKey: ["/api/program-outcomes"],
  });

  const filteredCompetencies = filterProgramId
    ? allCompetencies.filter((c) => c.programId === parseInt(filterProgramId))
    : allCompetencies;

  const programPOs = createProgramId
    ? allPOs.filter((po) => po.programId === parseInt(createProgramId))
    : [];

  const editProgramPOs = editForm.programId
    ? allPOs.filter((po) => po.programId === parseInt(editForm.programId))
    : [];

  const createMutation = useMutation({
    mutationFn: async (data: { programId: number; name: string; description: string; poIds: number[] }) => {
      return apiRequest("POST", "/api/competencies", {
        programId: data.programId,
        name: data.name,
        description: data.description,
        poIds: data.poIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      setIsCreateOpen(false);
      setCreateProgramId("");
      setCreateForm({ name: "", description: "" });
      setSelectedPoIds([]);
      toast({ title: "Competency created successfully" });
    },
    onError: () => toast({ title: "Failed to create competency", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; poIds: number[] } }) => {
      return apiRequest("PUT", `/api/competencies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      setEditingCompetency(null);
      setEditForm({ programId: "", name: "", description: "" });
      setEditPoIds([]);
      toast({ title: "Competency updated" });
    },
    onError: () => toast({ title: "Failed to update competency", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/competencies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competencies"] });
      toast({ title: "Competency deleted" });
    },
    onError: () => toast({ title: "Failed to delete competency", variant: "destructive" }),
  });

  const startEdit = async (comp: Competency) => {
    setEditingCompetency(comp);
    setEditForm({
      programId: comp.programId?.toString() || "",
      name: comp.name,
      description: comp.description || "",
    });
    try {
      const res = await fetch(`/api/competencies/${comp.id}/pos`, { credentials: "include" });
      if (res.ok) {
        const poIds = await res.json();
        setEditPoIds(poIds);
      }
    } catch (e) {
      setEditPoIds([]);
    }
  };

  const cancelEdit = () => {
    setEditingCompetency(null);
    setEditForm({ programId: "", name: "", description: "" });
    setEditPoIds([]);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      setCreateProgramId("");
      setCreateForm({ name: "", description: "" });
      setSelectedPoIds([]);
    }
  };

  const getProgramName = (programId: number | null) => {
    if (!programId) return "Unknown";
    const program = programs.find((p) => p.id === programId);
    return program ? program.code : "Unknown";
  };

  const getPoLabel = (poId: number) => {
    const po = allPOs.find((p) => p.id === poId);
    return po ? po.code : `PO ${poId}`;
  };

  const [competencyPoMap, setCompetencyPoMap] = useState<Record<number, number[]>>({});

  useEffect(() => {
    const fetchMappings = async () => {
      const map: Record<number, number[]> = {};
      for (const comp of allCompetencies) {
        try {
          const res = await fetch(`/api/competencies/${comp.id}/pos`, { credentials: "include" });
          if (res.ok) {
            map[comp.id] = await res.json();
          }
        } catch (e) {
          map[comp.id] = [];
        }
      }
      setCompetencyPoMap(map);
    };
    if (allCompetencies.length > 0) {
      fetchMappings();
    }
  }, [allCompetencies]);

  const isLoading = programsLoading || competenciesLoading;

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Competencies</h1>
          <p className="text-muted-foreground text-sm mt-1">Define competencies for employers to rate, mapped to program outcomes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-competency" disabled={programs.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Competency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Competency</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Program</Label>
                <Select
                  value={createProgramId}
                  onValueChange={(val) => {
                    setCreateProgramId(val);
                    setSelectedPoIds([]);
                  }}
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
                <Label htmlFor="name">Competency Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Communication Skills"
                  data-testid="input-competency-name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe the competency..."
                  className="resize-none"
                  data-testid="input-competency-description"
                />
              </div>
              {programPOs.length > 0 && (
                <div>
                  <Label>Map to Program Outcomes</Label>
                  <div className="border rounded-md p-3 mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {programPOs.map((po) => (
                      <div key={po.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`po-${po.id}`}
                          checked={selectedPoIds.includes(po.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPoIds([...selectedPoIds, po.id]);
                            } else {
                              setSelectedPoIds(selectedPoIds.filter((id) => id !== po.id));
                            }
                          }}
                        />
                        <label htmlFor={`po-${po.id}`} className="text-sm cursor-pointer">
                          <span className="font-medium">{po.code}</span>: {po.description}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={() => {
                  if (!createProgramId || !createForm.name) return;
                  createMutation.mutate({
                    programId: parseInt(createProgramId),
                    name: createForm.name,
                    description: createForm.description,
                    poIds: selectedPoIds,
                  });
                }}
                disabled={createMutation.isPending || !createProgramId || !createForm.name}
                className="w-full"
                data-testid="button-submit-competency"
              >
                {createMutation.isPending ? "Creating..." : "Create Competency"}
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
          {filteredCompetencies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Competency</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Mapped POs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompetencies.map((comp) => (
                  <TableRow key={comp.id} data-testid={`row-competency-${comp.id}`}>
                    <TableCell className="font-medium">{getProgramName(comp.programId)}</TableCell>
                    <TableCell>{comp.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{comp.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(competencyPoMap[comp.id] || []).map((poId) => (
                          <Badge key={poId} variant="secondary" className="text-xs">
                            {getPoLabel(poId)}
                          </Badge>
                        ))}
                        {(!competencyPoMap[comp.id] || competencyPoMap[comp.id].length === 0) && (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(comp)}
                          data-testid={`button-edit-competency-${comp.id}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this competency?")) {
                              deleteMutation.mutate(comp.id);
                            }
                          }}
                          data-testid={`button-delete-competency-${comp.id}`}
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
                ? "No competencies found for this program."
                : "No competencies defined yet. Create programs first, then add competencies."}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingCompetency} onOpenChange={(open) => !open && cancelEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Competency</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Program</Label>
              <Select
                value={editForm.programId}
                onValueChange={(value) => {
                  setEditForm({ ...editForm, programId: value });
                  setEditPoIds([]);
                }}
              >
                <SelectTrigger data-testid="select-edit-competency-program">
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
              <Label htmlFor="edit-name">Competency Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-competency-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="resize-none"
                data-testid="input-edit-competency-description"
              />
            </div>
            {editProgramPOs.length > 0 && (
              <div>
                <Label>Map to Program Outcomes</Label>
                <div className="border rounded-md p-3 mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {editProgramPOs.map((po) => (
                    <div key={po.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-po-${po.id}`}
                        checked={editPoIds.includes(po.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditPoIds([...editPoIds, po.id]);
                          } else {
                            setEditPoIds(editPoIds.filter((id) => id !== po.id));
                          }
                        }}
                      />
                      <label htmlFor={`edit-po-${po.id}`} className="text-sm cursor-pointer">
                        <span className="font-medium">{po.code}</span>: {po.description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={() => {
                if (!editingCompetency || !editForm.name) return;
                updateMutation.mutate({
                  id: editingCompetency.id,
                  data: {
                    name: editForm.name,
                    description: editForm.description,
                    poIds: editPoIds,
                  },
                });
              }}
              disabled={updateMutation.isPending || !editForm.name}
              className="w-full"
              data-testid="button-update-competency"
            >
              {updateMutation.isPending ? "Updating..." : "Update Competency"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
