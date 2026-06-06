import bcrypt from "bcrypt";
import { pool } from "../db";

export interface ChangeOwnPasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangeOwnPasswordResult {
  message: string;
}

export class AuthAccountError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthAccountError";
  }
}

const MIN_PASSWORD_LENGTH = 8;

const validatePasswordPayload = ({
  currentPassword,
  newPassword,
}: Pick<ChangeOwnPasswordInput, "currentPassword" | "newPassword">) => {
  if (!currentPassword || !newPassword) {
    throw new AuthAccountError(
      "currentPassword y newPassword son requeridos",
      400,
    );
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new AuthAccountError(
      `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      400,
    );
  }

  if (currentPassword === newPassword) {
    throw new AuthAccountError(
      "La nueva contraseña debe ser diferente a la actual",
      400,
    );
  }
};

export const changeOwnPassword = async ({
  userId,
  currentPassword,
  newPassword,
}: ChangeOwnPasswordInput): Promise<ChangeOwnPasswordResult> => {
  validatePasswordPayload({ currentPassword, newPassword });

  const { rows } = await pool.query<{ password: string | null }>(
    `SELECT password
       FROM users
       WHERE id = $1`,
    [userId],
  );

  if (rows.length === 0) {
    throw new AuthAccountError("Usuario no encontrado", 404);
  }

  const current = rows[0];
  if (!current.password) {
    throw new AuthAccountError(
      "La cuenta no tiene contraseña local para cambiar",
      400,
    );
  }

  const passwordValid = await bcrypt.compare(currentPassword, current.password);
  if (!passwordValid) {
    throw new AuthAccountError("Contraseña actual incorrecta", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE users
       SET password = $2
       WHERE id = $1`,
    [userId, hashedPassword],
  );

  return { message: "Contraseña actualizada correctamente" };
};
