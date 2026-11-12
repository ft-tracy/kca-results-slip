CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no text NOT NULL UNIQUE,
  full_name text NOT NULL,
  course text NOT NULL,
  year_of_study int NOT NULL DEFAULT 1 CHECK (year_of_study BETWEEN 1 AND 6),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  credit_hours int NOT NULL DEFAULT 3 CHECK (credit_hours > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  semester int NOT NULL CHECK (semester BETWEEN 1 AND 3),
  cat_marks numeric(5,2) NOT NULL DEFAULT 0 CHECK (cat_marks BETWEEN 0 AND 30),
  exam_marks numeric(5,2) NOT NULL DEFAULT 0 CHECK (exam_marks BETWEEN 0 AND 70),
  total numeric(5,2) GENERATED ALWAYS AS (cat_marks + exam_marks) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, unit_id, academic_year, semester)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students, public.units, public.results TO anon, authenticated;
GRANT ALL ON public.students, public.units, public.results TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open access units" ON public.units FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open access results" ON public.results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.students (reg_no, full_name, course, year_of_study) VALUES
('KCA/23/01234','Nyambura Tracy Watiri','BSc Software Development',3),
('KCA/23/01567','Brian Otieno Ouma','BSc Information Technology',3),
('KCA/24/00891','Faith Wanjiku Kamau','Diploma in Business IT',2);
INSERT INTO public.units (code, name, credit_hours) VALUES
('BSD 3201','Advanced Application Programming',3),
('BSD 3202','Database Systems II',3),
('BIT 3105','Computer Networks',3),
('BSD 3204','Software Engineering',4),
('BIT 3107','Web Technologies',3);
INSERT INTO public.results (student_id, unit_id, academic_year, semester, cat_marks, exam_marks)
SELECT s.id, u.id, '2026/2027', 1, v.cat, v.exam FROM (VALUES
('KCA/23/01234','BSD 3201',27,58),('KCA/23/01234','BSD 3202',24,49),('KCA/23/01234','BIT 3105',21,40),('KCA/23/01234','BSD 3204',26,52),('KCA/23/01234','BIT 3107',28,61),
('KCA/23/01567','BSD 3201',18,35),('KCA/23/01567','BSD 3202',15,30),('KCA/23/01567','BIT 3105',20,44),('KCA/23/01567','BSD 3204',12,22),
('KCA/24/00891','BIT 3107',25,50),('KCA/24/00891','BIT 3105',22,41)
) AS v(reg, code, cat, exam)
JOIN public.students s ON s.reg_no = v.reg JOIN public.units u ON u.code = v.code;