# Paket Prompt Gemini & Roadmap Engineering
## Buku Induk Digital SMP Negeri 99 Jakarta
**Target:** Prototype  
**Platform:** Google Apps Script Web App + HTML Service + Google Sheets + Google Drive + Google Docs/PDF

> Gunakan paket ini bertahap. Jangan kirim semua prompt sekaligus. Mulai dari P0, review, setujui, lalu lanjut.

## Keputusan arsitektur
- Frontend: Apps Script HTML Service (HTML/CSS/JS).
- Backend: Apps Script V8; `doGet()` untuk shell.
- Client/server: `google.script.run` asynchronous dengan success/failure handler.
- Storage prototype: Google Sheets melalui Repository layer saja.
- File: Google Drive private folder; metadata di Sheets.
- PDF: Google Docs template → PDF snapshot.
- Lock: `LockService` untuk critical writes.
- Config: `PropertiesService` untuk IDs/environment/schema version, bukan password.
- Cache: lookup/reference data saja, bukan source of truth.
- Blogger: portal/landing opsional, bukan backend dan bukan security layer.
- Data uji: synthetic/anonymized; jangan masukkan PII siswa sebelum security sign-off.
- Jangan deploy anonymous. Putuskan execute-as/access melalui ADR.

## Struktur file Apps Script
```text
appsscript.json
Code.gs
Config.gs
Router.gs
AuthService.gs
AuthorizationService.gs
ApiController.gs
Validation.gs
Utils.gs
Logger.gs
AuditService.gs
IdService.gs
LockService.gs
SheetRepository.gs
StudentRepository.gs
GuardianRepository.gs
AddressRepository.gs
EnrollmentRepository.gs
HistoryRepository.gs
DocumentRepository.gs
ImportRepository.gs
PrintRepository.gs
StudentService.gs
GuardianService.gs
EnrollmentService.gs
DocumentService.gs
ChangeRequestService.gs
ImportService.gs
PrintService.gs
DashboardService.gs
DriveStorage.gs
DocsRenderer.gs
SpreadsheetSetup.gs
SeedData.gs
Tests.gs
Index.html
Styles.html
ClientApp.html
Components.html
Dashboard.html
StudentsList.html
StudentProfile.html
StudentForm.html
ChangeRequests.html
Documents.html
ImportWizard.html
PrintCenter.html
Settings.html
```

## Skema data awal (sheets)
`_META`, `Users`, `Roles`, `RolePermissions`, `Students`, `StudentBiodata`, `Guardians`, `StudentGuardians`, `Addresses`, `Enrollments`, `ClassHistory`, `EducationHistory`, `Documents`, `HealthMeasurements`, `Achievements`, `Scholarships`, `Hobbies`, `StatusHistory`, `ChangeRequests`, `ChangeRequestItems`, `ImportBatches`, `ImportRows`, `PrintJobs`, `AuditLog`.

Setiap entitas memakai UUID. Nomor identitas dan telepon disimpan sebagai teks. Field sensitif seperti NIK, KK, penghasilan, dan kesehatan rinci ditunda dari MVP.

## Workflow utama
1. Registrasi: cek duplikasi → draft → identitas → keluarga/alamat → dokumen → verifikasi → aktif.
2. Perubahan: pilih siswa → field lama/baru → alasan/bukti → submit → review → approve/reject → apply + audit.
3. Dokumen: upload privat → pending review → verified/rejected/needs correction.
4. Impor: upload → staging → mapping → validasi → NEW/FILL_BLANK/CONFLICT/UNCHANGED/ERROR → preview → commit idempotent.
5. Mutasi/lulus: pilih transisi → tanggal/alasan → approval → update status + histori; jangan hapus siswa.
6. Cetak: pilih siswa/template → cek permission → snapshot → PDF → simpan privat → audit.

## Roadmap
| Fase | Fokus | Gate |
|---|---|---|
| P0 | Discovery, data dictionary, role matrix, ADR | Disetujui sebelum coding |
| P1 | GAS foundation, HTML shell, setup Sheets, seed data | Ping/setup/idempotency tests |
| P2 | Auth, allowlist, RBAC, audit, locks | Negative security tests |
| P3 | Dashboard, master siswa, search/filter, profile | CRUD + duplicate + permission tests |
| P4 | Guardian, address, enrollment, histories | Relasi/histori tests |
| P5 | Drive docs, verification, change requests | File privacy + workflow tests |
| P6 | Import staging, preview, commit, export | Dry-run, conflict, idempotency |
| P7 | Print Center, Google Docs template, PDF snapshot | PDF/privacy/immutability |
| P8 | QA, UAT, pilot, backup/restore, release | Go/No-Go report |

## Prompt Gemini per fase


### PROMPT 0 — SYSTEM / MASTER INSTRUCTION

```text
Kamu bertindak sebagai Senior Google Apps Script Architect, Full-stack Engineer, Database Designer, Security Engineer, UI/UX Engineer, dan QA Lead.

PROYEK: Buku Induk Digital SMP Negeri 99 Jakarta.
TARGET: PROTOTYPE.
STACK: Google Apps Script V8 + HTML Service + CSS/JavaScript + Google Sheets + Google Drive private storage + Google Docs/PDF.
Blogger hanya portal opsional; bukan backend.

SUMBER KEBUTUHAN:
1. PRD Buku Induk Digital SMPN 99 Jakarta.
2. Engineering Specification dan workflow.
3. UI/UX Engineering Addendum berdasarkan screenshot Sekolah.co.id.
4. Workbook FORM BUKU INDUK.xlsx sebagai inventarisasi domain data TU.
Jika sumber bertentangan, laporkan konflik; jangan mengarang keputusan.

PRINSIP:
- One-time data entry, single source of truth, multiple outputs.
- Sheets hanya storage prototype; semua akses melalui Repository + Service.
- Jangan letakkan business logic di HTML.
- Jangan expose fungsi internal ke google.script.run.
- Semua endpoint server memeriksa identity, role, permission, input schema, dan audit.
- Data prototype harus synthetic/anonymized.
- Jangan simpan password dalam Sheets.
- Jangan deploy anonymous.
- File Drive harus private.
- Gunakan UUID, schema version, batch reads/writes, LockService untuk critical writes.
- Jangan mengklaim transaksi database penuh; Sheets tidak setara PostgreSQL.
- Tidak ada tombol dekoratif, dummy action, atau fitur pura-pura selesai.

CARA KERJA:
Kerjakan hanya satu fase pada satu waktu. Sebelum coding, tampilkan rencana dan file yang akan dibuat. Setelah coding, tampilkan semua file lengkap, setup steps, test steps, hasil test, known limitations, dan checklist acceptance criteria. Jangan lanjut fase berikutnya tanpa persetujuan saya.
Jangan menghapus atau mengganti file yang sudah ada tanpa menjelaskan dampak.

```

### PROMPT 1 — DISCOVERY, DATA DICTIONARY, ADR

```text
Mulai Fase P0. Jangan menulis kode aplikasi dulu.

Analisis PRD, Engineering Spec, UI/UX Addendum, dan workbook Excel yang saya berikan. Hasilkan:
1. Scope MVP dan daftar fitur yang sengaja ditunda.
2. Data dictionary setiap field: fieldKey, label, tipe, requiredness (required/optional/conditional), source, validation, privacy class, siapa yang boleh melihat/mengubah, output yang memakai field.
3. Sheet schema dan relasi konseptual; identifikasi primary key logis dan unique rules.
4. Role-permission matrix minimal: ADMIN, OPERATOR_TU, VERIFIER, HOMEROOM_TEACHER, READ_ONLY_AUDITOR.
5. Workflow diagram tekstual untuk registrasi, update data, dokumen, import, mutasi/lulus, print.
6. Route map dan UI component inventory.
7. ADR: deployment execute-as/access, identifikasi user, penyimpanan file, schema version, lock/concurrency, backup.
8. Risiko Google Sheets dan batas prototype.

PENTING:
- Workbook contoh menyebut SMP Negeri 90; jangan gunakan identitas atau data contoh itu. Target hanya SMPN 99.
- NIK, KK, penghasilan, dan kesehatan rinci tidak masuk MVP awal.
- Jangan menganggap semua kolom Excel wajib.
- Berikan daftar keputusan yang perlu saya setujui.
Akhiri dengan STOP. Jangan coding.
```

### PROMPT 2 — PROJECT FOUNDATION

```text
Implementasikan Fase P1 berdasarkan keputusan P0 yang telah disetujui.

Buat fondasi Apps Script:
- appsscript.json dengan scopes minimum.
- doGet() dan HTML Service.
- include helper untuk HTML partial.
- Config melalui Script Properties untuk SPREADSHEET_ID, DRIVE_ROOT_FOLDER_ID, ENVIRONMENT, SCHEMA_VERSION.
- SpreadsheetSetup untuk membuat sheet dan header yang diperlukan secara idempotent.
- _META sheet untuk schema version dan setup status.
- UUID utility, date/time utility, structured logger.
- UI shell: sidebar, topbar, content area, toast, modal, loading skeleton, responsive CSS.
- Client API wrapper untuk google.script.run dengan success/failure handlers.
- README setup manual dan langkah deploy test /dev.

Buat data sintetis saja. Jangan implementasikan fitur siswa lengkap dulu.
Test: doGet render, include partial, setup idempotent, missing config error, client-server ping.
Berikan semua file lengkap dan daftar cara memasukkan file ke Apps Script editor atau clasp. STOP setelah P1.
```

### PROMPT 3 — AUTHORIZATION & SECURITY FOUNDATION

```text
Implementasikan Fase P2.

Buat:
- Users allowlist berbasis email sekolah yang dikonfigurasi.
- Roles dan RolePermissions sheets.
- getCurrentUserContext server-side.
- requireAuthenticatedUser_ dan requirePermission_.
- deny-by-default.
- guard untuk setiap server function yang dapat dipanggil google.script.run.
- AuditService append-only secara aplikasi.
- sanitasi output dan validasi payload.
- lock helper untuk operasi kritis.
- error response standar tanpa membocorkan stack trace/rahasia ke client.

Jangan membuat password login sendiri dan jangan menyimpan password di Sheets.
Jangan menggunakan email client yang dikirim browser sebagai bukti identitas.
Uji konfigurasi deployment yang dipilih; jika email aktif tidak tersedia secara andal, hentikan dan jelaskan opsi aman, jangan bypass.
Buat negative tests: anonymous, email tidak di-allowlist, user inactive, role tidak punya permission, request manipulasi studentId.
Jangan lanjut ke data sensitif. STOP setelah laporan security baseline.
```

### PROMPT 4 — STUDENT CORE & DASHBOARD

```text
Implementasikan Fase P3.

Bangun vertical slice master siswa:
- StudentRepository dan StudentService.
- Dashboard: total siswa, aktif, laki-laki, perempuan, data update timestamp.
- Semua Siswa: search nama/NIS/NISN, filter kelas/status/tingkat/tahun masuk, pagination server-side.
- Tambah siswa sebagai draft dengan validasi duplikasi.
- Detail profil berbasis tab: Ringkasan, Biodata, Keluarga, Pendidikan, Dokumen, Riwayat.
- Row actions: lihat, edit sesuai permission, dokumen, cetak placeholder yang jelas disabled sampai Print Center tersedia.
- UI mengikuti screenshot: sidebar navy, background pale blue, white cards, filter toolbar, table, status badge, action icons.
- Empty/loading/error states.
- Semua data dari Sheets melalui repository; tidak ada data hard-coded.

Sertakan synthetic seed data 20 siswa dengan nama fiktif yang jelas bukan data nyata.
Acceptance: create, list, search, filter kombinatif, pagination, duplicate prevention, permission tests. STOP.
```

### PROMPT 5 — FAMILY, ADDRESS, ENROLLMENT & HISTORY

```text
Implementasikan Fase P4.

Buat domain:
- Guardians + StudentGuardians (relasi satu siswa dapat memiliki beberapa orang tua/wali).
- Addresses dengan validFrom/validTo dan alamat utama.
- Enrollments untuk penerimaan.
- ClassHistory per tahun ajaran.
- EducationHistory untuk sekolah asal.
- StatusHistory append-only.

Bangun form section/tab pada profil siswa. Perubahan relasi/alamat harus mempertahankan histori, bukan overwrite tanpa jejak. Validasi tanggal dan relasi studentId. Buat completeness rules: required/optional/conditional dari konfigurasi, bukan hard-coded di banyak tempat.
Jangan memasukkan NIK wali, nomor KK, penghasilan, atau kesehatan rinci.
Test: siswa dengan dua wali, perubahan alamat, kelas lintas tahun, tanggal tumpang tindih, siswa pindah/lulus tidak terhapus. STOP.
```

### PROMPT 6 — DOCUMENTS & CHANGE REQUEST

```text
Implementasikan Fase P5.

DocumentService:
- Upload file ke folder Drive privat.
- Validasi mime type, ekstensi, ukuran, nama file.
- Simpan Drive fileId, checksum, category, studentId, uploader, status, timestamps.
- Tidak membuat file public dan tidak mengirim public URL.
- Status UPLOADED → PENDING_REVIEW → VERIFIED / REJECTED / NEEDS_CORRECTION.
- Checklist dokumen per siswa; hanya VERIFIED dihitung lengkap.

ChangeRequest:
- Submit field changes, reason, old/new values, optional evidence.
- Review approve/reject/needs revision.
- Apply approved change dan audit dalam critical section.
- Batasi self-approval sesuai policy.
Test akses file, role, file invalid, approval, rejected, audit before/after. Gunakan dokumen dummy/anonymized. STOP.
```

### PROMPT 7 — IMPORT / EXPORT

```text
Implementasikan Fase P6.

Bangun import wizard:
1. Upload file CSV atau XLSX jika parser yang dipilih benar-benar tersedia dan diuji. Jika XLSX native tidak didukung tanpa library, jelaskan dan sediakan CSV template sebagai MVP.
2. Parse ke ImportRows staging; tidak ada perubahan ke Students saat preview.
3. Mapping kolom dan normalisasi.
4. Matching berdasarkan NISN/NIS; nama hanya kandidat, bukan key tunggal.
5. Klasifikasi NEW, FILL_BLANK, CONFLICT, UNCHANGED, ERROR.
6. Preview per baris, koreksi mapping, pilih baris untuk commit.
7. Commit idempotent, lock, audit, row result.
8. Export CSV dan rekap sesuai permission; kolom sensitif tidak ada secara default.

Buat sample template CSV dan test duplicate, conflict, invalid date, malformed rows, retry, partial failure, dry-run no-write. STOP.
```

### PROMPT 8 — PRINT CENTER

```text
Implementasikan Fase P7.

Bangun shared Print Center:
- Google Docs template dengan placeholder yang didokumentasikan.
- Template registry dan templateVersion.
- Pilih satu siswa atau filter siswa.
- Ambil data dari service/repository dan periksa permission.
- Compose dokumen dan hasilkan PDF.
- Field kosong ditampilkan sesuai aturan template; jangan mengarang.
- Simpan PDF ke Drive private folder.
- PrintJobs mencatat requester, template/version, filter, timestamp, status, output fileId, checksum.
- Snapshot output tidak berubah saat data siswa berubah.
- Batasi batch size untuk prototype; jika besar, pecah menjadi job kecil dan tampilkan status.

Mulai dari Buku Induk satu siswa, kemudian batch maksimal kecil untuk UAT. Test field kosong, nama panjang, page break, PDF, akses privat, checksum, snapshot immutability. STOP.
```

### PROMPT 9 — QA, UAT, PILOT & RELEASE

```text
Implementasikan Fase P8 sebagai hardening, bukan menambah fitur baru.

Buat:
- Unit/integration/authorization tests.
- Regression checklist semua workflow.
- UAT script untuk operator TU, verifikator, wali kelas, admin.
- Synthetic test dataset dan reset procedure.
- Backup/restore procedure untuk spreadsheet dan Drive file.
- Deployment checklist: test /dev, versioned deployment, restricted access, post-deploy smoke test.
- Known limitations and quota monitoring.
- Error handling dan log review.
- User guide ringkas dan SOP operasional.

Lakukan threat review untuk deployment execute-as dan data exposure. Jangan deploy ke public/anonymous. Jangan memasukkan data siswa nyata sampai security sign-off.
Berikan Go/No-Go report dengan bukti test. STOP.
```

### PROMPT 10 — BUGFIX / CHANGE REQUEST CONTROL

```text
Kita sedang berada pada fase implementasi Buku Induk Digital SMPN 99. Jangan melakukan refactor luas.

Untuk bug/permintaan ini:
1. Reproduksi dan identifikasi root cause.
2. Tunjukkan file dan fungsi terdampak.
3. Jelaskan risiko ke data, permission, workflow, dan kompatibilitas.
4. Usulkan perubahan sekecil mungkin.
5. Implementasikan hanya setelah saya menyetujui rencana.
6. Jalankan regression tests terkait.
7. Laporkan file changed, test evidence, risiko tersisa, dan status.

Jangan menghapus fitur yang sudah selesai, mengganti schema tanpa migration plan, atau menambah scope yang tidak diminta.
```

## Command operasional
- `AUDIT CURRENT STATE` — bandingkan kondisi aktual tanpa mengubah kode.
- `IMPLEMENT PHASE Pn` — implementasi satu fase saja.
- `RUN REGRESSION` — jalankan test dan laporkan pass/fail.
- `REVIEW SECURITY` — periksa akses, data leakage, Drive permissions, deployment identity.
- `GENERATE FILE MANIFEST` — daftar file, tujuan, dependency, entry points.
- `PREPARE RELEASE` — siapkan release checklist; jangan deploy tanpa approval.
- `STOP AND REPORT` — hentikan perubahan dan laporkan blocker.

## Pagar keamanan
- Jangan deploy anonymous.
- Jangan simpan password di Sheets.
- Jangan percaya email/role yang dikirim browser.
- Setiap server function callable wajib authorization.
- Drive folder harus private.
- Jangan kirim OAuth token ke client.
- Gunakan LockService untuk critical writes.
- Gunakan synthetic/anonymized data.
- Jangan masukkan NIK/KK/penghasilan/kesehatan rinci pada MVP.
- Verifikasi kuota Apps Script resmi sebelum menetapkan batas batch dan runtime.

## Referensi resmi
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/html
- https://developers.google.com/apps-script/guides/html/reference/run
- https://developers.google.com/apps-script/guides/html/communication
- https://developers.google.com/apps-script/manifest/web-app-api-executable
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/guides/properties
- https://developers.google.com/apps-script/concepts/deployments
- https://developers.google.com/apps-script/guides/services/quotas
