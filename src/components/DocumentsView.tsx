import React, { useState } from 'react';
import {
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Student, VerificationStatus, UserRole } from '../types';

interface DocumentsViewProps {
  students: Student[];
  onVerifyDocument: (studentId: string, docId: string, status: VerificationStatus, note: string) => void;
  onSelectStudent: (student: Student) => void;
  activeRole: UserRole;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  students,
  onVerifyDocument,
  onSelectStudent,
  activeRole,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Collect all documents flattened with student info
  const allDocs = students.flatMap((s) =>
    (s.dokumen || []).map((d) => ({
      ...d,
      studentName: s.namaLengkap,
      nis: s.nis,
      nisn: s.nisn,
      rombel: s.rombel,
      student: s,
    }))
  );

  const filteredDocs = allDocs.filter((item) => {
    if (statusFilter !== 'ALL' && item.statusVerifikasi !== statusFilter) return false;
    if (docTypeFilter !== 'ALL' && item.jenisDokumen !== docTypeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.studentName.toLowerCase().includes(q);
      const matchNis = item.nis.toLowerCase().includes(q);
      const matchDoc = item.jenisDokumen.toLowerCase().includes(q);
      if (!matchName && !matchNis && !matchDoc) return false;
    }
    return true;
  });

  const verifiedCount = allDocs.filter((d) => d.statusVerifikasi === 'TERVERIFIKASI').length;
  const pendingCount = allDocs.filter((d) => d.statusVerifikasi === 'MENUNGGU_VERIFIKASI').length;
  const needFixCount = allDocs.filter((d) => d.statusVerifikasi === 'PERLU_PERBAIKAN').length;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Dokumen Terdaftar</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">{allDocs.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Akta, KK, Ijazah SD, SKL</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-medium">Berkas Terverifikasi</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">{verifiedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sesuai dokumen asli</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-700 font-medium">Menunggu Verifikasi</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">{pendingCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Antrean validasi TU</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-rose-700 font-medium">Perlu Perbaikan</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono tabular-nums">{needFixCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scan buram / tidak lengkap</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa atau jenis berkas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status Verifikasi</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
          </select>

          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Jenis Dokumen</option>
            <option value="Akta Kelahiran">Akta Kelahiran</option>
            <option value="Kartu Keluarga">Kartu Keluarga</option>
            <option value="Ijazah SD/MI">Ijazah SD/MI</option>
            <option value="Pas Foto Resmi">Pas Foto Resmi</option>
            <option value="Surat Keterangan Pindah">Surat Mutasi</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Nama Siswa & NIS</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Jenis Dokumen</th>
                <th className="py-3 px-3">Nama File & Ukuran</th>
                <th className="py-3 px-3">Tgl Unggah</th>
                <th className="py-3 px-3 text-center">Status Verifikasi</th>
                <th className="py-3 px-3">Catatan Verifikator</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada berkas yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredDocs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectStudent(item.student)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left block"
                      >
                        {item.studentName}
                      </button>
                      <span className="font-mono text-[10px] text-slate-500">NIS: {item.nis}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">Kelas {item.rombel}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.jenisDokumen}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                      {item.fileName} ({item.fileSize})
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{item.uploadDate}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.statusVerifikasi === 'TERVERIFIKASI'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.statusVerifikasi === 'MENUNGGU_VERIFIKASI'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.statusVerifikasi}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 italic max-w-[160px] truncate">
                      {item.catatan || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            onVerifyDocument(item.studentId, item.id, 'TERVERIFIKASI', 'Sesuai dokumen asli.')
                          }
                          title="Setujui Verifikasi"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Alasan perbaikan berkas:', 'Scan halaman belakang tidak terbaca jelas');
                            if (note) onVerifyDocument(item.studentId, item.id, 'PERLU_PERBAIKAN', note);
                          }}
                          title="Minta Perbaikan"
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Perbaikan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
