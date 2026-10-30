import type { Point } from '../../interfaces/common/types';
import { isPointInPolygon, doSegmentsIntersect } from '../poligonUtils/polygonIntersectionMath';

export type Triangle = [Point, Point, Point];

function cross(o: Point, a: Point, b: Point): number {
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function signedArea(points: Point[]): number {
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const a = points[i];
		const b = points[(i + 1) % points.length];
		sum += a.x * b.y - b.x * a.y;
	}
	return sum / 2;
}

function pointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
	const d1 = cross(a, b, p);
	const d2 = cross(b, c, p);
	const d3 = cross(c, a, p);

	const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
	const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

	return !(hasNeg && hasPos);
}

function triangleMinAngle(a: Point, b: Point, c: Point): number {
	const ab = Math.hypot(b.x - a.x, b.y - a.y);
	const bc = Math.hypot(c.x - b.x, c.y - b.y);
	const ca = Math.hypot(a.x - c.x, a.y - c.y);
	const angleA = Math.acos((ab * ab + ca * ca - bc * bc) / (2 * ab * ca));
	const angleB = Math.acos((ab * ab + bc * bc - ca * ca) / (2 * ab * bc));
	const angleC = Math.PI - angleA - angleB;
	return Math.min(angleA, angleB, angleC);
}

const DEDUPE_EPSILON = 1e-6;
const DEDUPE_EPSILON_SQ = DEDUPE_EPSILON * DEDUPE_EPSILON;
/** Triangles below this area are treated as invisible/degenerate rather than "thin" — see refineMesh. */
const AREA_EPSILON = 1e-4;

/** Squared distance — for threshold comparisons only, avoids a sqrt when the actual length isn't needed. */
function distSq(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

/**
 * Drops consecutive duplicate vertices (including an explicit closing point
 * that repeats the first vertex) — a duplicate creates a zero-length edge
 * whose degenerate triangle falsely reports "contains" for points that lie
 * on that edge, which blocks ear-clipping across most of the polygon.
 */
function dedupeClosedLoop(points: Point[]): Point[] {
	const result: Point[] = [];

	for (const p of points) {
		const last = result[result.length - 1];
		if (!last || distSq(p, last) > DEDUPE_EPSILON_SQ) {
			result.push(p);
		}
	}

	while (result.length > 1) {
		const first = result[0];
		const last = result[result.length - 1];
		if (distSq(first, last) <= DEDUPE_EPSILON_SQ) {
			result.pop();
		} else {
			break;
		}
	}

	return result;
}

/**
 * Ear-clipping triangulation for a simple (non-self-intersecting) polygon.
 * Works for either winding order — orientation is detected from signed area.
 */
export function triangulate(rawPolygon: Point[]): Triangle[] {
	const polygon = dedupeClosedLoop(rawPolygon);

	if (polygon.length < 3) {
		return [];
	}

	const indices = polygon.map((_, i) => i);
	const triangles: Triangle[] = [];
	const orientationSign = signedArea(polygon) < 0 ? -1 : 1;

	const maxIterations = polygon.length * polygon.length;
	let guard = 0;

	while (indices.length > 3 && guard < maxIterations) {
		guard++;

		let bestI = -1;
		let bestQuality = -Infinity;

		for (let i = 0; i < indices.length; i++) {
			const prevIndex = indices[(i - 1 + indices.length) % indices.length];
			const currIndex = indices[i];
			const nextIndex = indices[(i + 1) % indices.length];

			const prev = polygon[prevIndex];
			const curr = polygon[currIndex];
			const next = polygon[nextIndex];

			const convexity = cross(prev, curr, next) * orientationSign;
			if (convexity <= 0) {
				continue; // reflex or collinear vertex — can't be an ear
			}

			let containsOtherVertex = false;
			for (const idx of indices) {
				if (idx === prevIndex || idx === currIndex || idx === nextIndex) {
					continue;
				}
				if (pointInTriangle(polygon[idx], prev, curr, next)) {
					containsOtherVertex = true;
					break;
				}
			}

			if (containsOtherVertex) {
				continue;
			}

			const quality = triangleMinAngle(prev, curr, next);
			if (quality > bestQuality) {
				bestQuality = quality;
				bestI = i;
			}
		}

		if (bestI === -1) {
			// degenerate input (duplicate points / self-intersection) — stop cleanly
			break;
		}

		const prevIndex = indices[(bestI - 1 + indices.length) % indices.length];
		const currIndex = indices[bestI];
		const nextIndex = indices[(bestI + 1) % indices.length];
		triangles.push([polygon[prevIndex], polygon[currIndex], polygon[nextIndex]]);
		indices.splice(bestI, 1);
	}

	if (indices.length === 3) {
		triangles.push([polygon[indices[0]], polygon[indices[1]], polygon[indices[2]]]);
	}

	return triangles;
}

function key(p: Point): string {
	return `${p.x.toFixed(5)},${p.y.toFixed(5)}`;
}

function otherVertex(tri: Triangle, aKey: string, bKey: string): Point | null {
	for (const v of tri) {
		const k = key(v);
		if (k !== aKey && k !== bKey) return v;
	}
	return null;
}

function inCircumcircle(a: Point, b: Point, c: Point, d: Point): boolean {
	// a, b, c must be CCW. true if d lies inside their circumcircle.
	const ax = a.x - d.x, ay = a.y - d.y;
	const bx = b.x - d.x, by = b.y - d.y;
	const cx = c.x - d.x, cy = c.y - d.y;
	const det =
		(ax * ax + ay * ay) * (bx * cy - cx * by) -
		(bx * bx + by * by) * (ax * cy - cx * ay) +
		(cx * cx + cy * cy) * (ax * by - bx * ay);
	return det > 0;
}

function isConvexQuad(p: Point, r: Point, q: Point, s: Point): boolean {
	const c1 = cross(p, r, q);
	const c2 = cross(r, q, s);
	const c3 = cross(q, s, p);
	const c4 = cross(s, p, r);
	return (c1 > 0 && c2 > 0 && c3 > 0 && c4 > 0) || (c1 < 0 && c2 < 0 && c3 < 0 && c4 < 0);
}

/**
 * Post-process pass over ear-clipped triangles: for each pair sharing an edge,
 * flip the shared diagonal when the Delaunay in-circle test is violated and
 * the resulting quad stays convex. Kills the thin-fan slivers that ear-clipping
 * leaves around arc points (same vertex reused as apex for many triangles),
 * without adding or moving any points.
 */
export function improveTriangulation(triangles: Triangle[], maxPasses: number = 10): Triangle[] {
	const current = triangles.slice();

	for (let pass = 0; pass < maxPasses; pass++) {
		let flipped = false;

		for (let i = 0; i < current.length; i++) {
			for (let j = i + 1; j < current.length; j++) {
				const triA = current[i];
				const triB = current[j];

				const sharedKeys: string[] = [];
				for (const v of triA) {
					const k = key(v);
					if (triB.some((w) => key(w) === k)) sharedKeys.push(k);
				}
				if (sharedKeys.length !== 2) continue;

				const [pk, qk] = sharedKeys;
				const p = triA.find((v) => key(v) === pk)!;
				const q = triA.find((v) => key(v) === qk)!;
				const r = otherVertex(triA, pk, qk);
				const s = otherVertex(triB, pk, qk);
				if (!r || !s) continue;

				let a = p, b = q, c = r;
				if (cross(a, b, c) < 0) { b = r; c = q; }

				if (!inCircumcircle(a, b, c, s)) continue;
				if (!isConvexQuad(p, r, q, s)) continue;

				current[i] = [p, r, s];
				current[j] = [r, q, s];
				flipped = true;
			}
		}

		if (!flipped) break;
	}

	return current;
}

/**
 * Inserts evenly-spaced points along any boundary edge longer than
 * maxSegmentLength, leaving edges already below it (e.g. dense arc
 * points) untouched. Evens out vertex density before triangulating so
 * corners far from a fillet arc don't end up as one long thin triangle
 * that edge-flip can't shrink (no vertex exists on that edge to flip to).
 */
export function resamplePolygon(polygon: Point[], maxSegmentLength: number): Point[] {
	const result: Point[] = [];

	const maxSegmentLengthSq = maxSegmentLength * maxSegmentLength;

	for (let i = 0; i < polygon.length; i++) {
		const a = polygon[i];
		const b = polygon[(i + 1) % polygon.length];
		result.push(a);

		const lengthSq = distSq(a, b);
		if (lengthSq <= maxSegmentLengthSq) {
			continue; // already short enough — skip the sqrt entirely
		}

		const length = Math.sqrt(lengthSq);
		const segments = Math.floor(length / maxSegmentLength);
		for (let s = 1; s < segments; s++) {
			const t = s / segments;
			result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
		}
	}

	return result;
}

function midpoint(a: Point, b: Point): Point {
	return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Splits each triangle into 4 similar triangles (connecting edge midpoints),
 * repeated `levels` times. Halves edge length per level — angles are
 * unchanged, only triangle size shrinks.
 */
export function subdivideTriangles(triangles: Triangle[], levels: number): Triangle[] {
	let current = triangles;

	for (let level = 0; level < levels; level++) {
		const next: Triangle[] = [];

		for (const [a, b, c] of current) {
			const ab = midpoint(a, b);
			const bc = midpoint(b, c);
			const ca = midpoint(c, a);

			next.push(
				[a, ab, ca],
				[ab, b, bc],
				[ca, bc, c],
				[ab, bc, ca],
			);
		}

		current = next;
	}

	return current;
}

type ConstrainedEdges = Map<string, [Point, Point]>;

/** Order-independent edge identity, built from the existing point-key convention, so edge (a,b) and (b,a) hash the same. */
function edgeKey(p: Point, q: Point): string {
	const kp = key(p);
	const kq = key(q);
	return kp < kq ? `${kp}|${kq}` : `${kq}|${kp}`;
}

/** Coordinate-distance equality (vs. `key`'s string-rounding equality) — used where two points must be recognized as "the same corner" before they've been run through toFixed(5). */
function pointsEqual(p: Point, q: Point): boolean {
	return distSq(p, q) <= DEDUPE_EPSILON_SQ;
}

/**
 * Standard circumcenter formula. Returns null for a (near-)collinear
 * triangle, which has no finite circumcenter — callers must treat that
 * as "this triangle can't be fixed by inserting its circumcenter" rather
 * than crash or divide by ~0.
 */
function circumcenter(a: Point, b: Point, c: Point): Point | null {
	const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
	if (Math.abs(d) < 1e-12) {
		return null; // collinear — no circumcenter
	}
	const aSq = a.x * a.x + a.y * a.y;
	const bSq = b.x * b.x + b.y * b.y;
	const cSq = c.x * c.x + c.y * c.y;
	const ux = (aSq * (b.y - c.y) + bSq * (c.y - a.y) + cSq * (a.y - b.y)) / d;
	const uy = (aSq * (c.x - b.x) + bSq * (a.x - c.x) + cSq * (b.x - a.x)) / d;
	return { x: ux, y: uy };
}

/**
 * Ruppert's encroachment test: true if `p` lies inside (or on) the circle
 * having segment (a,b) as its diameter — equivalent to the angle a-p-b
 * being >= 90°. Used to detect "this candidate Steiner point is too close
 * to a boundary/hole edge to insert safely; split that edge instead."
 */
function encroaches(p: Point, a: Point, b: Point): boolean {
	return (a.x - p.x) * (b.x - p.x) + (a.y - p.y) * (b.y - p.y) <= 0;
}

/** "Inside the material" for a possibly-hollow cross-section: inside the outer ring AND outside every hole ring. The only domain-membership test the refinement algorithm needs — it never special-cases holes anywhere else. */
function inDomain(p: Point, domain: { outer: Point[]; holes: Point[][] }): boolean {
	if (!isPointInPolygon(p, domain.outer)) {
		return false;
	}
	return domain.holes.every((hole) => !isPointInPolygon(p, hole));
}

/** The 3 (unordered-pair) edges of a triangle, in a fixed order used consistently by every helper below so edge-based lookups agree with each other. */
function triangleEdges(tri: Triangle): [Point, Point][] {
	return [[tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]];
}

/** `inCircumcircle` requires its 3 input points to be wound CCW (per its own comment) — ear-clipped triangles aren't guaranteed to be, so this normalizes on demand rather than assuming. */
function ensureCCW(tri: Triangle): Triangle {
	const [a, b, c] = tri;
	return cross(a, b, c) < 0 ? [a, c, b] : [a, b, c];
}

/** Identity key for a whole triangle (its 3 point-keys, sorted) — lets refineMesh remember "already tried and gave up on this exact triangle" across iterations without tracking array indices, which shift every time triangles are inserted/removed. */
function triKey(tri: Triangle): string {
	return tri.map(key).sort().join('|');
}

/**
 * Maps each edge to the triangle(s) touching it. Rebuilt fresh from the
 * current triangle list on every call rather than maintained
 * incrementally — deliberate simplicity given mesh sizes here are tens
 * to low-hundreds of triangles (a rendering-preview mesh, not an FEM
 * solver mesh), matching this file's existing style of doing plain O(n)
 * scans (see `improveTriangulation`) instead of a persistent half-edge
 * structure.
 */
function buildEdgeMap(triangles: Triangle[]): Map<string, number[]> {
	const map = new Map<string, number[]>();
	triangles.forEach((tri, idx) => {
		for (const [a, b] of triangleEdges(tri)) {
			const k = edgeKey(a, b);
			const arr = map.get(k);
			if (arr) {
				arr.push(idx);
			} else {
				map.set(k, [idx]);
			}
		}
	});
	return map;
}

/** Linear scan for the triangle containing `p` — needed because a bad triangle's circumcenter can land in a different triangle than the bad triangle itself (common for obtuse triangles), so the Bowyer-Watson cavity flood-fill can't just start from the bad triangle. */
function findSeedTriangle(triangles: Triangle[], p: Point): number {
	for (let i = 0; i < triangles.length; i++) {
		const [a, b, c] = triangles[i];
		if (pointInTriangle(p, a, b, c)) {
			return i;
		}
	}
	return -1;
}

/**
 * Constrained Bowyer-Watson point insertion: flood-fills the cavity of
 * triangles whose circumcircle contains `p`, but never crosses a
 * constrained edge — which is what keeps insertion safe on concave
 * boundaries and around holes (a hole boundary is just another
 * constrained edge from this function's point of view). The cavity is
 * then re-triangulated as a fan from `p` to each edge left on the
 * cavity's rim.
 */
function insertPoint(
	triangles: Triangle[],
	constrainedEdges: ConstrainedEdges,
	p: Point,
	seedIndex: number
): Triangle[] {
	if (seedIndex < 0 || seedIndex >= triangles.length) {
		return triangles;
	}

	const edgeMap = buildEdgeMap(triangles);
	const cavity = new Set<number>([seedIndex]);
	const frontier = [seedIndex];
	const boundaryEdges: [Point, Point][] = [];

	while (frontier.length > 0) {
		const idx = frontier.pop()!;
		const tri = triangles[idx];

		for (const [a, b] of triangleEdges(tri)) {
			const k = edgeKey(a, b);

			// Never flood across a constrained edge — this single rule is what
			// keeps the cavity from crossing the polygon boundary, a concave
			// notch, or into a hole even when the raw in-circle test would
			// otherwise say "keep going".
			if (constrainedEdges.has(k)) {
				boundaryEdges.push([a, b]);
				continue;
			}

			const neighbors = (edgeMap.get(k) ?? []).filter((n) => n !== idx);
			if (neighbors.length === 0) {
				boundaryEdges.push([a, b]);
				continue;
			}

			const neighborIdx = neighbors[0];
			if (cavity.has(neighborIdx)) {
				continue;
			}

			const [na, nb, nc] = ensureCCW(triangles[neighborIdx]);
			if (inCircumcircle(na, nb, nc, p)) {
				cavity.add(neighborIdx);
				frontier.push(neighborIdx);
			} else {
				boundaryEdges.push([a, b]);
			}
		}
	}

	const remaining = triangles.filter((_, idx) => !cavity.has(idx));
	const fan: Triangle[] = boundaryEdges.map(([a, b]) => [a, b, p]);
	return [...remaining, ...fan];
}

/**
 * Inserts the midpoint of a boundary/hole edge as a new constrained
 * vertex, splitting that edge into two. This is Ruppert's fix for an
 * encroached (or otherwise unsplittable-any-other-way) edge — it
 * densifies exactly the sparse side of a dense/sparse mismatch, which is
 * what actually eliminates the reported sliver bug rather than just
 * relocating it.
 */
function splitEdge(
	triangles: Triangle[],
	constrainedEdges: ConstrainedEdges,
	edge: [Point, Point]
): Triangle[] {
	const [a, b] = edge;
	const m = midpoint(a, b);
	const k = edgeKey(a, b);

	constrainedEdges.delete(k);
	constrainedEdges.set(edgeKey(a, m), [a, m]);
	constrainedEdges.set(edgeKey(m, b), [m, b]);

	// The edge being split is constrained, so it borders exactly one
	// triangle (constrained edges are never shared between two triangles) —
	// that triangle is the only valid seed for re-triangulating around `m`.
	const edgeMap = buildEdgeMap(triangles);
	const seedCandidates = edgeMap.get(k) ?? [];
	if (seedCandidates.length === 0) {
		return triangles;
	}

	return insertPoint(triangles, constrainedEdges, m, seedCandidates[0]);
}

/** Finds a constrained edge belonging to `tri` to split when its circumcenter can't be inserted directly (outside the domain). Bridge edges can be excluded because splitting only one copy of a bridge (see `mergeHoles`) would desync the zero-width slit into invalid topology. */
function findConstrainedEdgeOfTriangle(
	tri: Triangle,
	constrainedEdges: ConstrainedEdges,
	bridgeEdgeKeys: Set<string>,
	excludeBridge: boolean
): [Point, Point] | null {
	for (const [a, b] of triangleEdges(tri)) {
		const k = edgeKey(a, b);
		if (constrainedEdges.has(k) && !(excludeBridge && bridgeEdgeKeys.has(k))) {
			return [a, b];
		}
	}
	return null;
}

/** True if an edge is already at (or below) the refinement's length floor, so halving it would risk creating a coincident-point/zero-area triangle instead of a genuinely finer one — see the floor's derivation in `refineMesh`. */
function edgeTooShortToSplit(edge: [Point, Point], minSplitLength: number): boolean {
	const [a, b] = edge;
	return distSq(a, b) < minSplitLength * minSplitLength;
}

/** Linear scan for any constrained edge that a candidate point encroaches on — the trigger for Ruppert's "split the edge instead of inserting the point" rule. */
function findEncroachedEdge(p: Point, constrainedEdges: ConstrainedEdges): [Point, Point] | null {
	for (const [a, b] of constrainedEdges.values()) {
		if (encroaches(p, a, b)) {
			return [a, b];
		}
	}
	return null;
}

export interface RefineMeshOptions {
	minAngleDeg?: number;
	maxSteinerPoints?: number;
	maxIterations?: number;
}

/**
 * Ruppert-style quality refinement: inserts Steiner points (splitting a
 * sparse boundary/hole edge, or adding an interior point) until every
 * triangle's minimum angle is >= minAngleDeg, or a safety cap is hit.
 * Fixes the slivers that bridge a dense fillet-arc boundary to a sparse
 * opposite boundary, which neither ear-clipping nor edge-flipping can
 * touch since both only ever use vertices already on the boundary.
 *
 * Each iteration picks the single worst triangle and asks, in order of
 * cheapest/most-decisive first: is its circumcenter outside the domain?
 * (fall back to splitting one of its boundary edges) does it encroach an
 * existing constrained edge? (split that edge instead of inserting the
 * point — this is the actual fix for the dense/sparse mismatch bug) —
 * otherwise the circumcenter is safe to insert as an interior point.
 */
export function refineMesh(
	triangles: Triangle[],
	constrainedEdges: ConstrainedEdges,
	bridgeEdgeKeys: Set<string>,
	domain: { outer: Point[]; holes: Point[][] },
	options: RefineMeshOptions = {}
): Triangle[] {
	const minAngleRad = (options.minAngleDeg ?? 28) * Math.PI / 180;
	const maxSteinerPoints = options.maxSteinerPoints ?? 500;
	const maxIterations = options.maxIterations ?? 2000;

	let current = triangles.slice();
	const edges = new Map(constrainedEdges);

	// A genuinely small INPUT angle (two constrained edges meeting at a
	// sharp corner, e.g. a tight fillet-to-flange junction) is a known
	// Ruppert non-termination case: splitting the edge opposite that corner
	// halves it, which halves the triangle's angle-defining geometry too,
	// producing another below-threshold triangle right next to it forever.
	// A hard floor on how short a constrained edge may get — well below any
	// legitimate mesh feature — turns that infinite regress into "give up on
	// this one corner," which is the only sound outcome (no amount of
	// splitting can fix a sliver whose thinness comes from the input shape
	// itself, not from boundary density).
	let minInputEdgeLengthSq = Infinity;
	for (const [a, b] of constrainedEdges.values()) {
		minInputEdgeLengthSq = Math.min(minInputEdgeLengthSq, distSq(a, b));
	}
	const minInputEdgeLength = Number.isFinite(minInputEdgeLengthSq) ? Math.sqrt(minInputEdgeLengthSq) : 1;
	const minSplitLength = minInputEdgeLength * 0.05;
	// Triangles that could not be fixed this run (e.g. a bridge-edge
	// encroachment we deliberately refuse to split) — remembered so the
	// worst-triangle scan doesn't retry the same unfixable case forever.
	const unfixable = new Set<string>();

	let steinerCount = 0;
	let iteration = 0;
	let cappedOut = false;

	while (iteration < maxIterations) {
		iteration++;

		let worstIdx = -1;
		let worstAngle = Infinity;
		for (let i = 0; i < current.length; i++) {
			const key = triKey(current[i]);
			if (unfixable.has(key)) {
				continue;
			}
			const [a, b, c] = current[i];
			// Ear-clipping a nearly-straight run of resampled boundary points
			// (a long flat edge densified for uniform spacing elsewhere) can
			// admit a flat, near-zero-area "ear" — its min angle is tiny too,
			// but it's not a visible sliver like the fillet-corner case: it
			// has no area to render. Subdividing it only produces more
			// exactly-collinear near-zero-area triangles forever (halving a
			// straight line is still a straight line), burning the whole
			// Steiner budget without ever converging. Treat it as already
			// resolved instead of chasing an angle that can't be fixed.
			if (Math.abs(cross(a, b, c)) / 2 < AREA_EPSILON) {
				unfixable.add(key);
				continue;
			}
			const angle = triangleMinAngle(a, b, c);
			if (angle < worstAngle) {
				worstAngle = angle;
				worstIdx = i;
			}
		}

		if (worstIdx === -1 || worstAngle >= minAngleRad) {
			break; // no triangle left below threshold — mesh is good
		}

		const tri = current[worstIdx];
		const cc = circumcenter(tri[0], tri[1], tri[2]);

		if (!cc || !inDomain(cc, domain)) {
			// Obtuse boundary-adjacent slivers routinely have a circumcenter
			// outside the shape entirely — inserting it would be meaningless,
			// so fix the triangle indirectly by densifying its boundary edge.
			const boundaryEdge = findConstrainedEdgeOfTriangle(tri, edges, bridgeEdgeKeys, true);
			if (!boundaryEdge || edgeTooShortToSplit(boundaryEdge, minSplitLength)) {
				unfixable.add(triKey(tri));
				continue;
			}
			current = splitEdge(current, edges, boundaryEdge);
			steinerCount++;
		} else {
			const encroachedEdge = findEncroachedEdge(cc, edges);
			if (encroachedEdge) {
				const ek = edgeKey(encroachedEdge[0], encroachedEdge[1]);
				if (bridgeEdgeKeys.has(ek) || edgeTooShortToSplit(encroachedEdge, minSplitLength)) {
					// Splitting only one copy of a keyhole bridge would desync the
					// slit (see mergeHoles); an already-tiny edge means we're
					// chasing a genuine small-input-angle corner (see comment
					// above) — accept this triangle stays thin rather than
					// regress forever or corrupt the mesh topology.
					unfixable.add(triKey(tri));
					continue;
				}
				current = splitEdge(current, edges, encroachedEdge);
				steinerCount++;
			} else {
				// A circumcenter that lands almost on top of ANY existing mesh
				// vertex — not just this triangle's own three — is a coincident
				// point waiting to happen: `insertPoint` would fan in a new
				// vertex a hair away from an old one, producing a genuinely
				// invalid needle-thin (or exactly coincident) triangle rather
				// than a "resolved" one. This is distinct from the collinear-ear
				// case above (that one is harmless/invisible; this one renders
				// as a visible sliver) and from `nearOwnVertex`-only checks,
				// which missed collisions with vertices from OTHER nearby
				// triangles — exactly the case that produced duplicate-point
				// triangles at tight fillets (small r) or dense resampling
				// (small maxSegmentLength) in practice.
				const minSplitLengthSq = minSplitLength * minSplitLength;
				const nearExistingVertex = current.some(([a, b, c]) =>
					[a, b, c].some((v) => distSq(v, cc) < minSplitLengthSq)
				);
				if (nearExistingVertex) {
					unfixable.add(triKey(tri));
					continue;
				}

				const seedIdx = findSeedTriangle(current, cc);
				if (seedIdx === -1) {
					unfixable.add(triKey(tri));
					continue;
				}
				current = insertPoint(current, edges, cc, seedIdx);
				steinerCount++;
			}
		}

		if (steinerCount >= maxSteinerPoints) {
			cappedOut = true;
			break;
		}
	}

	if (cappedOut || iteration >= maxIterations) {
		// Never throw or loop forever — this is a rendering-preview mesh, so a
		// capped, logged, "good enough" result is an acceptable fallback.
		console.warn(
			`refineMesh: stopped at cap (iterations=${iteration}, steinerPoints=${steinerCount}) — mesh may still contain slivers below the quality threshold`
		);
	}

	return current;
}

export interface PolygonWithHoles {
	outer: Point[];
	holes?: Point[][];
}

export interface MergedPolygon {
	polygon: Point[];
	constrainedEdges: ConstrainedEdges;
	bridgeEdgeKeys: Set<string>;
	/** Deduped outer/hole rings actually used to build `constrainedEdges` — pass these (not the raw input) as `refineMesh`'s `domain`, so its point-in-domain test agrees exactly with what `triangulate` (which also dedupes internally) produced. */
	outer: Point[];
	holes: Point[][];
}

/** Consecutive-pair edges of a closed ring, wrapping last-to-first. */
function ringEdges(ring: Point[]): [Point, Point][] {
	return ring.map((p, i) => [p, ring[(i + 1) % ring.length]] as [Point, Point]);
}

/** True if segment (a,b) crosses any edge of `ring`, ignoring edges that merely touch it at a shared endpoint (a candidate bridge always touches its own two rings there — that's not a crossing). Used to validate a candidate hole-to-boundary bridge doesn't cut through anything. */
function segmentCrossesRing(a: Point, b: Point, ring: Point[]): boolean {
	for (const [p, q] of ringEdges(ring)) {
		if (pointsEqual(p, a) || pointsEqual(p, b) || pointsEqual(q, a) || pointsEqual(q, b)) {
			continue;
		}
		if (doSegmentsIntersect(a, b, p, q)) {
			return true;
		}
	}
	return false;
}

/** Holes must wind opposite to the ring they're cut from for the keyhole splice below to produce a non-self-crossing polygon — flip automatically instead of trusting the caller's convention. */
function normalizeHoleWinding(hole: Point[], reference: Point[]): Point[] {
	const sameSign = Math.sign(signedArea(hole)) === Math.sign(signedArea(reference));
	return sameSign ? hole.slice().reverse() : hole.slice();
}

interface Bridge {
	outerIndex: number;
	holeIndex: number;
	outerPoint: Point;
	holePoint: Point;
}

/**
 * Finds the shortest hole-vertex-to-boundary-vertex segment that doesn't
 * cross the boundary itself, the hole's own ring, or any other
 * not-yet-merged hole. Shortest is preferred because the bridge becomes a
 * permanent zero-width seam in the mesh — the shorter it is, the smaller
 * the sliver it can leave behind (see refineMesh's bridge-edge caveat).
 */
function findShortestBridge(outerRing: Point[], hole: Point[], otherHoles: Point[][]): Bridge | null {
	let best: (Bridge & { distSq: number }) | null = null;

	for (let hi = 0; hi < hole.length; hi++) {
		const h = hole[hi];
		for (let oi = 0; oi < outerRing.length; oi++) {
			const o = outerRing[oi];
			if (pointsEqual(h, o)) {
				continue;
			}
			const d = distSq(h, o);
			if (best && d >= best.distSq) {
				continue; // already have a shorter valid candidate, skip the crossing checks
			}
			if (segmentCrossesRing(h, o, outerRing)) {
				continue;
			}
			if (segmentCrossesRing(h, o, hole)) {
				continue;
			}
			if (otherHoles.some((other) => segmentCrossesRing(h, o, other))) {
				continue;
			}

			best = { outerIndex: oi, holeIndex: hi, outerPoint: o, holePoint: h, distSq: d };
		}
	}

	return best;
}

/**
 * Stitches a polygon-with-holes into a single simple polygon that
 * `triangulate` can consume directly, via the standard keyhole/bridge
 * technique: each hole is connected to the outer boundary (or an
 * already-merged hole) by a zero-width bridge traversed twice — once
 * entering the hole loop, once leaving it.
 *
 * The bridge's "return" endpoints are nudged by a tiny epsilon along the
 * bridge direction rather than left exactly coincident with the "entry"
 * endpoints — ear-clipping's own-vertex-containment test (triangulate's
 * `containsOtherVertex` check) would otherwise always fire on a vertex
 * that's exactly coincident with another list entry, since a point
 * sitting exactly on a triangle's own vertex satisfies `pointInTriangle`.
 * The nudge is far below any visual or meshing tolerance in this domain.
 */
export function mergeHoles(shape: PolygonWithHoles): MergedPolygon {
	const BRIDGE_EPSILON = 1e-4;
	const holesInput = shape.holes ?? [];

	const constrainedEdges: ConstrainedEdges = new Map();
	const bridgeEdgeKeys = new Set<string>();

	const addRingEdges = (ring: Point[]) => {
		for (const [a, b] of ringEdges(ring)) {
			constrainedEdges.set(edgeKey(a, b), [a, b]);
		}
	};

	// Dedupe first: `triangulate` internally drops consecutive duplicate
	// points (real beam profiles have exact seam duplicates between an arc
	// and the straight run it meets), and every point-set used here —
	// constrainedEdges, the domain rings — must agree exactly with what
	// `triangulate` ends up building triangles from, or a "constrained" edge
	// keyed on a point that gets deduped away silently stops being
	// recognized as constrained, letting cavity flood-fill leak through it.
	const outer = dedupeClosedLoop(shape.outer);
	let merged = outer.slice();
	addRingEdges(merged);

	// Holes are merged one at a time so a later hole can legitimately bridge
	// to an earlier hole's already-spliced-in ring, not just the original
	// outer boundary, if that happens to be its shortest valid option.
	const remainingHoles = holesInput.map((h) => normalizeHoleWinding(dedupeClosedLoop(h), outer));

	for (let hIdx = 0; hIdx < remainingHoles.length; hIdx++) {
		const hole = remainingHoles[hIdx];
		const notYetMerged = remainingHoles.slice(hIdx + 1);

		const bridge = findShortestBridge(merged, hole, notYetMerged);
		if (!bridge) {
			// Surface loudly rather than silently produce a wrong mesh — this
			// means the hole isn't actually enclosed by the outer boundary.
			throw new Error(
				'mergeHoles: no valid bridge found for a hole — check that it is fully enclosed by the outer boundary and does not overlap another hole'
			);
		}

		const { outerIndex, holeIndex, outerPoint: o, holePoint: h } = bridge;

		const dx = h.x - o.x;
		const dy = h.y - o.y;
		const len = Math.hypot(dx, dy) || 1;
		const nx = dx / len;
		const ny = dy / len;
		const oReturn: Point = { x: o.x + nx * BRIDGE_EPSILON, y: o.y + ny * BRIDGE_EPSILON };
		const hReturn: Point = { x: h.x - nx * BRIDGE_EPSILON, y: h.y - ny * BRIDGE_EPSILON };

		// Splice: ..., o, h, <hole ring starting at h>, hReturn, oReturn, ...
		// — o and h (approximately) each appear twice, forming the slit.
		const rotatedHole = [...hole.slice(holeIndex), ...hole.slice(0, holeIndex)];
		const insertion = [...rotatedHole, hReturn, oReturn];

		const before = merged.slice(0, outerIndex + 1); // ends with o
		const after = merged.slice(outerIndex + 1);
		merged = [...before, ...insertion, ...after];

		addRingEdges(hole);
		constrainedEdges.set(edgeKey(o, h), [o, h]);
		constrainedEdges.set(edgeKey(hReturn, oReturn), [hReturn, oReturn]);
		bridgeEdgeKeys.add(edgeKey(o, h));
		bridgeEdgeKeys.add(edgeKey(hReturn, oReturn));
	}

	return { polygon: merged, constrainedEdges, bridgeEdgeKeys, outer, holes: remainingHoles };
}
