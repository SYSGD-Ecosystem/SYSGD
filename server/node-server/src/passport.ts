import passport from "passport";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-google-oauth20";
import { createUser, findUserByUsername } from "./services/authService";
import { generateJWT } from "./controllers/auth";

dotenv.config();

const googleClientId = process.env.GOOGLE_CLIENT_ID;
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

			if (!email) return done(null, false);

			try {
				const user = await findUserByUsername(email);

				if (user === null) {
					const result = await createUser(email, name, "", "user");

					if (!result.success) {
						console.error("Error al crear usuario:", result.message);
						return done(null, false);
						// biome-ignore lint/style/noUselessElse: <explanation>
					} else {
						const token = generateJWT({
							id: result.user.id,
							username: result.user.username,
							name: result.user.name,
							privileges: result.user.privileges,
						});
						return done(null, { token });
					}
				}
				const token = generateJWT({
					id: user.id,
					username: user.username,
					name: user.name,
					privileges: user.privileges,
				});

				return done(null, { token });
			} catch (err) {
				console.error("Error en login con Google:", err);
				return done(err, false);
			}
		},
	),
);
