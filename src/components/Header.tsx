import React from 'react';
import { Search, Plus, RefreshCw, Menu, PanelLeft, PanelLeftClose, LogOut } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  canAddStudent?: boolean;
  onLogoutRequest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onResetData,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileMenu,
  canAddStudent = true,
  onLogoutRequest,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard & Statistik Buku Induk';
      case 'students':
        return 'Master Buku Induk Peserta Didik';
      case 'documents':
        return 'Verifikasi Kelengkapan Berkas Digital';
      case 'mutations':
        return 'Buku Register Mutasi & Kelulusan';
      case 'print-center':
        return 'Pusat Cetak Lembar Buku Induk Resmi';
      case 'accounts':
        return 'Daftar Akun Wali Kelas, TU & Operator';
      case 'legger':
        return 'Export & Rekap Legger Tahun Ajaran Sebelumnya';
      case 'settings':
        return 'Pengaturan Buku Induk & Hak Akses';
      case 'import-export':
        return 'Impor & Ekspor Data Master Siswa';
      case 'gas-integration':
        return 'Integrasi Google Apps Script (GAS) & Sheets';
      case 'audit-log':
        return 'Audit Log & Jejak Rekam Transaksi TU';
      default:
        return 'Buku Induk Digital SMPN 99 Jakarta';
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8 shrink-0 select-none">
      {/* Zone 1: Sidebar Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Toggle Button */}
        <button
          onClick={onOpenMobileMenu}
          title="Buka Menu Taskbar"
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse / Expand Toggle */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Buka Taskbar Menu (Ctrl+B)' : 'Sembunyikan Taskbar Menu (Ctrl+B)'}
          className="hidden md:flex p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0 items-center justify-center"
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4.5 h-4.5 text-blue-600" />
          ) : (
            <PanelLeftClose className="w-4.5 h-4.5 text-slate-500" />
          )}
        </button>

        <div className="min-w-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5 truncate">
            <span>SMP Negeri 99 Jakarta</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">NPSN 20103565</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            {getTabTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Zone 2: Global Search Bar (shown on xl+ to avoid squeezing split-screen viewports) */}
      <div className="flex-1 max-w-md hidden xl:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, atau NISN..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResetData}
          title="Reset ke data awal contoh jika perlu"
          className="hidden sm:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-xs items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-xs">Reset Contoh</span>
        </button>

        {canAddStudent && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Tambah Siswa</span>
          </button>
        )}

        {onLogoutRequest && (
          <button
            type="button"
            onClick={onLogoutRequest}
            title="Keluar / Log Out dari sesi"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};
