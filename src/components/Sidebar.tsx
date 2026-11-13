import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  FileText,
  UploadCloud,
  Code2,
  History,
  GraduationCap,
  School,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  X,
  Settings,
  Lock,
  LogOut,
  UserCog,
  FileSpreadsheet,
} from 'lucide-react';
import { AppUser, BukuIndukSettings, RolePermissions, UserRole } from '../types';
import { SMPN99_INFO } from '../data/mockData';
import { DEFAULT_LOGO_SMPN99 } from '../data/defaultSettings';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  totalStudents: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  settings: BukuIndukSettings;
  activeUser: AppUser;
  permissions: RolePermissions;
  onLogoutRequest: () => void;
  pendingApprovalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeRole,
  onRoleChange,
  totalStudents,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  settings,
  activeUser,
  permissions,
  onLogoutRequest,
  pendingApprovalCount = 0,
}) => {
  const menuItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    allowed: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard & Approval',
      icon: LayoutDashboard,
      badge: permissions.approvePermohonan && pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
      allowed: permissions.lihatDashboard,
    },
    {
      id: 'students',
      label: 'Master Buku Induk',
      icon: Users,
      badge: totalStudents,
      allowed: true,
    },
    {
      id: 'documents',
      label: 'Verifikasi Berkas',
      icon: FileCheck2,
      allowed: permissions.verifikasiDokumen,
    },
    {
      id: 'mutations',
      label: 'Mutasi & Kelulusan',
      icon: GraduationCap,
      allowed: permissions.prosesMutasi,
    },
    {
      id: 'legger',
      label: 'Export Legger (T.A. Lalu)',
      icon: FileSpreadsheet,
      allowed: permissions.imporEksporData,
    },
    {
      id: 'print-center',
      label: 'Pusat Cetak Lembar',
      icon: FileText,
      allowed: permissions.cetakBukuInduk,
    },
    {
      id: 'accounts',
      label: 'Daftar Akun & Rules Role',
      icon: UserCog,
      allowed: true,
    },
    {
      id: 'settings',
      label: 'Pengaturan Cetak & KOP',
      icon: Settings,
      allowed: permissions.kelolaPengaturan,
    },
    {
      id: 'import-export',
      label: 'Impor & Ekspor Siswa',
      icon: UploadCloud,
      allowed: permissions.imporEksporData,
    },
    {
      id: 'gas-integration',
      label: 'Integrasi Apps Script (GAS)',
      icon: Code2,
      allowed: true,
    },
    {
      id: 'audit-log',
      label: 'Log Audit & Aktivitas',
      icon: History,
      allowed: true,
    },
  ];

  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const getInitials = (name: string) => {
    const parts = name
      .replace(/,.*$/, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return 'TU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside - Visible at md (768px+) so split-screen previews always show the taskbar */}
      <aside
        className={`no-print fixed md:static top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none transition-all duration-200 ease-in-out ${
          isCollapsed ? 'md:w-[72px]' : 'md:w-64'
        } ${
          isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`p-3.5 border-b border-slate-800 flex items-center ${
            isCollapsed ? 'md:justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden"
              title="SMP Negeri 99 Jakarta · NPSN 20103565"
            >
              <img
                src={settings.logoSekolahUrl || DEFAULT_LOGO_SMPN99}
                alt="Logo SMPN 99"
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-white tracking-tight truncate">
                  SMP NEGERI 99
                </div>
                <div className="text-[10px] text-blue-400 font-medium truncate">
                  Buku Induk · NPSN 20103565
                </div>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Buka Taskbar Menu (Ctrl+B)' : 'Sembunyikan Taskbar Menu (Ctrl+B)'}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 ml-1"
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4 text-blue-400" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Indicator / Switcher */}
        {!isCollapsed ? (
          <div className="px-3.5 py-2 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px]">Peran:</span>
            </div>
            <select
              value={activeRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-[11px] bg-slate-900 text-blue-300 font-semibold border border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer min-w-0 flex-1"
            >
              <option value="SUPER_ADMIN">Super Admin (Approval)</option>
              <option value="ADMIN">Tata Usaha (TU)</option>
              <option value="OPERATOR_TU">Operator</option>
              <option value="HOMEROOM_TEACHER">Wali Kelas</option>
              <option value="VERIFIER">Verifikator</option>
              <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
            </select>
          </div>
        ) : (
          <div className="py-2 flex justify-center border-b border-slate-800" title={`Peran Aktif: ${activeRole}`}>
            <div className="p-1.5 rounded-lg bg-slate-800/80 text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider">
              MENU UTAMA
            </div>
          )}
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.allowed ? item.label : `${item.label} (Akses terbatas untuk peran ${activeRole})`}
                className={`w-full flex items-center rounded-lg text-xs font-medium transition-colors ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : item.allowed
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-300'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.allowed ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!item.allowed && <Lock className="w-3 h-3 text-slate-500" />}
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* Menu Keluar / Log Out */}
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (isMobileOpen) onCloseMobile();
                onLogoutRequest();
              }}
              title="Keluar / Log Out"
              className={`w-full flex items-center rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-600/20 hover:text-rose-200 transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
                <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
                {!isCollapsed && <span className="truncate">Keluar / Log Out</span>}
              </div>
            </button>
          </div>
        </nav>

        {/* Current Academic Session Info (Expanded only) */}
        {!isCollapsed && (
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>T.A. {settings.tahunAjaranAktif || SMPN99_INFO.tahunAjaranAktif}</span>
              <span className="text-emerald-400 font-mono">
                Semester {settings.semesterAktif || SMPN99_INFO.semesterAktif}
              </span>
            </div>
            <div className="mt-0.5 text-slate-400 truncate text-[10px]">
              {SMPN99_INFO.alamat}, {SMPN99_INFO.kecamatan}
            </div>
          </div>
        )}

        {/* User Session Profile */}
        <div
          className={`p-3 border-t border-slate-800 bg-slate-900 flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          }`}
          title={`${activeUser.nama} (${activeUser.email})`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
            {getInitials(activeUser.nama)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {activeUser.nama}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {activeUser.email}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
