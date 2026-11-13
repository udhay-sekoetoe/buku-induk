import React, { useMemo, useState } from 'react';
import { X, FileDown, Printer, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { BukuIndukSettings, Student, UserRole } from '../types';
import { DEFAULT_LOGO_SMPN99 } from '../data/defaultSettings';
import {
  getFormattedPrintDate,
  resolveSignatureSlot,
  resolveWaliKelasForStudent,
  ResolvedSignature,
} from '../utils/printHelpers';
import { generateRecapStudentsPdf } from '../utils/recapPdfGenerator';
import { storageService } from '../services/storageService';

interface RecapPdfModalProps {
  students: Student[];
  settings: BukuIndukSettings;
  operator: { name: string; email: string; role: UserRole };
  onClose: () => void;
  onDownloaded?: (fileName: string) => void;
}

const compareRombel = (a: string, b: string) =>
  a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' });

export const RecapPdfModal: React.FC<RecapPdfModalProps> = ({
  students,
  settings,
  operator,
  onClose,
  onDownloaded,
}) => {
  const [filterTingkat, setFilterTingkat] = useState<string>('ALL');
  const [filterRombel, setFilterRombel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadMsg, setDownloadMsg] = useState<string>('');

  const rombelOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (filterTingkat !== 'ALL' && s.tingkat !== filterTingkat) return;
      if (s.rombel) set.add(s.rombel);
    });
    return Array.from(set).sort(compareRombel);
  }, [students, filterTingkat]);

  const filteredStudents = useMemo(() => {
    return [...students]
      .filter((s) => {
        if (filterTingkat !== 'ALL' && s.tingkat !== filterTingkat) return false;
        if (filterRombel !== 'ALL' && s.rombel !== filterRombel) return false;
        if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => {
        const rDiff = compareRombel(a.rombel || '', b.rombel || '');
        if (rDiff !== 0) return rDiff;
        const numA = a.nomorUrutPresensi ?? Number.MAX_SAFE_INTEGER;
        const numB = b.nomorUrutPresensi ?? Number.MAX_SAFE_INTEGER;
        if (numA !== numB) return numA - numB;
        return a.namaLengkap.localeCompare(b.namaLengkap, 'id');
      });
  }, [students, filterTingkat, filterRombel, filterStatus]);

  const rombelSummaries = useMemo(() => {
    const map = new Map<string, Student[]>();
    filteredStudents.forEach((s) => {
      const key = s.rombel || '-';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => compareRombel(a, b))
      .map(([rombel, list]) => {
        const wali = resolveWaliKelasForStudent(settings, list[0]);
        return {
          rombel,
          tingkat: list[0]?.tingkat || '-',
          waliNama: wali.nama,
          laki: list.filter((s) => s.jenisKelamin === 'L').length,
          perempuan: list.filter((s) => s.jenisKelamin === 'P').length,
          aktif: list.filter((s) => s.status === 'AKTIF').length,
          lainnya: list.filter((s) => s.status !== 'AKTIF').length,
          total: list.length,
        };
      });
  }, [filteredStudents, settings]);

  const total = filteredStudents.length;
  const aktifCount = filteredStudents.filter((s) => s.status === 'AKTIF').length;
  const mutasiCount = filteredStudents.filter((s) => s.status === 'MUTASI_KELUAR').length;
  const lulusCount = filteredStudents.filter((s) => s.status === 'LULUS').length;
  const boysCount = filteredStudents.filter((s) => s.jenisKelamin === 'L').length;
  const girlsCount = filteredStudents.filter((s) => s.jenisKelamin === 'P').length;
  const completeDocsCount = filteredStudents.filter(
    (s) =>
      s.dokumen &&
      s.dokumen.length >= 3 &&
      s.dokumen.every((d) => d.statusVerifikasi === 'TERVERIFIKASI')
  ).length;

  const formattedDate = getFormattedPrintDate(settings);
  const logoSizePx = settings.ukuranLogoPx || 56;
  const kopBorderClass =
    settings.gayaGarisKop === 'TANPA_GARIS'
      ? 'border-b-0 pb-1'
      : settings.gayaGarisKop === 'TUNGGAL'
      ? 'border-b-2 border-solid border-black pb-2'
      : 'border-b-4 border-double border-black pb-2';

  const pageSizeCss =
    settings.tataLetak.ukuranKertas === 'F4'
      ? '215mm 330mm'
      : settings.tataLetak.ukuranKertas === 'Legal'
      ? 'legal portrait'
      : 'A4 portrait';

  const pageMarginCss =
    settings.tataLetak.margin === 'RAPAT'
      ? '7mm 8mm 8mm 8mm'
      : settings.tataLetak.margin === 'LEBAR'
      ? '15mm 15mm 15mm 15mm'
      : '10mm 12mm 12mm 12mm';

  const sigKiri = resolveSignatureSlot(settings.tandaTangan.kiri, settings, filteredStudents[0]);
  const sigKanan = resolveSignatureSlot(settings.tandaTangan.kanan, settings, filteredStudents[0]);
  const showPengawasMiddle =
    settings.tandaTangan.tampilkanTengahPengawas ||
    settings.tataLetak.tampilkanPengawasPemeriksa;

  const handleSelectTingkat = (val: string) => {
    setFilterTingkat(val);
    if (val !== 'ALL' && filterRombel !== 'ALL') {
      const stillValid = students.some((s) => s.tingkat === val && s.rombel === filterRombel);
      if (!stillValid) setFilterRombel('ALL');
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadMsg('');
    try {
      const { fileName, totalIncluded } = await generateRecapStudentsPdf({
        students,
        settings,
        scope: {
          tingkat: filterTingkat,
          rombel: filterRombel,
          status: filterStatus,
        },
        operator,
      });

      storageService.addAuditLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operatorEmail: operator.email,
        operatorName: operator.name,
        role: operator.role,
        action: 'CETAK_BUKU_INDUK',
        details: `Mengunduh Laporan Rekapitulasi Data Siswa PDF (${totalIncluded} siswa) dengan format KOP surat resmi: ${fileName}`,
      });

      setDownloadMsg(`Berhasil mengunduh: ${fileName}`);
      onDownloaded?.(fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderSignatureBox = (sig: ResolvedSignature) => {
    if (!sig.tampilkan) return null;
    return (
      <div className="text-center">
        <div className="text-[10px] text-slate-600 min-h-[14px]">
          {sig.headerLine1 || '\u00A0'}
        </div>
        <div className="font-bold text-[10.5px]">{sig.labelJabatan}</div>
        <div className="h-14 flex items-center justify-center text-slate-300 text-[8.5px] italic">
          {sig.tampilkanStempelArea ? '[ Tanda Tangan & Stempel ]' : '[ Tanda Tangan ]'}
        </div>
        <div className="font-bold underline uppercase text-[10px]">{sig.nama}</div>
        {sig.tampilkanNip && (
          <div className="text-[8.5px] font-mono text-slate-600">
            {sig.nip.startsWith('NIS') || sig.nip.startsWith('NIP') ? sig.nip : `NIP. ${sig.nip}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <style media="print">{`
        @page {
          size: ${pageSizeCss};
          margin: ${pageMarginCss};
        }
      `}</style>

      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print-container">
        {/* Top Modal Control Bar */}
        <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-600 rounded-lg text-white shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                Laporan Rekapitulasi Data Siswa (PDF)
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Desain KOP surat, ukuran kertas ({settings.tataLetak.ukuranKertas}), & tanda tangan mengikuti Pengaturan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              <span>{isDownloading ? 'Menyusun PDF...' : 'Unduh PDF (.pdf)'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Browser</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Tutup pratinjau laporan rekapitulasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scope Filter Bar */}
        <div className="no-print bg-slate-800 text-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold">Cakupan Laporan:</span>

            <select
              value={filterTingkat}
              onChange={(e) => handleSelectTingkat(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="VII">Kelas VII</option>
              <option value="VIII">Kelas VIII</option>
              <option value="IX">Kelas IX</option>
            </select>

            <select
              value={filterRombel}
              onChange={(e) => setFilterRombel(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Rombel</option>
              {rombelOptions.map((r) => (
                <option key={r} value={r}>
                  Kelas {r}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="MUTASI_KELUAR">Mutasi Keluar</option>
              <option value="LULUS">Lulus</option>
            </select>
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums text-[11px]">
            {downloadMsg ? (
              <span className="text-emerald-300 flex items-center gap-1 font-sans font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {downloadMsg}
              </span>
            ) : (
              <span className="text-slate-300">{total} siswa tercakup dalam laporan</span>
            )}
          </div>
        </div>

        {/* Printable Document Viewport */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible font-sans text-black leading-relaxed text-[11px]">
          <div className="max-w-[820px] mx-auto print:max-w-none space-y-4">
            {/* KOP SURAT RESMI (KONSISTEN DENGAN PENGATURAN & PRINT CENTER) */}
            {settings.tampilkanKopSurat && (
              <div className={`${kopBorderClass} text-center font-serif text-black`}>
                <div className="flex items-center justify-between gap-3">
                  {settings.tampilkanLogoDinas && settings.logoDinasUrl ? (
                    <img
                      src={settings.logoDinasUrl}
                      alt="Logo Dinas Pendidikan"
                      style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                      className="object-contain shrink-0"
                    />
                  ) : (
                    <div
                      style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                      className="shrink-0"
                    />
                  )}

                  <div className="flex-1 space-y-0.5 font-sans">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-black">
                      {settings.headerKopBaris1}
                    </div>
                    <div className="text-[11px] font-extrabold uppercase text-black">
                      {settings.headerKopBaris2}
                    </div>
                    <div className="text-[13px] font-black uppercase text-black tracking-wide">
                      {settings.headerKopBaris3}
                    </div>
                    <div className="text-[9.5px] text-slate-700">{settings.headerKopAlamat}</div>
                    <div className="text-[9px] text-slate-600 font-mono">
                      {settings.headerKopKontak}
                    </div>
                  </div>

                  {settings.tampilkanLogoSekolah ? (
                    <img
                      src={settings.logoSekolahUrl || DEFAULT_LOGO_SMPN99}
                      alt="Logo SMP Negeri 99 Jakarta"
                      style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                      className="object-contain shrink-0"
                    />
                  ) : (
                    <div
                      style={{ width: `${logoSizePx}px`, height: `${logoSizePx}px` }}
                      className="shrink-0"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Judul Laporan */}
            <div className="text-center space-y-0.5">
              <h3 className="text-xs font-black tracking-wide uppercase text-black">
                LAPORAN REKAPITULASI DATA INDUK PESERTA DIDIK
              </h3>
              <p className="text-[10px] text-slate-700">
                Tahun Ajaran {settings.tahunAjaranAktif} ({settings.semesterAktif}) · Cakupan:{' '}
                {filterTingkat === 'ALL' ? 'Semua Tingkat' : `Tingkat ${filterTingkat}`} ·{' '}
                {filterRombel === 'ALL' ? 'Semua Rombel' : `Kelas ${filterRombel}`} ·{' '}
                {filterStatus === 'ALL' ? 'Semua Status' : filterStatus.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Bagian A: Ringkasan Statistik */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-bold text-slate-900">
                A. Ringkasan Statistik Peserta Didik
              </div>
              <table className="w-full border-collapse border border-slate-400 text-[10px] text-center">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="border border-slate-400 py-1.5 px-2">Total Siswa</th>
                    <th className="border border-slate-400 py-1.5 px-2">Aktif</th>
                    <th className="border border-slate-400 py-1.5 px-2">Mutasi Keluar</th>
                    <th className="border border-slate-400 py-1.5 px-2">Lulus</th>
                    <th className="border border-slate-400 py-1.5 px-2">Laki-Laki (L)</th>
                    <th className="border border-slate-400 py-1.5 px-2">Perempuan (P)</th>
                    <th className="border border-slate-400 py-1.5 px-2">Berkas Lengkap</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-mono tabular-nums font-bold">
                    <td className="border border-slate-400 py-1.5 px-2">{total} siswa</td>
                    <td className="border border-slate-400 py-1.5 px-2">{aktifCount}</td>
                    <td className="border border-slate-400 py-1.5 px-2">{mutasiCount}</td>
                    <td className="border border-slate-400 py-1.5 px-2">{lulusCount}</td>
                    <td className="border border-slate-400 py-1.5 px-2">
                      {boysCount} ({total ? Math.round((boysCount / total) * 100) : 0}%)
                    </td>
                    <td className="border border-slate-400 py-1.5 px-2">
                      {girlsCount} ({total ? Math.round((girlsCount / total) * 100) : 0}%)
                    </td>
                    <td className="border border-slate-400 py-1.5 px-2">
                      {completeDocsCount}/{total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bagian B: Rekapitulasi per Rombel */}
            {rombelSummaries.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10.5px] font-bold text-slate-900">
                  B. Rekapitulasi per Rombongan Belajar (Rombel)
                </div>
                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-400 py-1 px-2 text-center w-8">No</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">Rombel</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">Tingkat</th>
                      <th className="border border-slate-400 py-1 px-2 text-left">Wali Kelas</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">L</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">P</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">Aktif</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">Mutasi/Lulus</th>
                      <th className="border border-slate-400 py-1 px-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rombelSummaries.map((row, idx) => (
                      <tr key={row.rombel}>
                        <td className="border border-slate-400 py-1 px-2 text-center font-mono tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 py-1 px-2 text-center font-bold">
                          {row.rombel}
                        </td>
                        <td className="border border-slate-400 py-1 px-2 text-center">
                          {row.tingkat}
                        </td>
                        <td className="border border-slate-400 py-1 px-2">{row.waliNama}</td>
                        <td className="border border-slate-400 py-1 px-2 text-center font-mono tabular-nums">
                          {row.laki}
                        </td>
                        <td className="border border-slate-400 py-1 px-2 text-center font-mono tabular-nums">
                          {row.perempuan}
                        </td>
                        <td className="border border-slate-400 py-1 px-2 text-center font-mono tabular-nums">
                          {row.aktif}
                        </td>
                        <td className="border border-slate-400 py-1 px-2 text-center font-mono tabular-nums">
                          {row.lainnya}
                        </td>
                        <td className="border border-slate-400 py-1 px-2 text-center font-mono tabular-nums font-bold">
                          {row.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bagian C: Daftar Lengkap Peserta Didik */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-bold text-slate-900">
                C. Daftar Rekapitulasi Data Siswa
              </div>
              <table className="w-full border-collapse border border-slate-400 text-[9.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="border border-slate-400 py-1.5 px-1.5 text-center w-8">No</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-left">NIS / NISN</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-left">
                      Nama Lengkap Siswa
                    </th>
                    <th className="border border-slate-400 py-1.5 px-1.5 text-center">L/P</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 text-center">Rombel</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-left">Asal SD</th>
                    <th className="border border-slate-400 py-1.5 px-1.5 text-center">Berkas</th>
                    <th className="border border-slate-400 py-1.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-slate-400 py-4 text-center text-slate-500">
                        Tidak ada data siswa sesuai cakupan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const verifiedDocs =
                        s.dokumen?.filter((d) => d.statusVerifikasi === 'TERVERIFIKASI')
                          .length || 0;
                      const totalDocs = s.dokumen?.length || 0;
                      return (
                        <tr key={s.id} className={idx % 2 === 1 ? 'bg-slate-50/80' : ''}>
                          <td className="border border-slate-400 py-1 px-1.5 text-center font-mono tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-400 py-1 px-2 font-mono tabular-nums whitespace-nowrap">
                            <div className="font-semibold">{s.nis}</div>
                            <div className="text-[8.5px] text-slate-600">{s.nisn}</div>
                          </td>
                          <td className="border border-slate-400 py-1 px-2 font-semibold">
                            {s.namaLengkap}
                          </td>
                          <td className="border border-slate-400 py-1 px-1.5 text-center font-mono">
                            {s.jenisKelamin}
                          </td>
                          <td className="border border-slate-400 py-1 px-1.5 text-center font-bold">
                            {s.rombel}
                          </td>
                          <td className="border border-slate-400 py-1 px-2">
                            {s.sekolahAsal?.namaSd || '-'}
                          </td>
                          <td className="border border-slate-400 py-1 px-1.5 text-center font-mono tabular-nums">
                            {verifiedDocs}/{totalDocs}
                          </td>
                          <td className="border border-slate-400 py-1 px-2 text-center font-semibold">
                            {s.status.replace(/_/g, ' ')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bagian D: Tanda Tangan Resmi */}
            <div
              className={`pt-5 grid gap-4 ${
                showPengawasMiddle ? 'grid-cols-3' : 'grid-cols-2'
              }`}
            >
              <div>{renderSignatureBox(sigKiri)}</div>
              {showPengawasMiddle && (
                <div className="text-center">
                  <div className="text-[10px] text-slate-600 min-h-[14px]">Diperiksa oleh,</div>
                  <div className="font-bold text-[10.5px]">Pengawas Pembina</div>
                  <div className="h-14 flex items-center justify-center text-slate-300 text-[8.5px] italic">
                    [ Paraf / Pemeriksa ]
                  </div>
                  <div className="font-bold underline uppercase text-[10px]">
                    {settings.namaPengawas}
                  </div>
                  <div className="text-[8.5px] font-mono text-slate-600">
                    NIP. {settings.nipPengawas}
                  </div>
                </div>
              )}
              <div>{renderSignatureBox(sigKanan)}</div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-500 flex justify-between font-mono">
              <span>Buku Induk Digital SMP Negeri 99 Jakarta (NPSN 20103565)</span>
              <span>
                Dicetak: {settings.kotaTitimangsa || 'Jakarta'}, {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
