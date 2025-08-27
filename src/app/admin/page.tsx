"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabaseClient";
import { SholatReport, Siswa } from "@/types/sholat";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Download, Edit, Trash2 } from 'lucide-react';
import { writeFile } from 'xlsx-js-style';
import { toISODateString, getWeekRange, getMonthRange } from "@/utils/date";
import { buildExportWorkbook } from "@/utils/exportReports";
import FilterBar from "./components/FilterBar";
import ReportTable from "./components/ReportTable";

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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  // Debounced filter input states to reduce request frequency
  const [genderInput, setGenderInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [weekInput, setWeekInput] = useState("");
  const [monthInput, setMonthInput] = useState("");
  // Custom create mode state
  const [customMode, setCustomMode] = useState(false);
  const [customCount, setCustomCount] = useState<number>(1);
  const [customStart, setCustomStart] = useState<string>("");

  // Perbaikan: Gunakan useCallback untuk fetchReports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("sholat_reports").select("*, siswa(*)");
    
    if (gender) query = query.eq("siswa.gender", gender);
    if (search) query = query.ilike("siswa.nama", `%${search}%`);
    
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
  }, [gender, date, week, month, search]);

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

  // Debounce search input -> update effective search after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Debounce other filters (gender, date, week, month)
  useEffect(() => {
    const handler = setTimeout(() => {
      setGender(genderInput);
      setDate(dateInput);
      setWeek(weekInput);
      setMonth(monthInput);
    }, 400);
    return () => clearTimeout(handler);
  }, [genderInput, dateInput, weekInput, monthInput]);

  const clearTanggal = () => {
    setDate(""); setWeek(""); setMonth("");
    setDateInput(""); setWeekInput(""); setMonthInput("");
  };

  async function handleExport() {
    // Create fresh query with same filters as fetchReports for accurate export data
    let query = supabase.from("sholat_reports").select("*, siswa(*)");
    if (gender) query = query.eq("siswa.gender", gender);
    if (search) query = query.ilike("siswa.nama", `%${search}%`);
    if (date) query = query.eq("tanggal", date);
    if (week) {
      const { start, end } = getWeekRange(week);
      if (start && end) query = query.gte("tanggal", start).lte("tanggal", end);
    }
    if (month) {
      const { start, end } = getMonthRange(month);
      if (start && end) query = query.gte("tanggal", start).lte("tanggal", end);
    }

    const { data: exportReports } = await query.order("tanggal", { ascending: false });
    if (!exportReports || exportReports.length === 0) {
      setNotification({ message: 'Tidak ada data untuk diekspor dengan filter yang dipilih.', type: 'error' });
      return;
    }

    const { wb, filename } = buildExportWorkbook({
      exportReports,
      filters: { gender, date, week, month },
    });
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
  const rowsPerPage = 30;
  const filteredReports = reports.filter(r => r.siswa);
  const totalRows = filteredReports.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedReports = filteredReports.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Reset page to 1 if filter changes
  useEffect(() => { setPage(1); }, [gender, date, week, month, search]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-white dark:bg-neutral-900 dark:text-neutral-100">
      {notification && (
        <div className={`fixed top-5 right-5 p-4 rounded-md text-white z-[100] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in-fast`}>
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in-fast">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-md shadow-lg w-full max-w-sm">
              <h2 className="text-xl font-semibold mb-2">Hapus Laporan?</h2>
              <p className="text-gray-600 dark:text-neutral-300 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 dark:text-neutral-100 rounded-md hover:bg-gray-300 dark:hover:bg-neutral-600 transition">Batal</button>
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
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-md shadow-lg w-full max-w-md relative">
              <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-xl" onClick={()=>setModalOpen(false)}>&times;</button>
              <h2 className="text-xl font-semibold mb-4">{formEditId ? 'Edit' : 'Buat'} Laporan Sholat</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setFormLoading(true);
                  setFormError(null);
                  let res;
                  if (!form.siswa_id) {
                    setFormError('Nama siswa wajib diisi');
                    setFormLoading(false);
                    return;
                  }
                  if (!formEditId && customMode) {
                    // Custom bulk insert path
                    if (!customStart) {
                      setFormError('Tanggal mulai wajib diisi untuk mode custom');
                      setFormLoading(false);
                      return;
                    }
                    if (customCount < 1 || customCount > 7) {
                      setFormError('Jumlah laporan harus antara 1 hingga 7');
                      setFormLoading(false);
                      return;
                    }
                    const startDate = new Date(customStart);
                    const payloads = Array.from({ length: customCount }, (_, i) => {
                      const d = new Date(startDate);
                      d.setDate(d.getDate() + i);
                      return {
                        siswa_id: form.siswa_id as number,
                        tanggal: toISODateString(d),
                        subuh: !!form.subuh,
                        dzuhur: !!form.dzuhur,
                        ashar: !!form.ashar,
                        maghrib: !!form.maghrib,
                        isya: !!form.isya,
                      };
                    });
                    res = await supabase.from('sholat_reports').insert(payloads);
                  } else {
                    // Single create or edit path
                    if (!form.tanggal) {
                      setFormError('Tanggal wajib diisi');
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
                    if (formEditId) {
                      res = await supabase.from('sholat_reports').update(payload).eq('id', formEditId);
                    } else {
                      res = await supabase.from('sholat_reports').insert(payload);
                    }
                  }
                  if (res.error) {
                    setFormError(res.error.message);
                    setNotification({ message: `Gagal menyimpan: ${res.error.message}`, type: 'error' });
                  } else {
                    setModalOpen(false);
                    setForm({});
                    setFormEditId(null);
                    setCustomMode(false);
                    setCustomCount(5);
                    setCustomStart("");
                    fetchReports();
                    setNotification({ message: formEditId ? 'Laporan berhasil disimpan!' : (customMode ? `Berhasil membuat ${customCount} laporan!` : 'Laporan berhasil disimpan!'), type: 'success' });
                  }
                  setFormLoading(false);
                }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block font-semibold mb-1">Nama Siswa</label>
                  <select
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
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
                {/* Custom mode toggle */}
                {!formEditId && (
                  <div className="flex items-center gap-2">
                    <input
                      id="customMode"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={customMode}
                      onChange={(e) => setCustomMode(e.target.checked)}
                    />
                    <label htmlFor="customMode" className="font-semibold">Buat Laporan Sholat Custom (1–7 hari berturut-turut)</label>
                  </div>
                )}
                {/* Date inputs */}
                {!customMode && (
                  <div>
                    <label className="block font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                      value={form.tanggal ?? ''}
                      onChange={e => setForm(f => ({...f, tanggal: e.target.value}))}
                      required
                    />
                  </div>
                )}
                {(!formEditId && customMode) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Jumlah Hari (1–7)</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
                        value={customCount}
                        onChange={(e) => setCustomCount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-4 flex-wrap">
                  {SHOLAT_LIST.map(s => (
                    <label key={s.key} className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-700 px-3 py-2 rounded-md text-gray-800 dark:text-neutral-100">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded dark:border-neutral-600"
                        checked={!!form[s.key as keyof typeof form]}
                        onChange={e => setForm(f => ({...f, [s.key]: e.target.checked}))}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
                {formError && <div className="text-red-600 dark:text-red-400 text-sm text-center py-2">{formError}</div>}
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
            <h1 className="text-2xl font-bold text-neutral-100">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={()=>{setModalOpen(true);setForm({});setFormEditId(null);setCustomMode(false);setCustomCount(1);setCustomStart("");}} 
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

        <FilterBar
          genderInput={genderInput}
          setGenderInput={setGenderInput}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          search={search}
          setSearch={setSearch}
          dateInput={dateInput}
          setDateInput={setDateInput}
          weekInput={weekInput}
          setWeekInput={setWeekInput}
          monthInput={monthInput}
          setMonthInput={setMonthInput}
          clearTanggal={clearTanggal}
        />

        {loading ? (
          <div className="text-center p-12 text-neutral-300">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Memuat data...</p>
          </div>
        ) : (
          <ReportTable
            reports={paginatedReports as any}
            sholatList={SHOLAT_LIST as any}
            page={page}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            setPage={(n) => setPage(n)}
            onEdit={(report) => {
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
            onDelete={(report) => {
              setDeleteModalOpen(true);
              setDeleteTargetId(report.id);
            }}
          />
        )}
      </div>
    </div>
  );
}
