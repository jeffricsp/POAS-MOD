import { db } from "./db";
import { 
  programOutcomes, courses, enrollments, surveys, surveyQuestions, surveyResponses, surveyAnswers, users, invitations,
  coursePoMappings, notifications, employerFeedback, surveyCourseLinks, programs, programPoMappings, boardExamResults,
  competencies, competencyPoMappings, competencyRatings,
  type InsertUser, type User, type ProgramOutcome, type Course, type Survey, type SurveyQuestion, type SurveyResponse,
  type CoursePoMapping, type Notification, type EmployerFeedback, type Enrollment, type Program, type ProgramPoMapping, type BoardExamResult,
  type Competency, type CompetencyPoMapping, type CompetencyRating
} from "@shared/schema";
import { eq, sql, and, inArray, desc } from "drizzle-orm";

export interface IStorage {
  getPOs(): Promise<ProgramOutcome[]>;
  getPOsByProgram(programId: number): Promise<ProgramOutcome[]>;
  createPO(po: any): Promise<ProgramOutcome>;
  updatePO(id: number, po: any): Promise<ProgramOutcome>;
  deletePO(id: number): Promise<void>;

  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: any): Promise<Course>;
  updateCourse(id: number, course: any): Promise<Course>;
  deleteCourse(id: number): Promise<void>;

  getCoursePOMappings(courseId: number): Promise<CoursePoMapping[]>;
  getAllCoursePOMappings(): Promise<CoursePoMapping[]>;
  setCoursePOMappings(courseId: number, poIds: number[]): Promise<void>;
  
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  createEnrollment(data: any): Promise<Enrollment>;
  bulkCreateEnrollments(data: any[]): Promise<void>;
  getUserEnrollments(userId: string): Promise<Enrollment[]>;
  getCourseEnrollments(courseId: number): Promise<Enrollment[]>;
  getAllEnrollments(): Promise<Enrollment[]>;

  getSurveys(): Promise<Survey[]>;
  getSurveysByProgram(programId: number, userId: string): Promise<(Survey & { hasResponded: boolean })[]>;
  getSurveyResponsesForUser(userId: string): Promise<SurveyResponse[]>;
  getSurvey(id: number): Promise<Survey & { questions: SurveyQuestion[] } | undefined>;
  createSurvey(data: any, questions: any[], courseIds?: number[]): Promise<Survey>;
  updateSurvey(id: number, data: any, questions?: any[], courseIds?: number[]): Promise<Survey>;
  deleteSurvey(id: number): Promise<void>;
  submitSurveyResponse(surveyId: number, userId: string | null, name: string | null, answers: any[]): Promise<SurveyResponse>;
  getSurveyResponses(surveyId: number): Promise<any[]>;
  getSurveyCourseLinks(surveyId: number): Promise<number[]>;

  createInvitation(data: any): Promise<any>;
  getInvitationByToken(token: string): Promise<any>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: any): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  createBulkNotifications(userIds: string[], data: any): Promise<void>;

  createEmployerFeedback(data: any): Promise<EmployerFeedback>;
  bulkCreateEmployerFeedback(data: any[]): Promise<void>;
  getEmployerFeedback(): Promise<EmployerFeedback[]>;

  getAnalytics(programId?: number, year?: string): Promise<any>;

  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<Program | undefined>;
  createProgram(program: any): Promise<Program>;
  updateProgram(id: number, program: any): Promise<Program>;
  deleteProgram(id: number): Promise<void>;
  getProgramPOMappings(programId: number): Promise<number[]>;
  setProgramPOMappings(programId: number, poIds: number[]): Promise<void>;

  getBoardExamResults(programId: number): Promise<BoardExamResult[]>;
  getBoardExamResult(id: number): Promise<BoardExamResult | undefined>;
  createBoardExamResult(data: any): Promise<BoardExamResult>;
  updateBoardExamResult(id: number, data: any): Promise<BoardExamResult>;
  deleteBoardExamResult(id: number): Promise<void>;

  getCompetencies(programId?: number): Promise<Competency[]>;
  getCompetency(id: number): Promise<Competency | undefined>;
  createCompetency(data: any, poIds?: number[]): Promise<Competency>;
  updateCompetency(id: number, data: any, poIds?: number[]): Promise<Competency>;
  deleteCompetency(id: number): Promise<void>;
  getCompetencyPoMappings(competencyId: number): Promise<number[]>;
  
  getCompetencyRatings(programId?: number): Promise<CompetencyRating[]>;
  createCompetencyRating(data: any): Promise<CompetencyRating>;
  bulkCreateCompetencyRatings(data: any[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPOs(): Promise<ProgramOutcome[]> {
    return await db.select().from(programOutcomes);
  }

  async getPOsByProgram(programId: number): Promise<ProgramOutcome[]> {
    const all = await db.select().from(programOutcomes);
    console.log(`getPOsByProgram(${programId}): Found ${all.length} total POs`);
    all.forEach(po => console.log(`  - PO ${po.id}: programId=${po.programId} (${typeof po.programId}), code=${po.code}`));
    const filtered = all.filter(po => Number(po.programId) === Number(programId));
    console.log(`  Filtered to ${filtered.length} POs for programId ${programId}`);
    return filtered;
  }

  async createPO(po: any): Promise<ProgramOutcome> {
    await db.insert(programOutcomes).values(po);
    const [newPo] = await db.select().from(programOutcomes).where(
      and(eq(programOutcomes.programId, po.programId), eq(programOutcomes.code, po.code))
    );
    return newPo;
  }
  
  async updatePO(id: number, po: any): Promise<ProgramOutcome> {
    await db.update(programOutcomes).set(po).where(eq(programOutcomes.id, id));
    const [updated] = await db.select().from(programOutcomes).where(eq(programOutcomes.id, id));
    return updated;
  }

  async deletePO(id: number): Promise<void> {
    await db.delete(programOutcomes).where(eq(programOutcomes.id, id));
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: any): Promise<Course> {
    await db.insert(courses).values(course);
    const [newCourse] = await db.select().from(courses).where(eq(courses.code, course.code));
    return newCourse;
  }

  async updateCourse(id: number, course: any): Promise<Course> {
    await db.update(courses).set(course).where(eq(courses.id, id));
    const [updated] = await db.select().from(courses).where(eq(courses.id, id));
    return updated;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(coursePoMappings).where(eq(coursePoMappings.courseId, id));
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getCoursePOMappings(courseId: number): Promise<CoursePoMapping[]> {
    return await db.select().from(coursePoMappings).where(eq(coursePoMappings.courseId, courseId));
  }

  async getAllCoursePOMappings(): Promise<CoursePoMapping[]> {
    return await db.select().from(coursePoMappings);
  }

  async setCoursePOMappings(courseId: number, poIds: number[]): Promise<void> {
    await db.delete(coursePoMappings).where(eq(coursePoMappings.courseId, courseId));
    for (const poId of poIds) {
      await db.insert(coursePoMappings).values({ courseId, poId });
    }
  }

  async getUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    // Strip password from all users
    return allUsers.map(({ password: _, ...user }) => user) as User[];
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserRole(id: string, role: any): Promise<User> {
    await db.update(users).set({ role }).where(eq(users.id, id));
    const [updated] = await db.select().from(users).where(eq(users.id, id));
    // Strip password from response
    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword as User;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    // Delete related records first to maintain referential integrity
    await db.delete(enrollments).where(eq(enrollments.userId, id));
    await db.delete(surveyResponses).where(eq(surveyResponses.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async createEnrollment(data: any): Promise<Enrollment> {
    await db.insert(enrollments).values(data);
    const allEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, data.userId));
    return allEnrollments[allEnrollments.length - 1];
  }

  async bulkCreateEnrollments(data: any[]): Promise<void> {
    for (const e of data) {
      await db.insert(enrollments).values(e);
    }
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.userId, userId));
  }

  async getCourseEnrollments(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }

  async getSurveys(): Promise<Survey[]> {
    return await db.select().from(surveys);
  }

  async getSurveysByProgram(programId: number, userId: string): Promise<(Survey & { hasResponded: boolean })[]> {
    const allSurveys = await db.select().from(surveys);
    const allLinks = await db.select().from(surveyCourseLinks);
    const allCoursePOMappings = await db.select().from(coursePoMappings);
    const allPOs = await db.select().from(programOutcomes);
    const userResponses = await db.select().from(surveyResponses).where(eq(surveyResponses.userId, userId));
    const respondedSurveyIds = new Set(userResponses.map(r => r.surveyId));
    
    const programPOIds = allPOs.filter(po => Number(po.programId) === Number(programId)).map(po => po.id);
    const programCourseIds = allCoursePOMappings
      .filter(m => programPOIds.includes(m.poId))
      .map(m => m.courseId);
    const uniqueCourseIds = Array.from(new Set(programCourseIds));
    const surveysForProgram = allLinks
      .filter(link => uniqueCourseIds.includes(link.courseId))
      .map(link => link.surveyId);
    const uniqueSurveyIds = Array.from(new Set(surveysForProgram));
    
    return allSurveys
      .filter(s => 
        s.targetRole === 'student' && (
          uniqueSurveyIds.includes(s.id) || 
          !allLinks.some(link => link.surveyId === s.id)
        )
      )
      .map(s => ({
        ...s,
        hasResponded: respondedSurveyIds.has(s.id)
      }));
  }

  async getSurveyResponsesForUser(userId: string): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses).where(eq(surveyResponses.userId, userId));
  }

  async getSurvey(id: number): Promise<Survey & { questions: SurveyQuestion[] } | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    if (!survey) return undefined;
    
    const questions = await db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, id));
    return { ...survey, questions };
  }

  async createSurvey(data: any, questions: any[], courseIds?: number[]): Promise<Survey> {
    await db.insert(surveys).values(data);
    const allSurveys = await db.select().from(surveys);
    const survey = allSurveys[allSurveys.length - 1];
    
    for (const q of questions) {
      await db.insert(surveyQuestions).values({ ...q, surveyId: survey.id });
    }
    if (courseIds && courseIds.length > 0) {
      for (const courseId of courseIds) {
        await db.insert(surveyCourseLinks).values({ surveyId: survey.id, courseId });
      }
    }
    return survey;
  }

  async updateSurvey(id: number, data: any, questions?: any[], courseIds?: number[]): Promise<Survey> {
    await db.update(surveys).set(data).where(eq(surveys.id, id));
    
    if (questions) {
      await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id));
      for (const q of questions) {
        await db.insert(surveyQuestions).values({ ...q, surveyId: id });
      }
    }
    if (courseIds !== undefined) {
      await db.delete(surveyCourseLinks).where(eq(surveyCourseLinks.surveyId, id));
      for (const courseId of courseIds) {
        await db.insert(surveyCourseLinks).values({ surveyId: id, courseId });
      }
    }
    const [updated] = await db.select().from(surveys).where(eq(surveys.id, id));
    return updated;
  }

  async deleteSurvey(id: number): Promise<void> {
    await db.delete(surveyQuestions).where(eq(surveyQuestions.surveyId, id));
    await db.delete(surveyCourseLinks).where(eq(surveyCourseLinks.surveyId, id));
    await db.delete(surveyResponses).where(eq(surveyResponses.surveyId, id));
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  async getSurveyResponses(surveyId: number): Promise<any[]> {
    const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
    const result = [];
    for (const r of responses) {
      const answers = await db.select().from(surveyAnswers).where(eq(surveyAnswers.responseId, r.id));
      result.push({ ...r, answers });
    }
    return result;
  }

  async getSurveyCourseLinks(surveyId: number): Promise<number[]> {
    const links = await db.select().from(surveyCourseLinks).where(eq(surveyCourseLinks.surveyId, surveyId));
    return links.map(l => l.courseId);
  }

  async submitSurveyResponse(surveyId: number, userId: string | null, name: string | null, answers: any[]): Promise<SurveyResponse> {
    await db.insert(surveyResponses).values({
      surveyId,
      userId: userId as string,
      respondentName: name
    });

    const allResponses = await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, surveyId));
    const response = allResponses[allResponses.length - 1];

    for (const ans of answers) {
      await db.insert(surveyAnswers).values({
        responseId: response.id,
        questionId: ans.questionId,
        answerValue: ans.answerValue,
        answerText: ans.answerText
      });
    }
    return response;
  }

  async createInvitation(data: any): Promise<any> {
    await db.insert(invitations).values(data);
    const [invite] = await db.select().from(invitations).where(eq(invitations.token, data.token));
    return invite;
  }

  async getInvitationByToken(token: string): Promise<any> {
    const [invite] = await db.select().from(invitations).where(eq(invitations.token, token));
    return invite;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: any): Promise<Notification> {
    await db.insert(notifications).values(data);
    const all = await db.select().from(notifications).orderBy(desc(notifications.id));
    return all[0];
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async createBulkNotifications(userIds: string[], data: any): Promise<void> {
    for (const userId of userIds) {
      await db.insert(notifications).values({ ...data, userId });
    }
  }

  async createEmployerFeedback(data: any): Promise<EmployerFeedback> {
    await db.insert(employerFeedback).values(data);
    const all = await db.select().from(employerFeedback).orderBy(desc(employerFeedback.id));
    return all[0];
  }

  async bulkCreateEmployerFeedback(data: any[]): Promise<void> {
    for (const d of data) {
      await db.insert(employerFeedback).values(d);
    }
  }

  async getEmployerFeedback(): Promise<EmployerFeedback[]> {
    return await db.select().from(employerFeedback);
  }

  async getAnalytics(programId?: number, year?: string): Promise<any> {
    const pos = programId 
      ? await db.select().from(programOutcomes).where(eq(programOutcomes.programId, programId))
      : await db.select().from(programOutcomes);
    
    const allCourses = await db.select().from(courses);
    const allMappings = await db.select().from(coursePoMappings);
    let allEnrollments = await db.select().from(enrollments);
    const allSurveys = await db.select().from(surveys);
    const allQuestions = await db.select().from(surveyQuestions);
    let allResponses = await db.select().from(surveyResponses);
    const allAnswers = await db.select().from(surveyAnswers);
    let allBoardExams = await db.select().from(boardExamResults);
    const allPrograms = await db.select().from(programs);
    
    const allCompetencies = await db.select().from(competencies);
    const allCompetencyPoMappings = await db.select().from(competencyPoMappings);
    let allCompetencyRatings = await db.select().from(competencyRatings);

    // Helper to extract year from various date formats
    const extractYear = (dateStr: string | null | undefined): string | null => {
      if (!dateStr) return null;
      const match = dateStr.match(/(\d{4})/);
      return match ? match[1] : null;
    };

    // Filter by year if specified
    if (year && year !== 'all') {
      allEnrollments = allEnrollments.filter(e => {
        const termYear = e.term ? extractYear(e.term) : null;
        const acadYear = (e as any).academicYear ? extractYear((e as any).academicYear) : null;
        return termYear === year || acadYear === year;
      });
      
      allBoardExams = allBoardExams.filter(be => {
        const examYear = be.examDate ? extractYear(be.examDate) : null;
        return examYear === year;
      });
      
      allCompetencyRatings = allCompetencyRatings.filter(r => {
        const batch = r.batch ? extractYear(r.batch) : null;
        const created = r.createdAt ? new Date(r.createdAt).getFullYear().toString() : null;
        return batch === year || created === year;
      });
      
      const filteredResponseIds = allResponses.filter(r => {
        const submitted = r.submittedAt ? new Date(r.submittedAt).getFullYear().toString() : null;
        return submitted === year;
      }).map(r => r.id);
      allResponses = allResponses.filter(r => filteredResponseIds.includes(r.id));
    }

    // Filter answers to only those from filtered responses
    const filteredResponseIdSet = new Set(allResponses.map(r => r.id));
    const filteredAnswers = allAnswers.filter(a => filteredResponseIdSet.has(a.responseId));

    // Collect all available years for filtering
    const enrollmentYears = Array.from(new Set(
      (await db.select().from(enrollments))
        .map(e => extractYear(e.term))
        .filter(Boolean)
    )) as string[];
    
    const boardExamYears = Array.from(new Set(
      (await db.select().from(boardExamResults))
        .map(be => extractYear(be.examDate))
        .filter(Boolean)
    )) as string[];
    
    const feedbackYears = Array.from(new Set(
      (await db.select().from(competencyRatings))
        .map(r => r.batch ? extractYear(r.batch) : (r.createdAt ? new Date(r.createdAt).getFullYear().toString() : null))
        .filter(Boolean)
    )) as string[];
    
    const surveyYears = Array.from(new Set(
      (await db.select().from(surveyResponses))
        .map(r => r.submittedAt ? new Date(r.submittedAt).getFullYear().toString() : null)
        .filter(Boolean)
    )) as string[];

    const availableYears = Array.from(new Set([...enrollmentYears, ...boardExamYears, ...feedbackYears, ...surveyYears])).sort().reverse();

    const poAnalytics = pos.map(po => {
      const courseIds = allMappings.filter(m => m.poId === po.id).map(m => m.courseId);
      const grades = allEnrollments.filter(e => courseIds.includes(e.courseId)).map(e => e.grade);
      const avgGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;

      const questionIds = allQuestions.filter(q => q.linkedPoId === po.id).map(q => q.id);
      const surveyAnswersForPO = filteredAnswers.filter(a => 
        questionIds.includes(a.questionId) && 
        a.answerValue
      );
      const avgSurvey = surveyAnswersForPO.length > 0
        ? surveyAnswersForPO.reduce((sum, a) => sum + (a.answerValue || 0), 0) / surveyAnswersForPO.length
        : 0;

      const competencyIdsForPO = allCompetencyPoMappings
        .filter(m => m.poId === po.id)
        .map(m => m.competencyId);
      
      const ratingsForPO = allCompetencyRatings.filter(r => competencyIdsForPO.includes(r.competencyId));
      const avgFeedback = ratingsForPO.length > 0
        ? ratingsForPO.reduce((sum, r) => sum + r.rating, 0) / ratingsForPO.length
        : 0;

      const program = allPrograms.find(p => p.id === po.programId);
      const programBoardExams = allBoardExams.filter(be => be.programId === po.programId);
      const totalPassers = programBoardExams.reduce((sum, be) => sum + be.passers, 0);
      const totalTakers = programBoardExams.reduce((sum, be) => sum + be.takers, 0);
      const avgBoardExam = totalTakers > 0 ? (totalPassers / totalTakers) * 5 : 0;

      const scores = [];
      if (avgGrade > 0) scores.push(avgGrade / 100 * 5);
      if (avgSurvey > 0) scores.push(avgSurvey);
      if (avgFeedback > 0) scores.push(avgFeedback);
      if (program?.type === 'board' && avgBoardExam > 0) scores.push(avgBoardExam);

      const overallScore = scores.length > 0 
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

      return {
        po,
        gradeCount: grades.length,
        avgGrade: Math.round(avgGrade * 10) / 10,
        surveyCount: surveyAnswersForPO.length,
        avgSurvey: Math.round(avgSurvey * 10) / 10,
        feedbackCount: ratingsForPO.length,
        avgFeedback: Math.round(avgFeedback * 10) / 10,
        boardExamScore: Math.round(avgBoardExam * 10) / 10,
        isBoardProgram: program?.type === 'board',
        overallScore,
      };
    });

    // Grade trends by term
    const terms = Array.from(new Set(allEnrollments.map(e => e.term))).sort();
    const trendData = terms.map(term => {
      const termEnrollments = allEnrollments.filter(e => e.term === term);
      const avgGrade = termEnrollments.length > 0
        ? termEnrollments.reduce((sum, e) => sum + e.grade, 0) / termEnrollments.length
        : 0;
      return { term, avgGrade: Math.round(avgGrade * 10) / 10, count: termEnrollments.length };
    });

    // Board exam trends by year
    const allBoardExamsForTrend = await db.select().from(boardExamResults);
    const boardExamTrendYears = Array.from(new Set(
      allBoardExamsForTrend.map(be => extractYear(be.examDate)).filter(Boolean)
    )).sort() as string[];
    
    const boardExamTrend = boardExamTrendYears.map(yr => {
      const yearExams = allBoardExamsForTrend.filter(be => extractYear(be.examDate) === yr);
      const passers = yearExams.reduce((sum, be) => sum + be.passers, 0);
      const takers = yearExams.reduce((sum, be) => sum + be.takers, 0);
      const passingRate = takers > 0 ? Math.round((passers / takers) * 100) : 0;
      return { year: yr, passers, takers, passingRate };
    });

    // Survey trends by year
    const allResponsesForTrend = await db.select().from(surveyResponses);
    const allAnswersForTrend = await db.select().from(surveyAnswers);
    const surveyTrendYears = Array.from(new Set(
      allResponsesForTrend
        .map(r => r.submittedAt ? new Date(r.submittedAt).getFullYear().toString() : null)
        .filter(Boolean)
    )).sort() as string[];
    
    const surveyTrend = surveyTrendYears.map(yr => {
      const yearResponseIds = allResponsesForTrend
        .filter(r => r.submittedAt && new Date(r.submittedAt).getFullYear().toString() === yr)
        .map(r => r.id);
      const yearAnswers = allAnswersForTrend.filter(a => yearResponseIds.includes(a.responseId) && a.answerValue);
      const avgRating = yearAnswers.length > 0
        ? yearAnswers.reduce((sum, a) => sum + (a.answerValue || 0), 0) / yearAnswers.length
        : 0;
      return { year: yr, responses: yearResponseIds.length, avgRating: Math.round(avgRating * 10) / 10 };
    });

    // Employer feedback trends by batch year
    const allRatingsForTrend = await db.select().from(competencyRatings);
    const feedbackTrendYears = Array.from(new Set(
      allRatingsForTrend
        .map(r => r.batch ? extractYear(r.batch) : (r.createdAt ? new Date(r.createdAt).getFullYear().toString() : null))
        .filter(Boolean)
    )).sort() as string[];
    
    const feedbackTrend = feedbackTrendYears.map(yr => {
      const yearRatings = allRatingsForTrend.filter(r => {
        const batch = r.batch ? extractYear(r.batch) : null;
        const created = r.createdAt ? new Date(r.createdAt).getFullYear().toString() : null;
        return batch === yr || created === yr;
      });
      const avgRating = yearRatings.length > 0
        ? yearRatings.reduce((sum, r) => sum + r.rating, 0) / yearRatings.length
        : 0;
      return { year: yr, count: yearRatings.length, avgRating: Math.round(avgRating * 10) / 10 };
    });

    return {
      poAnalytics,
      trendData,
      boardExamTrend,
      surveyTrend,
      feedbackTrend,
      availableYears,
      summary: {
        totalCourses: allCourses.length,
        totalPOs: pos.length,
        totalEnrollments: allEnrollments.length,
        totalSurveyResponses: allResponses.length,
        totalFeedback: allCompetencyRatings.length,
      }
    };
  }

  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs);
  }

  async getProgram(id: number): Promise<Program | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    return program;
  }

  async createProgram(program: any): Promise<Program> {
    await db.insert(programs).values(program);
    const [newProgram] = await db.select().from(programs).where(eq(programs.code, program.code));
    
    // Set programId for the assigned program head
    if (program.programHeadId) {
      await db.update(users)
        .set({ programId: newProgram.id })
        .where(eq(users.id, program.programHeadId));
    }
    
    return newProgram;
  }

  async updateProgram(id: number, program: any): Promise<Program> {
    // If programHeadId is being updated, sync the user's programId
    if (program.programHeadId !== undefined) {
      const [existingProgram] = await db.select().from(programs).where(eq(programs.id, id));
      
      // Clear programId from old program head if exists
      if (existingProgram?.programHeadId && existingProgram.programHeadId !== program.programHeadId) {
        await db.update(users)
          .set({ programId: null })
          .where(eq(users.id, existingProgram.programHeadId));
      }
      
      // Set programId for new program head
      if (program.programHeadId) {
        await db.update(users)
          .set({ programId: id })
          .where(eq(users.id, program.programHeadId));
      }
    }
    
    await db.update(programs).set(program).where(eq(programs.id, id));
    const [updated] = await db.select().from(programs).where(eq(programs.id, id));
    return updated;
  }

  async deleteProgram(id: number): Promise<void> {
    await db.delete(programPoMappings).where(eq(programPoMappings.programId, id));
    await db.delete(boardExamResults).where(eq(boardExamResults.programId, id));
    await db.delete(programs).where(eq(programs.id, id));
  }

  async getProgramPOMappings(programId: number): Promise<number[]> {
    const mappings = await db.select().from(programPoMappings).where(eq(programPoMappings.programId, programId));
    return mappings.map(m => m.poId);
  }

  async setProgramPOMappings(programId: number, poIds: number[]): Promise<void> {
    await db.delete(programPoMappings).where(eq(programPoMappings.programId, programId));
    for (const poId of poIds) {
      await db.insert(programPoMappings).values({ programId, poId });
    }
  }

  async getBoardExamResults(programId: number): Promise<BoardExamResult[]> {
    return await db.select().from(boardExamResults).where(eq(boardExamResults.programId, programId)).orderBy(desc(boardExamResults.createdAt));
  }

  async getBoardExamResult(id: number): Promise<BoardExamResult | undefined> {
    const [result] = await db.select().from(boardExamResults).where(eq(boardExamResults.id, id));
    return result;
  }

  async createBoardExamResult(data: any): Promise<BoardExamResult> {
    await db.insert(boardExamResults).values(data);
    const results = await db.select().from(boardExamResults).where(eq(boardExamResults.programId, data.programId)).orderBy(desc(boardExamResults.id));
    return results[0];
  }

  async updateBoardExamResult(id: number, data: any): Promise<BoardExamResult> {
    await db.update(boardExamResults).set(data).where(eq(boardExamResults.id, id));
    const [updated] = await db.select().from(boardExamResults).where(eq(boardExamResults.id, id));
    return updated;
  }

  async deleteBoardExamResult(id: number): Promise<void> {
    await db.delete(boardExamResults).where(eq(boardExamResults.id, id));
  }

  async getCompetencies(programId?: number): Promise<Competency[]> {
    if (programId) {
      return await db.select().from(competencies).where(eq(competencies.programId, programId));
    }
    return await db.select().from(competencies);
  }

  async getCompetency(id: number): Promise<Competency | undefined> {
    const [comp] = await db.select().from(competencies).where(eq(competencies.id, id));
    return comp;
  }

  async createCompetency(data: any, poIds?: number[]): Promise<Competency> {
    await db.insert(competencies).values(data);
    const results = await db.select().from(competencies).where(
      and(eq(competencies.programId, data.programId), eq(competencies.name, data.name))
    );
    const newComp = results[0];
    if (poIds && poIds.length > 0) {
      for (const poId of poIds) {
        await db.insert(competencyPoMappings).values({ competencyId: newComp.id, poId });
      }
    }
    return newComp;
  }

  async updateCompetency(id: number, data: any, poIds?: number[]): Promise<Competency> {
    await db.update(competencies).set(data).where(eq(competencies.id, id));
    if (poIds !== undefined) {
      await db.delete(competencyPoMappings).where(eq(competencyPoMappings.competencyId, id));
      for (const poId of poIds) {
        await db.insert(competencyPoMappings).values({ competencyId: id, poId });
      }
    }
    const [updated] = await db.select().from(competencies).where(eq(competencies.id, id));
    return updated;
  }

  async deleteCompetency(id: number): Promise<void> {
    await db.delete(competencyPoMappings).where(eq(competencyPoMappings.competencyId, id));
    await db.delete(competencyRatings).where(eq(competencyRatings.competencyId, id));
    await db.delete(competencies).where(eq(competencies.id, id));
  }

  async getCompetencyPoMappings(competencyId: number): Promise<number[]> {
    const mappings = await db.select().from(competencyPoMappings).where(eq(competencyPoMappings.competencyId, competencyId));
    return mappings.map(m => m.poId);
  }

  async getCompetencyRatings(programId?: number): Promise<CompetencyRating[]> {
    const allRatings = await db.select().from(competencyRatings).orderBy(desc(competencyRatings.createdAt));
    if (!programId) return allRatings;
    const programCompetencies = await this.getCompetencies(programId);
    const competencyIds = new Set(programCompetencies.map(c => c.id));
    return allRatings.filter(r => competencyIds.has(r.competencyId));
  }

  async createCompetencyRating(data: any): Promise<CompetencyRating> {
    await db.insert(competencyRatings).values(data);
    const results = await db.select().from(competencyRatings).orderBy(desc(competencyRatings.id));
    return results[0];
  }

  async bulkCreateCompetencyRatings(data: any[]): Promise<void> {
    for (const item of data) {
      await db.insert(competencyRatings).values(item);
    }
  }
}

export const storage = new DatabaseStorage();
