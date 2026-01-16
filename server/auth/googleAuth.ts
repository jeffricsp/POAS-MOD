import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
// @ts-ignore
import MySQLStoreFactory from "express-mysql-session";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../db";
import { users, invitations } from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    invite_token?: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  
  if (process.env.MYSQL_HOSTNAME && process.env.MYSQL_USER && 
      process.env.MYSQL_PASSWORD && process.env.MYSQL_DBNAME) {
    const MySQLStore = MySQLStoreFactory(session as any);
    sessionStore = new MySQLStore({
      host: process.env.MYSQL_HOSTNAME,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DBNAME,
      createDatabaseTable: true,
      expiration: sessionTtl,
    });
  } else {
    console.warn("MySQL session store not configured, using in-memory sessions (not suitable for production)");
  }

  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

async function findOrCreateUser(profile: any, inviteRole?: string, inviteEmail?: string) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value;
  const firstName = profile.name?.givenName || null;
  const lastName = profile.name?.familyName || null;
  const profileImageUrl = profile.photos?.[0]?.value || null;

  // Only apply invite role if the Google email matches the invite email
  const shouldApplyInviteRole = inviteRole && inviteEmail && 
    email?.toLowerCase() === inviteEmail.toLowerCase();

  // First try to find user by Google ID
  let [existingUser] = await db.select().from(users).where(eq(users.googleId, googleId));
  
  // If not found by Google ID, try to find by email (for migrating existing users)
  if (!existingUser && email) {
    const [userByEmail] = await db.select().from(users).where(eq(users.email, email));
    if (userByEmail) {
      // Migrate existing user: link their account with Google ID (preserve primary key)
      await db.update(users).set({ 
        googleId,
        firstName,
        lastName,
        profileImageUrl,
        updatedAt: new Date(),
        ...(shouldApplyInviteRole ? { role: inviteRole as any } : {})
      }).where(eq(users.email, email));
      const [updatedUser] = await db.select().from(users).where(eq(users.email, email));
      return updatedUser;
    }
  }
  
  if (existingUser) {
    const updateData: any = {
      email,
      firstName,
      lastName,
      profileImageUrl,
      updatedAt: new Date(),
    };
    if (shouldApplyInviteRole) {
      updateData.role = inviteRole;
    }
    await db.update(users).set(updateData).where(eq(users.googleId, googleId));
    const [updatedUser] = await db.select().from(users).where(eq(users.googleId, googleId));
    return updatedUser;
  }

  const allUsers = await db.select().from(users);
  const isFirstUser = allUsers.length === 0;

  await db.insert(users).values({
    id: googleId,
    googleId,
    email,
    firstName,
    lastName,
    profileImageUrl,
    role: ((shouldApplyInviteRole ? inviteRole : null) || (isFirstUser ? "admin" : "student")) as any,
  });
  
  const [newUser] = await db.select().from(users).where(eq(users.googleId, googleId));
  return newUser;
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientID || !clientSecret) {
    console.warn("Google OAuth credentials not configured. Authentication will not work.");
    return;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: true,
      },
      async (req: any, accessToken, refreshToken, profile, done) => {
        try {
          const inviteToken = req.session?.invite_token;
          let inviteRole: string | undefined;
          let inviteEmail: string | undefined;

          if (inviteToken) {
            const [invite] = await db.select().from(invitations).where(eq(invitations.token, inviteToken));
            if (invite && !invite.isUsed) {
              inviteRole = invite.role;
              inviteEmail = invite.email;
              // Only mark as used if email matches (done inside findOrCreateUser)
            }
            delete req.session.invite_token;
          }

          const googleEmail = profile.emails?.[0]?.value;
          const user = await findOrCreateUser(profile, inviteRole, inviteEmail);
          
          // Mark invitation as used only after successful role assignment (email matched)
          if (inviteToken && inviteEmail && googleEmail?.toLowerCase() === inviteEmail.toLowerCase()) {
            await db.update(invitations).set({ isUsed: true }).where(eq(invitations.token, inviteToken));
          }
          
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );

  // Local (email/password) strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
          
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!user.password) {
            return done(null, false, { message: "Please sign in with Google" });
          }
          
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    // Store the primary key (id) in session, not googleId
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Lookup by primary key (id)
      const [user] = await db.select().from(users).where(eq(users.id, id));
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  // Email/password registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, inviteToken, programId } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Check if email already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Check invite token
      let inviteRole: string | undefined;
      let inviteEmail: string | undefined;
      
      if (inviteToken) {
        const [invite] = await db.select().from(invitations).where(eq(invitations.token, inviteToken));
        if (invite && !invite.isUsed) {
          inviteRole = invite.role;
          inviteEmail = invite.email;
        }
      }
      
      // Only apply invite role if emails match
      const shouldApplyInviteRole = inviteRole && inviteEmail && 
        email.toLowerCase() === inviteEmail.toLowerCase();
      
      const allUsers = await db.select().from(users);
      const isFirstUser = allUsers.length === 0;
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      
      await db.insert(users).values({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: ((shouldApplyInviteRole ? inviteRole : null) || (isFirstUser ? "admin" : "student")) as any,
        programId: programId ? parseInt(programId) : null,
      });
      
      // Mark invitation as used if email matched
      if (inviteToken && shouldApplyInviteRole) {
        await db.update(invitations).set({ isUsed: true }).where(eq(invitations.token, inviteToken));
      }
      
      const [newUser] = await db.select().from(users).where(eq(users.id, userId));
      
      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        // Don't return password in response
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Email/password login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        // Don't return password in response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.get("/api/login", (req, res, next) => {
    const inviteToken = req.query.invite_token as string | undefined;
    if (inviteToken) {
      req.session.invite_token = inviteToken;
    }
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res, next);
  });

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=auth_failed",
    }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      // Strip password from response
      const { password: _, ...userWithoutPassword } = req.user as any;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}
