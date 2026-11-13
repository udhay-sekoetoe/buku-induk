import React, { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  UploadCloud,
  Printer,
  CheckCircle2,
  Filter,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Student, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { generateDefaultSemesterGrades, STANDARD_SUBJECTS_TEMPLATE } from '../data/defaultGrades';

interface LeggerExportViewProps {
  students: Student[];
  operator: { name: string; email: string; role: UserRole };
  onOpenPrintTranskrip: (studentId: string) => void;
  onDataUpdated: () => void;
  canExportImport: boolean;
  canPrint: boolean;
}

export const LeggerExportView: React.FC<LeggerExportViewProps> = ({
  students,
  operator,
  onOpenPrintTranskrip,
  onDataUpdated,
  canExportImport,
  canPrint,
}) => {
  const [viewMode, setViewMode] = useState<'REKAP_6_SEM' | 'PER_TAHUN'>('REKAP_6_SEM');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('2024/2025');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedRombel, setSelectedRombel] = useState<string>('ALL');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const rombelList = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.rombel).filter(Boolean))).sort();
  }, [students]);

  // Discover all distinct Tahun Pelajaran across students' semester records
  const availableTahunAjaran = useMemo(() => {
    const set = new Set<string>(['2024/2025', '2025/2026', '2026/2027']);
    students.forEach((s) => {
      const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
      Object.values(riwayat).forEach((rec) => {
        if (rec?.tahunPelajaran) set.add(rec.tahunPelajaran);
      });
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => (selectedRombel === 'ALL' ? true : s.rombel === selectedRombel));
  }, [students, selectedRombel]);

  const coreSubjectPreview = useMemo(
    () => STANDARD_SUBJECTS_TEMPLATE.filter((m) => !m.isSubItem).slice(0, 9),
    []
  );

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportRekap6Sem = () => {
    const csv = storageService.exportLeggerRekap6SemesterCsv(filteredStudents);
    downloadCsv(
      csv,
      `Legger_Rekap_Sem1_sd_Sem6_SMPN99_${new Date().toISOString().slice(0, 10)}.csv`
    );
    storageService.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'EKSPOR_LEGGER',
      details: `Ekspor Legger Rekap Nilai Semester 1 s/d 6 (${filteredStudents.length} siswa) oleh ${operator.name}.`,
    });
    onDataUpdated();
    setStatusMsg({
      type: 'success',
      text: `Legger Rekap Semester 1–6 (${filteredStudents.length} siswa) berhasil diekspor ke CSV!`,
    });
  };

  const handleExportPerTahun = () => {
    const semNum = selectedSemester === 'ALL' ? undefined : Number(selectedSemester);
    const csv = storageService.exportLeggerCsv(filteredStudents, selectedTahunAjaran, semNum);
    const labelTahun = selectedTahunAjaran === 'ALL' ? 'Semua_TA' : selectedTahunAjaran.replace('/', '-');
    downloadCsv(
      csv,
      `Legger_Nilai_TA_${labelTahun}_${semNum ? `Sem${semNum}_` : ''}SMPN99.csv`
    );
    storageService.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'EKSPOR_LEGGER',
      details: `Ekspor Legger Nilai Tahun Ajaran ${selectedTahunAjaran}${semNum ? ` Semester ${semNum}` : ''} (${filteredStudents.length} siswa).`,
    });
    onDataUpdated();
    setStatusMsg({
      type: 'success',
      text: `Legger Tahun Ajaran ${selectedTahunAjaran} berhasil diekspor ke CSV!`,
    });
  };

  const handleDownloadLeggerTemplate = () => {
    const headers = [
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Semester (1-6)',
      'Tahun Pelajaran',
      'Kelas Rapor',
      ...STANDARD_SUBJECTS_TEMPLATE.map((m) => m.nama),
      'Sakit',
      'Izin',
      'Tanpa Keterangan',
    ];
    const sampleRows = filteredStudents.slice(0, 3).map((s) => {
      const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
      const semNum = selectedSemester === 'ALL' ? 1 : Number(selectedSemester);
      const rec = riwayat[semNum] || riwayat[1];
      const scores = STANDARD_SUBJECTS_TEMPLATE.map((tpl) => {
        const found = rec?.mataPelajaran.find((m) => m.nama === tpl.nama);
        return String(found ? found.nilaiAkhir : tpl.defaultBaseScore);
      });
      return [
        `"${s.nis}"`,
        `"${s.nisn}"`,
        `"${s.namaLengkap}"`,
        String(semNum),
        `"${selectedTahunAjaran === 'ALL' ? '2024/2025' : selectedTahunAjaran}"`,
        `"${rec?.kelas || s.rombel}"`,
        ...scores,
        String(rec?.ketidakhadiran?.sakit ?? 0),
        String(rec?.ketidakhadiran?.izin ?? 0),
        String(rec?.ketidakhadiran?.tanpaKeterangan ?? 0),
      ].join(',');
    });

    downloadCsv(
      '\uFEFF' + [headers.join(','), ...sampleRows].join('\r\n'),
      `Template_Impor_Legger_TA_Sebelumnya_SMPN99.csv`
    );
  };

  const handleImportLeggerCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setStatusMsg({ type: 'error', text: 'File CSV legger kosong atau format tidak sesuai.' });
        return;
      }

      const parseCsvLine = (line: string) => {
        const out: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            out.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        out.push(cur.trim());
        return out.map((c) => c.replace(/^"|"$/g, '').trim());
      };

      const headers = parseCsvLine(lines[0]);
      const parsedRows: Array<{
        nis: string;
        nisn: string;
        semesterNumber: number;
        tahunPelajaran: string;
        kelas?: string;
        scores: Record<string, number>;
        sakit?: number;
        izin?: number;
        alpa?: number;
      }> = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const nisIdx = headers.findIndex((h) => h.toLowerCase() === 'nis');
        const nisnIdx = headers.findIndex((h) => h.toLowerCase() === 'nisn');
        const semIdx = headers.findIndex((h) => h.toLowerCase().includes('semester'));
        const taIdx = headers.findIndex((h) => h.toLowerCase().includes('tahun pelajaran'));
        const kelasIdx = headers.findIndex((h) => h.toLowerCase().includes('kelas'));

        const nis = nisIdx >= 0 ? cols[nisIdx] || '' : cols[0] || '';
        const nisn = nisnIdx >= 0 ? cols[nisnIdx] || '' : cols[1] || '';
        const rawSem = semIdx >= 0 ? cols[semIdx] || '1' : '1';
        const semMatch = rawSem.match(/[1-6]/);
        const semesterNumber = semMatch ? Number(semMatch[0]) : 1;
        const tahunPelajaran =
          taIdx >= 0 && cols[taIdx]
            ? cols[taIdx]
            : selectedTahunAjaran === 'ALL'
            ? '2024/2025'
            : selectedTahunAjaran;
        const kelas = kelasIdx >= 0 ? cols[kelasIdx] : undefined;

        const scores: Record<string, number> = {};
        STANDARD_SUBJECTS_TEMPLATE.forEach((tpl) => {
          const mIdx = headers.findIndex(
            (h) => h.toLowerCase().trim() === tpl.nama.toLowerCase().trim()
          );
          if (mIdx >= 0 && cols[mIdx] !== undefined && cols[mIdx] !== '') {
            const val = Number(cols[mIdx]);
            if (!Number.isNaN(val)) scores[tpl.nama] = val;
          }
        });

        if (nis || nisn) {
          parsedRows.push({
            nis,
            nisn,
            semesterNumber,
            tahunPelajaran,
            kelas,
            scores,
          });
        }
      }

      const res = storageService.importLeggerRows(parsedRows, operator);
      if (res.success) {
        onDataUpdated();
        setStatusMsg({ type: 'success', text: res.message });
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Export & Rekap Legger Nilai Tahun Ajaran Sebelumnya
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Kelola dan ekspor arsip legger nilai dari Tahun Ajaran sebelumnya (2024/2025, 2025/2026) hingga 2026/2027 sehingga seluruh riwayat nilai Semester 1 sampai 6 tampil lengkap di Laporan Buku Induk Siswa.
            </p>
          </div>
        </div>

        {canExportImport && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportPerTahun}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Legger ({selectedTahunAjaran === 'ALL' ? 'Semua T.A.' : selectedTahunAjaran})</span>
            </button>

            <button
              type="button"
              onClick={handleExportRekap6Sem}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Export Rekap Sem 1–6 Lengkap</span>
            </button>
          </div>
        )}
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter & Impor Legger Tahun Ajaran Sebelumnya */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filter Tampilan & Export Legger</span>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('REKAP_6_SEM')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'REKAP_6_SEM'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Sem 1–6
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PER_TAHUN')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'PER_TAHUN'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Detail Mapel per T.A.
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tahun Ajaran
              </label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">Semua Tahun Ajaran</option>
                {availableTahunAjaran.map((ta) => (
                  <option key={ta} value={ta}>
                    T.A. {ta} {ta === '2026/2027' ? '(Aktif)' : '(Sebelumnya)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">Semua Semester (1 s/d 6)</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={String(n)}>
                    Semester {n} ({n % 2 === 1 ? 'Ganjil' : 'Genap'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Rombel / Kelas
              </label>
              <select
                value={selectedRombel}
                onChange={(e) => setSelectedRombel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">Semua Rombel ({students.length} siswa)</option>
                {rombelList.map((r) => (
                  <option key={r} value={r}>
                    Kelas {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Impor Arsip Legger T.A. Sebelumnya */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Muat / Impor Legger T.A. Lalu</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Unggah file CSV legger dari tahun ajaran lalu untuk langsung mengisi nilai Semester 1–6 pada Laporan Buku Induk Siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadLeggerTemplate}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Unduh Format CSV
            </button>

            {canExportImport && (
              <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                <span>Unggah CSV Legger</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImportLeggerCsv}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {viewMode === 'REKAP_6_SEM'
                ? 'Matriks Rekap Nilai Buku Induk Siswa (Semester 1 s/d Semester 6)'
                : `Pratinjau Detail Legger Nilai (${selectedTahunAjaran === 'ALL' ? 'Semua Tahun Ajaran' : `T.A. ${selectedTahunAjaran}`})`}
            </h2>
            <p className="text-[11px] text-slate-500">
              Menampilkan {filteredStudents.length} peserta didik · Klik tombol Laporan Buku Induk untuk melihat transkrip nilai Sem 1–6 lengkap per siswa.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'REKAP_6_SEM' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[10.5px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">NIS / NISN</th>
                  <th className="py-3 px-3 min-w-[180px]">Nama Peserta Didik</th>
                  <th className="py-3 px-2 text-center">Rombel</th>
                  <th className="py-3 px-2 text-center">Sem 1<div className="text-[9px] font-normal text-slate-400">2024/2025</div></th>
                  <th className="py-3 px-2 text-center">Sem 2<div className="text-[9px] font-normal text-slate-400">2024/2025</div></th>
                  <th className="py-3 px-2 text-center">Sem 3<div className="text-[9px] font-normal text-slate-400">2025/2026</div></th>
                  <th className="py-3 px-2 text-center">Sem 4<div className="text-[9px] font-normal text-slate-400">2025/2026</div></th>
                  <th className="py-3 px-2 text-center">Sem 5<div className="text-[9px] font-normal text-slate-400">2026/2027</div></th>
                  <th className="py-3 px-2 text-center">Sem 6<div className="text-[9px] font-normal text-slate-400">2026/2027</div></th>
                  <th className="py-3 px-2 text-center bg-blue-50/60 text-blue-900">Rata-Rata</th>
                  <th className="py-3 px-3 text-right">Laporan Buku Induk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => {
                  const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
                  const avgs = [1, 2, 3, 4, 5, 6].map((sem) => {
                    const list = riwayat[sem]?.mataPelajaran || [];
                    if (list.length === 0) return null;
                    return list.reduce((a, b) => a + (b.nilaiAkhir || 0), 0) / list.length;
                  });
                  const validAvgs = avgs.filter((v): v is number => v !== null);
                  const grand =
                    validAvgs.length > 0
                      ? (validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(1)
                      : '-';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        <div>{s.nis}</div>
                        <div className="text-[10px] text-slate-400">{s.nisn}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{s.namaLengkap}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">{s.rombel}</td>
                      {avgs.map((val, i) => (
                        <td key={i} className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-700">
                          {val !== null ? val.toFixed(1) : '-'}
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-center font-mono font-extrabold text-blue-700 bg-blue-50/40 tabular-nums">
                        {grand}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {canPrint && (
                          <button
                            type="button"
                            onClick={() => onOpenPrintTranskrip(s.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Nilai Sem 1–6</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-2.5">Nama Siswa</th>
                  <th className="py-2.5 px-2 text-center">T.A.</th>
                  <th className="py-2.5 px-2 text-center">Sem</th>
                  {coreSubjectPreview.map((m) => (
                    <th key={m.nama} className="py-2.5 px-2 text-center max-w-[72px] truncate" title={m.nama}>
                      {m.nama
                        .replace('Pendidikan Agama dan Budi Pekerti', 'PAI')
                        .replace('Pendidikan Pancasila', 'PKn')
                        .replace('Bahasa Indonesia', 'B.Indo')
                        .replace('Ilmu Pengetahuan Alam', 'IPA')
                        .replace('Ilmu Pengetahuan Sosial', 'IPS')
                        .replace('Bahasa Inggris', 'B.Ing')
                        .replace('Pendidikan Jasmani, Olahraga dan Kesehatan', 'PJOK')
                        .replace('Matematika', 'MTK')
                        .replace('Informatika', 'INF')}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center bg-blue-50/60 text-blue-900">Rata2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.flatMap((s) => {
                  const riwayat = s.riwayatNilai || generateDefaultSemesterGrades(s.namaLengkap, s.nis, 2024);
                  const semNums = selectedSemester === 'ALL' ? [1, 2, 3, 4, 5, 6] : [Number(selectedSemester)];
                  return semNums
                    .map((sem) => ({ sem, rec: riwayat[sem] }))
                    .filter(
                      ({ rec }) =>
                        rec &&
                        (selectedTahunAjaran === 'ALL' || rec.tahunPelajaran === selectedTahunAjaran)
                    )
                    .map(({ sem, rec }) => {
                      const total = rec.mataPelajaran.reduce((a, b) => a + (b.nilaiAkhir || 0), 0);
                      const avg =
                        rec.mataPelajaran.length > 0
                          ? (total / rec.mataPelajaran.length).toFixed(1)
                          : '-';
                      return (
                        <tr key={`${s.id}-${sem}`} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-semibold text-slate-900 whitespace-nowrap">
                            {s.namaLengkap} <span className="text-slate-400 font-mono">({s.rombel})</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-600 whitespace-nowrap">
                            {rec.tahunPelajaran}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                            S{sem}
                          </td>
                          {coreSubjectPreview.map((tpl) => {
                            const found = rec.mataPelajaran.find((m) => m.nama === tpl.nama);
                            return (
                              <td key={tpl.nama} className="py-2 px-2 text-center font-mono tabular-nums">
                                {found ? found.nilaiAkhir : '-'}
                              </td>
                            );
                          })}
                          <td className="py-2 px-2 text-center font-mono font-bold text-blue-700 bg-blue-50/40 tabular-nums">
                            {avg}
                          </td>
                        </tr>
                      );
                    });
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
