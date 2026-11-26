// scripts/check-types-colocation.mjs — sibling .types.ts rule (plan 21, 99-review decision 9)
// Fails when a non-.types.ts file exports an interface/type that another file imports (directly or through a barrel),
// when a .types.ts file contains runtime code, or when a .types.ts file has no same-named origin next to it.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { parse as parseSfc } from 'vue/compiler-sfc';

const SRC = path.resolve('src');
/** owner-less pure type modules: any file here may export shared types (plain names, the folder says "types") */
const TYPE_MODULE_DIRS = ['src/shared/types/', 'src/shared/shapes/types/'];
/** value-derived types (typeof / keyof typeof …) stay next to their value */
const VALUE_DERIVED = {
	'src/store/store.ts': ['Store'],
	'src/store/appSessionState.ts': ['AppSessionState'],
	'src/store/ui/infoPanel.ts': ['InfoTopic'],
	'src/store/persistence/projectFile.ts': ['ProjectFile', 'ProjectState'],
	'src/shared/math/snap.ts': ['SnapStep'],
};
/** .types.ts contract modules that have no same-named origin file */
const OWNERLESS_TYPES_FILES = ['src/features/top-bar/menu/menu.types.ts', 'src/features/section-editor/sectionForm.types.ts'];

const rel = (f) => path.relative(process.cwd(), f).split(path.sep).join('/');
const inTypeModuleDir = (f) => TYPE_MODULE_DIRS.some((d) => rel(f).startsWith(d));
const files = [];
(function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p);
		else if (/\.(ts|vue)$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(p);
	}
})(SRC);

function sourceOf(file) {
	const text = fs.readFileSync(file, 'utf8');
	if (!file.endsWith('.vue')) return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
	const { descriptor } = parseSfc(text, { filename: file });
	const code = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n');
	return ts.createSourceFile(`${file}.ts`, code, ts.ScriptTarget.Latest, true);
}
function resolve(from, spec) {
	let base;
	if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
	else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
	else return null; // packages, virtual modules
	for (const c of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
		if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
	}
	return null; // e.g. `?raw` assets
}
const isExported = (n) => n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

const declaredTypes = new Map(); // file -> Set of exported type names declared in it
const reexports = new Map(); // file -> [{ name | '*', as, target }]
const uses = []; // { file, target, name }: a named import or a named re-export
const runtimeInTypesFile = [];

for (const file of files) {
	const sf = sourceOf(file);
	const types = new Set();
	const rx = [];
	for (const st of sf.statements) {
		if ((ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) && isExported(st)) types.add(st.name.text);
		if (ts.isImportDeclaration(st) && st.importClause) {
			const target = resolve(file, st.moduleSpecifier.text);
			const nb = st.importClause.namedBindings;
			if (target && nb && ts.isNamedImports(nb)) {
				for (const el of nb.elements) uses.push({ file, target, name: (el.propertyName ?? el.name).text });
			}
		}
		if (ts.isExportDeclaration(st) && st.moduleSpecifier) {
			const target = resolve(file, st.moduleSpecifier.text);
			if (!target) continue;
			if (!st.exportClause) rx.push({ name: '*', target });
			else if (ts.isNamedExports(st.exportClause)) {
				for (const el of st.exportClause.elements) {
					const name = (el.propertyName ?? el.name).text;
					rx.push({ name, as: el.name.text, target });
					uses.push({ file, target, name });
				}
			}
		}
		if (file.endsWith('.types.ts') && !inTypeModuleDir(file)) { // shape type modules may hold SHAPE_TYPES
			const typeOnly = ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)
				|| (ts.isImportDeclaration(st) && st.importClause?.isTypeOnly)
				|| (ts.isExportDeclaration(st) && st.isTypeOnly);
			if (!typeOnly) runtimeInTypesFile.push(`${rel(file)}:${sf.getLineAndCharacterOfPosition(st.getStart()).line + 1}`);
		}
	}
	declaredTypes.set(file, types);
	reexports.set(file, rx);
}

/** follows barrels (`export *`, `export { X } from`) to the file that declares the type */
function origin(target, name, seen = new Set()) {
	const key = `${target}#${name}`;
	if (seen.has(key)) return null;
	seen.add(key);
	if (declaredTypes.get(target)?.has(name)) return target;
	for (const r of reexports.get(target) ?? []) {
		if (r.name === '*') { const o = origin(r.target, name, seen); if (o) return o; }
		else if (r.as === name) return origin(r.target, r.name, seen);
	}
	return null;
}
const allowed = (o, name) => o.endsWith('.types.ts') || o.endsWith('.vue') // SFC types stay in the SFC
	|| inTypeModuleDir(o)
	|| (VALUE_DERIVED[rel(o)] ?? []).includes(name);

const misplaced = new Map(); // "<origin> <Type>" -> importing files
for (const u of uses) {
	const o = origin(u.target, u.name);
	if (o && o !== u.file && !allowed(o, u.name)) {
		const key = `${rel(o)} ${u.name}`;
		misplaced.set(key, [...(misplaced.get(key) ?? []), rel(u.file)]);
	}
}
const orphans = files
	.filter((f) => f.endsWith('.types.ts'))
	.filter((f) => {
		const base = f.slice(0, -'.types.ts'.length);
		return !fs.existsSync(`${base}.ts`) && !fs.existsSync(`${base}.vue`)
			&& !OWNERLESS_TYPES_FILES.includes(rel(f)) && !inTypeModuleDir(f);
	})
	.map(rel);

const report = [
	...[...misplaced].map(([key, users]) => {
		const [file, name] = key.split(' ');
		return `misplaced type   ${name} (${file}) is used by ${users.length} file(s), e.g. ${users[0]}; move it to ${file.replace(/\.ts$/, '.types.ts')}`;
	}),
	...runtimeInTypesFile.map((m) => `runtime code     ${m} (a .types.ts file holds only types and \`import type\`)`),
	...orphans.map((m) => `orphan .types.ts ${m} (no same-named .ts/.vue origin next to it)`),
];
if (report.length) {
	console.error(`check-types-colocation: ${report.length} problem(s)\n${report.join('\n')}`);
	process.exit(1);
}
console.log(`check-types-colocation: OK (${files.length} files)`);
