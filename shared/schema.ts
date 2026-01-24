import { mysqlTable, text, serial, int, boolean, timestamp, varchar, json, mysqlEnum } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === REPLIT AUTH TABLES (Mandatory) ===
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), 
  googleId: varchar("google_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  
  username: text("username"), 
  role: mysqlEnum("role", ['student', 'graduate', 'program_head', 'admin', 'employer']).notNull().default('student'),
  programId: int("program_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// === APP TABLES ===

export const invitations = mysqlTable("invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: mysqlEnum("role", ['employer', 'program_head']).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programOutcomes = mysqlTable("program_outcomes", {
  id: serial("id").primaryKey(),
  programId: int("program_id").notNull(),
  code: varchar("code", { length: 50 }).notNull(), 
  description: text("description").notNull(),
});

export const courses = mysqlTable("courses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), 
  name: text("name").notNull(),
  credits: int("credits").notNull().default(3),
  programId: int("program_id"),
});

export const coursePoMappings = mysqlTable("course_po_mappings", {
  id: serial("id").primaryKey(),
  courseId: int("course_id").notNull(),
  poId: int("po_id").notNull(),
  weight: int("weight").default(1),
});

export const enrollments = mysqlTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  courseId: int("course_id").notNull(),
  grade: int("grade").notNull(), 
  academicYear: varchar("academic_year", { length: 20 }).notNull(),
  term: text("term").notNull(),
  programId: int("program_id"),
});

export const surveys = mysqlTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetRole: mysqlEnum("target_role", ['student', 'graduate', 'employer']).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  programId: int("program_id"),
});

export const surveyQuestions = mysqlTable("survey_questions", {
  id: serial("id").primaryKey(),
  surveyId: int("survey_id").notNull(),
  text: text("text").notNull(),
  type: mysqlEnum("type", ['scale', 'text']).default('scale'),
  linkedPoId: int("linked_po_id"),
});

export const surveyResponses = mysqlTable("survey_responses", {
  id: serial("id").primaryKey(),
  surveyId: int("survey_id").notNull(),
  userId: varchar("user_id", { length: 255 }), 
  respondentName: text("respondent_name"), 
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const surveyAnswers = mysqlTable("survey_answers", {
  id: serial("id").primaryKey(),
  responseId: int("response_id").notNull(),
  questionId: int("question_id").notNull(),
  answerValue: int("answer_value"), 
  answerText: text("answer_text"), 
});

export const surveyCourseLinks = mysqlTable("survey_course_links", {
  id: serial("id").primaryKey(),
  surveyId: int("survey_id").notNull(),
  courseId: int("course_id").notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }),
  type: mysqlEnum("type", ['survey_reminder', 'announcement', 'grade_posted']).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employerFeedback = mysqlTable("employer_feedback", {
  id: serial("id").primaryKey(),
  employerId: varchar("employer_id", { length: 255 }),
  employerName: text("employer_name"),
  graduateId: varchar("graduate_id", { length: 255 }),
  graduateName: text("graduate_name"),
  poId: int("po_id").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  cohort: varchar("cohort", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programs = mysqlTable("programs", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  type: mysqlEnum("type", ['board', 'non_board']).notNull().default('non_board'),
  programHeadId: varchar("program_head_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programPoMappings = mysqlTable("program_po_mappings", {
  id: serial("id").primaryKey(),
  programId: int("program_id").notNull(),
  poId: int("po_id").notNull(),
});

export const boardExamResults = mysqlTable("board_exam_results", {
  id: serial("id").primaryKey(),
  programId: int("program_id").notNull(),
  examName: text("exam_name").notNull(),
  examDate: varchar("exam_date", { length: 50 }),
  passers: int("passers").notNull().default(0),
  takers: int("takers").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competencies = mysqlTable("competencies", {
  id: serial("id").primaryKey(),
  programId: int("program_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competencyPoMappings = mysqlTable("competency_po_mappings", {
  id: serial("id").primaryKey(),
  competencyId: int("competency_id").notNull(),
  poId: int("po_id").notNull(),
});

export const competencyRatings = mysqlTable("competency_ratings", {
  id: serial("id").primaryKey(),
  competencyId: int("competency_id").notNull(),
  employerId: varchar("employer_id", { length: 255 }),
  employerName: text("employer_name"),
  graduateId: varchar("graduate_id", { length: 255 }),
  graduateName: text("graduate_name"),
  batch: varchar("batch", { length: 20 }),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  surveyResponses: many(surveyResponses),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  enrollments: many(enrollments),
  poMappings: many(coursePoMappings),
}));

export const poRelations = relations(programOutcomes, ({ many }) => ({
  courseMappings: many(coursePoMappings),
  surveyQuestions: many(surveyQuestions),
}));

export const surveyRelations = relations(surveys, ({ many }) => ({
  questions: many(surveyQuestions),
  responses: many(surveyResponses),
}));

export const responseRelations = relations(surveyResponses, ({ one, many }) => ({
  survey: one(surveys, { fields: [surveyResponses.surveyId], references: [surveys.id] }),
  user: one(users, { fields: [surveyResponses.userId], references: [users.id] }),
  answers: many(surveyAnswers),
}));

export const answerRelations = relations(surveyAnswers, ({ one }) => ({
  response: one(surveyResponses, { fields: [surveyAnswers.responseId], references: [surveyResponses.id] }),
  question: one(surveyQuestions, { fields: [surveyAnswers.questionId], references: [surveyQuestions.id] }),
}));

// === ZOD SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvitationSchema = createInsertSchema(invitations).omit({ id: true, token: true, isUsed: true, createdAt: true });
export const insertPoSchema = createInsertSchema(programOutcomes).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true });
export const insertSurveySchema = createInsertSchema(surveys).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(surveyQuestions).omit({ id: true, surveyId: true });
export const insertResponseSchema = createInsertSchema(surveyResponses).omit({ id: true, submittedAt: true });
export const insertAnswerSchema = createInsertSchema(surveyAnswers).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertEmployerFeedbackSchema = createInsertSchema(employerFeedback).omit({ id: true, createdAt: true });
export const insertCoursePOMappingSchema = createInsertSchema(coursePoMappings).omit({ id: true });
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export const insertProgramPoMappingSchema = createInsertSchema(programPoMappings).omit({ id: true });
export const insertBoardExamResultSchema = createInsertSchema(boardExamResults).omit({ id: true, createdAt: true });
export const insertCompetencySchema = createInsertSchema(competencies).omit({ id: true, createdAt: true });
export const insertCompetencyPoMappingSchema = createInsertSchema(competencyPoMappings).omit({ id: true });
export const insertCompetencyRatingSchema = createInsertSchema(competencyRatings).omit({ id: true, createdAt: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type ProgramOutcome = typeof programOutcomes.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CoursePoMapping = typeof coursePoMappings.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type SurveyAnswer = typeof surveyAnswers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type EmployerFeedback = typeof employerFeedback.$inferSelect;
export type Program = typeof programs.$inferSelect;
export type ProgramPoMapping = typeof programPoMappings.$inferSelect;
export type BoardExamResult = typeof boardExamResults.$inferSelect;
export type Competency = typeof competencies.$inferSelect;
export type CompetencyPoMapping = typeof competencyPoMappings.$inferSelect;
export type CompetencyRating = typeof competencyRatings.$inferSelect;
