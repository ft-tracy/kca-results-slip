// KCA grading scale: CAT out of 30 + Exam out of 70 = 100.
export function gradeFor(total: number): string {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "E";
}

const POINTS: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, E: 0 };

export function gpa(rows: { total: number; credit_hours: number }[]): number {
  const credits = rows.reduce((s, r) => s + r.credit_hours, 0);
  if (!credits) return 0;
  const pts = rows.reduce((s, r) => s + (POINTS[gradeFor(r.total)] ?? 0) * r.credit_hours, 0);
  return Math.round((pts / credits) * 100) / 100;
}

export function recommendation(rows: { total: number }[]): string {
  if (!rows.length) return "No results";
  const fails = rows.filter((r) => r.total < 40).length;
  if (fails === 0) return "PASS — Proceed to next semester";
  if (fails <= 2) return `SUPPLEMENTARY in ${fails} unit${fails > 1 ? "s" : ""}`;
  return "REPEAT — Discontinuation warning";
}
