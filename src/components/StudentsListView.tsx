import React, { useState, useMemo } from 'react';
import {
  Search,
  Printer,
  Edit,
  ArrowRightLeft,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  Layers,
  List,
  ChevronDown,
  ChevronRight,
  Users,
  BookOpen,
} from 'lucide-react';
import {
  Student,
  UserRole,
  BukuIndukSettings,
  AppUser,
  TingkatKelas,
} from '../types';
import { storageService } from '../services/storageService';

interface StudentsListViewProps {
  students: Student[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onPrintStudent: (student: Student) => void;
  onMutateStudent: (student: Student) => void;
  onOpenAddModal: () => void;
  activeRole: UserRole;
  activeUser?: AppUser;
  settings?: BukuIndukSettings;
  onDeleteStudent: (studentId: string) => void;
}

interface RombelGroup {
  rombel: string;
  tingkat: TingkatKelas | string;
  waliKelas: string;
  nipWaliKelas?: string;
  students: Student[];
  lakiLaki: number;
  perempuan: number;
  aktifCount: number;
}

const compareRombel = (a: string, b: string) =>
  a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });

const sortStudentsInGroup = (a: Student, b: Student) => {
  const numA = a.nomorUrutPresensi ?? Number.MAX_SAFE_INTEGER;
  const numB = b.nomorUrutPresensi ?? Number.MAX_SAFE_INTEGER;
  if (numA !== numB) return numA - numB;
  return a.namaLengkap.localeCompare(b.namaLengkap, 'id');
};

const inferTingkatFromRombel = (rombel: string): TingkatKelas | null => {
  const clean = rombel.trim().toUpperCase();
  if (clean.startsWith('7') || clean.startsWith('VII')) return 'VII';
  if (clean.startsWith('8') || clean.startsWith('VIII')) return 'VIII';
  if (clean.startsWith('9') || clean.startsWith('IX')) return 'IX';
  return null;
};

export const StudentsListView: React.FC<StudentsListViewProps> = ({
  students,
  searchQuery,
  onSearchChange,
  onSelectStudent,
  onEditStudent,
  onPrintStudent,
  onMutateStudent,
  onOpenAddModal,
  activeRole,
  activeUser,
  settings,
  onDeleteStudent,
}) => {
  const [filterTingkat, setFilterTingkat] = useState<string>('ALL');
  const [filterRombel, setFilterRombel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterJalur, setFilterJalur] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GROUPED' | 'FLAT'>('GROUPED');
  const [collapsedRombels, setCollapsedRombels] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Base students filtered by non-grade/non-rombel criteria (search, status, gender, jalur)
  // Used so grade-level & rombel tab counts stay accurate and helpful when filtering
  const baseFilteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName =
          s.namaLengkap.toLowerCase().includes(q) ||
          s.namaPanggilan.toLowerCase().includes(q) ||
          s.rombel.toLowerCase().includes(q);
        const matchNis = s.nis.toLowerCase().includes(q);
        const matchNisn = s.nisn.toLowerCase().includes(q);
        if (!matchName && !matchNis && !matchNisn) return false;
      }
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      if (filterGender !== 'ALL' && s.jenisKelamin !== filterGender) return false;
      if (filterJalur !== 'ALL' && s.penerimaan?.jalurPenerimaan !== filterJalur) return false;
      return true;
    });
  }, [students, searchQuery, filterStatus, filterGender, filterJalur]);

  // Grade-level counts (VII, VIII, IX) reflecting active search & secondary filters
  const gradeCounts = useMemo(() => {
    return {
      ALL: baseFilteredStudents.length,
      VII: baseFilteredStudents.filter((s) => s.tingkat === 'VII').length,
      VIII: baseFilteredStudents.filter((s) => s.tingkat === 'VIII').length,
      IX: baseFilteredStudents.filter((s) => s.tingkat === 'IX').length,
    };
  }, [baseFilteredStudents]);

  // Available Rombel options scoped dynamically to the selected Grade Level (Tingkat)
  const rombelSummaryOptions = useMemo(() => {
    const map = new Map<string, number>();
    baseFilteredStudents.forEach((s) => {
      if (filterTingkat !== 'ALL' && s.tingkat !== filterTingkat) return;
      if (!s.rombel) return;
      map.set(s.rombel, (map.get(s.rombel) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => compareRombel(a, b))
      .map(([rombel, count]) => ({ rombel, count }));
  }, [baseFilteredStudents, filterTingkat]);

  // Final filtered & sorted students
  const filteredStudents = useMemo(() => {
    return baseFilteredStudents
      .filter((s) => {
        if (filterTingkat !== 'ALL' && s.tingkat !== filterTingkat) return false;
        if (filterRombel !== 'ALL' && s.rombel !== filterRombel) return false;
        return true;
      })
      .sort((a, b) => {
        const rombelDiff = compareRombel(a.rombel || '', b.rombel || '');
        if (rombelDiff !== 0) return rombelDiff;
        return sortStudentsInGroup(a, b);
      });
  }, [baseFilteredStudents, filterTingkat, filterRombel]);

  // Grouped by Rombel (Grade/Class)
  const rombelGroups: RombelGroup[] = useMemo(() => {
    const groupedMap = new Map<string, Student[]>();
    filteredStudents.forEach((student) => {
      const key = student.rombel?.trim() || 'Tanpa Rombel';
      const list = groupedMap.get(key) || [];
      list.push(student);
      groupedMap.set(key, list);
    });

    return Array.from(groupedMap.entries())
      .sort(([a], [b]) => compareRombel(a, b))
      .map(([rombel, groupStudents]) => {
        const sorted = [...groupStudents].sort(sortStudentsInGroup);
        const firstStudent = sorted[0];
        const waliFromSettings = settings?.daftarWaliKelas?.find(
          (w) => w.rombel.toUpperCase() === rombel.toUpperCase()
        );
        const waliFromHistory = firstStudent?.riwayatKelas?.find(
          (r) => r.rombel.toUpperCase() === rombel.toUpperCase()
        )?.waliKelas;

        return {
          rombel,
          tingkat: firstStudent?.tingkat || inferTingkatFromRombel(rombel) || '-',
          waliKelas: waliFromSettings?.nama || waliFromHistory || 'Belum ditentukan',
          nipWaliKelas: waliFromSettings?.nip,
          students: sorted,
          lakiLaki: sorted.filter((s) => s.jenisKelamin === 'L').length,
          perempuan: sorted.filter((s) => s.jenisKelamin === 'P').length,
          aktifCount: sorted.filter((s) => s.status === 'AKTIF').length,
        };
      });
  }, [filteredStudents, settings?.daftarWaliKelas]);

  const handleSelectTingkat = (tingkat: string) => {
    setFilterTingkat(tingkat);
    if (tingkat !== 'ALL' && filterRombel !== 'ALL') {
      const stillValid = baseFilteredStudents.some(
        (s) => s.tingkat === tingkat && s.rombel === filterRombel
      );
      if (!stillValid) {
        setFilterRombel('ALL');
      }
    }
  };

  const handleResetFilters = () => {
    setFilterTingkat('ALL');
    setFilterRombel('ALL');
    setFilterStatus('ALL');
    setFilterGender('ALL');
    setFilterJalur('ALL');
    onSearchChange('');
  };

  const handleSelectHomeroomShortcut = () => {
    const homeroom = activeUser?.rombelBinaan;
    if (!homeroom) return;
    if (filterRombel === homeroom) {
      setFilterTingkat('ALL');
      setFilterRombel('ALL');
      return;
    }
    const inferred = inferTingkatFromRombel(homeroom);
    setFilterTingkat(inferred || 'ALL');
    setFilterRombel(homeroom);
  };

  const handleExportCsv = (targetStudents: Student[], labelSuffix?: string) => {
    const csvData = storageService.exportToCsv(targetStudents);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const suffix = labelSuffix ? `_${labelSuffix}` : '';
    link.setAttribute(
      'download',
      `Buku_Induk_SMPN99${suffix}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleGroupCollapse = (rombel: string) => {
    setCollapsedRombels((prev) => ({ ...prev, [rombel]: !prev[rombel] }));
  };

  const expandAllGroups = () => setCollapsedRombels({});

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    rombelGroups.forEach((g) => {
      next[g.rombel] = true;
    });
    setCollapsedRombels(next);
  };

  const allGroupsCollapsed =
    rombelGroups.length > 0 && rombelGroups.every((g) => collapsedRombels[g.rombel]);

  const canDelete = activeRole === 'SUPER_ADMIN' || activeRole === 'ADMIN';
  const hasActiveFilter =
    filterTingkat !== 'ALL' ||
    filterRombel !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterGender !== 'ALL' ||
    filterJalur !== 'ALL' ||
    searchQuery.trim().length > 0;

  const renderStudentRow = (student: Student, rowNumber: number, showRombelCol: boolean) => {
    const verifiedDocs =
      student.dokumen?.filter((d) => d.statusVerifikasi === 'TERVERIFIKASI').length || 0;
    const totalDocs = student.dokumen?.length || 0;
    const isDocsComplete = totalDocs >= 3 && verifiedDocs === totalDocs;
    const isConfirmingDelete = confirmDeleteId === student.id;

    return (
      <tr key={student.id} className="hover:bg-blue-50/40 transition-colors group">
        {/* No Urut */}
        <td className="py-2.5 px-3 text-center text-slate-500 font-mono tabular-nums">
          {rowNumber}
        </td>

        {/* NIS / NISN */}
        <td className="py-2.5 px-3 whitespace-nowrap">
          <div className="font-mono font-semibold text-slate-900 tabular-nums">{student.nis}</div>
          <div className="font-mono text-[11px] text-slate-500 tabular-nums">{student.nisn}</div>
        </td>

        {/* Nama Lengkap + Metadata unboxed */}
        <td className="py-2.5 px-4 min-w-[200px]">
          <button
            type="button"
            onClick={() => onSelectStudent(student)}
            className="text-left font-bold text-slate-900 hover:text-blue-600 transition-colors block cursor-pointer"
          >
            {student.namaLengkap}
          </button>
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5 mt-0.5">
            <span>
              {student.tempatLahir}, {student.tanggalLahir}
            </span>
            <span aria-hidden="true">·</span>
            <span>{student.agama}</span>
            {student.nomorUrutPresensi ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">No. Presensi {student.nomorUrutPresensi}</span>
              </>
            ) : null}
          </div>
        </td>

        {/* Gender */}
        <td className="py-2.5 px-2 text-center font-bold">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
              student.jenisKelamin === 'L'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {student.jenisKelamin}
          </span>
        </td>

        {/* Rombel (visible in flat view) */}
        {showRombelCol && (
          <td className="py-2.5 px-3 whitespace-nowrap">
            <span className="font-semibold text-slate-800">{student.rombel}</span>
            <div className="text-[10px] text-slate-500">Tingkat {student.tingkat}</div>
          </td>
        )}

        {/* Asal SD */}
        <td className="py-2.5 px-3 text-slate-700 max-w-[180px]">
          <div className="truncate font-medium">{student.sekolahAsal?.namaSd || '-'}</div>
          <div className="text-[10px] text-slate-500 truncate">
            {student.penerimaan?.jalurPenerimaan || 'Zonasi'}
          </div>
        </td>

        {/* Kelengkapan Berkas */}
        <td className="py-2.5 px-3 text-center whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
              isDocsComplete
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                : 'text-amber-700 bg-amber-50 border border-amber-200'
            }`}
          >
            {isDocsComplete ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="tabular-nums">
                  Lengkap ({verifiedDocs}/{totalDocs})
                </span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="tabular-nums">
                  {verifiedDocs}/{totalDocs || 0} Berkas
                </span>
              </>
            )}
          </span>
        </td>

        {/* Status */}
        <td className="py-2.5 px-3 text-center whitespace-nowrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              student.status === 'AKTIF'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : student.status === 'MUTASI_KELUAR'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {student.status.replace('_', ' ')}
          </span>
        </td>

        {/* Aksi */}
        <td className="py-2.5 px-4 text-right whitespace-nowrap">
          {isConfirmingDelete ? (
            <div className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-rose-700">Hapus?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteStudent(student.id);
                  setConfirmDeleteId(null);
                }}
                className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
              >
                Ya
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => onSelectStudent(student)}
                title="Buka Buku Induk Lengkap"
                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onPrintStudent(student)}
                title="Cetak Lembar Buku Induk Resmi"
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditStudent(student)}
                title="Edit Data Siswa"
                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMutateStudent(student)}
                title="Proses Mutasi / Kelulusan"
                className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(student.id)}
                  title="Hapus Siswa (Super Admin / TU)"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Efficient Grade-Level + Rombel Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
        {/* Top Row: Title, Count, View Mode Switch & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Buku Register Induk Siswa</h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Menampilkan {filteredStudents.length} dari {students.length} peserta didik
              {viewMode === 'GROUPED' && rombelGroups.length > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span>{rombelGroups.length} rombel terdaftar</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Segmented Control */}
            <div
              className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold"
              role="group"
              aria-label="Mode tampilan daftar siswa"
            >
              <button
                type="button"
                onClick={() => setViewMode('GROUPED')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'GROUPED'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Grup per Rombel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('FLAT')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'FLAT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5 text-slate-600" />
                <span>Daftar Datar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                handleExportCsv(
                  filteredStudents,
                  filterRombel !== 'ALL'
                    ? `Kelas_${filterRombel}`
                    : filterTingkat !== 'ALL'
                    ? `Tingkat_${filterTingkat}`
                    : undefined
                )
              }
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Grade-Level (Tingkat) Fast Filter Bar */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { key: 'ALL', label: 'Semua Tingkat', count: gradeCounts.ALL },
                  { key: 'VII', label: 'Kelas VII (7)', count: gradeCounts.VII },
                  { key: 'VIII', label: 'Kelas VIII (8)', count: gradeCounts.VIII },
                  { key: 'IX', label: 'Kelas IX (9)', count: gradeCounts.IX },
                ] as const
              ).map((tab) => {
                const isActive = filterTingkat === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleSelectTingkat(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        isActive ? 'text-blue-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeUser?.rombelBinaan && (
                <button
                  type="button"
                  onClick={handleSelectHomeroomShortcut}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    filterRombel === activeUser.rombelBinaan
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-blue-50/70 border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Kelas Binaan: {activeUser.rombelBinaan}</span>
                </button>
              )}

              {viewMode === 'GROUPED' && rombelGroups.length > 1 && (
                <button
                  type="button"
                  onClick={allGroupsCollapsed ? expandAllGroups : collapseAllGroups}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {allGroupsCollapsed ? 'Buka Semua Rombel' : 'Tutup Semua Rombel'}
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Rombel Quick-Selector Strip */}
          {rombelSummaryOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">
                Filter Rombel:
              </span>
              <button
                type="button"
                onClick={() => setFilterRombel('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterRombel === 'ALL'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                Semua ({rombelSummaryOptions.reduce((acc, r) => acc + r.count, 0)})
              </button>
              {rombelSummaryOptions.map(({ rombel, count }) => {
                const isSelected = filterRombel === rombel;
                return (
                  <button
                    key={rombel}
                    type="button"
                    onClick={() => setFilterRombel(isSelected ? 'ALL' : rombel)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {rombel} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search & Secondary Filters Row */}
        <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Search Input (available across all breakpoints directly inside view) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Cari Nama / NIS / NISN
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nama, NIS, atau rombel..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Siswa */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Status Siswa
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="MUTASI_KELUAR">Mutasi Keluar</option>
              <option value="LULUS">Lulus</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Jalur PPDB */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Jalur Penerimaan
            </label>
            <select
              value={filterJalur}
              onChange={(e) => setFilterJalur(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Jalur</option>
              <option value="Zonasi">Zonasi</option>
              <option value="Prestasi Akademik">Prestasi Akademik</option>
              <option value="Prestasi Non-Akademik">Prestasi Non-Akademik</option>
              <option value="Afirmasi">Afirmasi</option>
              <option value="Pindah Tugas Orang Tua">Pindah Tugas Ortu</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilter}
              className="w-full py-1.5 px-3 text-xs text-slate-700 hover:text-slate-900 disabled:text-slate-400 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 rounded-md font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-14 px-4 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-slate-800">Tidak ada data siswa ditemukan</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Sesuaikan filter tingkat kelas, rombel, atau kata kunci pencarian untuk menampilkan peserta didik.
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Tampilkan Semua Siswa
            </button>
          )}
        </div>
      ) : viewMode === 'GROUPED' ? (
        /* =============================================================== */
        /* GROUPED BY ROMBEL VIEW (Organized per Class like School Legger) */
        /* =============================================================== */
        <div className="space-y-4">
          {rombelGroups.map((group) => {
            const isCollapsed = Boolean(collapsedRombels[group.rombel]);
            return (
              <section
                key={group.rombel}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Rombel Group Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.rombel)}
                    className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer group"
                  >
                    <span className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 group-hover:text-slate-900 shrink-0">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Kelas {group.rombel}
                        </h3>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Tingkat {group.tingkat}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                          {group.students.length} siswa ({group.lakiLaki} L / {group.perempuan} P)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Wali Kelas: <span className="font-medium text-slate-700">{group.waliKelas}</span>
                        {group.nipWaliKelas ? (
                          <span className="font-mono text-slate-400"> · NIP {group.nipWaliKelas}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {filterRombel !== group.rombel && rombelGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const inferred = inferTingkatFromRombel(group.rombel);
                          if (inferred) setFilterTingkat(inferred);
                          setFilterRombel(group.rombel);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Fokus Kelas {group.rombel}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleExportCsv(group.students, `Kelas_${group.rombel}`)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      title={`Ekspor CSV siswa Kelas ${group.rombel}`}
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>CSV {group.rombel}</span>
                    </button>
                  </div>
                </div>

                {/* Group Students Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                          <th className="py-2.5 px-3 w-12 text-center">No</th>
                          <th className="py-2.5 px-3">NIS / NISN</th>
                          <th className="py-2.5 px-4">Nama Lengkap Siswa</th>
                          <th className="py-2.5 px-2 text-center">L/P</th>
                          <th className="py-2.5 px-3">Asal Sekolah</th>
                          <th className="py-2.5 px-3 text-center">Kelengkapan Berkas</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-4 text-right">Aksi Buku Induk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.students.map((student, idx) =>
                          renderStudentRow(student, idx + 1, false)
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        /* =============================================================== */
        /* FLAT UNIFIED TABLE VIEW                                         */
        /* =============================================================== */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-3">NIS / NISN</th>
                  <th className="py-2.5 px-4">Nama Lengkap Siswa</th>
                  <th className="py-2.5 px-2 text-center">L/P</th>
                  <th className="py-2.5 px-3">Rombel</th>
                  <th className="py-2.5 px-3">Asal Sekolah</th>
                  <th className="py-2.5 px-3 text-center">Kelengkapan Berkas</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Aksi Buku Induk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) =>
                  renderStudentRow(student, idx + 1, true)
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>Data tersimpan resmi pada Buku Induk Register SMP Negeri 99 Jakarta</div>
            <div className="font-mono tabular-nums">
              Total {filteredStudents.length} rekaman ditampilkan
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
