import passport from "passport";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "./index";
import type { VerifyCallback } from "passport-google-oauth20";

dotenv.config();

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error("Missing Google OAuth environment variables");
}

passport.use(
  new GoogleStrategy(
    {
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done: VerifyCallback) => {
      const email = profile.emails?.[0].value;
      const name = profile.displayName;

      console.log("Login con Google:", { email, name });

      if (!email) return done(null, false);

      try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [email]);

        // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
        let user;
        if (result.rows.length === 0) {
          const insertResult = await pool.query(
            "INSERT INTO users (name, username, password, privileges) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, "", "user"]
          );
          user = insertResult.rows[0];
          console.log("Nuevo usuario registrado:", user);
        } else {
          user = result.rows[0];
          console.log("Usuario existente:", user);
        }

        return done(null, {
          id: user.id,
          username: user.username,
          name: user.name,
          privileges: user.privileges,
        });
      } catch (err) {
        console.error("Error en login con Google:", err);
        return done(err, false);
      }
    }
  )
);


// biome-ignore lint/suspicious/noExplicitAny: <explanation>
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query(
      "SELECT id, name, username, privileges FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) return done(null, false);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});
