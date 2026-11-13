import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  FileCode,
  Layers,
  Database,
  ExternalLink,
  ShieldCheck,
  FolderGit2,
} from 'lucide-react';
import { SMPN99_INFO } from '../data/mockData';

export const GasIntegrationView: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string>('');
  const [activeGasTab, setActiveGasTab] = useState<'setup' | 'code' | 'schema' | 'config'>('setup');

  const copyToClipboard = (text: string, fileName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(''), 2000);
  };

  const codeGsSnippet = `/**
 * BUKU INDUK DIGITAL SMP NEGERI 99 JAKARTA
 * File: Code.gs (V8 Runtime)
 * Pengembang: Tim Tata Usaha SMPN 99 Jakarta
 */

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.schoolInfo = {
    nama: "${SMPN99_INFO.nama}",
    npsn: "${SMPN99_INFO.npsn}",
    alamat: "${SMPN99_INFO.alamat}",
    telepon: "${SMPN99_INFO.telepon}"
  };
  
  return template.evaluate()
    .setTitle('Buku Induk Digital SMP Negeri 99 Jakarta')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Mendapatkan identitas pengguna aktif via Google Workspace domain @guru.smp.belajar.id
 */
function getCurrentUserContext() {
  const email = Session.getActiveUser().getEmail();
  const allowed = checkUserAllowlist(email);
  return {
    email: email,
    isAllowed: allowed.isAllowed,
    role: allowed.role || 'READ_ONLY_AUDITOR',
    timestamp: new Date().toISOString()
  };
}

function checkUserAllowlist(email) {
  // Membaca sheet 'Users'
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][4] === 'ACTIVE') {
      return { isAllowed: true, role: data[i][3] };
    }
  }
  return { isAllowed: false };
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}`;

  const spreadsheetSetupSnippet = `/**
 * Setup Idempotent 22 Sheets Buku Induk SMPN 99 Jakarta
 * File: SpreadsheetSetup.gs
 */
function setupBukuIndukSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetSchemas = [
    { name: '_META', headers: ['Key', 'Value', 'UpdatedAt', 'UpdatedBy'] },
    { name: 'Users', headers: ['UserId', 'Email', 'FullName', 'Role', 'Status', 'CreatedAt'] },
    { name: 'Roles', headers: ['RoleKey', 'RoleName', 'Description'] },
    { name: 'RolePermissions', headers: ['RoleKey', 'Permission'] },
    { name: 'Students', headers: ['StudentId', 'NIS', 'NISN', 'NamaLengkap', 'NamaPanggilan', 'Gender', 'Status', 'Tingkat', 'Rombel', 'CreatedAt'] },
    { name: 'StudentBiodata', headers: ['StudentId', 'TempatLahir', 'TanggalLahir', 'Agama', 'Kewarganegaraan', 'AnakKe', 'GolDarah', 'TinggiCm', 'BeratKg'] },
    { name: 'Guardians', headers: ['GuardianId', 'Nama', 'Hubungan', 'Pendidikan', 'Pekerjaan', 'NoHp', 'StatusHidup'] },
    { name: 'StudentGuardians', headers: ['StudentId', 'GuardianId', 'HubunganKeluarga'] },
    { name: 'Addresses', headers: ['StudentId', 'Jalan', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Kota', 'KodePos', 'TinggalDengan'] },
    { name: 'Enrollments', headers: ['StudentId', 'TglDiterima', 'TingkatAwal', 'RombelAwal', 'JalurPPDB', 'AsalSD', 'NPSN_SD', 'NoIjazahSD'] },
    { name: 'ClassHistory', headers: ['HistoryId', 'StudentId', 'TahunAjaran', 'Tingkat', 'Rombel', 'WaliKelas', 'Semester', 'StatusKenaikan'] },
    { name: 'EducationHistory', headers: ['StudentId', 'NamaSD', 'NPSN', 'TahunLulus', 'NoIjazah', 'NoSKL'] },
    { name: 'Documents', headers: ['DocId', 'StudentId', 'JenisDokumen', 'DriveFileId', 'FileName', 'StatusVerifikasi', 'UploadedAt'] },
    { name: 'HealthMeasurements', headers: ['StudentId', 'TanggalUkur', 'TinggiCm', 'BeratKg', 'GolDarah', 'RiwayatPenyakit'] },
    { name: 'Achievements', headers: ['AchievementId', 'StudentId', 'NamaPrestasi', 'Tingkat', 'Tahun', 'Peringkat'] },
    { name: 'StatusHistory', headers: ['HistoryId', 'StudentId', 'StatusLama', 'StatusBaru', 'Tanggal', 'NoSurat', 'Alasan', 'Operator'] },
    { name: 'ChangeRequests', headers: ['RequestId', 'StudentId', 'Field', 'OldVal', 'NewVal', 'Status', 'SubmittedBy', 'ApprovedBy'] },
    { name: 'PrintJobs', headers: ['JobId', 'StudentId', 'TemplateName', 'DrivePdfId', 'PrintedAt', 'PrintedBy'] },
    { name: 'AuditLog', headers: ['LogId', 'Timestamp', 'OperatorEmail', 'Role', 'Action', 'TargetStudentId', 'Details'] }
  ];

  sheetSchemas.forEach(function(schema) {
    let sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
    }
    // Set Header
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schema.headers);
      sheet.getRange(1, 1, 1, schema.headers.length)
           .setBackground('#0f172a')
           .setFontColor('#ffffff')
           .setFontWeight('bold');
    }
  });

  Logger.log('Setup 22 sheet Buku Induk SMPN 99 Jakarta selesai.');
}`;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Integrasi Google Apps Script (GAS) & Google Sheets</h2>
            <p className="text-xs text-blue-300 mt-0.5">
              Arsitektur terpadu sesuai Paket Roadmap Engineering Buku Induk Digital SMP Negeri 99 Jakarta
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 mt-3 max-w-3xl leading-relaxed">
          Modul ini menyediakan skrip Apps Script V8 siap pakai untuk disalin ke editor <code>script.google.com</code> jika sekolah ingin menjalankan backend di Google Workspace domain <code>@guru.smp.belajar.id</code> dengan Google Sheets sebagai penyimpanan tabular dan Google Drive sebagai arsip dokumen PDF.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveGasTab('setup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeGasTab === 'setup'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Panduan Deploy 5 Langkah</span>
        </button>
        <button
          onClick={() => setActiveGasTab('code')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeGasTab === 'code'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Kode Apps Script (Code.gs)</span>
        </button>
        <button
          onClick={() => setActiveGasTab('schema')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeGasTab === 'schema'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Setup 22 Sheets (SpreadsheetSetup.gs)</span>
        </button>
      </div>

      {/* CONTENT: SETUP STEPS */}
      {activeGasTab === 'setup' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Langkah Deploy ke Akun Belajar.id SMPN 99 Jakarta
          </h3>
          <div className="space-y-4 text-xs text-slate-700">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-900">Buat Google Spreadsheet Baru</strong>
                <p className="text-slate-500 mt-0.5">
                  Buka Google Drive akun <code>antoniuspurnomo61@guru.smp.belajar.id</code>, buat Spreadsheet baru beri nama <em>"DB_BUKU_INDUK_SMPN_99_JAKARTA"</em>. Salin <strong>SPREADSHEET_ID</strong> dari URL.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-900">Buka Ekstensi &gt; Apps Script</strong>
                <p className="text-slate-500 mt-0.5">
                  Di menu Spreadsheet, pilih <em>Ekstensi &gt; Apps Script</em>. Buat file baru <code>Code.gs</code> dan <code>SpreadsheetSetup.gs</code>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-900">Jalankan Fungsi `setupBukuIndukSheets()`</strong>
                <p className="text-slate-500 mt-0.5">
                  Pilih fungsi <code>setupBukuIndukSheets</code> lalu klik <em>Jalankan</em>. Skrip akan secara otomatis membuat 22 lembar kerja dengan header baku.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                4
              </span>
              <div>
                <strong className="text-slate-900">Set Script Properties</strong>
                <p className="text-slate-500 mt-0.5">
                  Di Setelan Proyek Apps Script, tambahkan Script Property:
                  <br />
                  <code>SPREADSHEET_ID</code> = [ID Spreadsheet Anda]
                  <br />
                  <code>DRIVE_ROOT_FOLDER_ID</code> = [ID Folder Arsip Drive SMPN 99]
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                5
              </span>
              <div>
                <strong className="text-slate-900">Deploy sebagai Web App</strong>
                <p className="text-slate-500 mt-0.5">
                  Klik <em>Terapkan &gt; Penerapan Baru</em>. Pilih jenis <strong>Aplikasi Web</strong>. Jalankan sebagai: <em>Saya</em>, Akses: <em>Siapa saja yang memiliki akun Kemdikbud / Belajar.id</em>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: CODE.GS */}
      {activeGasTab === 'code' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-900 text-slate-200 flex items-center justify-between text-xs border-b border-slate-800">
            <span className="font-mono font-semibold">Code.gs</span>
            <button
              onClick={() => copyToClipboard(codeGsSnippet, 'Code.gs')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center gap-1 transition-colors text-[11px]"
            >
              {copiedFile === 'Code.gs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFile === 'Code.gs' ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-96">
            {codeGsSnippet}
          </pre>
        </div>
      )}

      {/* CONTENT: SPREADSHEETSETUP.GS */}
      {activeGasTab === 'schema' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-900 text-slate-200 flex items-center justify-between text-xs border-b border-slate-800">
            <span className="font-mono font-semibold">SpreadsheetSetup.gs (Idempotent 22 Sheets)</span>
            <button
              onClick={() => copyToClipboard(spreadsheetSetupSnippet, 'SpreadsheetSetup.gs')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded flex items-center gap-1 transition-colors text-[11px]"
            >
              {copiedFile === 'SpreadsheetSetup.gs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFile === 'SpreadsheetSetup.gs' ? 'Tersalin!' : 'Salin Skrip'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed max-h-96">
            {spreadsheetSetupSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
