// Extrae endpoints + parametros de entrada desde server/src (rutas -> controllers/services)
// Salida: ../../client/src/data/api-docs.generated.ts  (+ /tmp/opencode/api_params.json)
const fs = require("fs");
const path = require("path");
const SERVER = path.resolve(__dirname, "..");
const ROOT = path.join(SERVER, "src");
const OUT =
  process.env.API_DOCS_OUT ||
  path.resolve(SERVER, "..", "client", "src", "data", "api-docs.generated.ts");
const ROUTES = path.join(ROOT, "routes");
const read = (p) => fs.readFileSync(p, "utf8");

const VALIDATORS = new Set([
  "isAuthenticated",
  "optionalAuth",
  "checkTaskLimit",
  "checkAICredits",
  "hasWorkspaceAccess",
  "hasProjectAccess",
  "checkFileSize",
  "rateLimit",
  "isAdmin",
  "requireAdmin",
]);

// ---------- helpers de texto (consciente de strings, templates y comentarios) ----------
// Devuelve el indice del caracter `stop` que cierra el nivel 0 de parentesis/llaves.
function scanBalanced(src, openIdx, open, close) {
  let depth = 0;
  let i = openIdx;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0) return -1;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i) + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < src.length) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === q) break;
        if (q === "`" && src[i] === "$" && src[i + 1] === "{") {
          const end = scanBalanced(src, i + 1, "{", "}");
          i = end < 0 ? src.length : end;
        }
        i++;
      }
      i++;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}
function matchParen(src, i) {
  return scanBalanced(src, i, "(", ")");
}
function matchBrace(src, i) {
  return scanBalanced(src, i, "{", "}");
}
// separa por comas de nivel superior, ignorando strings/templates/comentarios
function splitTopLevel(s) {
  const out = [];
  let depth = 0,
    cur = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "/") {
      const nl = s.indexOf("\n", i);
      i = nl < 0 ? s.length : nl;
      continue;
    }
    if (c === "/" && s[i + 1] === "*") {
      const e = s.indexOf("*/", i);
      i = e < 0 ? s.length : e + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      let j = i + 1;
      while (j < s.length) {
        if (s[j] === "\\") {
          j += 2;
          continue;
        }
        if (s[j] === q) break;
        j++;
      }
      cur += s.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if ("([{<".includes(c)) depth++;
    else if (")]}>".includes(c)) depth--;
    if (c === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += c;
    i++;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
// indice de funciones por archivo: nombre -> cuerpo (arrow, function decl, metodos de clase/objeto)
// firmas: nombre -> lista de nombres de parametro, para resolver llamadas
const SIGS = new Map(); // name -> [paramNames]
function recordSig(name, argsText) {
  const names = splitTopLevel(argsText).map((a) => {
    const t = a.trim().replace(/^[a-z]+\s+/i, "");
    return (t.split(/[:?=]/)[0] || "").replace(/^\.\.\./, "").trim();
  });
  if (names.length && !SIGS.has(name)) SIGS.set(name, names);
}
function indexFunctions(src) {
  const fns = new Map();
  const arrowRe =
    /(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_]+)\s*(?::[^=]*?)?=\s*(?:async\s+)?\(/g;
  const declRe = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g;
  const methRe = /(?:static\s+)?(?:async\s+)?([A-Za-z0-9_]+)\s*\(\s*req(?:uest)?\s*:/g;
  const eat = (m, name) => {
    const open = m.index + m[0].lastIndexOf("(");
    const close = matchParen(src, open);
    if (close < 0) return;
    recordSig(name, src.slice(open + 1, close));
    let j = close + 1;
    while (j < src.length && src[j] !== "{" && src[j] !== ";" && src[j] !== "\n") j++;
    if (src[j] !== "{") return;
    const end = matchBrace(src, j);
    if (end < 0) return;
    const body = src.slice(j + 1, end);
    const reads =
      body.includes("req.body") ||
      body.includes("req.params") ||
      body.includes("req.query");
    if (reads) fns.set(name, body);
    else if (!all.has(name)) all.set(name, body);
  };
  const all = new Map();
  for (const m of src.matchAll(arrowRe)) {
    const arrow = src.indexOf("=>", m.index + m[0].length);
    if (arrow < 0) continue;
    {
      const popen = m.index + m[0].lastIndexOf("(");
      const pclose = matchParen(src, popen);
      if (pclose > -1) recordSig(m[1], src.slice(popen + 1, pclose));
    }
    const brace = src.indexOf("{", arrow);
    if (brace < 0) continue;
    const end = matchBrace(src, brace);
    if (end < 0) continue;
    const name = m[1];
    const body = src.slice(brace + 1, end);
    const reads =
      body.includes("req.body") ||
      body.includes("req.params") ||
      body.includes("req.query");
    if (reads) fns.set(name, body);
    else if (!all.has(name)) all.set(name, body);
  }
  for (const m of src.matchAll(declRe)) eat(m, m[1]);
  for (const m of src.matchAll(methRe)) eat(m, m[1]);
  for (const [n, b] of all) if (!fns.has(n)) fns.set(n, b);
  return fns;
}

// ---------- 1. montajes de index.ts ----------
const index = read(path.join(ROUTES, "index.ts"));
const impMap = {};
for (const im of index.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+["'`]([^"'`]+)["'`]/g))
  impMap[im[1]] = im[2];
const mounts = [];
for (const m of index.matchAll(
  /router\.use\(\s*(?:["'`]([^"'`]*)["'`]\s*,\s*)?([A-Za-z0-9_]+)\s*\)/g,
)) {
  const rel = impMap[m[2]];
  if (!rel) continue;
  const base = path.resolve(ROUTES, rel);
  const real = [base, `${base}.ts`, path.join(base, "index.ts")].find((c) =>
    fs.existsSync(c),
  );
  if (real) mounts.push({ mount: m[1] || "", file: real });
}

// mascara de codigo: 1 = codigo real, 0 = string/comentario
function codeMask(src) {
  const mask = new Uint8Array(src.length);
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      let nl = src.indexOf("\n", i);
      if (nl < 0) nl = src.length;
      i = nl;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const e = src.indexOf("*/", i);
      i = e < 0 ? src.length : e + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === q) break;
        j++;
      }
      i = j + 1;
      continue;
    }
    mask[i] = 1;
    i++;
  }
  return mask;
}
// ---------- indices globales: tipos, clases, funciones ----------
const ALL_FILES = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) ALL_FILES.push(p);
  }
})(ROOT);
const fileSrc = new Map(ALL_FILES.map((f) => [f, read(f)]));

// interface X { a: string; b?: number }  |  type X = { ... }
function indexTypes() {
  const types = new Map();
  for (const [f, src] of fileSrc) {
    for (const m of src.matchAll(
      /(?:export\s+)?interface\s+([A-Za-z0-9_]+)(?:<[^>]*>)?\s*(?:extends\s+[^{]+)?\{/g,
    )) {
      const brace = m.index + m[0].length - 1;
      const end = matchBrace(src, brace);
      if (end < 0) continue;
      const fields = parseFields(src.slice(brace + 1, end));
      if (!types.has(m[1])) types.set(m[1], { fields, file: path.relative(ROOT, f) });
    }
    for (const m of src.matchAll(/(?:export\s+)?type\s+([A-Za-z0-9_]+)\s*=\s*\{/g)) {
      const brace = m.index + m[0].length - 1;
      const end = matchBrace(src, brace);
      if (end < 0) continue;
      const fields = parseFields(src.slice(brace + 1, end));
      if (!types.has(m[1])) types.set(m[1], { fields, file: path.relative(ROOT, f) });
    }
  }
  return types;
}
function parseFields(body) {
  const out = [];
  let depth = 0,
    cur = "";
  const flush = () => {
    const line = cur.trim();
    cur = "";
    if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) return;
    const fm = line.match(/^([A-Za-z0-9_]+)(\?)?\s*:\s*(.+?);?$/);
    if (!fm) return;
    out.push({ name: fm[1], optional: !!fm[2], type: fm[3].replace(/;$/, "").trim() });
  };
  for (const c of body) {
    if ("([{<".includes(c)) depth++;
    else if (")]}>".includes(c)) depth--;
    if (c === ";" && depth === 0) flush();
    else if (c === "\n" && depth === 0) {
      // campos sin ';' (estilo sin punto y coma)
      if (/^[^:]+:\s*.+$/.test(cur.trim()) && !cur.includes("//")) flush();
      else cur += c;
    } else cur += c;
  }
  flush();
  return out;
}

// class X { static async m(...) {} }  -> Map clase -> Map metodo -> cuerpo
function indexClasses() {
  const classes = new Map();
  for (const [f, src] of fileSrc) {
    const cm = src.match(/class\s+([A-Za-z0-9_]+)/);
    if (!cm) continue;
    const methods = new Map();
    const re = /(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?([A-Za-z0-9_]+)\s*\(\s*req/g;
    let m;
    while ((m = re.exec(src))) {
      const name = m[1];
      if (["if", "for", "while", "switch", "catch", "constructor"].includes(name)) continue;
      const open = src.indexOf("(", m.index);
      const close = matchParen(src, open);
      if (close < 0) continue;
      recordSig(`${cm[1]}.${name}`, src.slice(open + 1, close));
      let j = close + 1;
      while (j < src.length && src[j] !== "{" && src[j] !== ";") j++;
      if (src[j] !== "{") continue;
      const end = matchBrace(src, j);
      if (end < 0) continue;
      if (!methods.has(name)) methods.set(name, src.slice(j + 1, end));
    }
    if (methods.size) classes.set(cm[1], methods);
  }
  return classes;
}

// metodos de un objeto: export const TasksService = { async createTask(...) {} }
function indexObjectMethods() {
  const objs = new Map();
  for (const [f, src] of fileSrc) {
    for (const m of src.matchAll(
      /(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*(?::[^=]+)?=\s*\{/g,
    )) {
      const brace = m.index + m[0].length - 1;
      const end = matchBrace(src, brace);
      if (end < 0) continue;
      const methods = new Map();
      const re =
        /(?:async\s+)?([A-Za-z0-9_]+)\s*\(\s*[^)]*\)\s*(?::[^{;]+)?\{/g;
      let mm;
      while ((mm = re.exec(src.slice(brace + 1, end)))) {
        const s = brace + 1 + mm.index;
        const popen = src.indexOf("(", s);
        const pclose = matchParen(src, popen);
        if (pclose > -1) recordSig(`${m[1]}.${mm[1]}`, src.slice(popen + 1, pclose));
        const b = src.indexOf("{", s);
        const e = matchBrace(src, b);
        if (e < 0) continue;
        if (!methods.has(mm[1])) methods.set(mm[1], src.slice(b + 1, e));
      }
      if (methods.size) objs.set(m[1], methods);
    }
  }
  return objs;
}

// esquemas zod: const NAME = z.object({ campo: z.string().min(1) ... })
function indexZod() {
  const out = new Map();
  for (const [f, src] of fileSrc) {
    for (const m of src.matchAll(
      /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*z\.object\(\s*\{/g,
    )) {
      const brace = m.index + m[0].length - 1;
      const end = matchBrace(src, brace);
      if (end < 0) continue;
      const inner = src.slice(brace + 1, end);
      const fields = [];
      for (const fm of inner.matchAll(
        /([A-Za-z0-9_]+)\s*:\s*z\.([^,\n}]+)/g,
      )) {
        const chain = fm[2];
        const optional = /\.optional\(\)/.test(chain);
        const hasDefault = /\.default\(/.test(chain);
        let type = "any";
        if (/^string\b/.test(chain)) type = "string";
        else if (/^number\b|^coerce\.number/.test(chain)) type = "number";
        else if (/^boolean\b/.test(chain)) type = "boolean";
        else if (/^array\b/.test(chain)) type = "array";
        else if (/^enum\(/.test(chain)) {
          const em = chain.match(/enum\(\[([^\]]*)\]/);
          type = em ? `enum(${(em[1].match(/"([^"]*)"/g) || []).join(", ").replace(/"/g, "")})` : "enum";
        } else if (/^object\b|^record\(|^any\b/.test(chain)) type = "object";
        const cons = [];
        const min = chain.match(/\.min\((\d+)/);
        const max = chain.match(/\.max\((\d+)/);
        if (min) cons.push(`min ${min[1]}`);
        if (max) cons.push(`max ${max[1]}`);
        if (/\.email\(\)/.test(chain)) cons.push("email");
        if (/\.url\(\)|\.uuid\(\)|\.isUUID\(\)/.test(chain)) cons.push("uuid/url");
        const def = chain.match(/\.default\(([^)]*)\)/);
        fields.push({
          name: fm[1],
          type,
          required: !optional && !hasDefault,
          constraint: cons.length ? cons.join(", ") : undefined,
          default: def ? def[1].trim() : undefined,
        });
      }
      out.set(m[1], fields);
    }
  }
  return out;
}
const ZOD = indexZod();
const TYPES = indexTypes();
const CLASSES = indexClasses();
const OBJECTS = indexObjectMethods();

// ---------- 2. handlers ----------
const searchFiles = ALL_FILES.filter((f) =>
  /\/(controllers|services|utils|routes)\//.test(f),
);
// constantes que no son funciones: middleware de multer, flags, etc.
const EXPRS = new Map();
for (const [f, src] of fileSrc) {
  for (const m of src.matchAll(
    /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*([^;\n]+)/g,
  )) {
    if (!EXPRS.has(m[1])) EXPRS.set(m[1], m[2]);
  }
}

// funciones definidas dentro de los propios archivos de rutas
const ROUTE_FNS = new Map();
for (const dir of [ROUTES]) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts")) continue;
    for (const [n, b] of indexFunctions(read(path.join(dir, f))))
      if (!ROUTE_FNS.has(n)) ROUTE_FNS.set(n, b);
  }
}

// nombre -> [cuerpos] (para detectar colisiones y no adivinar)
const handlerIndex = new Map();
for (const f of searchFiles)
  for (const [n, b] of indexFunctions(read(f))) {
    if (!handlerIndex.has(n)) handlerIndex.set(n, []);
    handlerIndex.get(n).push({ body: b, file: f });
  }

function resolveHandler(raw, localFns) {
  // 1) Clase.metodo / Objeto.metodo
  if (raw.includes(".")) {
    const [obj, meth] = raw.split(".");
    const table = CLASSES.get(obj) || OBJECTS.get(obj);
    if (table && table.has(meth)) return { body: table.get(meth), where: `${obj}.${meth}` };
    if (localFns.has(meth)) return { body: localFns.get(meth), where: `local:${meth}` };
    if (handlerIndex.has(meth)) {
      const cands = handlerIndex.get(meth);
      if (cands.length === 1) return { body: cands[0].body, where: "controller" };
      return { body: null, where: null, ambiguous: meth };
    }
    return { body: null, where: null };
  }
  // 2) funcion local del archivo de rutas
  if (localFns.has(raw)) return { body: localFns.get(raw), where: "inline-file" };
  // 3) global, solo si es unica
  const cands = handlerIndex.get(raw);
  if (cands && cands.length === 1) return { body: cands[0].body, where: "controller" };
  if (cands && cands.length > 1) return { body: null, where: null, ambiguous: raw };
  return { body: null, where: null };
}

// ---------- 3. parseo de rutas ----------
function parseRoutes(file, mount) {
  const src = read(file);
  const mask = codeMask(src);
  const localFns = indexFunctions(src);
  const out = [];
  const re = new RegExp("router\\.(get|post|put|patch|delete)\\(", "g");
  let r;
  while ((r = re.exec(src))) {
    if (!mask[r.index]) continue; // ruta comentada
    const open = r.index + r[0].length - 1;
    const close = matchParen(src, open);
    if (close < 0) continue;
    const argText = src.slice(open + 1, close);
    const trimmed = argText.trim();
    if (!/^["'`]/.test(trimmed)) continue;
    const q = trimmed[0];
    const endPath = trimmed.indexOf(q, 1);
    if (endPath < 0) continue;
    const sub = trimmed.slice(1, endPath);
    const restAbs = open + 1 + endPath + 1;
    const rest = src.slice(restAbs, close);
    const restClean = rest
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ")
      .trim();

    let handler,
      inlineBody = null;
    const arrowAt = restClean.indexOf("=>");
    if (arrowAt >= 0) {
      // handler inline: recuperar cuerpo desde el archivo completo
      const braceAbs = src.indexOf("{", restAbs + arrowAt);
      const end = braceAbs > -1 ? matchBrace(src, braceAbs) : -1;
      if (braceAbs > -1 && end > -1) inlineBody = src.slice(braceAbs + 1, end);
      handler = "(inline)";
    } else {
      // conservar la expresion completa (p.ej. TasksController.create)
      const toks = restClean.match(/[A-Za-z_$][A-Za-z0-9_$]*(?:\s*\.\s*[A-Za-z_$][A-Za-z0-9_$]*)*/g);
      handler = toks ? toks[toks.length - 1].replace(/\s+/g, "") : "?";
    }
    // lo que va antes del handler: si es inline, lo que va antes de la flecha
    const beforeHandler =
      arrowAt >= 0
        ? restClean.slice(0, arrowAt)
        : restClean.slice(0, Math.max(restClean.indexOf(handler), 0));
    out.push({
      method: r[1].toUpperCase(),
      path: ((mount + sub).replace(/\/+$/, "") || "/").replace(/([^:])\/\//g, "$1/")
        .replace(/^\/\//, "/"),
      handler,
      inlineBody,
      localFns,
      middlewares: (beforeHandler.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || []).filter(
        (x) => VALIDATORS.has(x),
      ),
      allMiddlewares: beforeHandler.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || [],
      file: path.relative(ROOT, file),
    });
  }
  return out;
}

// ---------- 3b. llamadas que reciben req.body / req.params ----------
// Si el handler hace Servicio.metodo(req.user.id, req.body), los campos no se ven con
// destructuring: hay que meterse en el metodo. Se sustituye el nombre del parametro formal
// por "req.body" y se vuelve a extraer.
const NOT_CALLABLE = new Set([
  "pool", "res", "req", "console", "JSON", "z", "Object", "Array", "String", "Number",
  "Boolean", "Date", "Math", "parseInt", "parseFloat", "Buffer", "process", "setTimeout",
  "setInterval", "encodeURIComponent", "decodeURIComponent", "isNaN", "Promise", "Map", "Set",
  "if", "for", "while", "switch", "catch", "return", "typeof", "await", "super", "this",
  "getCurrentUserData", "getUserPool", "handleServiceError", "getCurrentUser",
]);

function getCallable(name) {
  if (name.includes(".")) {
    const [obj, meth] = name.split(".");
    const t = CLASSES.get(obj) || OBJECTS.get(obj);
    if (t && t.has(meth)) {
      return { body: t.get(meth), sig: SIGS.get(`${obj}.${meth}`) || null };
    }
    return null;
  }
  if (NOT_CALLABLE.has(name)) return null;
  if (ROUTE_FNS.has(name)) return { body: ROUTE_FNS.get(name), sig: SIGS.get(name) || null };
  const cands = handlerIndex.get(name);
  if (cands && cands.length === 1)
    return { body: cands[0].body, sig: SIGS.get(name) || null };
  return null;
}

function followCalls(body, seen, depth) {
  if (depth > 2) return [];
  const out = [];
  const re = /\b([A-Za-z_$][A-Za-z0-9_$]*(?:\.[A-Za-z_$][A-Za-z0-9_$]*)?)\s*\(/g;
  let m;
  while ((m = re.exec(body))) {
    const callee = m[1];
    if (seen.has(callee)) continue;
    const open = m.index + m[0].length - 1;
    const close = matchParen(body, open);
    if (close < 0) continue;
    const args = splitTopLevel(body.slice(open + 1, close));
    // caso config: const { owner, repo } = await GitHubController.resolveConfig(req)
    const des = body
      .slice(Math.max(m.index - 120, 0), m.index)
      .match(/const\s*\{[^}]*\}\s*=\s*(?:await\s+)?$/);
    if (des && /\breq\b/.test(args[0] || "")) {
      const fn1 = getCallable(callee);
      if (fn1 && fn1.body && !seen.has(callee)) {
        seen.add(callee);
        out.push(...extractParams(fn1.body, routePathForFollow, seen, depth + 1).params);
        seen.delete(callee);
      }
      continue;
    }

    // caso delegacion: wrapper que llama a otro handler con (req, res)
    if (args[0] === "req" && /\bres\b/.test(args[1] || "")) {
      const fn0 = getCallable(callee);
      if (fn0 && fn0.body && !seen.has(callee)) {
        seen.add(callee);
        out.push(...extractParams(fn0.body, routePathForFollow, seen, depth + 1).params);
        seen.delete(callee);
      }
      continue;
    }
    const ci = args.findIndex(
      (a) => a === "req.body" || a === "req.params" || a === "req.query" || a === "req.body?.value",
    );
    if (ci < 0) continue;
    const kind = args[ci].startsWith("req.params")
      ? "req.params"
      : args[ci].startsWith("req.query")
        ? "req.query"
        : "req.body";
    const fn = getCallable(callee);
    if (!fn || !fn.body) continue;
    const paramName = fn.sig && fn.sig[ci];
    let inner = fn.body;
    if (paramName && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(paramName)) {
      inner = inner.replace(new RegExp(`\\b${paramName}\\b`, "g"), kind);
    } else {
      continue; // sin firma no se puede saber que parametro recibe el body
    }
    seen.add(callee);
    const nested = extractParams(inner, routePathForFollow, seen, depth + 1);
    out.push(...nested.params);
    seen.delete(callee);
  }
  return out;
}

// ---------- 4. parametros ----------
function guessType(def) {
  if (!def) return "string";
  if (/^-?\d+$/.test(def)) return "number";
  if (def === "true" || def === "false") return "boolean";
  if (/^[\[{]/.test(def)) return "array/object";
  if (/^new Date|^\(\)\s*=>/.test(def)) return "object";
  return "string";
}

let routePathForFollow = "";
function extractParams(body, routePath, seen = new Set(), depth = 0) {
  routePathForFollow = routePath;
  const params = [];
  const added = new Set();
  const add = (o) => {
    const k = `${o.in}:${o.name}`;
    if (added.has(k)) return;
    added.add(k);
    params.push(o);
  };

  for (const pm of routePath.matchAll(/:([A-Za-z0-9_]+)/g))
    add({ name: pm[1], in: "path", type: "string", required: true });

  const destructure = (re, where) => {
    for (const dm of body.matchAll(re))
      for (const part of splitTopLevel(dm[1])) {
        const name = part.split(/[:=]/)[0].trim().replace(/^\.\.\./, "");
        const def = part.includes("=") ? part.split("=").slice(1).join("=").trim() : null;
        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
          add({ name, in: where, type: guessType(def), required: false, default: def || undefined });
      }
  };
  destructure(/const\s*\{([^}]*)\}\s*=\s*req\.params/g, "path");
  destructure(/const\s*\{([^}]*)\}\s*=\s*req\.query/g, "query");
  destructure(/const\s*\{([^}]*)\}\s*=\s*req\.body/g, "body");
  destructure(/let\s*\{([^}]*)\}\s*=\s*req\.body/g, "body");

  for (const pm of body.matchAll(/req\.params\.([A-Za-z0-9_]+)/g))
    add({ name: pm[1], in: "path", type: "string", required: true });
  for (const qm of body.matchAll(/req\.query\.([A-Za-z0-9_]+)/g))
    add({ name: qm[1], in: "query", type: "string", required: false });
  for (const bm of body.matchAll(/req\.body\.([A-Za-z0-9_]+)/g))
    add({ name: bm[1], in: "body", type: "string", required: false });
  for (const am of body.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*req\.body\b/g))
    if (am[1] !== "body")
      add({ name: am[1], in: "body", type: "array/object", required: false, whole: true });
  for (const am of body.matchAll(/const\s+\{\s*\{([^}]*)\}\s*\}\s*=\s*req\.body/g))
    for (const nm of am[1].split(",").map((x) => x.trim()).filter(Boolean))
      add({ name: nm, in: "body", type: "object", required: false });

  // ---- campos de los esquemas zod: hay que saber si se validan body, query o params ----
  const zodNames = new Set();
  for (const zm of body.matchAll(
    /([A-Za-z0-9_]+)(?:Schema|Payload)?\.(?:parse|safeParse)\(\s*(?:req\.)?(body|query|params)/g,
  )) {
    const name = zm[1];
    if (!ZOD.has(name)) continue;
    zodNames.add(name + "|" + zm[2]);
  }
  for (const entry of zodNames) {
    const [zn, src] = entry.split("|");
    for (const f of ZOD.get(zn))
      add({
        name: f.name,
        in: src === "query" ? "query" : src === "params" ? "path" : "body",
        type: f.type,
        required: src === "params" ? true : f.required,
        requiredBy: src === "params" ? "ruta" : f.required ? "zod" : undefined,
        source: `esquema zod ${zn}`,
        constraint: f.constraint,
        default: f.default,
      });
  }

  // ---- campos declarados en tipos TS usados como cast del body ----
  // req.body as CreateTaskInput | <CreateTaskInput>req.body | Partial<X> | Pick<X,...> | X[]
  const casts = [
    ...[...body.matchAll(/req\.body(?:\?\.)?\s+as\s+(?:Partial<)?([A-Za-z0-9_]+)/g)].map(
      (x) => [x[1], "body"],
    ),
    ...[...body.matchAll(/<([A-Za-z0-9_]+)>\s*req\.body/g)].map((x) => [x[1], "body"]),
    ...[...body.matchAll(/req\.query\s+as\s+(?:Partial<)?([A-Za-z0-9_]+)/g)].map(
      (x) => [x[1], "query"],
    ),
    ...[...body.matchAll(/<([A-Za-z0-9_]+)>\s*req\.query/g)].map((x) => [x[1], "query"]),
    ...[...body.matchAll(/req\.params\s+as\s+(?:Partial<)?([A-Za-z0-9_]+)/g)].map(
      (x) => [x[1], "path"],
    ),
  ];
  // req.body as { registro?: unknown; activeWorkspaceId?: string }
  for (const om of body.matchAll(/req\.(?:body|query)\s+as\s*\{([\s\S]*?)\}/g)) {
    const where = body[om.index + 4] === "b" ? "body" : "query";
    for (const f of parseFields(om[1]))
      add({
        name: f.name,
        in: where,
        type: cleanTsType(f.type),
        required: !f.optional,
        requiredBy: f.optional ? undefined : "tipo en linea",
        source: "tipo en linea",
      });
  }
  // multipart: upload.single("file") / upload.array("files") / fields([{ name: "x" }])
  const multipart = [
    ...[...body.matchAll(/\.(?:single|array)\(\s*["'`]([^"'`]+)["'`]/g)].map((x) => x[1]),
    ...[...body.matchAll(/name\s*:\s*["'`]([^"'`]+)["'`]/g)].map((x) => x[1]),
  ];
  for (const f of multipart)
    add({ name: f, in: "body", type: "archivo (multipart)", required: true, requiredBy: "multipart" });
  const typeNames = [...new Set(casts.map((c) => c[0]))];
  for (const [t, where] of casts) {
    const def = TYPES.get(t);
    if (!def) continue;
    for (const f of def.fields) {
      if (["id", "created_at", "updated_at", "created_by"].includes(f.name)) continue;
      if (where === "path" && !new RegExp(`:${f.name}\\b`).test(routePath)) continue;
      add({
        name: f.name,
        in: where,
        type: cleanTsType(f.type),
        required: where === "path" ? true : !f.optional,
        requiredBy: where === "path" ? "ruta" : !f.optional ? "tipo:" + t : undefined,
        source: `interfaz ${t}`,
        optionalInType: f.optional,
      });
    }
  }

  // ---- required estricto: solo si el chequeo devuelve 400/422 ----
  const ifRe = /\bif\s*\(/g;
  let im2;
  const guards = [];
  while ((im2 = ifRe.exec(body))) {
    const open = im2.index + im2[0].length - 1;
    const close = matchParen(body, open);
    if (close < 0) continue;
    const cond = body.slice(open + 1, close);
    const tail = body.slice(close + 1, close + 320);
    if (/status\(\s*(400|422)/.test(tail)) guards.push(cond);
  }
  for (const p of params) {
    const esc = p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const hit = guards.some(
      (c) =>
        new RegExp(`!\\s*${esc}\\b`).test(c) ||
        new RegExp(`${esc}\\s*===?\\s*(undefined|null)\\b`).test(c) ||
        new RegExp(`typeof\\s+${esc}\\s*===?\\s*["'\`](string|number|boolean|array|object)["'\`]`).test(c) ||
        new RegExp(`!\\s*${esc}\\.trim\\(\\)`).test(c),
    );
    if (hit) {
      p.required = true;
      p.requiredBy = "validacion (400/422)";
    } else if (p.required && String(p.requiredBy || "").startsWith("tipo:")) {
      p.required = false;
      p.requiredBy = "opcional en la practica";
    }
    // limites zod / express-validator
    const c = body.match(
      new RegExp(`${esc}[^\\n]{0,100}?\\.(min|max|email|url|uuid|length|isUUID|int|positive)\\(([^)]*)\\)`),
    );
    if (c) p.constraint = `${c[1]}(${c[2]})`;
    if (p.type === "string" && p.in === "body") {
      if (new RegExp(`${esc}\\.(map|forEach|filter|some|length|push)\\b`).test(body))
        p.type = "array";
      else if (new RegExp(`JSON\\.stringify\\(\\s*${esc}\\b`).test(body)) p.type = "object";
      else if (new RegExp(`\\b${esc}\\.[A-Za-z_$][A-Za-z0-9_$]*\\b`).test(body))
        p.type = "object";
    }
    if (p.type === "string") {
      if (body.match(new RegExp(`${esc}[^\\n]{0,40}?z\\.number\\(\\)`))) p.type = "number";
      else if (body.match(new RegExp(`${esc}[^\\n]{0,40}?z\\.boolean\\(\\)`))) p.type = "boolean";
      else if (body.match(new RegExp(`${esc}[^\\n]{0,40}?z\\.array\\(`))) p.type = "array";
    }
  }

  // el handler puede pasarle el body a un servicio: los campos estan ahi
  for (const p of followCalls(body, seen, depth)) {
    add({
      name: p.name,
      in: p.in,
      type: p.type,
      required: p.required,
      default: p.default,
      constraint: p.constraint,
      requiredBy: p.requiredBy,
      source: p.source,
    });
  }

  const zod = [
    ...new Set(
      [...body.matchAll(/([A-Za-z0-9_]+)(?:Schema|Payload)\.(?:parse|safeParse)\(/g)].map(
        (x) => x[1],
      ),
    ),
  ];
  return { params, zod, types: typeNames };
}

function cleanTsType(t) {
  let s = t.replace(/\s*\|\s*(undefined|null)\b/g, "").trim();
  s = s.replace(/<[^>]*>/g, (m) => (m.includes("string") ? "string" : ""));
  if (/^string(\[\])?$/.test(s)) return /^string\[\]$/.test(s) ? "array<string>" : "string";
  if (/^number(\[\])?$/.test(s)) return /^number\[\]$/.test(s) ? "array<number>" : "number";
  if (/^boolean(\[\])?$/.test(s)) return /^boolean\[\]$/.test(s) ? "array<boolean>" : "boolean";
  if (/^Date(\[\])?$/.test(s)) return /^Date\[\]$/.test(s) ? "array<date>" : "date";
  if (/^(any|unknown|object)$/.test(s)) return "cualquiera";
  if (/^Record<|^\{ \[/.test(s)) return "objeto";
  if (/\[\]$/.test(s)) return "array";
  if (/^\{/.test(s)) return "object";
  return s || "any";
}

// ---------- 5. run ----------
const all = [];
for (const { mount, file } of mounts) {
  for (const r of parseRoutes(file, mount)) {
    let body = r.inlineBody;
    let where = r.inlineBody ? "inline" : null;
    if (!body && r.handler !== "(inline)") {
      const res = resolveHandler(r.handler, r.localFns);
      body = res.body;
      where = res.where;
    }
    let ex = body ? extractParams(body, r.path) : { params: [], zod: [] };

    // los middlewares de la ruta tambien pueden declarar entradas (multer, validadores)
    const extra = [];
    for (const mw of r.allMiddlewares || []) {
      const fn = getCallable(mw);
      if (!fn || !fn.body) {
        // middleware expresion: upload.single("file")
        const expr = EXPRS.get(mw);
        if (!expr) continue;
        for (const fm of expr.matchAll(/\.(?:single|array)\(\s*["'`]([^"'`]+)["'`]/g))
          if (!ex.params.some((p) => p.name === fm[1]))
            ex.params.push({
              name: fm[1],
              in: "body",
              type: "archivo (multipart)",
              required: true,
              requiredBy: "multipart",
            });
        continue;
      }
      // OJO: aqui no se extraen params en general. Los middlewares son compartidos
      // (isAuthenticated, hasProjectAccess...) y leerlos enteros contaminaria endpoints
      // ajenos. Solo se toman lo que el middleware declara de entrada: multipart y zod.
      for (const fm of fn.body.matchAll(
        /\.(?:single|array)\(\s*["'`]([^"'`]+)["'`]/g,
      ))
        if (!ex.params.some((p) => p.name === fm[1]))
          extra.push({
            name: fm[1],
            in: "body",
            type: "archivo (multipart)",
            required: true,
            requiredBy: "multipart",
          });
      for (const zm of fn.body.matchAll(/([A-Za-z0-9_]+)\.(?:parse|safeParse)\(/g))
        if (ZOD.has(zm[1])) {
          if (!ex.zod.includes(zm[1])) ex.zod.push(zm[1]);
          for (const f of ZOD.get(zm[1]))
            if (!ex.params.some((p) => p.name === f.name))
              extra.push({
                name: f.name,
                in: "body",
                type: f.type,
                required: f.required,
                constraint: f.constraint,
                default: f.default,
                requiredBy: f.required ? `esquema zod ${zm[1]}` : undefined,
                source: `esquema zod ${zm[1]}`,
              });
        }
    }
    const known = new Set(ex.params.map((p) => `${p.in}:${p.name}`));
    for (const p of extra)
      if (!known.has(`${p.in}:${p.name}`)) ex.params.push(p);
    all.push({
      method: r.method,
      path: r.path,
      handler: r.handler,
      where,
      middlewares: r.middlewares,
      file: r.file,
      params: ex.params,
      zod: ex.zod,
      resolved: !!body,
    });
  }
}

const seen = new Set();
const uniq = [];
for (const r of all) {
  const k = `${r.method} ${r.path}`;
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(r);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync("/tmp/opencode/api_params.json", JSON.stringify(uniq, null, 1));

// ---------- emision del modulo TypeScript para el cliente ----------
const key = (method, p) =>
  `${method} ${p
    .replace(/^\/api/, "")
    .replace(/\/+$/, "")
    .replace(/:[A-Za-z0-9_]+/g, ":p")
    .toLowerCase()}`;

const byKey = new Map();
for (const r of uniq) {
  const k = key(r.method, r.path);
  const prev = byKey.get(k);
  if (!prev || r.params.length > prev.params.length) byKey.set(k, r);
}
const rows = [...byKey.values()].sort((a, b) =>
  a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path),
);

const ts = `// ARCHIVO GENERADO — no editar a mano.
// Regenerar:  node server/scripts/extract-api-params.js
//
// Extrae del servidor (server/src/routes + controllers + services) los parametros que
// espera cada endpoint: los de la ruta, los de query, los del body (destructuring, casts
// a interfaces TypeScript y esquemas zod) y los middlewares de autorizacion.
//
// Un parametro solo aparece como "obligatorio" si el servidor lo comprueba y responde
// 400/422, o si el esquema zod lo declara sin .optional(). Los tipos vienen del codigo:
// son fiables como referencia, pero el contrato definitive es el servidor.

export interface ApiParamDoc {
  /** nombre real del parametro tal y como lo usa el servidor */
  name: string;
  /** donde viaja */
  in: "path" | "query" | "body";
  /** tipo segun el codigo (string, number, boolean, array, object, enum(...), date...) */
  type: string;
  required: boolean;
  /** limite o validacion detectada: min, max, email, uuid/url... */
  constraint?: string;
  /** valor por defecto si el servidor lo define */
  default?: string;
  /** de donde sale el dato: "validacion (400/422)", "esquema zod X", "interfaz X" */
  source?: string;
}

export interface ApiEndpointDoc {
  method: string;
  /** ruta real con los nombres de parametro del servidor */
  path: string;
  /** clave de busqueda: metodo + ruta normalizada (para emparejar con la ayuda) */
  key: string;
  /** middlewares de la ruta: isAuthenticated, hasWorkspaceAccess, checkTaskLimit... */
  auth: string[];
  /** true si la ruta vive en el router legacy routes/api.ts (deprecated) */
  legacy: boolean;
  params: ApiParamDoc[];
}

const DOCS: ApiEndpointDoc[] = ${JSON.stringify(
  rows.map((r) => ({
    method: r.method,
    path: r.path,
    key: key(r.method, r.path),
    auth: r.middlewares,
    legacy: r.file === "routes/api.ts",
    params: r.params.map((p) => {
      const o = { name: p.name, in: p.in, type: p.type, required: !!p.required };
      if (p.constraint) o.constraint = p.constraint;
      if (p.default) o.default = p.default;
      if (p.requiredBy) o.source = p.requiredBy;
      if (p.source && !o.source) o.source = p.source;
      return o;
    }),
  })),
  null,
  1,
)};

/** indice por clave para buscar desde la UI */
export const API_DOCS_BY_KEY: Record<string, ApiEndpointDoc> = Object.fromEntries(
  DOCS.map((d) => [d.key, d]),
);

export const API_DOCS_STATS = {
  endpoints: ${rows.length},
  conParametros: ${rows.filter((r) => r.params.length).length},
  totalParametros: ${rows.reduce((a, r) => a + r.params.length, 0)},
};

/** metodo + ruta normalizada: los nombres de parametro se igualan a ":p" */
export function apiDocKey(method: string, path: string) {
  return (
    method.toUpperCase() +
    " " +
    path
      .trim()
      .replace(/^\\/api/, "")
      .replace(/\\/+$/, "")
      .replace(/:[A-Za-z0-9_]+/g, ":p")
      .toLowerCase()
  );
}

export function findApiDocs(method: string, path: string) {
  return API_DOCS_BY_KEY[apiDocKey(method, path)];
}
`;
fs.writeFileSync(OUT, ts);

const resolved = uniq.filter((r) => r.resolved);
const conParams = uniq.filter((r) => r.params.length);
console.log("montajes:", mounts.length, "| endpoints unicos:", uniq.length);
console.log("handler resuelto:", resolved.length, "| sin resolver:", uniq.length - resolved.length);
console.log("con >=1 parametro:", conParams.length, `(${Math.round((conParams.length / uniq.length) * 100)}%)`);
console.log("params totales:", uniq.reduce((a, r) => a + r.params.length, 0));
console.log("con body:", uniq.filter((r) => r.params.some((p) => p.in === "body")).length);
console.log("sin handler (muestra):");
for (const r of uniq.filter((x) => !x.resolved).slice(0, 15)) console.log("  ", r.method, r.path, "->", r.handler);