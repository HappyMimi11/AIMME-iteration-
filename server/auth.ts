import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    // Define Express.User to include our User type
    interface User {
      id: number;
      username: string;
      email: string;
      password: string | null;
      displayName: string | null;
      photoURL: string | null;
      provider: string | null;
      providerId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Password hashing functions
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Setup PostgreSQL session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });

// Auth middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a proper secret in production
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Serialize/deserialize user for session
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, username, password, displayName, photoURL, provider, providerId } = req.body;
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password for local users
      let hashedPassword = null;
      if (password && provider === 'local') {
        hashedPassword = await hashPassword(password);
      }

      // Create user
      const newUser = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        displayName: displayName || username,
        photoURL,
        provider: provider || 'local',
        providerId
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      // Log in the user
      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Local login endpoint
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user as User;
    res.status(200).json(userWithoutPassword);
  });

  // Firebase/Google login endpoint
  app.post("/api/auth/firebase-login", async (req, res, next) => {
    try {
      const { email, displayName, photoURL, uid } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists by provider ID
      let user = await storage.getUserByProviderId(uid);
      
      if (!user) {
        // Check if user exists by email
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Update existing user with firebase info
          user = await storage.updateUser(user.id, {
            providerId: uid,
            provider: 'firebase',
            displayName: displayName || user.displayName,
            photoURL: photoURL || user.photoURL
          });
        } else {
          // Create new user
          const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
          user = await storage.createUser({
            email,
            username,
            displayName: displayName || username,
            photoURL,
            provider: 'firebase',
            providerId: uid,
          });
        }
      }

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user as User;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}