import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Star, Loader2 } from "lucide-react";
import type { Program, Competency, CompetencyRating, ProgramOutcome } from "@shared/schema";

export default function FeedbackPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [graduateName, setGraduateName] = useState("");
  const [batch, setBatch] = useState("");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [filterProgramId, setFilterProgramId] = useState<string>("");

  const isEmployer = user?.role === 'employer';
  const isProgramHead = user?.role === 'program_head' || user?.role === 'admin';

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: allCompetencies = [], isLoading: competenciesLoading } = useQuery<Competency[]>({
    queryKey: ["/api/competencies"],
  });

  const { data: allRatings = [], isLoading: ratingsLoading } = useQuery<CompetencyRating[]>({
    queryKey: ["/api/competency-ratings"],
  });

  const { data: allPOs = [] } = useQuery<ProgramOutcome[]>({
    queryKey: ["/api/program-outcomes"],
  });

  const filteredCompetencies = selectedProgramId
    ? allCompetencies.filter((c) => c.programId === parseInt(selectedProgramId))
    : [];

  const filteredRatings = filterProgramId
    ? allRatings.filter((r) => {
        const comp = allCompetencies.find((c) => c.id === r.competencyId);
        return comp && comp.programId === parseInt(filterProgramId);
      })
    : allRatings;

  const createMutation = useMutation({
    mutationFn: async (data: any[]) => {
      return apiRequest("POST", "/api/competency-ratings/bulk", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competency-ratings"] });
      setIsRatingOpen(false);
      setSelectedProgramId("");
      setGraduateName("");
      setBatch("");
      setRatings({});
      setComments({});
      toast({ title: "Ratings submitted successfully" });
    },
    onError: () => toast({ title: "Failed to submit ratings", variant: "destructive" }),
  });

  const handleSubmitRatings = () => {
    if (!graduateName.trim()) {
      toast({ title: "Please enter graduate name", variant: "destructive" });
      return;
    }

    const ratingData = filteredCompetencies
      .filter((c) => ratings[c.id] !== undefined)
      .map((c) => ({
        competencyId: c.id,
        employerId: user?.id || null,
        employerName: user?.firstName || user?.username || "Anonymous",
        graduateName: graduateName.trim(),
        batch: batch.trim() || null,
        rating: ratings[c.id],
        comment: comments[c.id] || null,
      }));

    if (ratingData.length === 0) {
      toast({ title: "Please rate at least one competency", variant: "destructive" });
      return;
    }

    createMutation.mutate(ratingData);
  };

  const getProgramName = (programId: number) => {
    const program = programs.find((p) => p.id === programId);
    return program ? program.code : "Unknown";
  };

  const getCompetencyName = (competencyId: number) => {
    const comp = allCompetencies.find((c) => c.id === competencyId);
    return comp ? comp.name : `Competency ${competencyId}`;
  };

  const renderStars = (rating: number, onSelect?: (val: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect?.(star)}
            className={onSelect ? "p-0.5 cursor-pointer" : "p-0"}
            disabled={!onSelect}
          >
            <Star
              className={`w-5 h-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    return labels[rating] || "";
  };

  const isLoading = competenciesLoading || ratingsLoading;

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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Competency Ratings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEmployer ? "Rate graduate competencies on a 5-point scale" : "View employer competency ratings for graduates"}
          </p>
        </div>
        {isEmployer && (
          <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-rate-competencies" disabled={allCompetencies.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Rate Graduate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Rate Graduate Competencies</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Select Program</Label>
                  <Select
                    value={selectedProgramId}
                    onValueChange={(val) => {
                      setSelectedProgramId(val);
                      setRatings({});
                      setComments({});
                    }}
                  >
                    <SelectTrigger data-testid="select-program">
                      <SelectValue placeholder="Choose a program" />
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
                  <Label htmlFor="graduateName">Graduate Name</Label>
                  <Input
                    id="graduateName"
                    value={graduateName}
                    onChange={(e) => setGraduateName(e.target.value)}
                    placeholder="Enter the graduate's name"
                    data-testid="input-graduate-name"
                  />
                </div>

                <div>
                  <Label htmlFor="batch">Batch / Year Graduated</Label>
                  <Input
                    id="batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. 2024"
                    data-testid="input-batch"
                  />
                </div>

                {filteredCompetencies.length > 0 && (
                  <div className="space-y-4">
                    <Label>Rate Each Competency (1-5 scale)</Label>
                    <div className="border rounded-md divide-y">
                      {filteredCompetencies.map((comp) => (
                        <div key={comp.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium">{comp.name}</p>
                              {comp.description && (
                                <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {renderStars(ratings[comp.id] || 0, (val) =>
                                setRatings({ ...ratings, [comp.id]: val })
                              )}
                              {ratings[comp.id] && (
                                <span className="text-xs text-muted-foreground">
                                  {getRatingLabel(ratings[comp.id])}
                                </span>
                              )}
                            </div>
                          </div>
                          <Textarea
                            placeholder="Optional comment..."
                            value={comments[comp.id] || ""}
                            onChange={(e) => setComments({ ...comments, [comp.id]: e.target.value })}
                            className="resize-none text-sm"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProgramId && filteredCompetencies.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No competencies defined for this program yet.
                  </p>
                )}

                <Button
                  onClick={handleSubmitRatings}
                  disabled={createMutation.isPending || !graduateName || Object.keys(ratings).length === 0}
                  className="w-full"
                  data-testid="button-submit-ratings"
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Ratings"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="ratings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ratings" data-testid="tab-ratings">Ratings</TabsTrigger>
          {isProgramHead && <TabsTrigger value="summary" data-testid="tab-summary">Summary</TabsTrigger>}
        </TabsList>

        <TabsContent value="ratings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Rating History</CardTitle>
                  <CardDescription>All competency ratings submitted by employers</CardDescription>
                </div>
                <Select
                  value={filterProgramId || "all"}
                  onValueChange={(value) => setFilterProgramId(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-48" data-testid="select-filter-program">
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRatings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Graduate</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Competency</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Employer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRatings.map((rating) => {
                      const comp = allCompetencies.find((c) => c.id === rating.competencyId);
                      return (
                        <TableRow key={rating.id} data-testid={`row-rating-${rating.id}`}>
                          <TableCell className="font-medium">{rating.graduateName || "-"}</TableCell>
                          <TableCell>{rating.batch || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{comp ? getProgramName(comp.programId) : "-"}</Badge>
                          </TableCell>
                          <TableCell>{getCompetencyName(rating.competencyId)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {renderStars(rating.rating)}
                              <span className="text-xs text-muted-foreground">{getRatingLabel(rating.rating)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{rating.comment || "-"}</TableCell>
                          <TableCell>{rating.employerName || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No ratings submitted yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isProgramHead && (
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Competency Summary</CardTitle>
                <CardDescription>Average ratings per competency across all graduates</CardDescription>
              </CardHeader>
              <CardContent>
                {allCompetencies.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Competency</TableHead>
                        <TableHead>Avg Rating</TableHead>
                        <TableHead>Total Ratings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allCompetencies.map((comp) => {
                        const compRatings = allRatings.filter((r) => r.competencyId === comp.id);
                        const avgRating = compRatings.length > 0
                          ? compRatings.reduce((sum, r) => sum + r.rating, 0) / compRatings.length
                          : 0;
                        return (
                          <TableRow key={comp.id}>
                            <TableCell>
                              <Badge variant="outline">{getProgramName(comp.programId)}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{comp.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {renderStars(Math.round(avgRating))}
                                <span className="text-sm text-muted-foreground">
                                  ({avgRating.toFixed(1)})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{compRatings.length}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No competencies defined yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </Shell>
  );
}
