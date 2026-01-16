import { Shell } from "@/components/layout/Shell";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, TrendingUp, TrendingDown, Minus, BarChart3, Users, BookOpen, MessageSquare, Filter, Calendar, Lightbulb, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import * as XLSX from "xlsx";
import type { Program } from "@shared/schema";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2"];

export default function Reports() {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: analytics, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/analytics", { programId: selectedProgramId, year: selectedYear }],
    queryFn: async ({ queryKey }: any) => {
      const [_key, { programId, year }] = queryKey;
      const params = new URLSearchParams();
      if (programId !== "all") params.append("programId", programId);
      if (year !== "all") params.append("year", year);
      const url = `/api/analytics${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    }
  });

  const selectedProgram = programs.find(p => p.id.toString() === selectedProgramId);
  const isBoardProgram = selectedProgram?.type === 'board';

  const exportToExcel = () => {
    if (!analytics) return;
    
    const wb = XLSX.utils.book_new();
    
    const poData = analytics.poAnalytics.map((item: any) => ({
      "PO Code": item.po.code,
      "Description": item.po.description,
      "Grade Avg": item.avgGrade,
      "Grade Count": item.gradeCount,
      "Survey Avg": item.avgSurvey,
      "Survey Count": item.surveyCount,
      "Feedback Avg": item.avgFeedback,
      "Feedback Count": item.feedbackCount,
      "Board Exam Score": item.isBoardProgram ? item.boardExamScore : "N/A",
      "Overall Score": item.overallScore,
    }));
    const ws1 = XLSX.utils.json_to_sheet(poData);
    XLSX.utils.book_append_sheet(wb, ws1, "PO Analytics");

    if (analytics.trendData?.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(analytics.trendData);
      XLSX.utils.book_append_sheet(wb, ws2, "Grade Trends");
    }

    if (analytics.boardExamTrend?.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(analytics.boardExamTrend);
      XLSX.utils.book_append_sheet(wb, ws3, "Board Exam Trends");
    }

    if (analytics.surveyTrend?.length > 0) {
      const ws4 = XLSX.utils.json_to_sheet(analytics.surveyTrend);
      XLSX.utils.book_append_sheet(wb, ws4, "Survey Trends");
    }

    if (analytics.feedbackTrend?.length > 0) {
      const ws5 = XLSX.utils.json_to_sheet(analytics.feedbackTrend);
      XLSX.utils.book_append_sheet(wb, ws5, "Feedback Trends");
    }

    const summaryData = [{
      "Total Courses": analytics.summary.totalCourses,
      "Total POs": analytics.summary.totalPOs,
      "Total Enrollments": analytics.summary.totalEnrollments,
      "Total Survey Responses": analytics.summary.totalSurveyResponses,
      "Total Employer Feedback": analytics.summary.totalFeedback,
    }];
    const ws6 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws6, "Summary");

    XLSX.writeFile(wb, `po_analytics_report${selectedYear !== 'all' ? `_${selectedYear}` : ''}.xlsx`);
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Failed to load analytics data. Please try again.
        </div>
      </Shell>
    );
  }

  const barData = (analytics?.poAnalytics || []).map((item: any) => ({
    name: item.po.code,
    "Course Grades": item.avgGrade ? (item.avgGrade / 100 * 5).toFixed(1) : 0,
    "Self Assessment": item.avgSurvey || 0,
    "Employer Feedback": item.avgFeedback || 0,
    "Board Exam": item.isBoardProgram ? item.boardExamScore : 0,
  }));

  const radarData = (analytics?.poAnalytics || []).map((item: any) => ({
    subject: item.po.code,
    score: item.overallScore || 0,
    fullMark: 5,
  }));

  const pieData = [
    { name: "Course Grades", value: analytics?.summary?.totalEnrollments || 0 },
    { name: "Survey Responses", value: analytics?.summary?.totalSurveyResponses || 0 },
    { name: "Employer Feedback", value: analytics?.summary?.totalFeedback || 0 },
  ].filter(d => d.value > 0);

  const getAttainmentDecision = (score: number) => {
    if (score >= 4.5) return "Highly Attained";
    if (score >= 4.0) return "Attained";
    if (score >= 3.0) return "Partially Attained / Needs Improvement";
    return "Not Attained";
  };

  const getAttainmentColor = (score: number) => {
    if (score >= 4.0) return "text-green-600";
    if (score >= 3.0) return "text-yellow-600";
    return "text-red-500";
  };

  const generateRecommendations = () => {
    const recommendations: { type: 'success' | 'warning' | 'danger' | 'info'; title: string; description: string }[] = [];
    
    const poAnalytics = analytics?.poAnalytics || [];
    
    const lowPerformingPOs = poAnalytics.filter((p: any) => p.overallScore < 3.0);
    const moderatePerformingPOs = poAnalytics.filter((p: any) => p.overallScore >= 3.0 && p.overallScore < 4.0);
    const highPerformingPOs = poAnalytics.filter((p: any) => p.overallScore >= 4.0);
    
    if (lowPerformingPOs.length > 0) {
      const poCodes = lowPerformingPOs.map((p: any) => p.po.code).join(", ");
      recommendations.push({
        type: 'danger',
        title: 'Critical Attention Required',
        description: `${poCodes} ${lowPerformingPOs.length === 1 ? 'is' : 'are'} scoring below 3.0. Consider curriculum review, additional teaching resources, or supplementary training programs to address these gaps.`
      });
    }

    if (moderatePerformingPOs.length > 0) {
      const poCodes = moderatePerformingPOs.map((p: any) => p.po.code).join(", ");
      recommendations.push({
        type: 'warning',
        title: 'Improvement Opportunities',
        description: `${poCodes} ${moderatePerformingPOs.length === 1 ? 'shows' : 'show'} moderate attainment (3.0-3.99). Targeted interventions such as peer tutoring, additional practice exercises, or industry mentorship could help elevate these outcomes.`
      });
    }

    if (highPerformingPOs.length > 0) {
      const poCodes = highPerformingPOs.map((p: any) => p.po.code).join(", ");
      recommendations.push({
        type: 'success',
        title: 'Strong Performance',
        description: `${poCodes} ${highPerformingPOs.length === 1 ? 'demonstrates' : 'demonstrate'} strong attainment. Continue current teaching strategies and consider documenting best practices to apply to other outcomes.`
      });
    }

    const lowFeedbackPOs = poAnalytics.filter((p: any) => p.feedbackCount < 5 && p.avgFeedback === 0);
    if (lowFeedbackPOs.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Increase Employer Engagement',
        description: 'Some program outcomes lack sufficient employer feedback. Consider expanding industry partnerships and conducting more employer surveys to get comprehensive assessment data.'
      });
    }

    const lowSurveyPOs = poAnalytics.filter((p: any) => p.surveyCount < 10 && p.avgSurvey === 0);
    if (lowSurveyPOs.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Boost Survey Participation',
        description: 'Survey response rates for some outcomes are low. Consider incentivizing survey completion or sending reminder notifications to increase self-assessment data collection.'
      });
    }

    const boardExamTrend = analytics?.boardExamTrend || [];
    if (boardExamTrend.length >= 2) {
      const latest = boardExamTrend[boardExamTrend.length - 1];
      const previous = boardExamTrend[boardExamTrend.length - 2];
      if (latest.passingRate < previous.passingRate) {
        recommendations.push({
          type: 'warning',
          title: 'Board Exam Passing Rate Declining',
          description: `Board exam passing rate dropped from ${previous.passingRate}% (${previous.year}) to ${latest.passingRate}% (${latest.year}). Review board exam preparation programs and consider additional review sessions.`
        });
      } else if (latest.passingRate > previous.passingRate) {
        recommendations.push({
          type: 'success',
          title: 'Board Exam Performance Improving',
          description: `Board exam passing rate improved from ${previous.passingRate}% to ${latest.passingRate}%. Current preparation strategies are effective.`
        });
      }
    }

    const feedbackTrend = analytics?.feedbackTrend || [];
    if (feedbackTrend.length >= 2) {
      const latest = feedbackTrend[feedbackTrend.length - 1];
      const previous = feedbackTrend[feedbackTrend.length - 2];
      if (latest.avgRating < previous.avgRating) {
        recommendations.push({
          type: 'warning',
          title: 'Employer Satisfaction Declining',
          description: `Average employer rating decreased from ${previous.avgRating} to ${latest.avgRating}. Review industry needs and align curriculum with current market demands.`
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        title: 'Collect More Data',
        description: 'Not enough data available for comprehensive recommendations. Continue collecting grades, survey responses, and employer feedback to enable better analysis.'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <Shell>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive PO achievement analysis from all data sources
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-[150px]">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger data-testid="select-year-filter">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {(analytics?.availableYears || []).map((year: string) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 min-w-[180px]">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger data-testid="select-program-filter">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportToExcel} data-testid="button-export-excel">
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card data-testid="card-stat-courses">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary?.totalCourses || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-pos">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Program Outcomes</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary?.totalPOs || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-enrollments">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Grade Entries</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary?.totalEnrollments || 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-feedback">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Items</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.summary?.totalSurveyResponses || 0) + (analytics?.summary?.totalFeedback || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <Card data-testid="card-chart-comparison">
          <CardHeader>
            <CardTitle>PO Achievement by Data Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Course Grades" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Self Assessment" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Employer Feedback" fill="#db2777" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Board Exam" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-chart-radar">
          <CardHeader>
            <CardTitle>Overall PO Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#7c3aed"
                    fill="#7c3aed"
                    fillOpacity={0.5}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        {isBoardProgram && analytics?.boardExamTrend?.length > 0 && (
          <Card data-testid="card-chart-board-exam-trend">
            <CardHeader>
              <CardTitle>Board Exam Results by Year</CardTitle>
              <CardDescription>Passing rate trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.boardExamTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Passing Rate']} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="passingRate"
                      stroke="#ea580c"
                      fill="#ea580c"
                      fillOpacity={0.3}
                      name="Passing Rate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {!isBoardProgram && analytics?.trendData?.length > 0 && (
          <Card data-testid="card-chart-grades-trend">
            <CardHeader>
              <CardTitle>Grade Trends by Term</CardTitle>
              <CardDescription>Average course grades over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="term" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value: any) => [`${value}%`, 'Avg Grade']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgGrade"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                      name="Average Grade"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics?.surveyTrend?.length > 0 && (
          <Card data-testid="card-chart-survey-trend">
            <CardHeader>
              <CardTitle>Survey Analysis by Year</CardTitle>
              <CardDescription>Self-assessment rating trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.surveyTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" domain={[0, 5]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgRating"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={{ fill: "#7c3aed" }}
                      name="Average Rating"
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      dataKey="responses"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ fill: "#16a34a" }}
                      name="Response Count"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        {analytics?.feedbackTrend?.length > 0 && (
          <Card className="lg:col-span-2" data-testid="card-chart-feedback-trend">
            <CardHeader>
              <CardTitle>Employer Feedback by Batch Year</CardTitle>
              <CardDescription>Graduate competency ratings from employers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.feedbackTrend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" domain={[0, 5]} label={{ value: 'Rating', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Count', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgRating" fill="#db2777" radius={[4, 4, 0, 0]} name="Avg Rating" />
                    <Bar yAxisId="right" dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} name="Feedback Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-chart-distribution">
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6" data-testid="card-po-details">
        <CardHeader>
          <CardTitle>PO Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.poAnalytics?.map((item: any) => {
              const score = item.overallScore || 0;
              const trend = score >= 3 ? "up" : score >= 2 ? "neutral" : "down";
              return (
                <div
                  key={item.po.id}
                  className="flex items-center justify-between p-4 rounded-lg border flex-wrap gap-4"
                  data-testid={`row-po-${item.po.id}`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.po.code}</span>
                      {trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {trend === "neutral" && <Minus className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.po.description}</p>
                  </div>
                  <div className="flex gap-6 text-center flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground">Grades</div>
                      <div className="font-medium">{item.avgGrade || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Surveys</div>
                      <div className="font-medium">{item.avgSurvey || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Feedback</div>
                      <div className="font-medium">{item.avgFeedback || "-"}</div>
                    </div>
                    {item.isBoardProgram && (
                      <div>
                        <div className="text-xs text-muted-foreground">Board Exam</div>
                        <div className="font-medium">{item.boardExamScore || "-"}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Overall</div>
                      <div className={`font-bold ${getAttainmentColor(score)}`}>
                        {score}/5
                      </div>
                    </div>
                    <div className="min-w-[120px]">
                      <div className="text-xs text-muted-foreground">Decision</div>
                      <div className={`font-bold text-sm ${getAttainmentColor(score)}`}>
                        {getAttainmentDecision(score)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold mb-3">Attainment Legend</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-md bg-muted/50 border">
                <div className="text-sm font-bold text-green-600">Highly Attained</div>
                <div className="text-xs text-muted-foreground">4.50 - 5.00</div>
                <div className="text-[10px] text-muted-foreground mt-1">Strong consensus PO is achieved</div>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border">
                <div className="text-sm font-bold text-green-600">Attained</div>
                <div className="text-xs text-muted-foreground">4.00 - 4.49</div>
                <div className="text-[10px] text-muted-foreground mt-1">Expected level of achievement</div>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border">
                <div className="text-sm font-bold text-yellow-600">Partially Attained / Needs Improvement</div>
                <div className="text-xs text-muted-foreground">3.00 - 3.99</div>
                <div className="text-[10px] text-muted-foreground mt-1">Moderate perception, some gaps</div>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border">
                <div className="text-sm font-bold text-red-500">Not Attained</div>
                <div className="text-xs text-muted-foreground">Below 3.00</div>
                <div className="text-[10px] text-muted-foreground mt-1">Major gaps, action needed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6" data-testid="card-recommendations">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle>Prescriptive Analytics & Recommendations</CardTitle>
          </div>
          <CardDescription>
            Data-driven suggestions to improve program outcomes based on current performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border flex gap-4 items-start ${
                  rec.type === 'danger' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900' :
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900' :
                  rec.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' :
                  'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900'
                }`}
                data-testid={`recommendation-${index}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {rec.type === 'danger' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  {rec.type === 'warning' && <Target className="w-5 h-5 text-yellow-600" />}
                  {rec.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {rec.type === 'info' && <Lightbulb className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    rec.type === 'danger' ? 'text-red-700 dark:text-red-400' :
                    rec.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                    rec.type === 'success' ? 'text-green-700 dark:text-green-400' :
                    'text-blue-700 dark:text-blue-400'
                  }`}>
                    {rec.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Shell>
  );
}
