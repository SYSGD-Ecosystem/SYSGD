import { pool } from "../db";

export interface AppRelease {
	app_key: string;
	display_name: string;
	download_url: string;
	changelog: string;
	version_name: string;
	version_code: number;
	updated_at: string;
	updated_by: string | null;
}

export interface UpsertAppReleaseInput {
	displayName?: string;
	downloadUrl: string;
	changelog: string;
	versionName: string;
	versionCode: number;
}

const RELEASE_COLUMNS = `app_key, display_name, download_url, changelog,
	version_name, version_code, updated_at, updated_by`;

/**
 * Versiones publicadas de las apps (sección Aplicaciones de la web + aviso de
 * actualización en la app). Una fila por app_key con la ÚLTIMA release; el
 * version_code (entero) es la autoridad de "cuál es más actual".
 */
export const getAppRelease = async (
	appKey: string,
): Promise<AppRelease | null> => {
	const { rows } = await pool.query<AppRelease>(
		`SELECT ${RELEASE_COLUMNS} FROM app_releases WHERE app_key = $1`,
		[appKey],
	);
	return rows[0] ?? null;
};

export const listAppReleases = async (): Promise<AppRelease[]> => {
	const { rows } = await pool.query<AppRelease>(
		`SELECT ${RELEASE_COLUMNS} FROM app_releases ORDER BY app_key ASC`,
	);
	return rows;
};

export const upsertAppRelease = async (
	appKey: string,
	adminId: string,
	input: UpsertAppReleaseInput,
): Promise<AppRelease> => {
	const { rows } = await pool.query<AppRelease>(
		`INSERT INTO app_releases (
		    app_key, display_name, download_url, changelog,
		    version_name, version_code, updated_at, updated_by
		 ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
		 ON CONFLICT (app_key) DO UPDATE SET
		    display_name = EXCLUDED.display_name,
		    download_url = EXCLUDED.download_url,
		    changelog = EXCLUDED.changelog,
		    version_name = EXCLUDED.version_name,
		    version_code = EXCLUDED.version_code,
		    updated_at = NOW(),
		    updated_by = EXCLUDED.updated_by
		 RETURNING ${RELEASE_COLUMNS}`,
		[
			appKey,
			input.displayName?.trim() || appKey,
			input.downloadUrl.trim(),
			input.changelog.trim(),
			input.versionName.trim(),
			input.versionCode,
			adminId,
		],
	);
	return rows[0];
};
