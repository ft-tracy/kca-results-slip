# KCA Student Result Slip Management System

Advanced Application Programming: CAT II  
Student: NYAMBURA TRACY WATIRI

## What is included
Student and unit registration, CAT/exam mark recording, automatic grades, credit-weighted GPA, recommendations, and printable result slips. PostgreSQL setup with three tables and sample records is in `database/setup.sql`.

The sample registration numbers, courses, other students and marks are demonstration data, not verified academic records. The grade scale and recommendations are demonstration rules, not confirmed university policy.

## Recommended free website hosting: Cloudflare Pages
Static website requests are free and unlimited under current published terms. No free host guarantees perpetual availability or unchanged terms. Hosting the website does not host its database.

This package uses standard open-source build tools. It contains no existing project address, database key, editor integration, or platform-specific build package. You must connect your own database before building.

## 1. Create your own compatible database
Use a PostgreSQL service offering the Supabase-compatible REST API. Create a new database project in your own account and run `database/setup.sql` in that service's SQL editor once. Copy its project URL and **public/publishable** API key. Never use a secret or service-role key in this website.

An independently managed free compatible database may pause after inactivity (the common free tier pauses after one week). Therefore a free website plus free database does NOT guarantee a maintenance-free, always-working system. An ordinary PostgreSQL connection string alone is not compatible with the browser client in this package.

The SQL includes 3 sample students, 5 units and 11 results; it does not export later changes from your original system. For your current records, export the students, units and results separately before moving, retaining UUIDs and importing students and units before results; omit the computed total column when importing results.

**Classroom demo only:** all visitors can read, add, overwrite and delete records. Do not put real private student records here until proper login and access controls have been added.

## 2. Build the upload folder
Install Node.js 22.12 or newer. Unzip this folder, open a terminal inside it, and run:

```sh
npm install
```

Copy `.env.example` to `.env`, then replace both values with your own database URL and public key.

```sh
npm run build
npm test
```

The upload-ready website will be in **dist/client**. Upload this folder, not the source ZIP. The database values are built into the website; changing them requires building again. Public keys are safe to expose only with appropriate database access policies.

## 3. Upload to Cloudflare Pages
1. Create or sign in to your Cloudflare account.
2. Open Workers & Pages and create a Pages project using Direct Upload / Upload assets.
3. Give it a name such as `kca-result-slips`.
4. Upload the entire `dist/client` folder, including its assets folder and index.html.
5. Deploy and open the assigned `pages.dev` address. A paid custom domain is not required.
6. Select a sample student and check their slip. Register a temporary student, refresh to check persistence, record marks, and test Print slip. Delete test records afterward.

A static host can serve the website without an application server running continuously. Records still depend on the separate database being available. Keep a backup of your source and records.

## Run locally
After setting `.env`, run `npm run dev`, then open the address it prints. To inspect a production build, run `npm run preview`.

## Database and grading design
`students` stores registration, name, programme and study year; `units` stores unit code, title and credit hours; `results` relates a student and unit to an academic period. Database checks enforce CAT 0–30, exam 0–70 and semester 1–3. Re-saving a unit result for the same period updates the existing record. Student/unit deletion removes their related results.

Grade and GPA calculations share `src/lib/grading.ts` with tests in `src/test/grading.test.ts`.

## Sources checked when this package was prepared
- Static hosting pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Compatible free database inactivity policy: see the chosen service's current pricing and terms.
