import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const tsFile = path.resolve("src/components/projects/task-management/taskListUtils.ts");
const source = fs.readFileSync(tsFile, "utf8");
const transpiled = ts.transpileModule(source, {
	compilerOptions: {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ES2020,
	},
});

const tmpFile = path.join(os.tmpdir(), `taskListUtils-${Date.now()}.mjs`);
fs.writeFileSync(tmpFile, transpiled.outputText, "utf8");
const module = await import(pathToFileURL(tmpFile).href);

const {
	filterTasks,
	sortTasks,
	groupTasks,
	getDefaultTaskPreferences,
	loadTaskPreferences,
	saveTaskPreferences,
} = module;

const tasks = [
	{
		id: "1",
		title: "Beta",
		status: "Pendiente",
		type: "Bug",
		priority: "Alta",
		created_at: "2026-01-01T00:00:00.000Z",
		assignees: [{ id: "a", name: "Ana", email: "ana@example.com" }],
		project_id: "p1",
	},
	{
		id: "2",
		title: "Alpha",
		status: "En progreso",
		type: "Feature",
		priority: "Media",
		created_at: "2026-01-03T00:00:00.000Z",
		assignees: [{ id: "b", name: "Luis", email: "luis@example.com" }],
		project_id: "p1",
	},
	{
		id: "3",
		title: "Gamma",
		status: "Cancelada",
		type: "Bug",
		priority: "Baja",
		created_at: "2026-01-02T00:00:00.000Z",
		assignees: [],
		project_id: "p1",
	},
];

const prefs = {
	...getDefaultTaskPreferences(),
	assignee: "Ana",
	hiddenStatuses: ["Cancelada"],
};
const filtered = filterTasks(tasks, prefs);
assert.deepEqual(filtered.map((task) => task.id), ["1"]);

const statusOrdered = sortTasks(
	tasks,
	{ ...getDefaultTaskPreferences(), sortField: "status", sortDirection: "asc" },
	{
		types: [],
		priorities: [],
		states: [
			{ name: "En progreso", color: "#1", requires_context: false },
			{ name: "Pendiente", color: "#2", requires_context: false },
			{ name: "Cancelada", color: "#3", requires_context: false },
		],
	},
);
assert.deepEqual(statusOrdered.map((task) => task.status), ["En progreso", "Pendiente", "Cancelada"]);

const grouped = groupTasks(tasks, { ...getDefaultTaskPreferences(), groupBy: "type" });
assert.equal(grouped.length, 2);
assert.equal(grouped[0].label, "Bug");

const storage = new Map();
global.window = {};
global.localStorage = {
	getItem: (key) => storage.get(key) || null,
	setItem: (key, value) => storage.set(key, value),
};

saveTaskPreferences("p1", { ...getDefaultTaskPreferences(), searchTerm: "alpha", sortDirection: "desc" });
const restored = loadTaskPreferences("p1");
assert.equal(restored.searchTerm, "alpha");
assert.equal(restored.sortDirection, "desc");

fs.unlinkSync(tmpFile);
console.log("task-list-utils tests passed");
