import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  FileCheck,
  ArrowRight,
  Printer,
  UploadCloud,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  XCircle,
  FileSpreadsheet,
  Send,
  UserCog,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  User,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronUp,
  PieChart as PieChartIcon,
  FileDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Student,
  AuditLogEntry,
  BukuIndukSettings,
  AppUser,
  UserRole,
  RolePermissions,
  ApprovalRequest,
  ApprovalCategory,
} from '../types';
import { SMPN99_INFO } from '../data/mockData';
import { DEFAULT_LOGO_SMPN99, DEFAULT_USER_PASSWORD } from '../data/defaultSettings';

interface DashboardViewProps {
  students: Student[];
  auditLogs: AuditLogEntry[];
  onNavigateTab: (tab: string) => void;
  onSelectStudent: (student: Student) => void;
  onOpenAddModal: () => void;
  settings?: BukuIndukSettings;
  activeUser?: AppUser;
  activeRole?: UserRole;
  permissions?: RolePermissions;
  approvals?: ApprovalRequest[];
  onApproveRequest?: (id: string, note?: string) => void;
  onRejectRequest?: (id: string, note?: string) => void;
  onCreateApprovalRequest?: (payload: {
    kategori: ApprovalCategory;
    judul: string;
    deskripsi: string;
    targetStudentId?: string;
    targetStudentName?: string;
    targetUserId?: string;
    requestedNewPassword?: string;
  }) => void;
  onUpdateProfile?: (updates: { nama: string; nip?: string; jabatan?: string }) => {
    success: boolean;
    message: string;
  };
  onChangePassword?: (payload: { currentPassword: string; newPassword: string }) => {
    success: boolean;
    message: string;
  };
  onAdminResetOtherPassword?: (
    targetUserId: string,
    newTempPassword: string
  ) => { success: boolean; message: string };
  onOpenRecapPdf?: () => void;
  onQuickDownloadRecapPdf?: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Tata Usaha (TU)',
  OPERATOR_TU: 'Operator',
  HOMEROOM_TEACHER: 'Wali Kelas',
  VERIFIER: 'Verifikator',
  KEPALA_SEKOLAH: 'Kepala Sekolah',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  auditLogs,
  onNavigateTab,
  onSelectStudent,
  onOpenAddModal,
  settings,
  activeUser,
  activeRole = 'SUPER_ADMIN',
  permissions,
  approvals = [],
  onApproveRequest,
  onRejectRequest,
  onCreateApprovalRequest,
  onUpdateProfile,
  onChangePassword,
  onAdminResetOtherPassword,
  onOpenRecapPdf,
  onQuickDownloadRecapPdf,
}) => {
  const total = students.length;
  const aktif = students.filter((s) => s.status === 'AKTIF').length;
  const mutasi = students.filter((s) => s.status === 'MUTASI_KELUAR').length;
  const lulus = students.filter((s) => s.status === 'LULUS').length;

  const totalBoys = students.filter((s) => s.jenisKelamin === 'L').length;
  const totalGirls = students.filter((s) => s.jenisKelamin === 'P').length;

  const kelas7 = students.filter((s) => s.tingkat === 'VII' && s.status === 'AKTIF').length;
  const kelas8 = students.filter((s) => s.tingkat === 'VIII' && s.status === 'AKTIF').length;
  const kelas9 = students.filter((s) => s.tingkat === 'IX' && s.status === 'AKTIF').length;

  // Kelengkapan Berkas
  const completeDocsCount = students.filter(
    (s) => s.dokumen && s.dokumen.length >= 3 && s.dokumen.every((d) => d.statusVerifikasi === 'TERVERIFIKASI')
  ).length;
  const completenessRate = total > 0 ? Math.round((completeDocsCount / total) * 100) : 0;

  // Jalur Penerimaan count
  const jalurStats: Record<string, number> = {};
  students.forEach((s) => {
    const jalur = s.penerimaan?.jalurPenerimaan || 'Zonasi';
    jalurStats[jalur] = (jalurStats[jalur] || 0) + 1;
  });

  // Agama count
  const agamaStats: Record<string, number> = {};
  students.forEach((s) => {
    const ag = s.agama || 'Islam';
    agamaStats[ag] = (agamaStats[ag] || 0) + 1;
  });

  // UI Interactive States
  const [chartViewMode, setChartViewMode] = useState<'tingkat' | 'rombel'>('tingkat');
  const [approvalTab, setApprovalTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [isNewReqOpen, setIsNewReqOpen] = useState<boolean>(false);
  const [newReq, setNewReq] = useState<{
    kategori: ApprovalCategory;
    judul: string;
    deskripsi: string;
    targetStudentId: string;
  }>({
    kategori: 'REVISI_NILAI',
    judul: '',
    deskripsi: '',
    targetStudentId: '',
  });

  const canApprove = Boolean(permissions?.approvePermohonan);
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const historyApprovals = approvals.filter((a) => a.status !== 'PENDING');
  const activeTahun = settings?.tahunAjaranAktif || SMPN99_INFO.tahunAjaranAktif;
  const activeSemester = settings?.semesterAktif || SMPN99_INFO.semesterAktif;
  const schoolLogoUrl = settings?.logoSekolahUrl || DEFAULT_LOGO_SMPN99;

  // Profile, Password & Request Reset Role Lain UI State
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<'PROFIL' | 'PASSWORD' | 'RESET_ROLE'>('PROFIL');
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [profileName, setProfileName] = useState<string>(activeUser?.nama || '');
  const [profileNip, setProfileNip] = useState<string>(activeUser?.nip || '');
  const [profileJabatan, setProfileJabatan] = useState<string>(activeUser?.jabatan || '');

  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);

  const otherUsers = (settings?.pengguna || []).filter((u) => u.id !== activeUser?.id);
  const [resetTargetUserId, setResetTargetUserId] = useState<string>(otherUsers[0]?.id || '');
  const [resetTempPassword, setResetTempPassword] = useState<string>('smpn99reset');
  const [resetReason, setResetReason] = useState<string>('');

  useEffect(() => {
    setProfileName(activeUser?.nama || '');
    setProfileNip(activeUser?.nip || '');
    setProfileJabatan(activeUser?.jabatan || '');
  }, [activeUser?.id, activeUser?.nama, activeUser?.nip, activeUser?.jabatan]);

  useEffect(() => {
    if (otherUsers.length > 0 && !otherUsers.some((u) => u.id === resetTargetUserId)) {
      setResetTargetUserId(otherUsers[0].id);
    }
  }, [otherUsers, resetTargetUserId]);

  const openProfilePanel = (tab: 'PROFIL' | 'PASSWORD' | 'RESET_ROLE') => {
    setProfileTab(tab);
    setProfileFeedback(null);
    setIsProfilePanelOpen(true);
  };

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    const res = onUpdateProfile({
      nama: profileName,
      nip: profileNip,
      jabatan: profileJabatan,
    });
    setProfileFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onChangePassword) return;
    if (newPass !== confirmPass) {
      setProfileFeedback({
        type: 'error',
        text: 'Konfirmasi password baru tidak cocok.',
      });
      return;
    }
    const res = onChangePassword({
      currentPassword: currentPass,
      newPassword: newPass,
    });
    setProfileFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleRequestResetOtherRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateApprovalRequest) return;
    const target = otherUsers.find((u) => u.id === resetTargetUserId);
    if (!target) {
      setProfileFeedback({
        type: 'error',
        text: 'Pilih akun / role tujuan terlebih dahulu.',
      });
      return;
    }
    if (!resetTempPassword || resetTempPassword.trim().length < 6) {
      setProfileFeedback({
        type: 'error',
        text: 'Password sementara minimal 6 karakter.',
      });
      return;
    }
    const cleanReason =
      resetReason.trim() ||
      `Permintaan reset password untuk akun ${target.nama} (${ROLE_LABELS[target.role]}) agar dapat login kembali dengan kata sandi sementara.`;

    onCreateApprovalRequest({
      kategori: 'RESET_PASSWORD',
      judul: `Request Reset Password: ${target.nama} (${ROLE_LABELS[target.role]})`,
      deskripsi: cleanReason,
      targetUserId: target.id,
      requestedNewPassword: resetTempPassword.trim(),
    });
    setProfileFeedback({
      type: 'success',
      text: `Request reset password untuk ${target.nama} (${ROLE_LABELS[target.role]}) dikirim ke Pusat Approval Super Admin.`,
    });
    setResetReason('');
  };

  const handleDirectResetOtherRole = () => {
    if (!onAdminResetOtherPassword) return;
    const target = otherUsers.find((u) => u.id === resetTargetUserId);
    if (!target) {
      setProfileFeedback({
        type: 'error',
        text: 'Pilih akun / role tujuan terlebih dahulu.',
      });
      return;
    }
    const res = onAdminResetOtherPassword(target.id, resetTempPassword.trim());
    setProfileFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateApprovalRequest || !newReq.judul.trim() || !newReq.deskripsi.trim()) return;
    const matchedStudent = students.find((s) => s.id === newReq.targetStudentId);
    onCreateApprovalRequest({
      kategori: newReq.kategori,
      judul: newReq.judul.trim(),
      deskripsi: newReq.deskripsi.trim(),
      targetStudentId: matchedStudent?.id,
      targetStudentName: matchedStudent?.namaLengkap,
    });
    setNewReq({
      kategori: 'REVISI_NILAI',
      judul: '',
      deskripsi: '',
      targetStudentId: '',
    });
    setIsNewReqOpen(false);
  };

  interface GenderDistributionItem {
    kategori: string;
    code: string;
    lakiLaki: number;
    perempuan: number;
    total: number;
  }

  const gradeDistributionData: GenderDistributionItem[] = [
    {
      kategori: 'Kelas VII',
      code: 'VII',
      lakiLaki: students.filter((s) => s.tingkat === 'VII' && s.jenisKelamin === 'L').length,
      perempuan: students.filter((s) => s.tingkat === 'VII' && s.jenisKelamin === 'P').length,
      total: students.filter((s) => s.tingkat === 'VII').length,
    },
    {
      kategori: 'Kelas VIII',
      code: 'VIII',
      lakiLaki: students.filter((s) => s.tingkat === 'VIII' && s.jenisKelamin === 'L').length,
      perempuan: students.filter((s) => s.tingkat === 'VIII' && s.jenisKelamin === 'P').length,
      total: students.filter((s) => s.tingkat === 'VIII').length,
    },
    {
      kategori: 'Kelas IX',
      code: 'IX',
      lakiLaki: students.filter((s) => s.tingkat === 'IX' && s.jenisKelamin === 'L').length,
      perempuan: students.filter((s) => s.tingkat === 'IX' && s.jenisKelamin === 'P').length,
      total: students.filter((s) => s.tingkat === 'IX').length,
    },
  ];

  const rombelList = Array.from(new Set(students.map((s) => s.rombel).filter(Boolean))).sort();
  const rombelDistributionData: GenderDistributionItem[] = rombelList.map((rombel) => {
    const lCount = students.filter((s) => s.rombel === rombel && s.jenisKelamin === 'L').length;
    const pCount = students.filter((s) => s.rombel === rombel && s.jenisKelamin === 'P').length;
    return {
      kategori: `Kls ${rombel}`,
      code: rombel,
      lakiLaki: lCount,
      perempuan: pCount,
      total: lCount + pCount,
    };
  });

  const activeChartData: GenderDistributionItem[] =
    chartViewMode === 'tingkat' ? gradeDistributionData : rombelDistributionData;

  const genderBarSummaryData = [
    {
      label: 'Laki-Laki (L)',
      jumlah: totalBoys,
      persentase: total > 0 ? Math.round((totalBoys / total) * 100) : 0,
      color: '#2563eb',
    },
    {
      label: 'Perempuan (P)',
      jumlah: totalGirls,
      persentase: total > 0 ? Math.round((totalGirls / total) * 100) : 0,
      color: '#e11d48',
    },
  ];

  const dikeluarkanCount = students.filter((s) => s.status === 'DIKELUARKAN').length;
  const statusSummaryAll = [
    {
      name: 'Aktif',
      value: aktif,
      persentase: total > 0 ? Math.round((aktif / total) * 100) : 0,
      color: '#16a34a',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Mutasi Keluar',
      value: mutasi,
      persentase: total > 0 ? Math.round((mutasi / total) * 100) : 0,
      color: '#d97706',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      name: 'Lulus',
      value: lulus,
      persentase: total > 0 ? Math.round((lulus / total) * 100) : 0,
      color: '#2563eb',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    ...(dikeluarkanCount > 0
      ? [
          {
            name: 'Dikeluarkan',
            value: dikeluarkanCount,
            persentase: total > 0 ? Math.round((dikeluarkanCount / total) * 100) : 0,
            color: '#e11d48',
            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          },
        ]
      : []),
  ];
  const statusPieSlices = statusSummaryAll.filter((item) => item.value > 0);

  const CustomGenderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1 font-sans min-w-[165px]">
          <div className="font-bold text-slate-900">{item?.label}</div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Jumlah Siswa:</span>
            <span className="font-mono font-bold tabular-nums">{item?.jumlah ?? 0} siswa</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Proporsi:</span>
            <span className="font-mono font-semibold tabular-nums">{item?.persentase ?? 0}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomStatusPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1 font-sans min-w-[165px]">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-xs inline-block"
              style={{ backgroundColor: item?.color }}
            />
            <span>Status: {item?.name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span>Jumlah Siswa:</span>
            <span className="font-mono font-bold tabular-nums">{item?.value ?? 0} siswa</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Persentase:</span>
            <span className="font-mono font-semibold tabular-nums">{item?.persentase ?? 0}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const l = payload.find((p: any) => p.dataKey === 'lakiLaki')?.value || 0;
      const p = payload.find((p: any) => p.dataKey === 'perempuan')?.value || 0;
      const t = l + p;
      return (
        <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1.5 font-sans min-w-[175px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</div>
          <div className="flex items-center justify-between text-blue-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
              <span>Laki-Laki (L):</span>
            </span>
            <span className="font-mono font-bold tabular-nums">{l} siswa</span>
          </div>
          <div className="flex items-center justify-between text-rose-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
              <span>Perempuan (P):</span>
            </span>
            <span className="font-mono font-bold tabular-nums">{p} siswa</span>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-slate-800 font-semibold text-[11px]">
            <span>Total Peserta Didik:</span>
            <span className="font-mono tabular-nums">{t} siswa</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* ================================================================= */}
      {/* HERO BANNER: ARCHITECTURAL SCHOOL PORTAL HEADER                   */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
        {/* Subtle depth mesh accents (clean, non-garish) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl"
        />

        <div className="relative z-10 p-5 sm:p-6 space-y-5">
          {/* Row 1: Identity & Session Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* School Crest Frame */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-lg ring-4 ring-white/10 shrink-0 flex items-center justify-center">
                <img
                  src={schoolLogoUrl}
                  alt="Logo Resmi SMP Negeri 99 Jakarta"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-wider text-blue-300 uppercase">
                  <span>Buku Induk Digital Resmi</span>
                  <span aria-hidden="true" className="text-slate-600">•</span>
                  <span className="font-mono text-sky-200">NPSN {SMPN99_INFO.npsn}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
                  {SMPN99_INFO.nama}
                </h2>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    Tahun Ajaran {activeTahun} ({activeSemester})
                  </span>
                  <span aria-hidden="true" className="text-slate-600 hidden sm:inline">|</span>
                  <span className="text-slate-300">{SMPN99_INFO.kota}</span>
                </div>
              </div>
            </div>

            {/* Active Session Identity Pill + Quick Profile/Security Triggers */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 shrink-0 self-start sm:self-center space-y-2 max-w-full">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Sesi Aktif · {ROLE_LABELS[activeRole]}
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate max-w-[230px]">
                  {activeUser?.nama || 'Antonius Purnomo, S.Pd.'}
                </div>
                <div className="text-[10px] text-blue-300 font-mono truncate max-w-[230px]">
                  {activeUser?.email || 'antoniuspurnomo61@guru.smp.belajar.id'}
                </div>
              </div>

              {activeUser?.mustChangePassword && (
                <button
                  type="button"
                  onClick={() => openProfilePanel('PASSWORD')}
                  className="w-full px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10px] font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Password baru direset · Segera ganti</span>
                </button>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => openProfilePanel('PROFIL')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-100 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <User className="w-3 h-3 text-sky-300" />
                  <span>Profil & Sandi</span>
                </button>
                <button
                  type="button"
                  onClick={() => openProfilePanel('RESET_ROLE')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-100 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-amber-300" />
                  <span>Reset Role Lain</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Description & Action Bar (wraps smoothly on every screen width) */}
          <div className="pt-4 border-t border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Pusat kendali data induk siswa terintegrasi, riwayat nilai Semester 1–6 lintas tahun ajaran, arsip dokumen digital, serta approval terpusat Super Admin.
            </p>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {permissions?.cetakBukuInduk !== false && onOpenRecapPdf && (
                <button
                  type="button"
                  onClick={onOpenRecapPdf}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh Rekap PDF</span>
                </button>
              )}

              {permissions?.cetakBukuInduk !== false && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('print-center')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-0.5 border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-300" />
                  <span>Pusat Cetak</span>
                </button>
              )}

              {(permissions?.imporEksporData !== false || permissions?.cetakBukuInduk !== false) && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('legger')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-0.5 border border-slate-700 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-300" />
                  <span>Export Legger T.A. Lalu</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateTab('accounts')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hover:-translate-y-0.5 border border-slate-700 cursor-pointer"
              >
                <UserCog className="w-3.5 h-3.5 text-indigo-300" />
                <span>Daftar Akun</span>
              </button>

              {permissions?.tambahEditSiswa !== false && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer"
                >
                  <span>+ Entri Siswa</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* PENGATURAN PROFIL, PASSWORD & REQUEST RESET PASSWORD ROLE LAIN    */}
      {/* ================================================================= */}
      {isProfilePanelOpen && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(activeUser?.nama || 'AP')
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Pengaturan Profil & Keamanan Akun
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {activeUser?.nama} · {ROLE_LABELS[activeRole]} ({activeUser?.email})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('PROFIL');
                    setProfileFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    profileTab === 'PROFIL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ubah Nama & Profil</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('PASSWORD');
                    setProfileFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    profileTab === 'PASSWORD'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ganti Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('RESET_ROLE');
                    setProfileFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    profileTab === 'RESET_ROLE'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Request Reset Role Lain</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsProfilePanelOpen(false)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                title="Tutup panel pengaturan profil"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {profileFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                profileFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {profileFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{profileFeedback.text}</span>
            </div>
          )}

          {/* Tab 1: Ubah Nama & Profil */}
          {profileTab === 'PROFIL' && (
            <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Contoh: Antonius Purnomo, S.Pd."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    value={profileNip}
                    onChange={(e) => setProfileNip(e.target.value)}
                    placeholder="1978xxxxxxxxxxxxxx"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jabatan / Keterangan Peran
                  </label>
                  <input
                    type="text"
                    value={profileJabatan}
                    onChange={(e) => setProfileJabatan(e.target.value)}
                    placeholder="Jabatan pada satuan pendidikan"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono">
                    Email: {activeUser?.email}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                    Role: {ROLE_LABELS[activeRole]}
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Ganti Password Pribadi */}
          {profileTab === 'PASSWORD' && (
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="Masukkan password saat ini"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-9 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Password bawaan awal: <span className="font-mono font-semibold text-slate-600">{DEFAULT_USER_PASSWORD}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password Baru (min. 6 karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-9 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Perbarui Password</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Request Reset Password Role Lain */}
          {profileTab === 'RESET_ROLE' && (
            <form onSubmit={handleRequestResetOtherRole} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                Ajukan permintaan reset kata sandi untuk akun role lain (Wali Kelas, TU, Operator, Verifikator, atau Kepala Sekolah). Permohonan masuk ke <strong>Pusat Approval Super Admin</strong>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Pilih Akun / Role Tujuan
                  </label>
                  <select
                    value={resetTargetUserId}
                    onChange={(e) => setResetTargetUserId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {otherUsers.length === 0 ? (
                      <option value="">Tidak ada akun lain terdaftar</option>
                    ) : (
                      otherUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama} — {ROLE_LABELS[u.role]} ({u.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password Sementara Diajukan (min. 6 karakter)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                    placeholder="Contoh: smpn99reset"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alasan / Keterangan Permintaan Reset Password
                  </label>
                  <textarea
                    rows={2}
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="Contoh: Wali Kelas lupa kata sandi login semester aktif dan meminta reset ke sandi sementara..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={otherUsers.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Request Reset ke Approval</span>
                </button>

                {canApprove && onAdminResetOtherPassword && (
                  <button
                    type="button"
                    disabled={otherUsers.length === 0}
                    onClick={handleDirectResetOtherRole}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Langsung Sekarang (Super Admin)</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      )}

      {/* ================================================================= */}
      {/* KPI SUMMARY CARDS (INTERACTIVE & BALANCED GRID)                   */}
      {/* ================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => onNavigateTab('students')}
          className="group text-left bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Siswa Terdata</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
            {total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Buku Induk Digital</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('students')}
          className="group text-left bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Siswa Aktif</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono tabular-nums">
            {aktif}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tingkat VII, VIII & IX</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('mutations')}
          className="group text-left bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Mutasi Keluar</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2 font-mono tabular-nums">
            {mutasi}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pindah Sekolah / Daerah</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('mutations')}
          className="group text-left bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700">Siswa Lulus</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2 font-mono tabular-nums">
            {lulus}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Arsip Alumni Terintegrasi</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('documents')}
          className="group text-left bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all col-span-2 sm:col-span-2 xl:col-span-1 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Berkas Terverifikasi</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-2 font-mono tabular-nums">
            {completenessRate}%
          </div>
          <div className="mt-1.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completenessRate}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {completeDocsCount} dari {total} siswa tervalidasi
          </div>
        </button>
      </section>

      {/* ================================================================= */}
      {/* PUSAT APPROVAL SUPER ADMIN / PENGAJUAN PERSYARATAN ROLE          */}
      {/* ================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                canApprove ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  {canApprove
                    ? 'Pusat Approval Super Admin'
                    : 'Pengajuan Persetujuan ke Super Admin'}
                </h3>
                {pendingApprovals.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    {pendingApprovals.length} Menunggu
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {canApprove
                  ? `Penanggung jawab: ${activeUser?.nama || 'Antonius Purnomo, S.Pd.'}. Review dan putuskan permohonan dari Wali Kelas, TU, & Operator.`
                  : `Peran aktif (${ROLE_LABELS[activeRole]}) dapat mengirim pengajuan perubahan data, revisi nilai, atau aktivasi akun.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setApprovalTab('PENDING')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  approvalTab === 'PENDING'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menunggu ({pendingApprovals.length})
              </button>
              <button
                type="button"
                onClick={() => setApprovalTab('HISTORY')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  approvalTab === 'HISTORY'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riwayat ({historyApprovals.length})
              </button>
            </div>

            {onCreateApprovalRequest && !canApprove && (
              <button
                type="button"
                onClick={() => setIsNewReqOpen(!isNewReqOpen)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan Approval</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Pengajuan Approval (untuk Wali Kelas, TU, Operator) */}
        {isNewReqOpen && onCreateApprovalRequest && (
          <form
            onSubmit={handleSubmitNewRequest}
            className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Kategori Pengajuan
                </label>
                <select
                  value={newReq.kategori}
                  onChange={(e) => setNewReq({ ...newReq, kategori: e.target.value as ApprovalCategory })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                >
                  <option value="REVISI_NILAI">Revisi Nilai Rapor / Legger</option>
                  <option value="MUTASI_SISWA">Persetujuan Mutasi / Kelulusan</option>
                  <option value="PERUBAHAN_DATA">Perubahan Biodata Induk Siswa</option>
                  <option value="HAPUS_DATA">Permohonan Penghapusan Data</option>
                  <option value="VERIFIKASI_BERKAS">Validasi Berkas Khusus</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Siswa Terkait (Opsional)
                </label>
                <select
                  value={newReq.targetStudentId}
                  onChange={(e) => setNewReq({ ...newReq, targetStudentId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="">-- Umum / Bukan Siswa Spesifik --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nis} - {s.namaLengkap} ({s.rombel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Judul Permohonan
                </label>
                <input
                  type="text"
                  required
                  value={newReq.judul}
                  onChange={(e) => setNewReq({ ...newReq, judul: e.target.value })}
                  placeholder="Contoh: Persetujuan Revisi Nilai Matematika Semester 4"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Alasan & Rincian Pengajuan
                </label>
                <textarea
                  rows={2}
                  required
                  value={newReq.deskripsi}
                  onChange={(e) => setNewReq({ ...newReq, deskripsi: e.target.value })}
                  placeholder="Jelaskan detail perubahan yang dimohonkan kepada Super Admin..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewReqOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Kirim ke Super Admin
              </button>
            </div>
          </form>
        )}

        {/* Daftar Approval Items */}
        <div className="space-y-2.5">
          {(approvalTab === 'PENDING' ? pendingApprovals : historyApprovals).length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              {approvalTab === 'PENDING'
                ? 'Seluruh permohonan telah diproses. Tidak ada antrean approval saat ini.'
                : 'Belum ada riwayat keputusan approval.'}
            </div>
          ) : (
            (approvalTab === 'PENDING' ? pendingApprovals : historyApprovals).map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border border-slate-200 border-l-4 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 ${
                  item.status === 'PENDING'
                    ? 'bg-slate-50/80 border-l-amber-500 hover:bg-white'
                    : item.status === 'APPROVED'
                    ? 'bg-emerald-50/30 border-l-emerald-500'
                    : 'bg-rose-50/30 border-l-rose-500'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800 uppercase tracking-wide">
                      {item.kategori.replace(/_/g, ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Pemohon: <strong className="text-slate-700">{item.pemohonNama}</strong> (
                      {ROLE_LABELS[item.pemohonRole]})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{item.judul}</div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">{item.deskripsi}</p>
                  {item.kategori === 'RESET_PASSWORD' && item.requestedNewPassword && (
                    <div className="text-[11px] text-teal-700 font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3" />
                      <span>
                        Sandi sementara diajukan:{' '}
                        <code className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 font-mono">
                          {item.requestedNewPassword}
                        </code>
                      </span>
                    </div>
                  )}
                  {item.targetStudentName && (
                    <div className="text-[11px] text-blue-700 font-semibold">
                      Siswa Terkait: {item.targetStudentName}
                    </div>
                  )}
                  {item.status !== 'PENDING' && (
                    <div className="text-[11px] pt-1 text-slate-600">
                      Keputusan:{' '}
                      <strong
                        className={
                          item.status === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'
                        }
                      >
                        {item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </strong>{' '}
                      oleh {item.reviewedBy} — "{item.catatanReviewer}"
                    </div>
                  )}
                </div>

                {item.status === 'PENDING' && canApprove && onApproveRequest && onRejectRequest ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={reviewNotes[item.id] || ''}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Catatan review (opsional)..."
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs flex-1 sm:flex-none sm:w-48 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => onApproveRequest(item.id, reviewNotes[item.id])}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectRequest(item.id, reviewNotes[item.id])}
                      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                ) : item.status === 'PENDING' ? (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Menunggu Approval Super Admin</span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================================================================= */}
      {/* RECHARTS OVERVIEW: GENDER BAR CHART & STUDENT STATUS PIE CHART    */}
      {/* ================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Diagram Batang Jumlah Siswa per Gender */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Jumlah Siswa per Gender
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan peserta didik Laki-Laki (L) dan Perempuan (P)
                </p>
              </div>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-slate-600">
              Total: {total}
            </span>
          </div>

          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genderBarSummaryData}
                margin={{ top: 12, right: 16, left: -16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomGenderTooltip />} />
                <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} maxBarSize={76}>
                  {genderBarSummaryData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            {genderBarSummaryData.map((g) => (
              <div
                key={g.label}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <span>{g.label}</span>
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {g.jumlah} ({g.persentase}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Diagram Lingkaran Distribusi Status Siswa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Distribusi Status Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  Proporsi siswa Aktif, Mutasi Keluar, dan Lulus
                </p>
              </div>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-slate-600">
              {total} siswa
            </span>
          </div>

          {statusPieSlices.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              Belum ada data siswa untuk ditampilkan.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
              <div className="sm:col-span-6 h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {statusPieSlices.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomStatusPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    Total
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
                    {total}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-6 space-y-2.5">
                {statusSummaryAll.map((item) => (
                  <div
                    key={item.name}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <div className="font-mono tabular-nums text-right shrink-0">
                      <span className="font-bold text-slate-900">{item.value}</span>
                      <span className="text-slate-500 text-[11px] ml-1">({item.persentase}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pembaruan otomatis dari Buku Register & Mutasi Siswa</span>
            <button
              type="button"
              onClick={() => onNavigateTab('mutations')}
              className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
            >
              Kelola Mutasi
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ANALYTICS & OPERATIONAL GRID (Stacks cleanly below xl breakpoints) */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Visualizations, Rombel & Breakdown */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recharts BarChart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Distribusi Siswa: Tingkat Kelas & Gender
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sebaran Laki-Laki (L) dan Perempuan (P) SMP Negeri 99 Jakarta
                  </p>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setChartViewMode('tingkat')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'tingkat'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Tingkat
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('rombel')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'rombel'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Rombel
                </button>
              </div>
            </div>

            <div className="mt-4 h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeChartData}
                  margin={{ top: 12, right: 12, left: -18, bottom: 4 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="kategori"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                    formatter={(value) => (
                      <span className="text-slate-700 font-medium mr-3">
                        {value === 'lakiLaki' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="lakiLaki"
                    name="lakiLaki"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    dataKey="perempuan"
                    name="perempuan"
                    fill="#e11d48"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={38}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-center text-xs">
              {gradeDistributionData.map((g) => (
                <div key={g.code} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="font-bold text-slate-900 text-xs">{g.kategori}</div>
                  <div className="mt-1 flex items-center justify-center gap-2 font-mono tabular-nums text-[11px]">
                    <span className="text-blue-700 font-semibold">L: {g.lakiLaki}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-rose-600 font-semibold">P: {g.perempuan}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    Total: {g.total} siswa
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rombel & Gender Composition */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Komposisi Rombongan Belajar & Gender
                </h3>
                <p className="text-xs text-slate-500">
                  Tahun Ajaran {activeTahun} · Semester {activeSemester}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('students')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Master</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3.5 mt-4">
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                <div className="text-xs font-semibold text-blue-900">Kelas VII</div>
                <div className="text-xl font-extrabold text-blue-700 font-mono tabular-nums mt-1">
                  {kelas7}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Siswa Aktif</div>
              </div>

              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center">
                <div className="text-xs font-semibold text-indigo-900">Kelas VIII</div>
                <div className="text-xl font-extrabold text-indigo-700 font-mono tabular-nums mt-1">
                  {kelas8}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Siswa Aktif</div>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                <div className="text-xs font-semibold text-purple-900">Kelas IX</div>
                <div className="text-xl font-extrabold text-purple-700 font-mono tabular-nums mt-1">
                  {kelas9}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Siswa Aktif</div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 mb-2">
                <span className="font-semibold text-slate-800">Rasio Gender Keseluruhan</span>
                <span className="font-mono tabular-nums text-[11px]">
                  L: <strong className="text-blue-700">{totalBoys}</strong> (
                  {Math.round((totalBoys / (total || 1)) * 100)}%) · P:{' '}
                  <strong className="text-rose-600">{totalGirls}</strong> (
                  {Math.round((totalGirls / (total || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(totalBoys / (total || 1)) * 100}%` }}
                  title={`Laki-laki: ${totalBoys}`}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(totalGirls / (total || 1)) * 100}%` }}
                  title={`Perempuan: ${totalGirls}`}
                />
              </div>
            </div>
          </div>

          {/* Jalur Masuk & Agama with subtle proportion bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Jalur Penerimaan Siswa</h4>
              <div className="space-y-2.5">
                {Object.entries(jalurStats).map(([jalur, count]) => (
                  <div key={jalur} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{jalur}</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.round((count / (total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Distribusi Agama Siswa</h4>
              <div className="space-y-2.5">
                {Object.entries(agamaStats).map(([agama, count]) => (
                  <div key={agama} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{agama}</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${Math.round((count / (total || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Recent Students, Activity Feed & Quick Links */}
        <div className="space-y-6">
          {/* Quick Shortcuts Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">Aksi Cepat Administrasi TU</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {permissions?.cetakBukuInduk !== false && onQuickDownloadRecapPdf && (
                <button
                  type="button"
                  onClick={onQuickDownloadRecapPdf}
                  className="w-full p-2.5 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-blue-600" />
                    <span>Unduh Rekap Siswa (.pdf)</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateTab('legger')}
                className="w-full p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Export Legger (Sem 1–6)</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('accounts')}
                className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-indigo-600" />
                  <span>Akun Wali Kelas, TU & Operator</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('import-export')}
                className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>Impor / Ekspor CSV Siswa</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('gas-integration')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <span>Sinkronisasi Google Sheets (GAS)</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recent Student Entries */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900">Siswa Terdaftar Terbaru</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('students')}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-slate-100 mt-1">
              {students.slice(0, 5).map((student) => {
                const initials = student.namaLengkap
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase();
                return (
                  <div
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {student.namaLengkap}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">NIS: {student.nis}</span>
                          <span aria-hidden="true">·</span>
                          <span>Kls {student.rombel}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        student.status === 'AKTIF'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : student.status === 'MUTASI_KELUAR'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity / Audit Log Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900">Jejak Aktivitas Terbaru</h3>
              <button
                type="button"
                onClick={() => onNavigateTab('audit-log')}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Lihat Lengkap
              </button>
            </div>
            <div className="space-y-3 mt-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="text-xs pl-3 border-l-2 border-slate-200 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-800 truncate pr-2">
                      {log.operatorName.split(',')[0]}
                    </span>
                    <span className="font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
