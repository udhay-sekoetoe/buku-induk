import {
  Student,
  AuditLogEntry,
  MutationRecord,
  VerificationStatus,
  UserRole,
  SemesterGradesRecord,
  BukuIndukSettings,
  ApprovalRequest,
  ApprovalStatus,
  AppUser,
} from '../types';
import { INITIAL_STUDENTS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import { generateDefaultSemesterGrades, STANDARD_SUBJECTS_TEMPLATE } from '../data/defaultGrades';
import {
  DEFAULT_BUKU_INDUK_SETTINGS,
  DEFAULT_LOGO_SMPN99,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_APP_USERS,
  DEFAULT_USER_PASSWORD,
  DEFAULT_MAPEL_CONFIG,
} from '../data/defaultSettings';

const STORAGE_KEY_STUDENTS = 'smpn99_buku_induk_students_v2';
const STORAGE_KEY_LOGS = 'smpn99_buku_induk_logs_v1';
const STORAGE_KEY_SETTINGS = 'smpn99_buku_induk_settings_v1';
const STORAGE_KEY_APPROVALS = 'smpn99_buku_induk_approvals_v1';
const SETTINGS_SCHEMA_FLAG = 'smpn99_settings_schema_v2';
const GRADES_SCHEMA_FLAG = 'smpn99_grades_schema_v2';

const INITIAL_APPROVALS: ApprovalRequest[] = [
  {
    id: 'apr-001',
    kategori: 'REVISI_NILAI',
    judul: 'Permohonan Revisi Nilai IPA Semester 3 (T.A. 2025/2026)',
    deskripsi:
      'Wali Kelas 7A/8A mengajukan penyesuaian nilai akhir Ilmu Pengetahuan Alam dari 84 menjadi 88 setelah validasi proyek praktikum laboratorium untuk arsip Buku Induk.',
    pemohonNama: 'Hj. Ratna Dewi, M.Pd.',
    pemohonEmail: 'ratna.dewi@guru.smp.belajar.id',
    pemohonRole: 'HOMEROOM_TEACHER',
    targetStudentId: 'std-99-001',
    targetStudentName: 'ADITYA PRATAMA NUGRAHA',
    status: 'PENDING',
    createdAt: '2026-11-11T08:45:00.000Z',
  },
  {
    id: 'apr-002',
    kategori: 'MUTASI_SISWA',
    judul: 'Persetujuan Pengesahan Surat Pindah / Mutasi Keluar',
    deskripsi:
      'Tata Usaha (TU) telah memverifikasi surat permohonan pindah orang tua ke SMP Negeri 5 Bandung dan memohon persetujuan final Super Admin sebelum penerbitan surat mutasi.',
    pemohonNama: 'Bambang Supriyanto, S.Sos.',
    pemohonEmail: 'bambang.tu@smpn99jakarta.sch.id',
    pemohonRole: 'ADMIN',
    targetStudentId: 'std-99-003',
    targetStudentName: 'BAGAS SAPUTRA WIJAYA',
    status: 'PENDING',
    createdAt: '2026-11-11T11:20:00.000Z',
  },
  {
    id: 'apr-003',
    kategori: 'PERUBAHAN_DATA',
    judul: 'Sinkronisasi Impor Legger Tahun Ajaran 2024/2025 & 2025/2026',
    deskripsi:
      'Operator mengajukan validasi penguncian data legger nilai Semester 1–4 angkatan masuk 2024 agar terintegrasi langsung ke Transkrip Buku Induk Siswa.',
    pemohonNama: 'Rizky Ramadhan, S.Kom.',
    pemohonEmail: 'operator.dapodik@smpn99jakarta.sch.id',
    pemohonRole: 'OPERATOR_TU',
    status: 'PENDING',
    createdAt: '2026-11-12T06:15:00.000Z',
  },
  {
    id: 'apr-004',
    kategori: 'RESET_PASSWORD',
    judul: 'Permintaan Reset Password Akun Wali Kelas 9A (Sri Wahyuni, S.Pd.)',
    deskripsi:
      'Wali Kelas 9A lupa kata sandi akses input rapor Semester 5 dan memohon reset password sementara melalui persetujuan Super Admin.',
    pemohonNama: 'Bambang Supriyanto, S.Sos.',
    pemohonEmail: 'bambang.tu@smpn99jakarta.sch.id',
    pemohonRole: 'ADMIN',
    targetUserId: 'usr-06',
    requestedNewPassword: 'smpn99reset',
    status: 'PENDING',
    createdAt: '2026-11-12T07:30:00.000Z',
  },
];

export const storageService = {
  getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STUDENTS);
      let list: Student[];
      if (!data) {
        list = INITIAL_STUDENTS.map((s) => ({
          ...s,
          riwayatNilai: s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024),
        }));
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(list));
        localStorage.setItem(GRADES_SCHEMA_FLAG, 'true');
        return list;
      }
      list = JSON.parse(data);
      const needsGradeMigration = !localStorage.getItem(GRADES_SCHEMA_FLAG);
      let modified = false;
      const verifiedList = list.map((s) => {
        if (!s.riwayatNilai || Object.keys(s.riwayatNilai).length === 0) {
          modified = true;
          return {
            ...s,
            riwayatNilai: generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024),
          };
        }
        if (needsGradeMigration && s.riwayatNilai[1]?.tahunPelajaran === '2022/2023') {
          modified = true;
          const freshDefaults = generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
          const updatedRiwayat: Record<number, SemesterGradesRecord> = { ...s.riwayatNilai };
          [1, 2, 3, 4, 5, 6].forEach((sem) => {
            if (updatedRiwayat[sem] && freshDefaults[sem]) {
              updatedRiwayat[sem] = {
                ...updatedRiwayat[sem],
                tahunPelajaran: freshDefaults[sem].tahunPelajaran,
                tanggalRapor: freshDefaults[sem].tanggalRapor,
              };
            }
          });
          return {
            ...s,
            riwayatNilai: updatedRiwayat,
          };
        }
        return s;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(verifiedList));
      }
      if (needsGradeMigration) {
        localStorage.setItem(GRADES_SCHEMA_FLAG, 'true');
      }
      return verifiedList;
    } catch (err) {
      console.error('Failed to get students from localStorage', err);
      return INITIAL_STUDENTS;
    }
  },

  updateStudentSemesterGrades(
    studentId: string,
    semesterNum: number,
    gradesData: SemesterGradesRecord,
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string } {
    const list = this.getStudents();
    const index = list.findIndex((s) => s.id === studentId);
    if (index === -1) {
      return { success: false, message: 'Data siswa tidak ditemukan.' };
    }

    const currentStudent = list[index];
    const updatedRiwayat = {
      ...(currentStudent.riwayatNilai || generateDefaultSemesterGrades(currentStudent.namaLengkap, currentStudent.nis, 2024)),
      [semesterNum]: gradesData,
    };

    list[index] = {
      ...currentStudent,
      riwayatNilai: updatedRiwayat,
      updatedAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    this.saveStudents(list);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'UPDATE_BIODATA',
      targetStudentId: studentId,
      studentName: currentStudent.namaLengkap,
      details: `Pembaruan Nilai Rapor Semester ${semesterNum} (${gradesData.kelas} - ${gradesData.semesterType}) oleh ${operator.name}`,
    });

    return { success: true, message: `Nilai Rapor Semester ${semesterNum} berhasil disimpan!` };
  },

  getStudentById(id: string): Student | undefined {
    const list = this.getStudents();
    return list.find((s) => s.id === id);
  },

  saveStudents(students: Student[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch (err) {
      console.error('Failed to save students to localStorage', err);
    }
  },

  addStudent(
    student: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string; student?: Student } {
    const list = this.getStudents();

    if (student.nisn && list.some((s) => s.nisn === student.nisn)) {
      return { success: false, message: `NISN ${student.nisn} sudah terdaftar pada siswa lain!` };
    }

    if (student.nis && list.some((s) => s.nis === student.nis)) {
      return { success: false, message: `Nomor Induk Siswa (NIS) ${student.nis} sudah digunakan!` };
    }

    const newStudent: Student = {
      ...student,
      riwayatNilai: student.riwayatNilai || generateDefaultSemesterGrades(student.namaLengkap, student.nis, 2024),
      id: `std-99-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    const updated = [newStudent, ...list];
    this.saveStudents(updated);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'TAMBAH_SISWA',
      targetStudentId: newStudent.id,
      studentName: newStudent.namaLengkap,
      details: `Registrasi siswa baru: ${newStudent.namaLengkap} (NIS: ${newStudent.nis}, NISN: ${newStudent.nisn}) di kelas ${newStudent.rombel}`,
    });

    return { success: true, message: 'Data siswa baru berhasil ditambahkan ke Buku Induk!', student: newStudent };
  },

  updateStudent(student: Student, operator: { name: string; email: string; role: UserRole }): { success: boolean; message: string } {
    const list = this.getStudents();
    const index = list.findIndex((s) => s.id === student.id);
    if (index === -1) {
      return { success: false, message: 'Data siswa tidak ditemukan.' };
    }

    const conflictNisn = list.find((s) => s.id !== student.id && s.nisn === student.nisn);
    if (conflictNisn) {
      return { success: false, message: `NISN ${student.nisn} sudah dipakai oleh siswa: ${conflictNisn.namaLengkap}` };
    }

    const conflictNis = list.find((s) => s.id !== student.id && s.nis === student.nis);
    if (conflictNis) {
      return { success: false, message: `NIS ${student.nis} sudah dipakai oleh siswa: ${conflictNis.namaLengkap}` };
    }

    list[index] = {
      ...student,
      updatedAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    this.saveStudents(list);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'UPDATE_BIODATA',
      targetStudentId: student.id,
      studentName: student.namaLengkap,
      details: `Pembaruan data biodata siswa ${student.namaLengkap} (NIS: ${student.nis})`,
    });

    return { success: true, message: 'Data siswa berhasil diperbarui.' };
  },

  deleteStudent(id: string, operator: { name: string; email: string; role: UserRole }): { success: boolean; message: string } {
    const list = this.getStudents();
    const student = list.find((s) => s.id === id);
    if (!student) {
      return { success: false, message: 'Siswa tidak ditemukan.' };
    }

    const filtered = list.filter((s) => s.id !== id);
    this.saveStudents(filtered);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'HAPUS_SISWA',
      targetStudentId: id,
      studentName: student.namaLengkap,
      details: `Penghapusan data siswa: ${student.namaLengkap} (NIS: ${student.nis})`,
    });

    return { success: true, message: `Data siswa ${student.namaLengkap} berhasil dihapus.` };
  },

  mutateStudent(
    studentId: string,
    mutationData: Omit<MutationRecord, 'id' | 'studentId'>,
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string } {
    const list = this.getStudents();
    const index = list.findIndex((s) => s.id === studentId);
    if (index === -1) {
      return { success: false, message: 'Siswa tidak ditemukan.' };
    }

    const student = list[index];
    const newStatus = mutationData.jenis === 'MUTASI_KELUAR' ? 'MUTASI_KELUAR' : mutationData.jenis === 'LULUS' ? 'LULUS' : 'AKTIF';

    const fullMutation: MutationRecord = {
      ...mutationData,
      id: `mut-${Date.now()}`,
      studentId: student.id,
    };

    list[index] = {
      ...student,
      status: newStatus,
      mutasi: fullMutation,
      updatedAt: new Date().toISOString(),
      updatedBy: operator.email,
    };

    this.saveStudents(list);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'MUTASI_SISWA',
      targetStudentId: student.id,
      studentName: student.namaLengkap,
      details: `Status ${student.namaLengkap} diubah menjadi ${newStatus}. Alasan: ${mutationData.alasan}. No. Surat: ${mutationData.noSurat}`,
    });

    return { success: true, message: `Mutasi/Kelulusan siswa ${student.namaLengkap} berhasil dicatat.` };
  },

  updateDocumentVerification(
    studentId: string,
    docId: string,
    newStatus: VerificationStatus,
    catatan: string,
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string } {
    const list = this.getStudents();
    const studentIndex = list.findIndex((s) => s.id === studentId);
    if (studentIndex === -1) return { success: false, message: 'Siswa tidak ditemukan.' };

    const student = list[studentIndex];
    const docIndex = student.dokumen.findIndex((d) => d.id === docId);
    if (docIndex === -1) return { success: false, message: 'Dokumen tidak ditemukan.' };

    student.dokumen[docIndex].statusVerifikasi = newStatus;
    if (catatan) {
      student.dokumen[docIndex].catatan = catatan;
    }
    student.updatedAt = new Date().toISOString();
    student.updatedBy = operator.email;

    list[studentIndex] = student;
    this.saveStudents(list);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'VERIFIKASI_BERKAS',
      targetStudentId: student.id,
      studentName: student.namaLengkap,
      details: `Verifikasi dokumen "${student.dokumen[docIndex].jenisDokumen}" diubah menjadi ${newStatus}.`,
    });

    return { success: true, message: 'Status verifikasi berkas berhasil diperbarui.' };
  },

  getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  addAuditLog(entry: AuditLogEntry): void {
    const logs = this.getAuditLogs();
    const updated = [entry, ...logs].slice(0, 300);
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save audit log', err);
    }
  },

  resetData(): void {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(INITIAL_APPROVALS));
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  },

  getSettings(): BukuIndukSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!data) {
        localStorage.setItem(SETTINGS_SCHEMA_FLAG, 'true');
        return DEFAULT_BUKU_INDUK_SETTINGS;
      }
      const parsed = JSON.parse(data);
      const isMigrated = localStorage.getItem(SETTINGS_SCHEMA_FLAG) === 'true';

      // Deep merge role permissions safely across all roles (including SUPER_ADMIN)
      const mergedRolePermissions: Record<UserRole, any> = {
        SUPER_ADMIN: {
          ...DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN,
          ...(parsed.hakAksesPeran?.SUPER_ADMIN || {}),
        },
        ADMIN: {
          ...DEFAULT_ROLE_PERMISSIONS.ADMIN,
          ...(parsed.hakAksesPeran?.ADMIN || {}),
        },
        OPERATOR_TU: {
          ...DEFAULT_ROLE_PERMISSIONS.OPERATOR_TU,
          ...(parsed.hakAksesPeran?.OPERATOR_TU || {}),
        },
        HOMEROOM_TEACHER: {
          ...DEFAULT_ROLE_PERMISSIONS.HOMEROOM_TEACHER,
          ...(parsed.hakAksesPeran?.HOMEROOM_TEACHER || {}),
        },
        VERIFIER: {
          ...DEFAULT_ROLE_PERMISSIONS.VERIFIER,
          ...(parsed.hakAksesPeran?.VERIFIER || {}),
        },
        KEPALA_SEKOLAH: {
          ...DEFAULT_ROLE_PERMISSIONS.KEPALA_SEKOLAH,
          ...(parsed.hakAksesPeran?.KEPALA_SEKOLAH || {}),
        },
      };

      const rawUsers: any[] =
        Array.isArray(parsed.pengguna) && parsed.pengguna.length > 0
          ? parsed.pengguna
          : DEFAULT_APP_USERS;

      let logoSekolahUrl = parsed.logoSekolahUrl;
      let headerKopKontak = parsed.headerKopKontak || DEFAULT_BUKU_INDUK_SETTINGS.headerKopKontak;
      let tahunAjaranAktif = parsed.tahunAjaranAktif || DEFAULT_BUKU_INDUK_SETTINGS.tahunAjaranAktif;
      let semesterAktif = parsed.semesterAktif || DEFAULT_BUKU_INDUK_SETTINGS.semesterAktif;

      if (!isMigrated) {
        // Migrate old SVG logo, old NPSN 20102604, and old 2024/2025 academic year
        if (!logoSekolahUrl || logoSekolahUrl.startsWith('data:image/svg+xml')) {
          logoSekolahUrl = DEFAULT_LOGO_SMPN99;
        }
        if (headerKopKontak.includes('20102604')) {
          headerKopKontak = headerKopKontak.replace(/20102604/g, '20103565');
        }
        if (tahunAjaranAktif === '2024/2025') {
          tahunAjaranAktif = '2026/2027';
          semesterAktif = 'Ganjil';
        }
      }

      // Deduplicate users safely by id and email (fixes any duplicate usr-03 / usr-05 from prior migration)
      const defaultById = new Map(DEFAULT_APP_USERS.map((u) => [u.id, u]));
      const seenIds = new Set<string>();
      const seenEmails = new Set<string>();
      const cleanedUsers: any[] = [];
      let hadUserCleanup = false;

      // Prefer canonical DEFAULT_APP_USERS entries if an id/email collides with an older seed version
      rawUsers.forEach((u) => {
        if (!u || !u.id || !u.email) {
          hadUserCleanup = true;
          return;
        }
        const emailLower = String(u.email).toLowerCase();
        if (seenIds.has(u.id)) {
          hadUserCleanup = true;
          // If the later item matches the canonical v2 default for this ID, swap it in
          const canonical = defaultById.get(u.id);
          if (canonical && canonical.email.toLowerCase() === emailLower) {
            const existingIdx = cleanedUsers.findIndex((x) => x.id === u.id);
            if (existingIdx !== -1) {
              cleanedUsers[existingIdx] = u;
            }
          }
          return;
        }
        if (seenEmails.has(emailLower)) {
          hadUserCleanup = true;
          return;
        }
        seenIds.add(u.id);
        seenEmails.add(emailLower);

        if (u.id === 'usr-01' || emailLower === 'antoniuspurnomo61@guru.smp.belajar.id') {
          cleanedUsers.push({
            ...u,
            role: 'SUPER_ADMIN',
            jabatan: 'Super Admin & Penanggung Jawab Buku Induk',
            aktif: true,
          });
        } else {
          cleanedUsers.push(u);
        }
      });

      // Ensure all default role sample accounts exist without duplicating ID or email
      DEFAULT_APP_USERS.forEach((defUser) => {
        const emailLower = defUser.email.toLowerCase();
        if (!seenIds.has(defUser.id) && !seenEmails.has(emailLower)) {
          cleanedUsers.push(defUser);
          seenIds.add(defUser.id);
          seenEmails.add(emailLower);
          hadUserCleanup = true;
        }
      });

      const mergedUsers = cleanedUsers;

      const result: BukuIndukSettings = {
        ...DEFAULT_BUKU_INDUK_SETTINGS,
        ...parsed,
        tahunAjaranAktif,
        semesterAktif,
        headerKopKontak,
        logoSekolahUrl: logoSekolahUrl || DEFAULT_LOGO_SMPN99,
        tataLetak: {
          ...DEFAULT_BUKU_INDUK_SETTINGS.tataLetak,
          ...(parsed.tataLetak || {}),
        },
        tandaTangan: {
          kiri: {
            ...DEFAULT_BUKU_INDUK_SETTINGS.tandaTangan.kiri,
            ...(parsed.tandaTangan?.kiri || {}),
          },
          kanan: {
            ...DEFAULT_BUKU_INDUK_SETTINGS.tandaTangan.kanan,
            ...(parsed.tandaTangan?.kanan || {}),
          },
          tampilkanTengahPengawas:
            parsed.tandaTangan?.tampilkanTengahPengawas ??
            DEFAULT_BUKU_INDUK_SETTINGS.tandaTangan.tampilkanTengahPengawas,
        },
        daftarWaliKelas:
          Array.isArray(parsed.daftarWaliKelas) && parsed.daftarWaliKelas.length > 0
            ? parsed.daftarWaliKelas
            : DEFAULT_BUKU_INDUK_SETTINGS.daftarWaliKelas,
        pengaturanMapel:
          Array.isArray(parsed.pengaturanMapel) && parsed.pengaturanMapel.length > 0
            ? parsed.pengaturanMapel
            : DEFAULT_MAPEL_CONFIG,
        pengguna: mergedUsers,
        hakAksesPeran: mergedRolePermissions,
      };

      if (!isMigrated || hadUserCleanup) {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(result));
        localStorage.setItem(SETTINGS_SCHEMA_FLAG, 'true');
      }

      return result;
    } catch (err) {
      console.error('Failed to get settings from localStorage', err);
      return DEFAULT_BUKU_INDUK_SETTINGS;
    }
  },

  saveSettings(settings: BukuIndukSettings, operator?: { name: string; email: string; role: UserRole }): void {
    try {
      const uniqueIds = new Set<string>();
      const uniquePengguna = (settings.pengguna || []).filter((u) => {
        if (!u?.id || uniqueIds.has(u.id)) return false;
        uniqueIds.add(u.id);
        return true;
      });
      const cleanSettings: BukuIndukSettings = {
        ...settings,
        pengguna: uniquePengguna,
      };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(cleanSettings));
      localStorage.setItem(SETTINGS_SCHEMA_FLAG, 'true');
      if (operator) {
        this.addAuditLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          operatorEmail: operator.email,
          operatorName: operator.name,
          role: operator.role,
          action: 'UPDATE_BIODATA',
          details: `Pembaruan Konfigurasi Pengaturan, Akun, atau Hak Akses oleh ${operator.name}`,
        });
      }
    } catch (err) {
      console.error('Failed to save settings to localStorage', err);
    }
  },

  // =========================================================
  // APPROVAL SUPER ADMIN WORKFLOW
  // =========================================================
  getApprovals(): ApprovalRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_APPROVALS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(INITIAL_APPROVALS));
        return INITIAL_APPROVALS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_APPROVALS;
    }
  },

  saveApprovals(list: ApprovalRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(list));
    } catch (err) {
      console.error('Failed to save approvals', err);
    }
  },

  createApprovalRequest(
    payload: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>
  ): ApprovalRequest {
    const list = this.getApprovals();
    const created: ApprovalRequest = {
      ...payload,
      id: `apr-${Date.now().toString(36)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    const updated = [created, ...list];
    this.saveApprovals(updated);

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: payload.pemohonEmail,
      operatorName: payload.pemohonNama,
      role: payload.pemohonRole,
      action: 'APPROVAL_SUPER_ADMIN',
      targetStudentId: payload.targetStudentId,
      studentName: payload.targetStudentName,
      details: `Pengajuan persetujuan (${payload.kategori}): "${payload.judul}" menunggu review Super Admin.`,
    });

    return created;
  },

  reviewApprovalRequest(
    approvalId: string,
    decision: Exclude<ApprovalStatus, 'PENDING'>,
    reviewer: { name: string; email: string; role: UserRole },
    catatanReviewer?: string
  ): { success: boolean; message: string; updatedSettings?: BukuIndukSettings } {
    const list = this.getApprovals();
    const idx = list.findIndex((a) => a.id === approvalId);
    if (idx === -1) {
      return { success: false, message: 'Permintaan approval tidak ditemukan.' };
    }

    const target = list[idx];
    const reviewed: ApprovalRequest = {
      ...target,
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer.name,
      catatanReviewer: catatanReviewer?.trim() || (decision === 'APPROVED' ? 'Disetujui oleh Super Admin' : 'Ditolak oleh Super Admin'),
    };
    list[idx] = reviewed;
    this.saveApprovals(list);

    let updatedSettings: BukuIndukSettings | undefined;
    // Execute side effect when approving account activation or password reset
    if (decision === 'APPROVED' && target.kategori === 'AKTIVASI_AKUN' && target.targetUserId) {
      const currentSettings = this.getSettings();
      updatedSettings = {
        ...currentSettings,
        pengguna: currentSettings.pengguna.map((u) =>
          u.id === target.targetUserId ? { ...u, aktif: true } : u
        ),
      };
      this.saveSettings(updatedSettings);
    } else if (decision === 'APPROVED' && target.kategori === 'RESET_PASSWORD' && target.targetUserId) {
      const currentSettings = this.getSettings();
      const newTempPassword = target.requestedNewPassword || 'smpn99reset';
      updatedSettings = {
        ...currentSettings,
        pengguna: currentSettings.pengguna.map((u) =>
          u.id === target.targetUserId
            ? { ...u, password: newTempPassword, mustChangePassword: true }
            : u
        ),
      };
      this.saveSettings(updatedSettings);
      this.addAuditLog({
        id: `log-${Date.now() + 1}`,
        timestamp: new Date().toISOString(),
        operatorEmail: reviewer.email,
        operatorName: reviewer.name,
        role: reviewer.role,
        action: 'RESET_PASSWORD',
        details: `Super Admin (${reviewer.name}) menyetujui & mereset password akun target (${target.judul}) menjadi password sementara.`,
      });
    }

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: reviewer.email,
      operatorName: reviewer.name,
      role: reviewer.role,
      action: 'APPROVAL_SUPER_ADMIN',
      targetStudentId: target.targetStudentId,
      studentName: target.targetStudentName,
      details: `Super Admin (${reviewer.name}) ${decision === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'} pengajuan: "${target.judul}". Catatan: ${reviewed.catatanReviewer}`,
    });

    return {
      success: true,
      message:
        decision === 'APPROVED'
          ? `Pengajuan "${target.judul}" berhasil disetujui.`
          : `Pengajuan "${target.judul}" telah ditolak.`,
      updatedSettings,
    };
  },

  // =========================================================
  // PROFIL PENGGUNA, GANTI PASSWORD & RESET PASSWORD ROLE LAIN
  // =========================================================
  updateUserProfile(
    userId: string,
    updates: { nama: string; nip?: string; jabatan?: string },
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string; updatedSettings?: BukuIndukSettings } {
    const cleanName = updates.nama.trim();
    if (!cleanName) {
      return { success: false, message: 'Nama lengkap tidak boleh kosong.' };
    }

    const currentSettings = this.getSettings();
    const targetUser = currentSettings.pengguna.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Data akun pengguna tidak ditemukan.' };
    }

    const updatedSettings: BukuIndukSettings = {
      ...currentSettings,
      pengguna: currentSettings.pengguna.map((u) =>
        u.id === userId
          ? {
              ...u,
              nama: cleanName,
              nip: updates.nip !== undefined ? updates.nip.trim() : u.nip,
              jabatan: updates.jabatan?.trim() ? updates.jabatan.trim() : u.jabatan,
            }
          : u
      ),
    };

    this.saveSettings(updatedSettings);
    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: cleanName,
      role: operator.role,
      action: 'UPDATE_PROFIL',
      details: `Pembaruan profil akun oleh ${operator.name} -> Nama: "${cleanName}"${updates.nip ? `, NIP: ${updates.nip.trim()}` : ''}.`,
    });

    return {
      success: true,
      message: `Profil "${cleanName}" berhasil diperbarui!`,
      updatedSettings,
    };
  },

  changeUserPassword(
    userId: string,
    payload: { currentPassword: string; newPassword: string },
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string; updatedSettings?: BukuIndukSettings } {
    const currentSettings = this.getSettings();
    const targetUser = currentSettings.pengguna.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    const expectedCurrent = targetUser.password || DEFAULT_USER_PASSWORD;
    if (payload.currentPassword !== expectedCurrent) {
      return {
        success: false,
        message: 'Password saat ini tidak sesuai. (Password awal bawaan: smpn992026)',
      };
    }

    if (!payload.newPassword || payload.newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter.' };
    }

    const updatedSettings: BukuIndukSettings = {
      ...currentSettings,
      pengguna: currentSettings.pengguna.map((u) =>
        u.id === userId
          ? { ...u, password: payload.newPassword, mustChangePassword: false }
          : u
      ),
    };

    this.saveSettings(updatedSettings);
    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'RESET_PASSWORD',
      details: `${operator.name} (${operator.role}) mengganti kata sandi akun pribadinya.`,
    });

    return {
      success: true,
      message: 'Password akun berhasil diubah!',
      updatedSettings,
    };
  },

  resetOtherUserPassword(
    targetUserId: string,
    newTempPassword: string,
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; message: string; updatedSettings?: BukuIndukSettings } {
    if (!newTempPassword || newTempPassword.length < 6) {
      return { success: false, message: 'Password reset minimal 6 karakter.' };
    }
    const currentSettings = this.getSettings();
    const targetUser = currentSettings.pengguna.find((u) => u.id === targetUserId);
    if (!targetUser) {
      return { success: false, message: 'Akun target tidak ditemukan.' };
    }

    const updatedSettings: BukuIndukSettings = {
      ...currentSettings,
      pengguna: currentSettings.pengguna.map((u) =>
        u.id === targetUserId
          ? { ...u, password: newTempPassword, mustChangePassword: true }
          : u
      ),
    };

    this.saveSettings(updatedSettings);
    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'RESET_PASSWORD',
      details: `Super Admin (${operator.name}) mereset langsung password untuk ${targetUser.nama} (${targetUser.role}).`,
    });

    return {
      success: true,
      message: `Password untuk ${targetUser.nama} berhasil direset ke "${newTempPassword}".`,
      updatedSettings,
    };
  },

  registerPendingUser(payload: {
    nama: string;
    nip?: string;
    email: string;
    password: string;
    role: Exclude<UserRole, 'SUPER_ADMIN'>;
    jabatan?: string;
    rombelBinaan?: string;
  }): {
    success: boolean;
    message: string;
    updatedSettings?: BukuIndukSettings;
    createdUser?: AppUser;
  } {
    const cleanName = payload.nama.trim();
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPassword = payload.password;

    if (!cleanName) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Masukkan alamat email yang valid.' };
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      return { success: false, message: 'Password minimal 6 karakter.' };
    }

    const currentSettings = this.getSettings();
    const existing = (currentSettings.pengguna || []).find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return {
        success: false,
        message: existing.aktif
          ? 'Email ini sudah terdaftar sebagai akun aktif. Silakan masuk melalui form Login.'
          : 'Email ini sudah didaftarkan dan masih menunggu persetujuan (approval) Super Admin.',
      };
    }

    const roleTitles: Record<Exclude<UserRole, 'SUPER_ADMIN'>, string> = {
      ADMIN: 'Tata Usaha (TU)',
      OPERATOR_TU: 'Operator Dapodik & Legger',
      HOMEROOM_TEACHER: 'Wali Kelas',
      VERIFIER: 'Verifikator Berkas',
      KEPALA_SEKOLAH: 'Kepala Sekolah',
    };

    const roleLabel = roleTitles[payload.role] || payload.role;
    const rombelClean =
      payload.role === 'HOMEROOM_TEACHER' && payload.rombelBinaan?.trim()
        ? payload.rombelBinaan.trim().toUpperCase()
        : undefined;

    const createdUser: AppUser = {
      id: `usr-${Date.now().toString(36)}`,
      nama: cleanName,
      nip: payload.nip?.trim() || undefined,
      email: cleanEmail,
      password: cleanPassword,
      role: payload.role,
      jabatan:
        payload.jabatan?.trim() ||
        (rombelClean ? `Wali Kelas ${rombelClean}` : roleLabel),
      rombelBinaan: rombelClean,
      aktif: false,
    };

    const updatedSettings: BukuIndukSettings = {
      ...currentSettings,
      pengguna: [...(currentSettings.pengguna || []), createdUser],
    };

    this.saveSettings(updatedSettings);

    this.createApprovalRequest({
      kategori: 'AKTIVASI_AKUN',
      judul: `Aktivasi Akun Baru (${roleLabel}): ${cleanName}`,
      deskripsi: `${cleanName} (${cleanEmail}) mendaftarkan akun dari halaman login dengan permintaan akses role ${roleLabel}${
        rombelClean ? ` untuk Rombel ${rombelClean}` : ''
      }. Menunggu Super Admin menyetujui (accept) akun ini agar dapat masuk ke sistem.`,
      pemohonNama: cleanName,
      pemohonEmail: cleanEmail,
      pemohonRole: payload.role,
      targetUserId: createdUser.id,
    });

    return {
      success: true,
      message:
        'Pendaftaran akun berhasil dikirim! Menunggu persetujuan (approval) Super Admin sebelum dapat digunakan untuk login.',
      updatedSettings,
      createdUser,
    };
  },

  // =========================================================
  // LEGGER NILAI TAHUN AJARAN SEBELUMNYA (SEMESTER 1 S/D 6)
  // =========================================================
  exportLeggerCsv(
    students: Student[],
    tahunPelajaranFilter: string = 'ALL',
    semesterNum?: number
  ): string {
    const subjectNames = STANDARD_SUBJECTS_TEMPLATE.map((m) => m.nama);
    const headers = [
      'No',
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Rombel Saat Ini',
      'Semester',
      'Tahun Pelajaran',
      'Kelas Rapor',
      ...subjectNames,
      'Jumlah Nilai',
      'Rata-Rata',
      'Sakit',
      'Izin',
      'Tanpa Keterangan',
    ];

    const rows: string[][] = [];
    let no = 1;

    students.forEach((s) => {
      const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
      const semNums = semesterNum ? [semesterNum] : [1, 2, 3, 4, 5, 6];

      semNums.forEach((sem) => {
        const rec = riwayat[sem];
        if (!rec) return;
        if (tahunPelajaranFilter !== 'ALL' && rec.tahunPelajaran !== tahunPelajaranFilter) return;

        const mapelScores = subjectNames.map((nama) => {
          const found = rec.mataPelajaran.find((m) => m.nama === nama);
          return found ? String(found.nilaiAkhir) : '';
        });

        const numericScores = rec.mataPelajaran.map((m) => m.nilaiAkhir || 0);
        const total = numericScores.reduce((a, b) => a + b, 0);
        const avg = numericScores.length > 0 ? (total / numericScores.length).toFixed(1) : '0.0';

        rows.push([
          String(no++),
          `"${s.nis}"`,
          `"${s.nisn}"`,
          `"${s.namaLengkap.replace(/"/g, '""')}"`,
          `"${s.rombel}"`,
          `Sem ${sem} (${rec.semesterType})`,
          `"${rec.tahunPelajaran}"`,
          `"${rec.kelas}"`,
          ...mapelScores,
          String(total),
          avg,
          String(rec.ketidakhadiran?.sakit ?? 0),
          String(rec.ketidakhadiran?.izin ?? 0),
          String(rec.ketidakhadiran?.tanpaKeterangan ?? 0),
        ]);
      });
    });

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  exportLeggerRekap6SemesterCsv(students: Student[]): string {
    const subjectNames = STANDARD_SUBJECTS_TEMPLATE.map((m) => m.nama);
    const dynamicMapelHeaders: string[] = [];
    subjectNames.forEach((m) => {
      for (let sem = 1; sem <= 6; sem++) {
        dynamicMapelHeaders.push(`"${m} (S${sem})"`);
      }
    });

    const headers = [
      'No',
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Rombel',
      'Tahun Masuk',
      'Rata Sem 1',
      'Rata Sem 2',
      'Rata Sem 3',
      'Rata Sem 4',
      'Rata Sem 5',
      'Rata Sem 6',
      'Rata-Rata Akhir (S1-S6)',
      ...dynamicMapelHeaders,
    ];

    const rows: string[][] = students.map((s, idx) => {
      const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
      const semAvgs: string[] = [];
      const numericSemAvgs: number[] = [];

      for (let sem = 1; sem <= 6; sem++) {
        const list = riwayat[sem]?.mataPelajaran || [];
        if (list.length > 0) {
          const avg = list.reduce((a, b) => a + (b.nilaiAkhir || 0), 0) / list.length;
          semAvgs.push(avg.toFixed(1));
          numericSemAvgs.push(avg);
        } else {
          semAvgs.push('-');
        }
      }

      const grandAvg =
        numericSemAvgs.length > 0
          ? (numericSemAvgs.reduce((a, b) => a + b, 0) / numericSemAvgs.length).toFixed(1)
          : '-';

      const mapelAllSemScores: string[] = [];
      subjectNames.forEach((mNama) => {
        for (let sem = 1; sem <= 6; sem++) {
          const found = riwayat[sem]?.mataPelajaran.find((m) => m.nama === mNama);
          mapelAllSemScores.push(found ? String(found.nilaiAkhir) : '');
        }
      });

      return [
        String(idx + 1),
        `"${s.nis}"`,
        `"${s.nisn}"`,
        `"${s.namaLengkap.replace(/"/g, '""')}"`,
        `"${s.rombel}"`,
        `"${s.tahunAjaranMasuk}"`,
        ...semAvgs,
        grandAvg,
        ...mapelAllSemScores,
      ];
    });

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  importLeggerRows(
    rows: Array<{
      nis: string;
      nisn: string;
      semesterNumber: number;
      tahunPelajaran: string;
      kelas?: string;
      scores: Record<string, number>;
      sakit?: number;
      izin?: number;
      alpa?: number;
    }>,
    operator: { name: string; email: string; role: UserRole }
  ): { success: boolean; updatedCount: number; message: string } {
    const list = this.getStudents();
    let updatedCount = 0;

    rows.forEach((row) => {
      const idx = list.findIndex(
        (s) => (row.nis && s.nis === row.nis) || (row.nisn && s.nisn === row.nisn)
      );
      if (idx === -1) return;

      const student = list[idx];
      const existingRiwayat =
        student.riwayatNilai || generateDefaultSemesterGrades(student.namaLengkap, student.nis, 2024);
      const baseSem = existingRiwayat[row.semesterNumber] || generateDefaultSemesterGrades(student.namaLengkap, student.nis, 2024)[row.semesterNumber];
      if (!baseSem) return;

      const updatedMapel = baseSem.mataPelajaran.map((m) => {
        const importedScore = row.scores[m.nama];
        return typeof importedScore === 'number' && !Number.isNaN(importedScore)
          ? { ...m, nilaiAkhir: Math.max(0, Math.min(100, Math.round(importedScore))) }
          : m;
      });

      list[idx] = {
        ...student,
        riwayatNilai: {
          ...existingRiwayat,
          [row.semesterNumber]: {
            ...baseSem,
            tahunPelajaran: row.tahunPelajaran || baseSem.tahunPelajaran,
            kelas: row.kelas || baseSem.kelas,
            mataPelajaran: updatedMapel,
            ketidakhadiran: {
              sakit: row.sakit ?? baseSem.ketidakhadiran.sakit,
              izin: row.izin ?? baseSem.ketidakhadiran.izin,
              tanpaKeterangan: row.alpa ?? baseSem.ketidakhadiran.tanpaKeterangan,
            },
          },
        },
        updatedAt: new Date().toISOString(),
        updatedBy: operator.email,
      };
      updatedCount++;
    });

    if (updatedCount > 0) {
      this.saveStudents(list);
      this.addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operatorEmail: operator.email,
        operatorName: operator.name,
        role: operator.role,
        action: 'IMPOR_LEGGER',
        details: `Impor Legger Nilai Tahun Ajaran sebelumnya berhasil memperbarui ${updatedCount} catatan rapor siswa.`,
      });
    }

    return {
      success: updatedCount > 0,
      updatedCount,
      message:
        updatedCount > 0
          ? `Berhasil mengimpor & memperbarui ${updatedCount} baris legger nilai ke Buku Induk!`
          : 'Tidak ada data NIS/NISN yang cocok untuk diperbarui.',
    };
  },

  // Export data to CSV format
  exportToCsv(students: Student[]): string {
    const headers = [
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Nama Panggilan',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Agama',
      'Status Siswa',
      'Tingkat',
      'Rombel',
      'Tahun Ajaran',
      'Nama Ayah',
      'Pekerjaan Ayah',
      'No HP Ayah',
      'Nama Ibu',
      'Pekerjaan Ibu',
      'No HP Ibu',
      'Alamat Jalan',
      'Kelurahan',
      'Kecamatan',
      'Kota',
      'Asal SD',
      'Jalur Masuk',
    ];

    const rows = students.map((s) => [
      `"${s.nis}"`,
      `"${s.nisn}"`,
      `"${s.namaLengkap.replace(/"/g, '""')}"`,
      `"${s.namaPanggilan}"`,
      `"${s.jenisKelamin}"`,
      `"${s.tempatLahir}"`,
      `"${s.tanggalLahir}"`,
      `"${s.agama}"`,
      `"${s.status}"`,
      `"${s.tingkat}"`,
      `"${s.rombel}"`,
      `"${s.tahunAjaranSekarang}"`,
      `"${s.ayah?.nama?.replace(/"/g, '""') || ''}"`,
      `"${s.ayah?.pekerjaan || ''}"`,
      `"${s.ayah?.noHp || ''}"`,
      `"${s.ibu?.nama?.replace(/"/g, '""') || ''}"`,
      `"${s.ibu?.pekerjaan || ''}"`,
      `"${s.ibu?.noHp || ''}"`,
      `"${s.alamatJalan?.replace(/"/g, '""') || ''}"`,
      `"${s.kelurahan || ''}"`,
      `"${s.kecamatan || ''}"`,
      `"${s.kotaKabupaten || ''}"`,
      `"${s.sekolahAsal?.namaSd?.replace(/"/g, '""') || ''}"`,
      `"${s.penerimaan?.jalurPenerimaan || ''}"`,
    ]);

    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  },

  // Batch Upsert dari Impor Excel (.xlsx) / CSV
  upsertImportedStudents(
    items: Array<{
      student: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>;
      mode: 'NEW' | 'UPDATE';
    }>,
    operator: { name: string; email: string; role: UserRole }
  ): { insertedCount: number; updatedCount: number; skippedCount: number } {
    const list = [...this.getStudents()];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const now = new Date().toISOString();

    items.forEach(({ student, mode }, index) => {
      const existingIdx = list.findIndex(
        (s) =>
          (student.nisn && s.nisn === student.nisn) ||
          (student.nis && s.nis === student.nis)
      );

      if (mode === 'UPDATE' && existingIdx !== -1) {
        const existing = list[existingIdx];
        list[existingIdx] = {
          ...existing,
          nis: student.nis || existing.nis,
          nisn: student.nisn || existing.nisn,
          nik: student.nik || existing.nik,
          namaLengkap: student.namaLengkap || existing.namaLengkap,
          namaPanggilan: student.namaPanggilan || existing.namaPanggilan,
          jenisKelamin: student.jenisKelamin || existing.jenisKelamin,
          tempatLahir: student.tempatLahir || existing.tempatLahir,
          tanggalLahir: student.tanggalLahir || existing.tanggalLahir,
          agama: student.agama || existing.agama,
          kewarganegaraan: student.kewarganegaraan || existing.kewarganegaraan,
          status: student.status || existing.status,
          tingkat: student.tingkat || existing.tingkat,
          rombel: student.rombel || existing.rombel,
          tahunAjaranSekarang: student.tahunAjaranSekarang || existing.tahunAjaranSekarang,
          alamatJalan: student.alamatJalan || existing.alamatJalan,
          rt: student.rt || existing.rt,
          rw: student.rw || existing.rw,
          kelurahan: student.kelurahan || existing.kelurahan,
          kecamatan: student.kecamatan || existing.kecamatan,
          kotaKabupaten: student.kotaKabupaten || existing.kotaKabupaten,
          kodePos: student.kodePos || existing.kodePos,
          noHpSiswa: student.noHpSiswa || existing.noHpSiswa,
          ayah: {
            ...existing.ayah,
            ...student.ayah,
            nama: student.ayah?.nama || existing.ayah.nama,
            pekerjaan: student.ayah?.pekerjaan || existing.ayah.pekerjaan,
            noHp: student.ayah?.noHp || existing.ayah.noHp,
          },
          ibu: {
            ...existing.ibu,
            ...student.ibu,
            nama: student.ibu?.nama || existing.ibu.nama,
            pekerjaan: student.ibu?.pekerjaan || existing.ibu.pekerjaan,
            noHp: student.ibu?.noHp || existing.ibu.noHp,
          },
          sekolahAsal: {
            ...existing.sekolahAsal,
            ...student.sekolahAsal,
            namaSd: student.sekolahAsal?.namaSd || existing.sekolahAsal.namaSd,
          },
          penerimaan: {
            ...existing.penerimaan,
            ...student.penerimaan,
          },
          updatedAt: now,
          updatedBy: operator.email,
        };
        updatedCount++;
      } else if (existingIdx === -1) {
        const startYr = parseInt((student.tahunAjaranMasuk || '2024').slice(0, 4), 10) || 2024;
        const newStudent: Student = {
          ...student,
          riwayatNilai:
            student.riwayatNilai ||
            generateDefaultSemesterGrades(student.namaLengkap, student.nis, startYr),
          id: `std-99-${Date.now().toString(36)}-${index.toString(36)}-${Math.random()
            .toString(36)
            .substring(2, 5)}`,
          createdAt: now,
          updatedAt: now,
          updatedBy: operator.email,
        };
        list.unshift(newStudent);
        insertedCount++;
      } else {
        skippedCount++;
      }
    });

    if (insertedCount > 0 || updatedCount > 0) {
      this.saveStudents(list);
      this.addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: now,
        operatorEmail: operator.email,
        operatorName: operator.name,
        role: operator.role,
        action: 'IMPOR_DATA',
        details: `Impor massal Excel/CSV: ${insertedCount} siswa baru ditambahkan, ${updatedCount} data siswa diperbarui (${skippedCount} dilewati).`,
      });
    }

    return { insertedCount, updatedCount, skippedCount };
  },
};
