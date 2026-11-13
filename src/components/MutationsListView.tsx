import React, { useState } from 'react';
import { GraduationCap, ArrowRightLeft, FileText, Printer, CheckCircle2, Search } from 'lucide-react';
import { Student } from '../types';

interface MutationsListViewProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onPrintStudent: (student: Student) => void;
}

export const MutationsListView: React.FC<MutationsListViewProps> = ({
  students,
  onSelectStudent,
  onPrintStudent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'MUTASI' | 'LULUS'>('MUTASI');
  const [search, setSearch] = useState<string>('');

  const mutasiList = students.filter((s) => s.status === 'MUTASI_KELUAR' && s.mutasi);
  const lulusList = students.filter((s) => s.status === 'LULUS');

  const displayList = (activeSubTab === 'MUTASI' ? mutasiList : lulusList).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.namaLengkap.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      (s.mutasi?.noSurat && s.mutasi.noSurat.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Buku Register Mutasi & Kelulusan Siswa</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan legalitas peserta didik yang berpindah satuan pendidikan maupun yang telah menyelesaikan masa studi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('MUTASI')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeSubTab === 'MUTASI' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mutasi Keluar ({mutasiList.length})
            </button>
            <button
              onClick={() => setActiveSubTab('LULUS')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeSubTab === 'LULUS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alumni / Lulus ({lulusList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Nomor Surat / SKL</th>
                <th className="py-3 px-3">Nama Siswa & NIS</th>
                <th className="py-3 px-3">Tanggal Mutasi</th>
                <th className="py-3 px-3">Sekolah Tujuan / Lanjutan</th>
                <th className="py-3 px-3">Alasan Kepindahan</th>
                <th className="py-3 px-3">Pengesahan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Belum ada data register pada kategori ini
                  </td>
                </tr>
              ) : (
                displayList.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {s.mutasi?.noSurat || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onSelectStudent(s)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left block"
                      >
                        {s.namaLengkap}
                      </button>
                      <span className="font-mono text-[10px] text-slate-500">
                        NIS: {s.nis} · Rombel Terakhir: {s.mutasi?.kelasSaatKeluar || s.rombel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{s.mutasi?.tanggal || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-blue-800">
                      {s.mutasi?.sekolahTujuan || '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {s.mutasi?.alasan || '-'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {s.mutasi?.disetujuiOleh || 'Kepala Sekolah'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onPrintStudent(s)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Lembar</span>
                      </button>
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
