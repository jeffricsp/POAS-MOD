import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import crypto from 'crypto';
import { sendInvitationEmail } from './email';

// Authorization helper for program head access control
function checkProgramHeadAuthorization(user: any, programId: number): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'program_head') {
    return user.programId === programId;
  }
  return false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // === API ROUTES ===

  // Program Outcomes
  app.get(api.programOutcomes.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let pos = await storage.getPOs();
    
    // Program heads only see POs for their linked program
    if (user.role === 'program_head') {
      if (!user.programId) {
        return res.json([]); // No program assigned, return empty
      }
      pos = pos.filter(po => po.programId === user.programId);
    }
    
    res.json(pos);
  });

  app.post(api.programOutcomes.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.programOutcomes.create.input.parse(req.body);
      const po = await storage.createPO(input);
      res.status(201).json(po);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete('/api/program-outcomes/:id', isAuthenticated, async (req, res) => {
    await storage.deletePO(Number(req.params.id));
    res.status(204).send();
  });

  // Courses
  app.get(api.courses.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let courses = await storage.getCourses();
    
    // Program heads only see courses linked to their program's POs
    if (user.role === 'program_head') {
      if (!user.programId) {
        return res.json([]); // No program assigned, return empty
      }
      const programPos = await storage.getPOs();
      const programPoIds = programPos
        .filter(po => po.programId === user.programId)
        .map(po => po.id);
      
      const allMappings = await storage.getAllCoursePOMappings();
      const courseIdsInProgram = new Set(
        allMappings
          .filter(m => programPoIds.includes(m.poId))
          .map(m => m.courseId)
      );
      
      courses = courses.filter(c => courseIdsInProgram.has(c.id));
    }
    
    res.json(courses);
  });

  app.get('/api/courses/:id', async (req, res) => {
    const course = await storage.getCourse(Number(req.params.id));
    if (!course) return res.status(404).json({ message: "Not found" });
    res.json(course);
  });

  app.post(api.courses.create.path, isAuthenticated, async (req, res) => {
    const input = api.courses.create.input.parse(req.body);
    const course = await storage.createCourse(input);
    res.status(201).json(course);
  });

  app.put('/api/courses/:id', isAuthenticated, async (req, res) => {
    const input = api.courses.update.input.parse(req.body);
    const course = await storage.updateCourse(Number(req.params.id), input);
    res.json(course);
  });

  app.delete('/api/courses/:id', isAuthenticated, async (req, res) => {
    await storage.deleteCourse(Number(req.params.id));
    res.status(204).send();
  });

  app.get('/api/courses/:id/pos', async (req, res) => {
    const mappings = await storage.getCoursePOMappings(Number(req.params.id));
    res.json(mappings.map(m => m.poId));
  });

  app.put('/api/courses/:id/pos', isAuthenticated, async (req, res) => {
    const { poIds } = req.body;
    await storage.setCoursePOMappings(Number(req.params.id), poIds);
    res.json({ success: true });
  });

  // Surveys
  app.get(api.surveys.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let surveys = await storage.getSurveys();
    
    // Program heads only see surveys linked to courses in their program
    if (user.role === 'program_head') {
      if (!user.programId) {
        return res.json([]); // No program assigned, return empty
      }
      const programPos = await storage.getPOs();
      const programPoIds = programPos
        .filter(po => po.programId === user.programId)
        .map(po => po.id);
      
      const allMappings = await storage.getAllCoursePOMappings();
      const courseIdsInProgram = new Set(
        allMappings
          .filter(m => programPoIds.includes(m.poId))
          .map(m => m.courseId)
      );
      
      // Filter surveys that are linked to courses in the program
      const filteredSurveys = [];
      for (const survey of surveys) {
        const surveyCourseIds = await storage.getSurveyCourseLinks(survey.id);
        if (surveyCourseIds.length === 0 || surveyCourseIds.some(cid => courseIdsInProgram.has(cid))) {
          filteredSurveys.push(survey);
        }
      }
      surveys = filteredSurveys;
    }
    
    res.json(surveys);
  });

  // My Surveys - filtered for student's program
  app.get('/api/my-surveys', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Admin can see all surveys regardless of program
    if (user.role === 'admin') {
      const allSurveys = await storage.getSurveys();
      const userResponses = await storage.getSurveyResponsesForUser(user.id);
      const respondedSurveyIds = new Set(userResponses.map((r: any) => r.surveyId));
      
      return res.json(allSurveys.map(s => ({
        ...s,
        hasResponded: respondedSurveyIds.has(s.id)
      })));
    }

    if (!user.programId) {
      // No program assigned - return empty or all student surveys
      const allSurveys = await storage.getSurveys();
      const userResponses = await storage.getSurveyResponsesForUser(user.id);
      const respondedSurveyIds = new Set(userResponses.map((r: any) => r.surveyId));
      
      return res.json(allSurveys
        .filter(s => s.targetRole === user.role)
        .map(s => ({
          ...s,
          hasResponded: respondedSurveyIds.has(s.id)
        }))
      );
    }
    const surveys = await storage.getSurveysByProgram(user.programId, user.id);
    res.json(surveys);
  });

  app.get(api.surveys.get.path, async (req, res) => {
    const survey = await storage.getSurvey(Number(req.params.id));
    if (!survey) return res.status(404).json({ message: "Not found" });
    const courseIds = await storage.getSurveyCourseLinks(survey.id);
    res.json({ ...survey, courseIds });
  });

  app.post(api.surveys.create.path, isAuthenticated, async (req, res) => {
    const input = api.surveys.create.input.parse(req.body);
    const { questions, courseIds, ...surveyData } = input;
    const survey = await storage.createSurvey(surveyData, questions, courseIds);
    res.status(201).json(survey);
  });

  app.put('/api/surveys/:id', isAuthenticated, async (req, res) => {
    const input = api.surveys.update.input.parse(req.body);
    const { questions, courseIds, ...surveyData } = input;
    const survey = await storage.updateSurvey(Number(req.params.id), surveyData, questions, courseIds);
    res.json(survey);
  });

  app.delete('/api/surveys/:id', isAuthenticated, async (req, res) => {
    await storage.deleteSurvey(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.surveys.submit.path, async (req, res) => {
    const input = api.surveys.submit.input.parse(req.body);
    const userId = (req.user as any)?.id || null;
    const response = await storage.submitSurveyResponse(Number(req.params.id), userId, input.respondentName || null, input.answers);
    res.status(201).json(response);
  });

  app.get('/api/surveys/:id/responses', isAuthenticated, async (req, res) => {
    const responses = await storage.getSurveyResponses(Number(req.params.id));
    res.json(responses);
  });

  // Enrollments
  app.get(api.enrollments.list.path, isAuthenticated, async (req, res) => {
    const enrollments = await storage.getAllEnrollments();
    res.json(enrollments);
  });

  app.post(api.enrollments.create.path, isAuthenticated, async (req, res) => {
    const input = api.enrollments.create.input.parse(req.body);
    const enrollment = await storage.createEnrollment(input);
    res.status(201).json(enrollment);
  });

  app.post(api.enrollments.bulkCreate.path, isAuthenticated, async (req, res) => {
    const input = api.enrollments.bulkCreate.input.parse(req.body);
    await storage.bulkCreateEnrollments(input);
    res.status(201).json({ count: input.length });
  });

  app.get('/api/courses/:courseId/enrollments', isAuthenticated, async (req, res) => {
    const enrollments = await storage.getCourseEnrollments(Number(req.params.courseId));
    res.json(enrollments);
  });

  // Notifications
  app.get(api.notifications.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  });

  app.post(api.notifications.create.path, isAuthenticated, async (req, res) => {
    const input = api.notifications.create.input.parse(req.body);
    const notification = await storage.createNotification(input);
    res.status(201).json(notification);
  });

  app.post(api.notifications.createBulk.path, isAuthenticated, async (req, res) => {
    const { userIds, ...data } = req.body;
    await storage.createBulkNotifications(userIds, data);
    res.status(201).json({ count: userIds.length });
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    await storage.markNotificationRead(Number(req.params.id));
    res.json({ success: true });
  });

  // Employer Feedback
  app.get(api.employerFeedback.list.path, isAuthenticated, async (req, res) => {
    const feedback = await storage.getEmployerFeedback();
    res.json(feedback);
  });

  app.post(api.employerFeedback.create.path, isAuthenticated, async (req, res) => {
    const input = api.employerFeedback.create.input.parse(req.body);
    const feedback = await storage.createEmployerFeedback(input);
    res.status(201).json(feedback);
  });

  app.post(api.employerFeedback.bulkCreate.path, isAuthenticated, async (req, res) => {
    const input = api.employerFeedback.bulkCreate.input.parse(req.body);
    await storage.bulkCreateEmployerFeedback(input);
    res.status(201).json({ count: input.length });
  });

  // Analytics
  app.get(api.analytics.get.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
    const year = req.query.year as string | undefined;
    
    // Program heads only see analytics for their linked program
    if (user.role === 'program_head') {
      if (!user.programId) {
        return res.json({ poAnalytics: [], trendData: [], summary: { totalCourses: 0, totalPOs: 0, totalEnrollments: 0, totalSurveyResponses: 0, totalFeedback: 0 }, availableYears: [] });
      }
      programId = user.programId;
    }
    
    const analytics = await storage.getAnalytics(programId, year);
    res.json(analytics);
  });

  // Users
  app.get(api.users.list.path, isAuthenticated, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.patch(api.users.updateRole.path, isAuthenticated, async (req, res) => {
    const { role } = req.body;
    const user = await storage.updateUserRole(req.params.id, role);
    res.json(user);
  });

  app.delete('/api/users/:id', isAuthenticated, async (req, res) => {
    // Check if user is trying to delete themselves
    if ((req.user as any).id === req.params.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

  // Update user profile
  app.patch('/api/users/:id/profile', isAuthenticated, async (req, res) => {
    const currentUser = req.user as any;
    const userId = req.params.id;
    
    // Users can only update their own profile (unless admin)
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const { firstName, lastName, email } = req.body;
    
    try {
      await storage.updateUserProfile(userId, { firstName, lastName, email });
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Admin change password for non-OAuth users
  app.patch('/api/users/:id/password', isAuthenticated, async (req, res) => {
    const currentUser = req.user as any;
    
    // Only admins can change other users' passwords
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can change user passwords" });
    }
    
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    // Check if target user uses Google OAuth
    const targetUser = await storage.getUser(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (targetUser.googleId) {
      return res.status(400).json({ message: "Cannot change password for Google OAuth users" });
    }
    
    // Hash and update password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUserPassword(req.params.id, hashedPassword);
    
    res.json({ success: true, message: "Password updated successfully" });
  });

  // Invitations
  app.post(api.invitations.create.path, isAuthenticated, async (req, res) => {
    const input = api.invitations.create.input.parse(req.body);
    const token = crypto.randomBytes(16).toString('hex');
    const invite = await storage.createInvitation({ ...input, token });
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const emailSent = await sendInvitationEmail(input.email, input.role, token, baseUrl);
    
    res.status(201).json({ ...invite, emailSent });
  });

  app.post(api.invitations.verify.path, async (req, res) => {
    const { token } = req.body;
    const invite = await storage.getInvitationByToken(token);
    if (!invite) return res.status(404).json({ valid: false, message: "Invalid token" });
    if (invite.isUsed) return res.json({ valid: false, message: "Invitation already used" });
    res.json({ valid: true, role: invite.role, email: invite.email });
  });

  // Programs (list is public for registration form)
  app.get(api.programs.list.path, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, isAuthenticated, async (req, res) => {
    const program = await storage.getProgram(parseInt(req.params.id));
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.json(program);
  });

  app.post(api.programs.create.path, isAuthenticated, async (req, res) => {
    const input = api.programs.create.input.parse(req.body);
    const program = await storage.createProgram(input);
    res.status(201).json(program);
  });

  app.put(api.programs.update.path, isAuthenticated, async (req, res) => {
    const input = api.programs.update.input.parse(req.body);
    const program = await storage.updateProgram(parseInt(req.params.id), input);
    res.json(program);
  });

  app.delete(api.programs.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteProgram(parseInt(req.params.id));
    res.status(204).send();
  });

  app.get(api.programs.getMappings.path, isAuthenticated, async (req, res) => {
    const poIds = await storage.getProgramPOMappings(parseInt(req.params.id));
    res.json(poIds);
  });

  app.put(api.programs.setMappings.path, isAuthenticated, async (req, res) => {
    const { poIds } = api.programs.setMappings.input.parse(req.body);
    await storage.setProgramPOMappings(parseInt(req.params.id), poIds);
    res.json({ success: true });
  });

  // Program-specific POs
  app.get('/api/programs/:programId/pos', isAuthenticated, async (req, res) => {
    const programId = parseInt(req.params.programId);
    if (isNaN(programId)) {
      return res.status(400).json({ message: "Invalid program ID" });
    }
    const pos = await storage.getPOsByProgram(programId);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json(pos);
  });

  app.post('/api/programs/:programId/pos', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const programId = parseInt(req.params.programId);
      
      if (!checkProgramHeadAuthorization(user, programId)) {
        return res.status(403).json({ message: "Not authorized to modify this program" });
      }
      
      const { code, description } = req.body;
      const po = await storage.createPO({ 
        programId: parseInt(req.params.programId), 
        code, 
        description 
      });
      res.status(201).json(po);
    } catch (e) {
      res.status(400).json({ message: "Invalid input or duplicate PO code" });
    }
  });

  app.put('/api/programs/:programId/pos/:poId', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const programId = parseInt(req.params.programId);
    
    if (!checkProgramHeadAuthorization(user, programId)) {
      return res.status(403).json({ message: "Not authorized to modify this program" });
    }
    
    const { code, description } = req.body;
    const po = await storage.updatePO(parseInt(req.params.poId), { code, description });
    res.json(po);
  });

  app.delete('/api/programs/:programId/pos/:poId', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const programId = parseInt(req.params.programId);
    
    if (!checkProgramHeadAuthorization(user, programId)) {
      return res.status(403).json({ message: "Not authorized to modify this program" });
    }
    
    await storage.deletePO(parseInt(req.params.poId));
    res.status(204).send();
  });

  // Board Exam Results
  app.get(api.boardExams.list.path, isAuthenticated, async (req, res) => {
    const results = await storage.getBoardExamResults(parseInt(req.params.programId));
    res.json(results);
  });

  app.post(api.boardExams.create.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const programId = parseInt(req.params.programId);
    
    if (!checkProgramHeadAuthorization(user, programId)) {
      return res.status(403).json({ message: "Not authorized to add board exam results for this program" });
    }
    
    const { examName, examDate, passers, takers, notes } = req.body;
    const result = await storage.createBoardExamResult({ 
      programId, 
      examName, 
      examDate, 
      passers, 
      takers, 
      notes 
    });
    res.status(201).json(result);
  });

  app.put(api.boardExams.update.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Fetch board exam to check programId
    const examId = parseInt(req.params.id);
    const existingExam = await storage.getBoardExamResult(examId);
    
    if (!existingExam) {
      return res.status(404).json({ message: "Board exam result not found" });
    }
    
    if (!checkProgramHeadAuthorization(user, existingExam.programId)) {
      return res.status(403).json({ message: "Not authorized to update this board exam result" });
    }
    
    const input = api.boardExams.update.input.parse(req.body);
    const result = await storage.updateBoardExamResult(parseInt(req.params.id), input);
    res.json(result);
  });

  app.delete(api.boardExams.delete.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Fetch board exam to check programId
    const examId = parseInt(req.params.id);
    const existingExam = await storage.getBoardExamResult(examId);
    
    if (!existingExam) {
      return res.status(404).json({ message: "Board exam result not found" });
    }
    
    if (!checkProgramHeadAuthorization(user, existingExam.programId)) {
      return res.status(403).json({ message: "Not authorized to delete this board exam result" });
    }
    
    await storage.deleteBoardExamResult(parseInt(req.params.id));
    res.status(204).send();
  });

  // Competencies - Role based authorization
  app.get(api.competencies.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
    
    // Program heads only see competencies for their linked program
    if (user.role === 'program_head') {
      if (!user.programId) {
        return res.json([]); // No program assigned, return empty
      }
      programId = user.programId;
    }
    
    const comps = await storage.getCompetencies(programId);
    res.json(comps);
  });

  app.get(api.competencies.get.path, isAuthenticated, async (req, res) => {
    const comp = await storage.getCompetency(parseInt(req.params.id));
    if (!comp) return res.status(404).json({ message: "Not found" });
    res.json(comp);
  });

  app.post(api.competencies.create.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!['admin', 'program_head'].includes(user.role)) {
      return res.status(403).json({ message: "Only admins and program heads can create competencies" });
    }
    
    const { poIds, ...data } = api.competencies.create.input.parse(req.body);
    
    // Check authorization for program heads
    if (user.role === 'program_head' && data.programId !== user.programId) {
      return res.status(403).json({ message: "Not authorized to create competencies for this program" });
    }
    
    const comp = await storage.createCompetency(data, poIds);
    res.status(201).json(comp);
  });

  app.put(api.competencies.update.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!['admin', 'program_head'].includes(user.role)) {
      return res.status(403).json({ message: "Only admins and program heads can update competencies" });
    }
    
    // Fetch competency to check programId
    const competency = await storage.getCompetency(parseInt(req.params.id));
    if (!competency) {
      return res.status(404).json({ message: "Competency not found" });
    }
    
    if (user.role === 'program_head' && competency.programId !== user.programId) {
      return res.status(403).json({ message: "Not authorized to update this competency" });
    }
    
    const { poIds, ...data } = api.competencies.update.input.parse(req.body);
    const comp = await storage.updateCompetency(parseInt(req.params.id), data, poIds);
    res.json(comp);
  });

  app.delete(api.competencies.delete.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!['admin', 'program_head'].includes(user.role)) {
      return res.status(403).json({ message: "Only admins and program heads can delete competencies" });
    }
    
    // Fetch competency to check programId
    const competency = await storage.getCompetency(parseInt(req.params.id));
    if (!competency) {
      return res.status(404).json({ message: "Competency not found" });
    }
    
    if (user.role === 'program_head' && competency.programId !== user.programId) {
      return res.status(403).json({ message: "Not authorized to delete this competency" });
    }
    
    await storage.deleteCompetency(parseInt(req.params.id));
    res.status(204).send();
  });

  app.get(api.competencies.getMappings.path, isAuthenticated, async (req, res) => {
    const mappings = await storage.getCompetencyPoMappings(parseInt(req.params.id));
    res.json(mappings);
  });

  // Competency Ratings - Role based authorization
  app.get(api.competencyRatings.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    let programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
    
    // Program heads only see ratings for their linked program
    if (user.role === 'program_head') {
      if (!user.programId) {
        return res.json([]); // No program assigned, return empty
      }
      programId = user.programId;
    }
    
    const ratings = await storage.getCompetencyRatings(programId);
    res.json(ratings);
  });

  app.post(api.competencyRatings.create.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!['admin', 'program_head', 'employer'].includes(user.role)) {
      return res.status(403).json({ message: "Only employers and program heads can submit ratings" });
    }
    const input = api.competencyRatings.create.input.parse(req.body);
    const rating = await storage.createCompetencyRating(input);
    res.status(201).json(rating);
  });

  app.post(api.competencyRatings.bulkCreate.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!['admin', 'program_head', 'employer'].includes(user.role)) {
      return res.status(403).json({ message: "Only employers and program heads can submit ratings" });
    }
    const input = api.competencyRatings.bulkCreate.input.parse(req.body);
    await storage.bulkCreateCompetencyRatings(input);
    res.status(201).json({ count: input.length });
  });

  // Seed Data
  const allPrograms = await storage.getPrograms();
  if (allPrograms.length === 0) {
    const bsis = await storage.createProgram({ code: "BSIS", name: "Bachelor of Science in Information Systems", type: "non_board" });
    const bsit = await storage.createProgram({ code: "BSIT", name: "Bachelor of Science in Information Technology", type: "non_board" });
    
    await storage.createPO({ programId: bsis.id, code: "PO1", description: "Critical Thinking: Apply knowledge of computing fundamentals." });
    await storage.createPO({ programId: bsis.id, code: "PO2", description: "Problem Solving: Identify and analyze complex problems." });
    await storage.createPO({ programId: bsis.id, code: "PO3", description: "Communication: Communicate effectively with diverse audiences." });

    await storage.createPO({ programId: bsit.id, code: "PO1", description: "Technical Skills: Apply IT knowledge in practical scenarios." });
    await storage.createPO({ programId: bsit.id, code: "PO2", description: "System Design: Design and implement IT solutions." });

    const course1 = await storage.createCourse({ code: "CS101", name: "Introduction to Computing", credits: 3 });
    const course2 = await storage.createCourse({ code: "CS102", name: "Data Structures", credits: 3 });
    
    const allPos = await storage.getPOs();
    const survey = await storage.createSurvey({
      title: "Course Feedback",
      targetRole: "student",
      description: "Feedback for CS101"
    }, [
      { text: "The course content was relevant.", type: "scale", linkedPoId: allPos[0]?.id },
      { text: "The instructor was effective.", type: "scale", linkedPoId: allPos[2]?.id },
      { text: "Any additional comments?", type: "text" }
    ]);
  }

  return httpServer;
}
