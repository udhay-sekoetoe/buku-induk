import React, { useMemo, useState, useEffect } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Filter,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Users,
  Check,
  X,
} from 'lucide-react';
import {
  BukuIndukSettings,
  MapelConfigItem,
  Student,
  StudentStatus,
  TingkatKelas,
  UserRole,
} from '../types';
import { storageService } from '../services/storageService';
import { DEFAULT_MAPEL_CONFIG } from '../data/defaultSettings';
import {
  downloadDapodikXlsxTemplate,
  exportStudentsToXlsx,
  filterStudentsForExcel,
  parseExcelOrCsvFile,
  StagedImportRow,
} from '../utils/excelDapodikHelper';

interface ImportExportViewProps {
  students: Student[];
  settings: BukuIndukSettings;
  onSaveSettings: (newSettings: BukuIndukSettings) => void;
  onImportSuccess: () => void;
  activeRole: UserRole;
  operator: { name: string; email: string; role: UserRole };
}

type ActiveSubTab = 'EXPORT' | 'IMPORT' | 'MAPEL';

const KATEGORI_LABELS: Record<MapelConfigItem['kategori'], string> = {
  WAJIB: 'Mata Pelajaran Wajib',
  SENI_PRAKARYA: 'Seni & Prakarya',
  MULOK: 'Muatan Lokal',
  BK: 'Layanan BK',
};

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  students,
  settings,
  onSaveSettings,
  onImportSuccess,
  operator,
}) => {
  const [subTab, setSubTab] = useState<ActiveSubTab>('EXPORT');

  // Filter states for Dapodik Export
  const [filterTingkat, setFilterTingkat] = useState<'ALL' | TingkatKelas>('ALL');
  const [filterRombel, setFilterRombel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | StudentStatus>('ALL');
  const [semesterScope, setSemesterScope] = useState<'REKAP_S1_S6' | number>('REKAP_S1_S6');

  // Column & Sheet toggles
  const [includeOrangTua, setIncludeOrangTua] = useState<boolean>(true);
  const [includeSekolahAsal, setIncludeSekolahAsal] = useState<boolean>(true);
  const [includeRekapRombel, setIncludeRekapRombel] = useState<boolean>(true);
  const [includeNilaiMapel, setIncludeNilaiMapel] = useState<boolean>(true);
  const [includePengaturanMapelSheet, setIncludePengaturanMapelSheet] = useState<boolean>(true);

  // Feedback message (replaces window.alert)
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Import staging states
  const [fileName, setFileName] = useState<string>('');
  const [detectedSheet, setDetectedSheet] = useState<string>('');
  const [stagedRows, setStagedRows] = useState<StagedImportRow[]>([]);
  const [allowUpsert, setAllowUpsert] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Mapel settings state synced with global settings
  const [mapelDraft, setMapelDraft] = useState<MapelConfigItem[]>(
    () => settings.pengaturanMapel || DEFAULT_MAPEL_CONFIG
  );
  const [newMapelKode, setNewMapelKode] = useState<string>('');
  const [newMapelNama, setNewMapelNama] = useState<string>('');
  const [newMapelKktp, setNewMapelKktp] = useState<number>(75);
  const [newMapelKategori, setNewMapelKategori] =
    useState<MapelConfigItem['kategori']>('MULOK');

  useEffect(() => {
    setMapelDraft(settings.pengaturanMapel || DEFAULT_MAPEL_CONFIG);
  }, [settings.pengaturanMapel]);

  // Available rombels synced cleanly to selected Tingkat
  const availableRombels = useMemo(() => {
    const rombelSet = new Set<string>();
    students.forEach((s) => {
      if (filterTingkat === 'ALL' || s.tingkat === filterTingkat) {
        if (s.rombel) rombelSet.add(s.rombel);
      }
    });
    settings.daftarWaliKelas.forEach((w) => {
      const t: TingkatKelas = w.rombel.startsWith('9')
        ? 'IX'
        : w.rombel.startsWith('8')
        ? 'VIII'
        : 'VII';
      if (filterTingkat === 'ALL' || t === filterTingkat) {
        rombelSet.add(w.rombel);
      }
    });
    return Array.from(rombelSet).sort((a, b) => a.localeCompare(b, 'id'));
  }, [students, settings.daftarWaliKelas, filterTingkat]);

  // Reset rombel if selected rombel doesn't match newly selected tingkat
  useEffect(() => {
    if (filterRombel !== 'ALL' && !availableRombels.includes(filterRombel)) {
      setFilterRombel('ALL');
    }
  }, [availableRombels, filterRombel]);

  // Filtered students preview
  const filteredStudents = useMemo(
    () => filterStudentsForExcel(students, filterTingkat, filterRombel, filterStatus),
    [students, filterTingkat, filterRombel, filterStatus]
  );

  const filteredStats = useMemo(() => {
    const l = filteredStudents.filter((s) => s.jenisKelamin === 'L').length;
    const p = filteredStudents.filter((s) => s.jenisKelamin === 'P').length;
    const rombelCount = new Set(filteredStudents.map((s) => s.rombel)).size;
    return { total: filteredStudents.length, l, p, rombelCount };
  }, [filteredStudents]);

  const activeMapelCount = useMemo(
    () => mapelDraft.filter((m) => m.aktif).length,
    [mapelDraft]
  );

  // =========================================================
  // HANDLERS: EXPORT EXCEL (.xlsx) / CSV / TEMPLATE
  // =========================================================
  const handleExportXlsx = () => {
    if (filteredStudents.length === 0) {
      setFeedbackBanner({
        type: 'error',
        text: 'Tidak ada data siswa yang sesuai dengan filter Tingkat/Rombel/Status saat ini.',
      });
      return;
    }
    const result = exportStudentsToXlsx({
      students,
      settings,
      filterTingkat,
      filterRombel,
      filterStatus,
      semesterScope,
      includeSections: {
        orangTua: includeOrangTua,
        sekolahAsal: includeSekolahAsal,
        rekapRombel: includeRekapRombel,
        nilaiMapel: includeNilaiMapel,
        pengaturanMapel: includePengaturanMapelSheet,
      },
      mapelList: mapelDraft,
    });

    storageService.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'EKSPOR_LEGGER',
      details: `Ekspor Excel (.xlsx) Dapodik & Eksternal: ${result.exportedCount} siswa (${result.sheetNames.join(', ')}) ke file ${result.fileName}`,
    });

    setFeedbackBanner({
      type: 'success',
      text: `File Excel "${result.fileName}" berhasil diunduh (${result.exportedCount} siswa, ${result.sheetNames.length} sheet: ${result.sheetNames.join(', ')}).`,
    });
  };

  const handleExportFilteredCsv = () => {
    if (filteredStudents.length === 0) {
      setFeedbackBanner({
        type: 'error',
        text: 'Tidak ada data siswa yang cocok dengan filter untuk diekspor ke CSV.',
      });
      return;
    }
    const csvData = storageService.exportToCsv(filteredStudents);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const tagTingkat = filterTingkat === 'ALL' ? 'SemuaTingkat' : `Kls${filterTingkat}`;
    const tagRombel = filterRombel === 'ALL' ? 'SemuaRombel' : filterRombel;
    link.href = url;
    link.download = `BukuInduk_SMPN99_${tagTingkat}_${tagRombel}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedbackBanner({
      type: 'success',
      text: `Berhasil mengekspor ${filteredStudents.length} data siswa ke format CSV.`,
    });
  };

  const handleDownloadXlsxTemplate = () => {
    const tplName = downloadDapodikXlsxTemplate(mapelDraft);
    setFeedbackBanner({
      type: 'info',
      text: `Template Excel "${tplName}" telah diunduh beserta panduan pengisian & daftar kode mapel aktif.`,
    });
  };

  // =========================================================
  // HANDLERS: IMPORT EXCEL (.xlsx) / CSV
  // =========================================================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFeedbackBanner(null);
    setIsProcessing(true);

    try {
      const currentStudents = storageService.getStudents();
      const { rows, detectedSheet: sheetUsed } = await parseExcelOrCsvFile(
        file,
        currentStudents,
        settings
      );

      setDetectedSheet(sheetUsed);
      setStagedRows(rows);

      if (rows.length === 0) {
        setFeedbackBanner({
          type: 'error',
          text: `Tidak ditemukan baris data siswa valid di file "${file.name}". Pastikan terdapat kolom NIS/NISN dan Nama Lengkap.`,
        });
      } else {
        setFeedbackBanner({
          type: 'info',
          text: `Memindai ${rows.length} baris dari sheet "${sheetUsed || 'CSV'}". Periksa hasil validasi di bawah sebelum commit.`,
        });
      }
    } catch (err) {
      console.error('Failed to parse file:', err);
      setStagedRows([]);
      setFeedbackBanner({
        type: 'error',
        text: `Gagal membaca file "${file.name}". Pastikan format file adalah .xlsx, .xls, atau .csv yang tidak korup.`,
      });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleCommitStaging = () => {
    const itemsToCommit = stagedRows
      .filter((r) => r.statusKlasifikasi === 'NEW' || (allowUpsert && r.statusKlasifikasi === 'CONFLICT'))
      .map((r) => ({
        student: r.rawStudent,
        mode: r.statusKlasifikasi === 'CONFLICT' ? ('UPDATE' as const) : ('NEW' as const),
      }));

    if (itemsToCommit.length === 0) {
      setFeedbackBanner({
        type: 'error',
        text: allowUpsert
          ? 'Tidak ada baris valid (BARU atau KONFLIK) yang dapat diproses.'
          : 'Tidak ada baris berkategori BARU. Aktifkan opsi "Perbarui data yang sudah ada" jika ingin mengupdate data siswa lama.',
      });
      return;
    }

    setIsProcessing(true);
    const { insertedCount, updatedCount, skippedCount } = storageService.upsertImportedStudents(
      itemsToCommit,
      operator
    );
    setIsProcessing(false);
    setStagedRows([]);
    setFileName('');
    setDetectedSheet('');
    onImportSuccess();

    setFeedbackBanner({
      type: 'success',
      text: `Impor selesai: ${insertedCount} siswa baru ditambahkan, ${updatedCount} data siswa diperbarui${
        skippedCount > 0 ? `, ${skippedCount} dilewati` : ''
      }.`,
    });
  };

  // =========================================================
  // HANDLERS: PENGATURAN MAPEL & KKTP
  // =========================================================
  const handleToggleMapelAktif = (id: string) => {
    setMapelDraft((prev) => prev.map((m) => (m.id === id ? { ...m, aktif: !m.aktif } : m)));
  };

  const handleChangeMapelField = <K extends keyof MapelConfigItem>(
    id: string,
    field: K,
    value: MapelConfigItem[K]
  ) => {
    setMapelDraft((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleAddMapel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMapelNama.trim();
    const cleanCode = (newMapelKode.trim() || `MP-${mapelDraft.length + 1}`).toUpperCase();
    if (!cleanName) {
      setFeedbackBanner({
        type: 'error',
        text: 'Nama mata pelajaran baru tidak boleh kosong.',
      });
      return;
    }
    const nextUrutan =
      mapelDraft.length > 0 ? Math.max(...mapelDraft.map((m) => m.urutan)) + 1 : 1;

    const item: MapelConfigItem = {
      id: `mp-custom-${Date.now().toString(36)}`,
      kodeDapodik: cleanCode,
      nama: cleanName,
      kategori: newMapelKategori,
      kktp: Math.max(0, Math.min(100, Number(newMapelKktp) || 75)),
      aktif: true,
      urutan: nextUrutan,
    };

    setMapelDraft((prev) => [...prev, item]);
    setNewMapelKode('');
    setNewMapelNama('');
    setNewMapelKktp(75);
    setFeedbackBanner({
      type: 'info',
      text: `Mata pelajaran "${cleanName}" ditambahkan ke daftar. Klik "Simpan Pengaturan Mapel" untuk menyimpan permanen.`,
    });
  };

  const handleDeleteMapel = (id: string) => {
    setMapelDraft((prev) =>
      prev
        .filter((m) => m.id !== id)
        .map((m, idx) => ({ ...m, urutan: idx + 1 }))
    );
  };

  const handleResetDefaultMapel = () => {
    setMapelDraft(DEFAULT_MAPEL_CONFIG);
    setFeedbackBanner({
      type: 'info',
      text: 'Daftar mapel dikembalikan ke standar Kurikulum Merdeka (17 Mapel). Klik "Simpan Pengaturan Mapel" untuk menerapkan.',
    });
  };

  const handleSaveMapelSettings = () => {
    const updatedSettings: BukuIndukSettings = {
      ...settings,
      pengaturanMapel: mapelDraft,
    };
    onSaveSettings(updatedSettings);
    setFeedbackBanner({
      type: 'success',
      text: `Pengaturan ${mapelDraft.length} mata pelajaran (${activeMapelCount} aktif) & KKTP berhasil disimpan untuk ekspor Excel/Dapodik.`,
    });
  };

  const newCount = stagedRows.filter((r) => r.statusKlasifikasi === 'NEW').length;
  const conflictCount = stagedRows.filter((r) => r.statusKlasifikasi === 'CONFLICT').length;
  const errorCount = stagedRows.filter((r) => r.statusKlasifikasi === 'ERROR').length;
  const commitableCount = newCount + (allowUpsert ? conflictCount : 0);

  return (
    <div className="space-y-5">
      {/* Header & Sub-Tab Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ekspor & Impor Excel (.xlsx) Sesuai Dapodik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pelaporan eksternal SMP Negeri 99 Jakarta (NPSN 20103565) dengan filter Tingkat, Rombel, Status, dan kustomisasi Mata Pelajaran &amp; KKTP.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('EXPORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              subTab === 'EXPORT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('IMPORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              subTab === 'IMPORT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span>Impor Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('MAPEL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              subTab === 'MAPEL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pengaturan Mapel ({activeMapelCount})</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedbackBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="p-1 rounded hover:bg-black/5 shrink-0 cursor-pointer"
            aria-label="Tutup pesan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: EXPORT EXCEL (.XLSX) DAPODIK & EKSTERNAL                       */}
      {/* ===================================================================== */}
      {subTab === 'EXPORT' && (
        <div className="space-y-5">
          {/* Filter & Worksheet Configuration Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Filter Data Dapodik &amp; Struktur Workbook (.xlsx)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterTingkat('ALL');
                  setFilterRombel('ALL');
                  setFilterStatus('ALL');
                  setSemesterScope('REKAP_S1_S6');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            </div>

            {/* 4-column Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tingkat Kelas (Dapodik)
                </label>
                <select
                  value={filterTingkat}
                  onChange={(e) => setFilterTingkat(e.target.value as 'ALL' | TingkatKelas)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="ALL">Semua Tingkat (VII, VIII, IX)</option>
                  <option value="VII">Kelas VII (Tingkat 7)</option>
                  <option value="VIII">Kelas VIII (Tingkat 8)</option>
                  <option value="IX">Kelas IX (Tingkat 9)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Rombongan Belajar (Rombel)
                </label>
                <select
                  value={filterRombel}
                  onChange={(e) => setFilterRombel(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="ALL">
                    Semua Rombel ({availableRombels.length} Rombel)
                  </option>
                  {availableRombels.map((rb) => (
                    <option key={rb} value={rb}>
                      Rombel {rb}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Status Peserta Didik
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'ALL' | StudentStatus)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="ALL">Semua Status Siswa</option>
                  <option value="AKTIF">Siswa Aktif</option>
                  <option value="MUTASI_KELUAR">Mutasi Keluar</option>
                  <option value="LULUS">Siswa Lulus</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Cakupan Nilai Mapel
                </label>
                <select
                  value={semesterScope}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSemesterScope(val === 'REKAP_S1_S6' ? 'REKAP_S1_S6' : Number(val));
                  }}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="REKAP_S1_S6">Rekap Rata-Rata Semester 1–6</option>
                  <option value={1}>Legger Semester 1 (VII Ganjil)</option>
                  <option value={2}>Legger Semester 2 (VII Genap)</option>
                  <option value={3}>Legger Semester 3 (VIII Ganjil)</option>
                  <option value={4}>Legger Semester 4 (VIII Genap)</option>
                  <option value={5}>Legger Semester 5 (IX Ganjil)</option>
                  <option value={6}>Legger Semester 6 (IX Genap)</option>
                </select>
              </div>
            </div>

            {/* Section & Sheet Checkboxes */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Komponen Kolom &amp; Sheet Excel yang Disertakan</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSubTab('MAPEL')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Atur Daftar Mapel ({activeMapelCount} Aktif) →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={includeOrangTua}
                    onChange={(e) => setIncludeOrangTua(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Data Orang Tua (Ayah/Ibu)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={includeSekolahAsal}
                    onChange={(e) => setIncludeSekolahAsal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Asal SD/MI &amp; Jalur PPDB</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={includeRekapRombel}
                    onChange={(e) => setIncludeRekapRombel(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sheet Rekap Rombel</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={includeNilaiMapel}
                    onChange={(e) => setIncludeNilaiMapel(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sheet Nilai Mapel ({activeMapelCount})</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={includePengaturanMapelSheet}
                    onChange={(e) => setIncludePengaturanMapelSheet(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sheet Referensi Mapel</span>
                </label>
              </div>
            </div>

            {/* Summary Metrics + Download Action Row */}
            <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Hasil Filter:</span>
                  <strong className="text-slate-900 tabular-nums">
                    {filteredStats.total} Siswa
                  </strong>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 tabular-nums">
                  Laki-Laki: <strong className="text-slate-900">{filteredStats.l}</strong>
                </span>
                <span className="text-slate-600 tabular-nums">
                  Perempuan: <strong className="text-slate-900">{filteredStats.p}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 tabular-nums">
                  Rombel Tercakup:{' '}
                  <strong className="text-slate-900">{filteredStats.rombelCount}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadXlsxTemplate}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                  <span>Template Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportFilteredCsv}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Ekspor CSV ({filteredStats.total})</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor Excel (.xlsx) ({filteredStats.total})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Filtered Student Preview Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pratinjau Data yang Akan Diekspor ({filteredStudents.length} Siswa)
                </h3>
                <p className="text-xs text-slate-500">
                  Menampilkan urutan sesuai Tingkat &amp; Rombel Dapodik sebelum dibuat menjadi workbook multi-sheet (.xlsx).
                </p>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tidak ada data siswa yang cocok dengan kombinasi filter Tingkat, Rombel, dan Status di atas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">NIS / NIPD</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-2 text-center">L/P</th>
                      <th className="py-2.5 px-3 text-center">Tingkat</th>
                      <th className="py-2.5 px-3 text-center">Rombel</th>
                      <th className="py-2.5 px-3">Asal SD/MI</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.slice(0, 25).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">
                          {s.nis}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">
                          {s.nisn}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {s.namaLengkap}
                        </td>
                        <td className="py-2.5 px-2 text-center font-semibold">
                          {s.jenisKelamin}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                          {s.tingkat}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                          {s.rombel}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {s.sekolahAsal?.namaSd || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'AKTIF'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : s.status === 'LULUS'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length > 25 && (
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                    Menampilkan 25 dari {filteredStudents.length} siswa. Seluruh{' '}
                    {filteredStudents.length} data akan disertakan saat mengekspor ke Excel (.xlsx).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: IMPORT EXCEL (.XLSX / .XLS) & CSV                              */}
      {/* ===================================================================== */}
      {subTab === 'IMPORT' && (
        <div className="space-y-5">
          {/* Upload Dropzone Card */}
          <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors text-center">
            <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-900">
              Unggah File Excel (.xlsx / .xls) atau CSV Data Siswa Dapodik
            </h3>
            <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1 mb-4">
              Sistem otomatis mendeteksi header kolom standar Dapodik maupun Template Buku Induk, mengonversi format tanggal Excel, serta memvalidasi NISN/NIS sebelum commit.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                <UploadCloud className="w-4 h-4" />
                <span>{isProcessing ? 'Memproses File...' : 'Pilih File Excel (.xlsx) / CSV'}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadXlsxTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Unduh Template .xlsx</span>
              </button>
            </div>

            {fileName && (
              <div className="mt-3 text-xs font-mono text-blue-700 font-semibold">
                File aktif: {fileName} {detectedSheet ? `(Sheet: ${detectedSheet})` : ''}
              </div>
            )}
          </div>

          {/* Staging Validation Preview Table */}
          {stagedRows.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-4 p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pratinjau Staging Impor ({stagedRows.length} Baris)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Periksa hasil pemetaan kolom di bawah. Aktifkan mode Upsert jika ingin memperbarui biodata/rombel siswa lama yang NIS/NISN-nya sudah terdaftar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="text-xs flex items-center gap-1.5 font-mono tabular-nums">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      BARU: {newCount}
                    </span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      SUDAH ADA: {conflictCount}
                    </span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      ERROR: {errorCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitStaging}
                    disabled={commitableCount === 0 || isProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Menyimpan...'
                        : `Commit ${commitableCount} Data ke Buku Induk`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Upsert Toggle */}
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowUpsert}
                  onChange={(e) => setAllowUpsert(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Perbarui otomatis data siswa yang sudah ada berdasarkan kecocokan{' '}
                  <strong>NISN / NIS</strong> (Upsert — nilai rapor &amp; dokumen digital tetap aman).
                </span>
              </label>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                      <th className="py-2.5 px-3 w-12 text-center">Baris</th>
                      <th className="py-2.5 px-3">NIS</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-2 text-center">L/P</th>
                      <th className="py-2.5 px-3 text-center">Tingkat / Rombel</th>
                      <th className="py-2.5 px-3 text-center">Status Impor</th>
                      <th className="py-2.5 px-3">Keterangan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stagedRows.map((r) => (
                      <tr key={r.rowNum} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono tabular-nums">
                          {r.rowNum}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium tabular-nums">
                          {r.nis}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium tabular-nums">
                          {r.nisn || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {r.namaLengkap || '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">{r.jenisKelamin}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-blue-700">
                          {r.tingkat} · {r.rombel}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                              r.statusKlasifikasi === 'NEW'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.statusKlasifikasi === 'CONFLICT'
                                ? allowUpsert
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {r.statusKlasifikasi === 'NEW' && <CheckCircle2 className="w-3 h-3" />}
                            {r.statusKlasifikasi === 'CONFLICT' && <RefreshCw className="w-3 h-3" />}
                            {r.statusKlasifikasi === 'ERROR' && <AlertCircle className="w-3 h-3" />}
                            <span>
                              {r.statusKlasifikasi === 'NEW'
                                ? 'BARU'
                                : r.statusKlasifikasi === 'CONFLICT'
                                ? allowUpsert
                                  ? 'PERBARUI'
                                  : 'DUPLIKAT'
                                : 'ERROR'}
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {r.pesanValidasi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PENGATURAN MATA PELAJARAN (MAPEL), KODE DAPODIK & KKTP         */}
      {/* ===================================================================== */}
      {subTab === 'MAPEL' && (
        <div className="space-y-5">
          {/* Control Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pengaturan Mata Pelajaran (Mapel), Kode Dapodik &amp; KKTP
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hanya mata pelajaran berstatus <strong>Aktif</strong> yang disertakan pada sheet Nilai Mapel saat ekspor Excel (.xlsx) dan panduan template Dapodik.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetDefaultMapel}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar (17 Mapel)</span>
              </button>
              <button
                type="button"
                onClick={handleSaveMapelSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan Mapel</span>
              </button>
            </div>
          </div>

          {/* Add New Subject Inline Form */}
          <form
            onSubmit={handleAddMapel}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Kode Dapodik
              </label>
              <input
                type="text"
                value={newMapelKode}
                onChange={(e) => setNewMapelKode(e.target.value)}
                placeholder="mis. MULOK-KOD"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Nama Mata Pelajaran Baru
              </label>
              <input
                type="text"
                value={newMapelNama}
                onChange={(e) => setNewMapelNama(e.target.value)}
                placeholder="mis. Muatan Lokal: Koding & Kecerdasan Artifisial"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Kategori
              </label>
              <select
                value={newMapelKategori}
                onChange={(e) =>
                  setNewMapelKategori(e.target.value as MapelConfigItem['kategori'])
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WAJIB">Mata Pelajaran Wajib</option>
                <option value="SENI_PRAKARYA">Seni &amp; Prakarya</option>
                <option value="MULOK">Muatan Lokal (Mulok)</option>
                <option value="BK">Layanan BK</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                KKTP
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={newMapelKktp}
                onChange={(e) => setNewMapelKktp(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Mapel</span>
              </button>
            </div>
          </form>

          {/* Editable Mapel Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 w-32">Kode Dapodik</th>
                    <th className="py-2.5 px-3">Nama Mata Pelajaran</th>
                    <th className="py-2.5 px-3 w-44">Kategori</th>
                    <th className="py-2.5 px-3 w-24 text-center">KKTP</th>
                    <th className="py-2.5 px-3 w-28 text-center">Status Ekspor</th>
                    <th className="py-2.5 px-3 w-14 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mapelDraft.map((mp, idx) => (
                    <tr
                      key={mp.id}
                      className={mp.aktif ? 'hover:bg-slate-50' : 'bg-slate-50/60 opacity-75'}
                    >
                      <td className="py-2 px-3 text-center text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={mp.kodeDapodik}
                          onChange={(e) =>
                            handleChangeMapelField(
                              mp.id,
                              'kodeDapodik',
                              e.target.value.toUpperCase()
                            )
                          }
                          className="w-full px-2 py-1 text-xs font-mono font-semibold bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={mp.nama}
                          onChange={(e) =>
                            handleChangeMapelField(mp.id, 'nama', e.target.value)
                          }
                          className="w-full px-2.5 py-1 text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={mp.kategori}
                          onChange={(e) =>
                            handleChangeMapelField(
                              mp.id,
                              'kategori',
                              e.target.value as MapelConfigItem['kategori']
                            )
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {Object.entries(KATEGORI_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={mp.kktp}
                          onChange={(e) =>
                            handleChangeMapelField(
                              mp.id,
                              'kktp',
                              Math.max(0, Math.min(100, Number(e.target.value) || 0))
                            )
                          }
                          className="w-16 px-2 py-1 text-xs text-center font-bold tabular-nums bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleMapelAktif(mp.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                            mp.aktif
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {mp.aktif ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>AKTIF</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              <span>NONAKTIF</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteMapel(mp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Hapus Mapel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
