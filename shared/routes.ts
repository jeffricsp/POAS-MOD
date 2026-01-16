import { z } from 'zod';
import { 
  insertUserSchema, insertInvitationSchema, insertPoSchema, insertCourseSchema, 
  insertEnrollmentSchema, insertSurveySchema, insertQuestionSchema, insertResponseSchema, insertAnswerSchema,
  insertNotificationSchema, insertEmployerFeedbackSchema, insertCoursePOMappingSchema, insertProgramSchema, insertBoardExamResultSchema,
  insertCompetencySchema, insertCompetencyRatingSchema,
  programOutcomes, courses, surveys, surveyQuestions, surveyResponses, invitations, users, enrollments,
  notifications, employerFeedback, coursePoMappings, programs, boardExamResults, competencies, competencyRatings
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/auth/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  invitations: {
    create: {
      method: 'POST' as const,
      path: '/api/invitations',
      input: insertInvitationSchema,
      responses: {
        201: z.custom<typeof invitations.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    verify: {
      method: 'POST' as const,
      path: '/api/invitations/verify',
      input: z.object({ token: z.string() }),
      responses: {
        200: z.object({ valid: z.boolean(), role: z.string().optional(), email: z.string().optional() }),
        404: errorSchemas.notFound,
      }
    }
  },
  programOutcomes: {
    list: {
      method: 'GET' as const,
      path: '/api/program-outcomes',
      responses: {
        200: z.array(z.custom<typeof programOutcomes.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/program-outcomes',
      input: insertPoSchema,
      responses: {
        201: z.custom<typeof programOutcomes.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/program-outcomes/:id',
      input: insertPoSchema.partial(),
      responses: {
        200: z.custom<typeof programOutcomes.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/program-outcomes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses',
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/courses/:id',
      responses: {
        200: z.custom<typeof courses.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/courses',
      input: insertCourseSchema,
      responses: {
        201: z.custom<typeof courses.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/courses/:id',
      input: insertCourseSchema.partial(),
      responses: {
        200: z.custom<typeof courses.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/courses/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    getMappings: {
      method: 'GET' as const,
      path: '/api/courses/:id/pos',
      responses: {
        200: z.array(z.number()),
      }
    },
    setMappings: {
      method: 'PUT' as const,
      path: '/api/courses/:id/pos',
      input: z.object({ poIds: z.array(z.number()) }),
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    }
  },
  enrollments: {
    list: {
      method: 'GET' as const,
      path: '/api/enrollments',
      responses: {
        200: z.array(z.custom<typeof enrollments.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/enrollments',
      input: insertEnrollmentSchema,
      responses: {
        201: z.custom<typeof enrollments.$inferSelect>(),
      }
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/enrollments/bulk',
      input: z.array(insertEnrollmentSchema),
      responses: {
        201: z.object({ count: z.number() }),
      }
    },
    listByUser: {
      method: 'GET' as const,
      path: '/api/users/:userId/enrollments',
      responses: {
        200: z.array(z.custom<typeof enrollments.$inferSelect>()),
      }
    },
    listByCourse: {
      method: 'GET' as const,
      path: '/api/courses/:courseId/enrollments',
      responses: {
        200: z.array(z.custom<typeof enrollments.$inferSelect>()),
      }
    }
  },
  surveys: {
    list: {
      method: 'GET' as const,
      path: '/api/surveys',
      responses: {
        200: z.array(z.custom<typeof surveys.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/surveys/:id',
      responses: {
        200: z.custom<typeof surveys.$inferSelect & { questions: typeof surveyQuestions.$inferSelect[], courseIds: number[] }>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/surveys',
      input: insertSurveySchema.extend({
        questions: z.array(insertQuestionSchema),
        courseIds: z.array(z.number()).optional()
      }),
      responses: {
        201: z.custom<typeof surveys.$inferSelect>(),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/surveys/:id',
      input: insertSurveySchema.partial().extend({
        questions: z.array(insertQuestionSchema).optional(),
        courseIds: z.array(z.number()).optional()
      }),
      responses: {
        200: z.custom<typeof surveys.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/surveys/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    submit: {
      method: 'POST' as const,
      path: '/api/surveys/:id/responses',
      input: z.object({
        respondentName: z.string().optional(),
        answers: z.array(z.object({
          questionId: z.number(),
          answerValue: z.number().optional(),
          answerText: z.string().optional()
        }))
      }),
      responses: {
        201: z.custom<typeof surveyResponses.$inferSelect>(),
      }
    },
    getResponses: {
      method: 'GET' as const,
      path: '/api/surveys/:id/responses',
      responses: {
        200: z.array(z.any()),
      }
    }
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/notifications',
      input: insertNotificationSchema,
      responses: {
        201: z.custom<typeof notifications.$inferSelect>(),
      }
    },
    createBulk: {
      method: 'POST' as const,
      path: '/api/notifications/bulk',
      input: z.object({
        userIds: z.array(z.string()),
        type: z.enum(['survey_reminder', 'announcement', 'grade_posted']),
        title: z.string(),
        message: z.string()
      }),
      responses: {
        201: z.object({ count: z.number() }),
      }
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/notifications/:id/read',
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    }
  },
  employerFeedback: {
    list: {
      method: 'GET' as const,
      path: '/api/employer-feedback',
      responses: {
        200: z.array(z.custom<typeof employerFeedback.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/employer-feedback',
      input: insertEmployerFeedbackSchema,
      responses: {
        201: z.custom<typeof employerFeedback.$inferSelect>(),
      }
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/employer-feedback/bulk',
      input: z.array(insertEmployerFeedbackSchema),
      responses: {
        201: z.object({ count: z.number() }),
      }
    }
  },
  analytics: {
    get: {
      method: 'GET' as const,
      path: '/api/analytics',
      responses: {
        200: z.any(),
      }
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      }
    },
    updateRole: {
      method: 'PATCH' as const,
      path: '/api/users/:id/role',
      input: z.object({ role: z.enum(['student', 'graduate', 'program_head', 'admin', 'employer']) }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      }
    }
  },
  programs: {
    list: {
      method: 'GET' as const,
      path: '/api/programs',
      responses: {
        200: z.array(z.custom<typeof programs.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/programs/:id',
      responses: {
        200: z.custom<typeof programs.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/programs',
      input: insertProgramSchema,
      responses: {
        201: z.custom<typeof programs.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/programs/:id',
      input: insertProgramSchema.partial(),
      responses: {
        200: z.custom<typeof programs.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/programs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    getMappings: {
      method: 'GET' as const,
      path: '/api/programs/:id/pos',
      responses: {
        200: z.array(z.number()),
      }
    },
    setMappings: {
      method: 'PUT' as const,
      path: '/api/programs/:id/pos',
      input: z.object({ poIds: z.array(z.number()) }),
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    }
  },
  boardExams: {
    list: {
      method: 'GET' as const,
      path: '/api/programs/:programId/board-exams',
      responses: {
        200: z.array(z.custom<typeof boardExamResults.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/programs/:programId/board-exams',
      input: insertBoardExamResultSchema,
      responses: {
        201: z.custom<typeof boardExamResults.$inferSelect>(),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/board-exams/:id',
      input: insertBoardExamResultSchema.partial(),
      responses: {
        200: z.custom<typeof boardExamResults.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/board-exams/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  competencies: {
    list: {
      method: 'GET' as const,
      path: '/api/competencies',
      responses: {
        200: z.array(z.custom<typeof competencies.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/competencies/:id',
      responses: {
        200: z.custom<typeof competencies.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/competencies',
      input: insertCompetencySchema.extend({ poIds: z.array(z.number()).optional() }),
      responses: {
        201: z.custom<typeof competencies.$inferSelect>(),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/competencies/:id',
      input: insertCompetencySchema.partial().extend({ poIds: z.array(z.number()).optional() }),
      responses: {
        200: z.custom<typeof competencies.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/competencies/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    getMappings: {
      method: 'GET' as const,
      path: '/api/competencies/:id/pos',
      responses: {
        200: z.array(z.number()),
      }
    }
  },
  competencyRatings: {
    list: {
      method: 'GET' as const,
      path: '/api/competency-ratings',
      responses: {
        200: z.array(z.custom<typeof competencyRatings.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/competency-ratings',
      input: insertCompetencyRatingSchema,
      responses: {
        201: z.custom<typeof competencyRatings.$inferSelect>(),
      }
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/competency-ratings/bulk',
      input: z.array(insertCompetencyRatingSchema),
      responses: {
        201: z.object({ count: z.number() }),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
