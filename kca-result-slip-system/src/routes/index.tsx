import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { database as supabase } from "@/lib/database";
import { gradeFor, gpa, recommendation } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Printer, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KCA Student Result Slip Management System" },
      { name: "description", content: "Register students and units, record CAT and exam marks, and print KCA result slips." },
      { property: "og:title", content: "KCA Student Result Slip Management System" },
      { property: "og:description", content: "Register students and units, record marks, and print result slips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Student = { id: string; reg_no: string; full_name: string; course: string; year_of_study: number };
type Unit = { id: string; code: string; name: string; credit_hours: number };
type Result = {
  id: string; student_id: string; unit_id: string; academic_year: string; semester: number;
  cat_marks: number; exam_marks: number; total: number | null;
};

function useData() {
  const students = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("reg_no");
      if (error) throw error;
      return data as Student[];
    },
  });
  const units = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*").order("code");
      if (error) throw error;
      return data as Unit[];
    },
  });
  const results = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const { data, error } = await supabase.from("results").select("*").order("created_at");
      if (error) throw error;
      return data as Result[];
    },
  });
  return { students: students.data ?? [], units: units.data ?? [], results: results.data ?? [] };
}

const selectCls =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Index() {
  const { students, units, results } = useData();
  return (
    <div className="min-h-screen font-sans">
      <header className="no-print bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-6">
          <GraduationCap className="h-9 w-9 text-accent" />
          <div>
            <h1 className="font-display text-2xl font-bold">KCA University</h1>
            <p className="text-sm opacity-80">Student Result Slip Management System</p>
          </div>
          <div className="ml-auto hidden gap-6 text-sm sm:flex">
            <Stat n={students.length} l="Students" />
            <Stat n={units.length} l="Units" />
            <Stat n={results.length} l="Results" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="slip">
          <TabsList className="no-print mb-6">
            <TabsTrigger value="slip">Result Slip</TabsTrigger>
            <TabsTrigger value="results">Enter Marks</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
          </TabsList>
          <TabsContent value="slip"><SlipTab students={students} units={units} results={results} /></TabsContent>
          <TabsContent value="results"><ResultsTab students={students} units={units} results={results} /></TabsContent>
          <TabsContent value="students"><StudentsTab students={students} /></TabsContent>
          <TabsContent value="units"><UnitsTab units={units} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div className="text-right">
      <div className="font-display text-xl font-bold text-accent">{n}</div>
      <div className="opacity-80">{l}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/* ---------------- Students ---------------- */
function StudentsTab({ students }: { students: Student[] }) {
  const refresh = useRefresh();
  const [f, setF] = useState({ reg_no: "", full_name: "", course: "", year_of_study: 1 });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("students").insert(f);
    if (error) { toast.error(error.message); return; }
    toast.success("Student registered");
    setF({ reg_no: "", full_name: "", course: "", year_of_study: 1 });
    refresh("students");
  };
  const del = async (id: string) => {
    if (!confirm("Delete this student and all their results?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Student deleted");
    refresh("students", "results");
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Panel title="Register student">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Reg. No."><Input required placeholder="KCA/24/00001" value={f.reg_no} onChange={(e) => setF({ ...f, reg_no: e.target.value })} /></Field>
          <Field label="Full name"><Input required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
          <Field label="Course"><Input required value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })} /></Field>
          <Field label="Year of study"><Input type="number" min={1} max={6} value={f.year_of_study} onChange={(e) => setF({ ...f, year_of_study: Number(e.target.value) })} /></Field>
          <Button type="submit" className="w-full">Save student</Button>
        </form>
      </Panel>
      <Panel title="Registered students">
        <Table head={["Reg. No.", "Name", "Course", "Year", ""]}>
          {students.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="py-2 font-medium">{s.reg_no}</td><td>{s.full_name}</td><td>{s.course}</td><td>{s.year_of_study}</td>
              <td className="text-right"><DelBtn onClick={() => del(s.id)} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}

/* ---------------- Units ---------------- */
function UnitsTab({ units }: { units: Unit[] }) {
  const refresh = useRefresh();
  const [f, setF] = useState({ code: "", name: "", credit_hours: 3 });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("units").insert(f);
    if (error) { toast.error(error.message); return; }
    toast.success("Unit added");
    setF({ code: "", name: "", credit_hours: 3 });
    refresh("units");
  };
  const del = async (id: string) => {
    if (!confirm("Delete this unit and its results?")) return;
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh("units", "results");
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Panel title="Add unit">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Unit code"><Input required placeholder="BSD 3201" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <Field label="Unit name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Credit hours"><Input type="number" min={1} value={f.credit_hours} onChange={(e) => setF({ ...f, credit_hours: Number(e.target.value) })} /></Field>
          <Button type="submit" className="w-full">Save unit</Button>
        </form>
      </Panel>
      <Panel title="Units offered">
        <Table head={["Code", "Name", "Credit hrs", ""]}>
          {units.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="py-2 font-medium">{u.code}</td><td>{u.name}</td><td>{u.credit_hours}</td>
              <td className="text-right"><DelBtn onClick={() => del(u.id)} /></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </div>
  );
}

/* ---------------- Results ---------------- */
function ResultsTab({ students, units, results }: { students: Student[]; units: Unit[]; results: Result[] }) {
  const refresh = useRefresh();
  const empty = { student_id: "", unit_id: "", academic_year: "2026/2027", semester: 1, cat_marks: 0, exam_marks: 0 };
  const [f, setF] = useState(empty);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.student_id || !f.unit_id) { toast.error("Choose a student and a unit"); return; }
    if (f.cat_marks < 0 || f.cat_marks > 30) { toast.error("CAT marks must be 0–30"); return; }
    if (f.exam_marks < 0 || f.exam_marks > 70) { toast.error("Exam marks must be 0–70"); return; }
    const { error } = await supabase.from("results").upsert(f, { onConflict: "student_id,unit_id,academic_year,semester" });
    if (error) { toast.error(error.message); return; }
    toast.success("Marks saved");
    setF({ ...f, unit_id: "", cat_marks: 0, exam_marks: 0 });
    refresh("results");
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("results").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh("results");
  };
  const sName = (id: string) => students.find((s) => s.id === id)?.reg_no ?? "";
  const uName = (id: string) => units.find((u) => u.id === id)?.code ?? "";
  const total = f.cat_marks + f.exam_marks;
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Panel title="Enter / update marks">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Student">
            <select className={selectCls} value={f.student_id} onChange={(e) => setF({ ...f, student_id: e.target.value })}>
              <option value="">Select…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.reg_no} — {s.full_name}</option>)}
            </select>
          </Field>
          <Field label="Unit">
            <select className={selectCls} value={f.unit_id} onChange={(e) => setF({ ...f, unit_id: e.target.value })}>
              <option value="">Select…</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Academic year"><Input value={f.academic_year} onChange={(e) => setF({ ...f, academic_year: e.target.value })} /></Field>
            <Field label="Semester">
              <select className={selectCls} value={f.semester} onChange={(e) => setF({ ...f, semester: Number(e.target.value) })}>
                {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="CAT (/30)"><Input type="number" min={0} max={30} step="0.5" value={f.cat_marks} onChange={(e) => setF({ ...f, cat_marks: Number(e.target.value) })} /></Field>
            <Field label="Exam (/70)"><Input type="number" min={0} max={70} step="0.5" value={f.exam_marks} onChange={(e) => setF({ ...f, exam_marks: Number(e.target.value) })} /></Field>
          </div>
          <p className="rounded-md bg-muted px-3 py-2 text-sm">Total: <b>{total}</b> · Grade: <b>{gradeFor(total)}</b></p>
          <Button type="submit" className="w-full">Save marks</Button>
        </form>
      </Panel>
      <Panel title="All recorded results">
        <Table head={["Reg. No.", "Unit", "Year / Sem", "CAT", "Exam", "Total", "Grade", ""]}>
          {results.map((r) => {
            const t = Number(r.total ?? 0);
            return (
              <tr key={r.id} className="border-t">
                <td className="py-2 font-medium">{sName(r.student_id)}</td><td>{uName(r.unit_id)}</td>
                <td>{r.academic_year} / {r.semester}</td><td>{r.cat_marks}</td><td>{r.exam_marks}</td>
                <td className="font-semibold">{t}</td><td><GradeBadge g={gradeFor(t)} /></td>
                <td className="text-right"><DelBtn onClick={() => del(r.id)} /></td>
              </tr>
            );
          })}
        </Table>
      </Panel>
    </div>
  );
}

/* ---------------- Slip ---------------- */
function SlipTab({ students, units, results }: { students: Student[]; units: Unit[]; results: Result[] }) {
  const [sid, setSid] = useState("");
  const [period, setPeriod] = useState("");
  const student = students.find((s) => s.id === sid);
  const mine = results.filter((r) => r.student_id === sid);
  const periods = Array.from(new Set(mine.map((r) => `${r.academic_year}|${r.semester}`)));
  const active = period && periods.includes(period) ? period : periods[0] ?? "";
  const [ay, sem] = active.split("|");
  const rows = useMemo(
    () =>
      mine
        .filter((r) => r.academic_year === ay && String(r.semester) === sem)
        .map((r) => {
          const u = units.find((x) => x.id === r.unit_id);
          return { ...r, total: Number(r.total ?? 0), code: u?.code ?? "", name: u?.name ?? "", credit_hours: u?.credit_hours ?? 0 };
        })
        .sort((a, b) => a.code.localeCompare(b.code)),
    [mine, units, ay, sem],
  );
  const mean = rows.length ? (rows.reduce((s, r) => s + r.total, 0) / rows.length).toFixed(1) : "–";

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="min-w-64 flex-1">
          <Label className="mb-1 block">Student</Label>
          <select className={selectCls} value={sid} onChange={(e) => { setSid(e.target.value); setPeriod(""); }}>
            <option value="">Select a student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.reg_no} — {s.full_name}</option>)}
          </select>
        </div>
        <div className="w-48">
          <Label className="mb-1 block">Year / Semester</Label>
          <select className={selectCls} value={active} onChange={(e) => setPeriod(e.target.value)} disabled={!periods.length}>
            {periods.map((p) => <option key={p} value={p}>{p.replace("|", " · Sem ")}</option>)}
          </select>
        </div>
        <Button onClick={() => window.print()} disabled={!rows.length}><Printer className="mr-2 h-4 w-4" />Print slip</Button>
      </div>

      {!student ? (
        <p className="py-16 text-center text-muted-foreground">Choose a student to view their result slip.</p>
      ) : (
        <article className="print-area mx-auto max-w-3xl rounded-lg border-t-8 border-primary bg-card p-8 shadow-md">
          <div className="border-b-2 border-accent pb-4 text-center">
            <h2 className="font-display text-3xl font-bold text-primary">KCA UNIVERSITY</h2>
            <p className="text-sm text-muted-foreground">P.O. Box 56808-00200, Nairobi · Office of the Registrar (Academics)</p>
            <p className="mt-3 font-display text-lg font-bold tracking-widest">PROVISIONAL RESULT SLIP</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 py-4 text-sm">
            <Info k="Name" v={student.full_name} /><Info k="Reg. No." v={student.reg_no} />
            <Info k="Programme" v={student.course} /><Info k="Year of study" v={String(student.year_of_study)} />
            <Info k="Academic year" v={ay ?? "–"} /><Info k="Semester" v={sem ?? "–"} />
          </dl>
          {rows.length ? (
            <table className="w-full text-sm">
              <thead><tr className="bg-primary text-left text-primary-foreground">
                {["Code", "Unit title", "CH", "CAT", "Exam", "Total", "Grade"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-2 py-2 font-medium">{r.code}</td><td className="px-2">{r.name}</td><td className="px-2">{r.credit_hours}</td>
                    <td className="px-2">{r.cat_marks}</td><td className="px-2">{r.exam_marks}</td>
                    <td className="px-2 font-semibold">{r.total}</td><td className="px-2"><GradeBadge g={gradeFor(r.total)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="py-6 text-center text-muted-foreground">No results recorded for this student yet.</p>}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <Summary k="Units taken" v={String(rows.length)} />
            <Summary k="Mean mark" v={mean} />
            <Summary k="GPA (4.0)" v={rows.length ? gpa(rows).toFixed(2) : "–"} />
          </div>
          <p className="mt-4 rounded-md bg-secondary px-4 py-3 text-center font-semibold">Recommendation: {recommendation(rows)}</p>
          <p className="mt-6 text-xs text-muted-foreground">Grading: A 70–100 · B 60–69 · C 50–59 · D 40–49 · E 0–39 (Fail). CAT 30% + Exam 70%. This slip is provisional; the official transcript is issued by the Registrar.</p>
          <div className="mt-10 flex justify-between text-xs text-muted-foreground">
            <span>________________________<br />Registrar (Academics)</span>
            <span>Date issued: {new Date().toLocaleDateString("en-KE")}</span>
          </div>
        </article>
      )}
    </div>
  );
}

/* ---------------- Small parts ---------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">{head.map((h, i) => <th key={i} className="pb-2 font-medium">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function DelBtn({ onClick }: { onClick: () => void }) {
  return <Button variant="ghost" size="icon" onClick={onClick} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>;
}
function GradeBadge({ g }: { g: string }) {
  const cls = g === "E" ? "bg-destructive text-destructive-foreground" : g === "A" ? "bg-success text-primary-foreground" : "bg-secondary text-secondary-foreground";
  return <span className={`inline-block min-w-7 rounded px-2 py-0.5 text-center text-xs font-bold ${cls}`}>{g}</span>;
}
function Info({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-2"><dt className="w-28 text-muted-foreground">{k}:</dt><dd className="font-medium">{v}</dd></div>;
}
function Summary({ k, v }: { k: string; v: string }) {
  return <div className="rounded-md border p-3"><div className="font-display text-2xl font-bold text-primary">{v}</div><div className="text-xs text-muted-foreground">{k}</div></div>;
}
