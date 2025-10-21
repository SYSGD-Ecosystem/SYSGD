"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const authService_1 = require("./services/authService");
const auth_1 = require("./controllers/auth");
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret) {
    throw new Error("Missing Google OAuth environment variables");
}
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: "/api/auth/google/callback",
}, (_accessToken, _refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const email = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value;
    const name = profile.displayName;
    if (!email)
        return done(null, false);
    try {
        const user = yield (0, authService_1.findUserByUsername)(email);
        if (user === null) {
            const result = yield (0, authService_1.createUser)(name, email, "", "user");
            if (!result.success) {
                console.error("Error al crear usuario:", result.message);
                return done(null, false);
                // biome-ignore lint/style/noUselessElse: <explanation>
            }
            else {
                const token = (0, auth_1.generateJWT)({
                    id: result.user.id,
                    username: result.user.username,
                    name: result.user.name,
                    privileges: result.user.privileges,
                });
                return done(null, { token });
            }
        }
        const token = (0, auth_1.generateJWT)({
            id: user.id,
            username: user.username,
            name: user.name,
            privileges: user.privileges,
        });
        return done(null, { token });
    }
    catch (err) {
        console.error("Error en login con Google:", err);
        return done(err, false);
    }
})));
