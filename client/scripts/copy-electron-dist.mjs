import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const distDir = path.join(projectRoot, "dist");
const electronWwwDir = path.join(projectRoot, "electron", "www");

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true });
}

async function clearDir(dir) {
	await fs.rm(dir, { recursive: true, force: true });
}

async function copyDir(src, dest) {
	await fs.cp(src, dest, { recursive: true });
}

async function main() {
	try {
		await fs.access(distDir);
	} catch {
		throw new Error(
			`No se encontro la carpeta dist en ${distDir}. Ejecuta el build de Vite primero.`,
		);
	}

	await clearDir(electronWwwDir);
	await ensureDir(electronWwwDir);
	await copyDir(distDir, electronWwwDir);
	console.log(`Electron: dist copiado a ${electronWwwDir}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
