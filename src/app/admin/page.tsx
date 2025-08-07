"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { SholatReport, Siswa } from "@/types/sholat";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Download, Edit, Trash2 } from 'lucide-react';
import { utils, writeFile } from 'xlsx-js-style';

function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekRange(weekString: string) {
  if (!weekString) return { start: '', end: '' };
  
  const [year, week] = weekString.split('-W').map(Number);
  if (isNaN(year) || isNaN(week)) return { start: '', end: '' };

  const start = new Date(year, 0, 1 + (week - 1) * 7);
  while (start.getDay() !== 0) {
    start.setDate(start.getDate() - 1);
  }
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    start: toISODateString(start),
    end: toISODateString(end)
  };
}

function getMonthRange(monthString: string) {
  if (!monthString) return { start: '', end: '' };
  
  const [year, month] = monthString.split('-').map(Number);
  if (isNaN(year) || isNaN(month)) return { start: '', end: '' };
  
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  
  return {
    start: toISODateString(start),
    end: toISODateString(end)
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<SholatReport[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<SholatReport>>({});
  const [formEditId, setFormEditId] = useState<number|null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string|null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number|null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [gender, setGender] = useState("");
  const [date, setDate] = useState("");
  const [week, setWeek] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);

  // Perbaikan: Gunakan useCallback untuk fetchReports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("sholat_reports").select("*, siswa(*)");
    
    if (gender) query = query.eq("siswa.gender", gender);
    
    if (date) {
      query = query.eq("tanggal", date);
    }
    if (week) {
      const { start, end } = getWeekRange(week);
      if (start && end) {
        query = query.gte("tanggal", start).lte("tanggal", end);
      }
    }
    if (month) {
      const { start, end } = getMonthRange(month);
      if (start && end) {
        query = query.gte("tanggal", start).lte("tanggal", end);
      }
    }
    
    const { data } = await query.order("tanggal", { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, [gender, date, week, month]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      }
    });
    supabase.from('siswa').select('*').then(({ data }) => {
      if (data) setSiswaList(data);
    });
  }, [router]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Perbaikan: Tambahkan fetchReports sebagai dependency
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function handleExport() {
    let filename = "laporan-sholat";
    if (gender) filename += `_${gender === 'L' ? 'Laki' : 'Perempuan'}`;
    if (date) filename += `_harian-${date}`;
    if (week) filename += `_mingguan-${week}`;
    if (month) filename += `_bulanan-${month}`;
    
    const exportData = reports.filter(r => r.siswa).map(r => ({
      Nama: r.siswa?.nama,
      Gender: r.siswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      Tanggal: r.tanggal,
      Subuh: r.subuh ? "✅" : "❌",
      Dzuhur: r.dzuhur ? "✅" : "❌",
      Ashar: r.ashar ? "✅" : "❌",
      Maghrib: r.maghrib ? "✅" : "❌",
      Isya: r.isya ? "✅" : "❌",
    }));
    
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const dataStyle = {
      border: {
        top: { style: "thin", color: { rgb: "D3D3D3" } },
        bottom: { style: "thin", color: { rgb: "D3D3D3" } },
        left: { style: "thin", color: { rgb: "D3D3D3" } },
        right: { style: "thin", color: { rgb: "D3D3D3" } }
      }
    };
    
    const checkStyle = {
      font: { color: { rgb: "00AA00" }, bold: true },
      alignment: { horizontal: "center" }
    };
    
    const wb = utils.book_new();
    
    const wsData = [
      Object.keys(exportData[0] || {}).map(key => ({
        v: key,
        t: "s",
        s: headerStyle
      })),
      
      ...exportData.map(row => [
        { v: row.Nama, t: "s", s: dataStyle },
        { v: row.Gender, t: "s", s: dataStyle },
        { v: row.Tanggal, t: "s", s: dataStyle },
        { v: row.Subuh, t: "s", s: { ...dataStyle, ...checkStyle } },
        { v: row.Dzuhur, t: "s", s: { ...dataStyle, ...checkStyle } },
        { v: row.Ashar, t: "s", s: { ...dataStyle, ...checkStyle } },
        { v: row.Maghrib, t: "s", s: { ...dataStyle, ...checkStyle } },
        { v: row.Isya, t: "s", s: { ...dataStyle, ...checkStyle } },
      ])
    ];
    
    const ws = utils.aoa_to_sheet(wsData);
    
    const colWidths = [
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      ...Array(5).fill({ wch: 10 })
    ];
    ws['!cols'] = colWidths;
    
    utils.book_append_sheet(wb, ws, "Laporan Sholat");
    
    writeFile(wb, `${filename}.xlsx`);
  }

  const SHOLAT_LIST = [
    { key: 'subuh', label: 'Subuh' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isya', label: 'Isya' },
  ];

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const filteredReports = reports.filter(r => r.siswa);
  const totalRows = filteredReports.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedReports = filteredReports.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Reset page to 1 if filter changes
  useEffect(() => { setPage(1); }, [gender, date, week, month]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      {notification && (
        <div className={`fixed top-5 right-5 p-4 rounded-md text-white z-[100] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-fast`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in-fast">
            <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm">
              <h2 className="text-xl font-semibold mb-2">Hapus Laporan?</h2>
              <p className="text-gray-600 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition">Batal</button>
                <button 
                  onClick={async () => {
                    if(deleteTargetId) {
                      const { error } = await supabase.from('sholat_reports').delete().eq('id', deleteTargetId);
                      setDeleteModalOpen(false);
                      if (error) {
                        setNotification({ message: `Gagal menghapus: ${error.message}`, type: 'error' });
                      } else {
                        setNotification({ message: 'Laporan berhasil dihapus.', type: 'success' });
                        fetchReports();
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >Hapus</button>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in-fast">
            <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md relative">
              <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl" onClick={()=>setModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-semibold mb-4">{formEditId ? 'Edit' : 'Buat'} Laporan Sholat</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormLoading(true);
                  setFormError(null);
                  if (!form.siswa_id || !form.tanggal) {
                    setFormError('Nama siswa dan tanggal wajib diisi');
                    setFormLoading(false);
                    return;
                  }
                  const payload = {
                    siswa_id: form.siswa_id,
                    tanggal: form.tanggal,
                    subuh: !!form.subuh,
                    dzuhur: !!form.dzuhur,
                    ashar: !!form.ashar,
                    maghrib: !!form.maghrib,
                    isya: !!form.isya,
                  };
                  let res;
                  if (formEditId) {
                    res = await supabase.from('sholat_reports').update(payload).eq('id', formEditId);
                  } else {
                    res = await supabase.from('sholat_reports').insert(payload);
                  }
                  if (res.error) {
                    setFormError(res.error.message);
                    setNotification({ message: `Gagal menyimpan: ${res.error.message}`, type: 'error' });
                  } else {
                    setModalOpen(false);
                    setForm({});
                    setFormEditId(null);
                    fetchReports();
                    setNotification({ message: 'Laporan berhasil disimpan!', type: 'success' });
                  }
                  setFormLoading(false);
                }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block font-semibold mb-1">Nama Siswa</label>
                  <select
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.siswa_id ?? ''}
                    onChange={e => setForm(f => ({...f, siswa_id: Number(e.target.value)}))}
                    required
                  >
                    <option value="">Pilih siswa</option>
                    {siswaList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.tanggal ?? ''}
                    onChange={e => setForm(f => ({...f, tanggal: e.target.value}))}
                    required
                  />
                </div>
                <div className="flex gap-4 flex-wrap">
                  {SHOLAT_LIST.map(s => (
                    <label key={s.key} className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-md">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!form[s.key as keyof typeof form]}
                        onChange={e => setForm(f => ({...f, [s.key]: e.target.checked}))}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
                {formError && <div className="text-red-600 text-sm text-center py-2">{formError}</div>}
                <button 
                  type="submit" 
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? 'Menyimpan...' : (formEditId ? 'Simpan Perubahan' : 'Buat Laporan')}
                </button>
              </form>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={()=>{setModalOpen(true);setForm({});setFormEditId(null);}} 
              className="flex items-center gap-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition w-full sm:w-auto justify-center"
            >
              <Plus size={16} /> Create
            </button>
            <button 
              onClick={handleExport} 
              className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition w-full sm:w-auto justify-center"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
            <h3 className="font-semibold text-gray-700 lg:col-span-1">Filter Laporan:</h3>
            <select 
              onChange={(e) => {
                setGender(e.target.value);
                setDate("");
                setWeek("");
                setMonth("");
              }} 
              value={gender}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Gender</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <input 
              type="date" 
              onChange={(e) => {
                setDate(e.target.value);
                setWeek("");
                setMonth("");
              }} 
              value={date}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
            <input 
              type="week" 
              onChange={(e) => {
                setWeek(e.target.value);
                setDate("");
                setMonth("");
              }} 
              value={week}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
            <input 
              type="month" 
              onChange={(e) => {
                setMonth(e.target.value);
                setDate("");
                setWeek("");
              }} 
              value={month}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center p-12 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p>Memuat data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3">Tanggal</th>
                    <th scope="col" className="px-4 py-3">Nama Siswa</th>
                    <th scope="col" className="px-4 py-3">Gender</th>
                    {SHOLAT_LIST.map(s => <th key={s.key} scope="col" className="px-4 py-3 text-center">{s.label}</th>)}
                    <th scope="col" className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.length > 0 ? paginatedReports.map((report) => (
                    <tr key={report.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{report.tanggal}</td>
                      <th scope="row" className="px-4 py-3 font-medium text-gray-900">{report.siswa?.nama}</th>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${report.siswa?.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                          {report.siswa?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>
                      {SHOLAT_LIST.map(s => (
                        <td key={s.key} className="px-4 py-3 text-center">
                          {report[s.key as keyof SholatReport] ? (
                            <span className="text-green-500 font-bold">✅</span>
                          ) : (
                            <span className="text-red-500">❌</span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition"
                            onClick={() => {
                              setModalOpen(true);
                              setForm({
                                siswa_id: report.siswa_id,
                                tanggal: report.tanggal,
                                subuh: report.subuh,
                                dzuhur: report.dzuhur,
                                ashar: report.ashar,
                                maghrib: report.maghrib,
                                isya: report.isya,
                              });
                              setFormEditId(report.id);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                            onClick={() => {
                              setDeleteModalOpen(true);
                              setDeleteTargetId(report.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={SHOLAT_LIST.length + 4} className="text-center p-8 text-gray-500">
                        Tidak ada data yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 border-t bg-gray-50">
                <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                  {totalRows > 0
                    ? `Menampilkan ${(page-1)*rowsPerPage+1}–${Math.min(page*rowsPerPage, totalRows)} dari ${totalRows} data`
                    : 'Tidak ada data'}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p-1))}
                    disabled={page === 1}
                  >Sebelumnya</button>
                  <span className="text-gray-700 px-2">Halaman {page} / {totalPages}</span>
                  <button
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    onClick={() => setPage(p => Math.min(totalPages, p+1))}
                    disabled={page === totalPages}
                  >Berikutnya</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
