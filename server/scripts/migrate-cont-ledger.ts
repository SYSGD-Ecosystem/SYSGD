import "dotenv/config";
import { pool } from "../src/db";
import { LedgerEncryptionService } from "../src/services/ledger-encryption.service";

interface ContLedgerRecord {
  user_id: string;
  registro: unknown;
  inventario_registro: unknown;
  updated_at: string;
}

async function migrate(): Promise<void> {
  console.log("[migración] Iniciando...");

  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM cont_ledger_records`
  );
  const totalUsuarios = Number.parseInt(countRows[0].count, 10);
  console.log(`[migración] Registros en cont_ledger_records: ${totalUsuarios}`);

  const { rows } = await pool.query<ContLedgerRecord>(
    `SELECT user_id, registro, inventario_registro, updated_at FROM cont_ledger_records`
  );
  console.log(`[migración] Iniciando migración de ${rows.length} usuario(s)...`);

  let totalSpaces = 0;
  let usuariosMigrados = 0;

  for (let i = 0; i < rows.length; i++) {
    const { user_id, registro, inventario_registro, updated_at } = rows[i];
    console.log(`[migración] [${i + 1}/${rows.length}] Procesando usuario ${user_id}...`);

    let decrypted: unknown = registro;
    if (
      typeof registro === "object" &&
      registro !== null &&
      "encrypted" in (registro as Record<string, unknown>)
    ) {
      try {
        decrypted = LedgerEncryptionService.decryptLedger(registro as never);
      } catch (error) {
        console.error(`[migración] Error descifrando usuario ${user_id}:`, error);
        continue;
      }
    }

    const container = decrypted as {
      workspaces?: Record<string, unknown>[];
      activeWorkspaceId?: string;
    };
    const workspaces = container.workspaces ?? [];

    if (workspaces.length === 0) {
      console.log(`[migración] Usuario ${user_id}: sin workspaces, se omite`);
      continue;
    }

    for (const ws of workspaces) {
      const wsData = {
        ...ws,
        _activeWorkspaceId: container.activeWorkspaceId,
        _inventarioRegistro: inventario_registro,
        _migratedAt: new Date().toISOString(),
      };

      const spaceId = (ws as { id?: string }).id ?? `space-${totalSpaces}`;
      await pool.query(
        `INSERT INTO gctcp_spaces (user_id, space_id, data, updated_at)
         VALUES ($1, $2, $3::jsonb, $4)
         ON CONFLICT DO NOTHING`,
        [user_id, spaceId, JSON.stringify(wsData), updated_at]
      );
      totalSpaces++;
    }

    usuariosMigrados++;
    console.log(`[migración] Usuario ${user_id}: ${workspaces.length} space(s) migrado(s)`);
  }

  console.log(
    `[migración] Completada: ${usuariosMigrados} usuarios, ${totalSpaces} spaces`
  );
  await pool.end();
}

migrate().catch((error) => {
  console.error("[migración] Error fatal:", error);
  process.exit(1);
});
