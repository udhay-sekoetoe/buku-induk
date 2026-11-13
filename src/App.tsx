import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StudentsListView } from './components/StudentsListView';
import { DocumentsView } from './components/DocumentsView';
import { MutationsListView } from './components/MutationsListView';
import { PrintCenterModal } from './components/PrintCenterModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { StudentFormModal } from './components/StudentFormModal';
import { MutationModal } from './components/MutationModal';
import { ImportExportView } from './components/ImportExportView';
import { GasIntegrationView } from './components/GasIntegrationView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { LoginScreen, RegisterPendingPayload } from './components/LoginScreen';
import { AccountsManagementView } from './components/AccountsManagementView';
import { LeggerExportView } from './components/LeggerExportView';
import { RecapPdfModal } from './components/RecapPdfModal';
import { generateRecapStudentsPdf } from './utils/recapPdfGenerator';
import {
  Student,
  UserRole,
  VerificationStatus,
  BukuIndukSettings,
  SemesterGradesRecord,
  AppUser,
  RolePermissions,
  ApprovalRequest,
  ApprovalCategory,
} from './types';
import { storageService } from './services/storageService';
import { DEFAULT_APP_USERS, DEFAULT_ROLE_PERMISSIONS } from './data/defaultSettings';
import { Lock, ShieldAlert, LogOut, X } from 'lucide-react';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => storageService.getApprovals());
  const [settings, setSettings] = useState<BukuIndukSettings>(() => storageService.getSettings());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeUser: AppUser =
    settings.pengguna?.find((u) => u.id === settings.activeUserId) ||
    settings.pengguna?.[0] ||
    DEFAULT_APP_USERS[0];

  const [activeRole, setActiveRole] = useState<UserRole>(() => activeUser.role || 'SUPER_ADMIN');

  const activePermissions: RolePermissions =
    settings.hakAksesPeran?.[activeRole] || DEFAULT_ROLE_PERMISSIONS[activeRole];

  // Sidebar dynamic collapse / mobile hide state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smpn99_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('smpn99_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modals state
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [printSemesterNum, setPrintSemesterNum] = useState<number>(1);
  const [printDocType, setPrintDocType] = useState<'LEMBAR_BIODATA' | 'RAPOR_SEMESTER' | 'TRANSKRIP_6_SEMESTER'>('LEMBAR_BIODATA');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isRecapPdfModalOpen, setIsRecapPdfModalOpen] = useState<boolean>(false);
  const [mutationStudent, setMutationStudent] = useState<Student | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smpn99_session_logged_out') === 'true';
    } catch {
      return false;
    }
  });

  const operator = {
    name: activeUser.nama,
    email: activeUser.email,
    role: activeRole,
  };

  // Initial load
  const refreshData = () => {
    const loadedStudents = storageService.getStudents();
    const loadedLogs = storageService.getAuditLogs();
    const loadedApprovals = storageService.getApprovals();
    setStudents(loadedStudents);
    setAuditLogs(loadedLogs);
    setApprovals(loadedApprovals);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const requirePermission = (allowed: boolean, actionLabel: string): boolean => {
    if (!allowed) {
      showToast(`Akses dibatasi: Peran ${activeRole} tidak memiliki izin untuk ${actionLabel}.`);
      return false;
    }
    return true;
  };

  // Student Actions
  const handleAddStudent = (studentData: any) => {
    if (!requirePermission(activePermissions.tambahEditSiswa, 'menambah siswa')) return;
    const res = storageService.addStudent(studentData, operator);
    if (res.success) {
      refreshData();
      setIsAddModalOpen(false);
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleUpdateStudent = (studentData: Student) => {
    if (!requirePermission(activePermissions.tambahEditSiswa, 'mengedit data siswa')) return;
    const res = storageService.updateStudent(studentData, operator);
    if (res.success) {
      refreshData();
      setEditStudent(null);
      if (profileStudent?.id === studentData.id) {
        setProfileStudent(studentData);
      }
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    if (!requirePermission(activePermissions.hapusSiswa, 'menghapus data siswa')) return;
    const res = storageService.deleteStudent(studentId, operator);
    if (res.success) {
      refreshData();
      if (profileStudent?.id === studentId) setProfileStudent(null);
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleConfirmMutation = (mutationData: any) => {
    if (!requirePermission(activePermissions.prosesMutasi, 'memproses mutasi & kelulusan')) return;
    if (!mutationStudent) return;
    const res = storageService.mutateStudent(mutationStudent.id, mutationData, operator);
    if (res.success) {
      refreshData();
      setMutationStudent(null);
      if (profileStudent?.id === mutationStudent.id) {
        const updated = storageService.getStudentById(mutationStudent.id);
        if (updated) setProfileStudent(updated);
      }
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleVerifyDocument = (
    studentId: string,
    docId: string,
    status: VerificationStatus,
    note: string
  ) => {
    if (!requirePermission(activePermissions.verifikasiDokumen, 'memverifikasi berkas')) return;
    const res = storageService.updateDocumentVerification(studentId, docId, status, note, operator);
    if (res.success) {
      refreshData();
      if (profileStudent?.id === studentId) {
        const updated = storageService.getStudentById(studentId);
        if (updated) setProfileStudent(updated);
      }
      showToast(res.message);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset data Buku Induk kembali ke data bawaan contoh?')) {
      storageService.resetData();
      refreshData();
      showToast('Data contoh Buku Induk berhasil dimuat ulang!');
    }
  };

  const handleOpenPrintForStudent = (student: Student) => {
    if (!requirePermission(activePermissions.cetakBukuInduk, 'mencetak lembar buku induk')) return;
    setPrintStudentId(student.id);
    setPrintDocType('LEMBAR_BIODATA');
    setIsPrintModalOpen(true);
  };

  const handleOpenPrintSemester = (studentId: string, semesterNum: number) => {
    if (!requirePermission(activePermissions.cetakBukuInduk, 'mencetak lembar rapor')) return;
    setPrintStudentId(studentId);
    setPrintSemesterNum(semesterNum);
    setPrintDocType('RAPOR_SEMESTER');
    setIsPrintModalOpen(true);
  };

  const handleSaveSettings = (newSettings: BukuIndukSettings) => {
    if (
      !requirePermission(
        activePermissions.kelolaPengaturan || activePermissions.kelolaAkun,
        'mengubah pengaturan & akun buku induk'
      )
    ) {
      return;
    }
    storageService.saveSettings(newSettings, operator);
    setSettings(newSettings);
    refreshData();
    showToast('Pengaturan Buku Induk, Daftar Akun & Hak Akses berhasil diperbarui!');
  };

  const handleCreateApprovalRequest = (payload: {
    kategori: ApprovalCategory;
    judul: string;
    deskripsi: string;
    targetStudentId?: string;
    targetStudentName?: string;
    targetUserId?: string;
    requestedNewPassword?: string;
  }) => {
    storageService.createApprovalRequest({
      ...payload,
      pemohonNama: operator.name,
      pemohonEmail: operator.email,
      pemohonRole: activeRole,
    });
    refreshData();
    showToast(`Permohonan "${payload.judul}" telah dikirim ke Dashboard Super Admin.`);
  };

  const handleUpdateProfile = (updates: { nama: string; nip?: string; jabatan?: string }) => {
    const res = storageService.updateUserProfile(activeUser.id, updates, operator);
    if (res.success && res.updatedSettings) {
      setSettings(res.updatedSettings);
      refreshData();
      showToast(res.message);
    }
    return { success: res.success, message: res.message };
  };

  const handleChangePassword = (payload: { currentPassword: string; newPassword: string }) => {
    const res = storageService.changeUserPassword(activeUser.id, payload, operator);
    if (res.success && res.updatedSettings) {
      setSettings(res.updatedSettings);
      refreshData();
      showToast(res.message);
    }
    return { success: res.success, message: res.message };
  };

  const handleAdminResetOtherPassword = (targetUserId: string, newTempPassword: string) => {
    if (!requirePermission(activePermissions.approvePermohonan, 'mereset password akun lain secara langsung')) {
      return { success: false, message: 'Hanya Super Admin yang dapat melakukan reset langsung.' };
    }
    const res = storageService.resetOtherUserPassword(targetUserId, newTempPassword, operator);
    if (res.success && res.updatedSettings) {
      setSettings(res.updatedSettings);
      refreshData();
      showToast(res.message);
    }
    return { success: res.success, message: res.message };
  };

  const handleApproveRequest = (approvalId: string, note?: string) => {
    if (!requirePermission(activePermissions.approvePermohonan, 'melakukan approval Super Admin')) {
      return;
    }
    const res = storageService.reviewApprovalRequest(approvalId, 'APPROVED', operator, note);
    if (res.success) {
      if (res.updatedSettings) {
        setSettings(res.updatedSettings);
      }
      refreshData();
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleRejectRequest = (approvalId: string, note?: string) => {
    if (!requirePermission(activePermissions.approvePermohonan, 'menolak pengajuan approval')) {
      return;
    }
    const res = storageService.reviewApprovalRequest(approvalId, 'REJECTED', operator, note);
    if (res.success) {
      refreshData();
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleSwitchActiveUser = (user: AppUser) => {
    const updatedSettings: BukuIndukSettings = {
      ...settings,
      activeUserId: user.id,
    };
    storageService.saveSettings(updatedSettings, {
      name: user.nama,
      email: user.email,
      role: user.role,
    });
    setSettings(updatedSettings);
    setActiveRole(user.role);
    showToast(`Sesi aktif beralih ke ${user.nama} (${user.jabatan})`);
  };

  const handleSaveSemesterGrades = (
    studentId: string,
    semesterNum: number,
    gradesData: SemesterGradesRecord
  ) => {
    if (!requirePermission(activePermissions.inputNilaiRapor, 'mengedit nilai rapor')) return;
    const res = storageService.updateStudentSemesterGrades(studentId, semesterNum, gradesData, operator);
    if (res.success) {
      refreshData();
      if (profileStudent?.id === studentId) {
        const updated = storageService.getStudentById(studentId);
        if (updated) setProfileStudent(updated);
      }
      showToast(res.message);
    }
  };

  const handleConfirmLogout = () => {
    storageService.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'LOGOUT_SESI',
      details: `${operator.name} (${operator.role}) keluar (Log Out) dari sesi Buku Induk.`,
    });
    refreshData();
    try {
      localStorage.setItem('smpn99_session_logged_out', 'true');
    } catch {}
    setIsLogoutConfirmOpen(false);
    setProfileStudent(null);
    setEditStudent(null);
    setIsAddModalOpen(false);
    setIsPrintModalOpen(false);
    setMutationStudent(null);
    setIsMobileMenuOpen(false);
    setIsLoggedOut(true);
  };

  const handleLoginSuccess = (user: AppUser) => {
    const updatedSettings: BukuIndukSettings = {
      ...settings,
      activeUserId: user.id,
    };
    storageService.saveSettings(updatedSettings);
    storageService.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: user.email,
      operatorName: user.nama,
      role: user.role,
      action: 'LOGIN_SESI',
      details: `${user.nama} (${user.role}) masuk ke sesi Buku Induk.`,
    });
    try {
      localStorage.removeItem('smpn99_session_logged_out');
    } catch {}
    setSettings(updatedSettings);
    setActiveRole(user.role);
    const rolePerms = updatedSettings.hakAksesPeran?.[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role];
    setCurrentTab(rolePerms.lihatDashboard ? 'dashboard' : 'students');
    setIsLoggedOut(false);
    refreshData();
    showToast(`Selamat datang, ${user.nama}!`);
  };

  const handleRegisterAccount = (payload: RegisterPendingPayload) => {
    const res = storageService.registerPendingUser(payload);
    if (res.success && res.updatedSettings) {
      setSettings(res.updatedSettings);
      refreshData();
    }
    return { success: res.success, message: res.message };
  };

  const handleQuickDownloadRecapPdf = async () => {
    if (!requirePermission(activePermissions.cetakBukuInduk, 'mengunduh laporan rekapitulasi PDF')) {
      return;
    }
    const { fileName, totalIncluded } = await generateRecapStudentsPdf({
      students,
      settings,
      scope: { tingkat: 'ALL', rombel: 'ALL', status: 'ALL' },
      operator,
    });
    storageService.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorEmail: operator.email,
      operatorName: operator.name,
      role: operator.role,
      action: 'CETAK_BUKU_INDUK',
      details: `Mengunduh langsung Laporan Rekapitulasi Data Siswa PDF (${totalIncluded} siswa) dari Halaman Utama: ${fileName}`,
    });
    refreshData();
    showToast(`Laporan Rekapitulasi PDF diunduh: ${fileName}`);
  };

  if (isLoggedOut) {
    return (
      <LoginScreen
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
        onRegisterAccount={handleRegisterAccount}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'print-center') {
            if (requirePermission(activePermissions.cetakBukuInduk, 'membuka Pusat Cetak')) {
              setIsPrintModalOpen(true);
            }
          } else {
            setCurrentTab(tab);
          }
        }}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        totalStudents={students.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        settings={settings}
        activeUser={activeUser}
        permissions={activePermissions}
        onLogoutRequest={() => setIsLogoutConfirmOpen(true)}
        pendingApprovalCount={approvals.filter((a) => a.status === 'PENDING').length}
      />

      {/* Viewport Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={() => {
            if (requirePermission(activePermissions.tambahEditSiswa, 'menambah siswa baru')) {
              setIsAddModalOpen(true);
            }
          }}
          onResetData={handleResetData}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapse}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          canAddStudent={activePermissions.tambahEditSiswa}
          onLogoutRequest={() => setIsLogoutConfirmOpen(true)}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              activePermissions.lihatDashboard ? (
                <DashboardView
                  students={students}
                  auditLogs={auditLogs}
                  onNavigateTab={(tab) => {
                    if (tab === 'print-center') {
                      if (requirePermission(activePermissions.cetakBukuInduk, 'membuka Pusat Cetak')) {
                        setIsPrintModalOpen(true);
                      }
                    } else {
                      setCurrentTab(tab);
                    }
                  }}
                  onSelectStudent={setProfileStudent}
                  onOpenAddModal={() => {
                    if (requirePermission(activePermissions.tambahEditSiswa, 'menambah siswa baru')) {
                      setIsAddModalOpen(true);
                    }
                  }}
                  settings={settings}
                  activeUser={activeUser}
                  activeRole={activeRole}
                  permissions={activePermissions}
                  approvals={approvals}
                  onApproveRequest={handleApproveRequest}
                  onRejectRequest={handleRejectRequest}
                  onCreateApprovalRequest={handleCreateApprovalRequest}
                  onUpdateProfile={handleUpdateProfile}
                  onChangePassword={handleChangePassword}
                  onAdminResetOtherPassword={handleAdminResetOtherPassword}
                  onOpenRecapPdf={() => {
                    if (
                      requirePermission(
                        activePermissions.cetakBukuInduk,
                        'mengunduh laporan rekapitulasi PDF'
                      )
                    ) {
                      setIsRecapPdfModalOpen(true);
                    }
                  }}
                  onQuickDownloadRecapPdf={handleQuickDownloadRecapPdf}
                />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto mt-8">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">Akses Dashboard Dibatasi</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Peran aktif ({activeRole}) saat ini tidak diberi hak akses ke Dashboard & Statistik.
                  </p>
                </div>
              )
            )}

            {currentTab === 'students' && (
              <StudentsListView
                students={students}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectStudent={setProfileStudent}
                onEditStudent={(s) => {
                  if (requirePermission(activePermissions.tambahEditSiswa, 'mengedit data siswa')) {
                    setEditStudent(s);
                  }
                }}
                onPrintStudent={handleOpenPrintForStudent}
                onMutateStudent={(s) => {
                  if (requirePermission(activePermissions.prosesMutasi, 'memproses mutasi siswa')) {
                    setMutationStudent(s);
                  }
                }}
                onOpenAddModal={() => {
                  if (requirePermission(activePermissions.tambahEditSiswa, 'menambah siswa baru')) {
                    setIsAddModalOpen(true);
                  }
                }}
                activeRole={activeRole}
                activeUser={activeUser}
                settings={settings}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {currentTab === 'documents' && (
              activePermissions.verifikasiDokumen ? (
                <DocumentsView
                  students={students}
                  onVerifyDocument={handleVerifyDocument}
                  onSelectStudent={setProfileStudent}
                  activeRole={activeRole}
                />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto mt-8">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">Akses Verifikasi Berkas Dibatasi</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Peran aktif ({activeRole}) tidak memiliki izin verifikasi dokumen digital.
                  </p>
                </div>
              )
            )}

            {currentTab === 'mutations' && (
              activePermissions.prosesMutasi ? (
                <MutationsListView
                  students={students}
                  onSelectStudent={setProfileStudent}
                  onPrintStudent={handleOpenPrintForStudent}
                />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto mt-8">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">Akses Mutasi & Kelulusan Dibatasi</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Peran aktif ({activeRole}) tidak memiliki izin mengelola data mutasi dan kelulusan.
                  </p>
                </div>
              )
            )}

            {currentTab === 'accounts' && (
              <AccountsManagementView
                settings={settings}
                onSaveSettings={(newSettings) => {
                  storageService.saveSettings(newSettings, operator);
                  setSettings(newSettings);
                  refreshData();
                }}
                activeUser={activeUser}
                activeRole={activeRole}
                permissions={activePermissions}
                onSwitchActiveUser={handleSwitchActiveUser}
                onSubmitApprovalRequest={handleCreateApprovalRequest}
              />
            )}

            {currentTab === 'legger' && (
              activePermissions.imporEksporData || activePermissions.cetakBukuInduk ? (
                <LeggerExportView
                  students={students}
                  operator={operator}
                  onOpenPrintTranskrip={(studentId) => {
                    if (requirePermission(activePermissions.cetakBukuInduk, 'mencetak transkrip 6 semester')) {
                      setPrintStudentId(studentId);
                      setPrintDocType('TRANSKRIP_6_SEMESTER');
                      setIsPrintModalOpen(true);
                    }
                  }}
                  onDataUpdated={() => {
                    refreshData();
                    showToast('Data legger & laporan Buku Induk berhasil diperbarui!');
                  }}
                  canExportImport={activePermissions.imporEksporData}
                  canPrint={activePermissions.cetakBukuInduk}
                />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto mt-8">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">Akses Export Legger Dibatasi</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Peran aktif ({activeRole}) tidak memiliki izin mengelola atau mengekspor legger tahun ajaran.
                  </p>
                </div>
              )
            )}

            {currentTab === 'settings' && (
              activePermissions.kelolaPengaturan ? (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  operator={operator}
                  onSwitchActiveUser={handleSwitchActiveUser}
                />
              ) : (
                <div className="bg-white rounded-xl border border-amber-200 p-8 text-center max-w-lg mx-auto mt-8 shadow-xs">
                  <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Pengaturan & Hak Akses Terkunci untuk Peran {activeRole}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Berdasarkan Matriks Hak Akses, peran ini tidak dapat mengubah pengaturan sistem, TTD, Kop Surat, atau pengguna.
                  </p>
                  <button
                    onClick={() => setActiveRole('SUPER_ADMIN')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Beralih ke Peran Super Admin
                  </button>
                </div>
              )
            )}

            {currentTab === 'import-export' && (
              activePermissions.imporEksporData ? (
                <ImportExportView
                  students={students}
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onImportSuccess={() => {
                    refreshData();
                    showToast('Data Excel/CSV berhasil diimpor ke Buku Induk!');
                  }}
                  activeRole={activeRole}
                  operator={operator}
                />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-lg mx-auto mt-8">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">Akses Impor & Ekspor Dibatasi</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Peran aktif ({activeRole}) tidak memiliki izin impor atau ekspor data massal.
                  </p>
                </div>
              )
            )}

            {currentTab === 'gas-integration' && <GasIntegrationView />}

            {currentTab === 'audit-log' && <AuditLogView logs={auditLogs} />}
          </div>
        </main>
      </div>

      {/* MODAL 1: STUDENT PROFILE DETAIL */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          onClose={() => setProfileStudent(null)}
          onEdit={(s) => {
            setProfileStudent(null);
            setEditStudent(s);
          }}
          onPrint={handleOpenPrintForStudent}
          onPrintSemester={handleOpenPrintSemester}
          onMutate={(s) => {
            setProfileStudent(null);
            setMutationStudent(s);
          }}
          onVerifyDocument={handleVerifyDocument}
          onSaveSemesterGrades={handleSaveSemesterGrades}
          activeRole={activeRole}
        />
      )}

      {/* MODAL 2: ADD / EDIT STUDENT FORM */}
      {(isAddModalOpen || editStudent) && (
        <StudentFormModal
          initialData={editStudent}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditStudent(null);
          }}
          onSubmit={(studentData) => {
            if (editStudent) {
              handleUpdateStudent(studentData);
            } else {
              handleAddStudent(studentData);
            }
          }}
        />
      )}

      {/* MODAL 3: MUTATION & GRADUATION */}
      {mutationStudent && (
        <MutationModal
          student={mutationStudent}
          onClose={() => setMutationStudent(null)}
          onConfirm={handleConfirmMutation}
        />
      )}

      {/* MODAL 4: OFFICIAL PRINT CENTER */}
      {isPrintModalOpen && (
        <PrintCenterModal
          students={students}
          initialStudentId={printStudentId || undefined}
          initialSemester={printSemesterNum}
          initialDocType={printDocType}
          settings={settings}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintStudentId(null);
          }}
        />
      )}

      {/* MODAL 4B: RECAPITULATION PDF REPORT WITH CONSISTENT KOP SURAT */}
      {isRecapPdfModalOpen && (
        <RecapPdfModal
          students={students}
          settings={settings}
          operator={operator}
          onClose={() => setIsRecapPdfModalOpen(false)}
          onDownloaded={(fileName) => {
            refreshData();
            showToast(`Laporan Rekapitulasi PDF diunduh: ${fileName}`);
          }}
        />
      )}

      {/* MODAL 5: LOGOUT CONFIRMATION */}
      {isLogoutConfirmOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <LogOut className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Keluar dari Sesi Buku Induk?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan keluar dari akun <span className="font-semibold text-slate-900">{activeUser.nama}</span> ({activeUser.email}). Seluruh data siswa, nilai, dan pengaturan yang telah disimpan tetap aman di perangkat ini.
              </p>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
