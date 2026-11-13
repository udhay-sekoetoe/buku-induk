import React, { useState } from 'react';
import { History, Search, Shield, User, Clock, FileText } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchOp = log.operatorName.toLowerCase().includes(q) || log.operatorEmail.toLowerCase().includes(q);
      const matchStudent = (log.studentName || '').toLowerCase().includes(q);
      if (!matchDetails && !matchOp && !matchStudent) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Audit Log & Jejak Rekam Transaksi TU</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan append-only terhadap seluruh perubahan data master peserta didik, penerbitan lembar cetak, dan verifikasi berkas.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Total Rekaman: <strong>{logs.length}</strong> Entri
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktivitas, operator, atau nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Jenis Aksi</option>
            <option value="TAMBAH_SISWA">Pendaftaran Siswa Baru</option>
            <option value="UPDATE_BIODATA">Pembaruan Biodata</option>
            <option value="MUTASI_SISWA">Mutasi / Kelulusan</option>
            <option value="VERIFIKASI_BERKAS">Verifikasi Dokumen</option>
            <option value="CETAK_BUKU_INDUK">Cetak Lembar Buku Induk</option>
            <option value="APPROVAL_SUPER_ADMIN">Approval Super Admin</option>
            <option value="UPDATE_PROFIL">Pembaruan Profil Akun</option>
            <option value="RESET_PASSWORD">Ganti / Reset Password</option>
            <option value="EKSPOR_LEGGER">Ekspor Legger Nilai</option>
            <option value="IMPOR_LEGGER">Impor Legger Nilai</option>
            <option value="IMPOR_DATA">Impor Batch CSV</option>
            <option value="LOGIN_SESI">Masuk Sesi (Login)</option>
            <option value="LOGOUT_SESI">Keluar Sesi (Log Out)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Waktu (WIB)</th>
                <th className="py-3 px-3">Operator TU</th>
                <th className="py-3 px-3">Peran Akun</th>
                <th className="py-3 px-3">Jenis Tindakan</th>
                <th className="py-3 px-3">Siswa Terkait</th>
                <th className="py-3 px-4">Deskripsi Rincian Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada aktivitas yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{log.operatorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.operatorEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.action === 'TAMBAH_SISWA'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : log.action === 'MUTASI_SISWA'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : log.action === 'VERIFIKASI_BERKAS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action === 'HAPUS_SISWA' || log.action === 'LOGOUT_SESI'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : log.action === 'APPROVAL_SUPER_ADMIN'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : log.action === 'RESET_PASSWORD' || log.action === 'UPDATE_PROFIL'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : log.action === 'EKSPOR_LEGGER' || log.action === 'IMPOR_LEGGER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : log.action === 'LOGIN_SESI'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {log.studentName || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs leading-relaxed">
                      {log.details}
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
