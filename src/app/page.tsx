"use client";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import type { Siswa, SholatReport } from "../types/sholat";

const SHOLAT_LIST = [
  { key: "subuh", label: "Subuh" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" },
];

export default function Home() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [gender, setGender] = useState<string>("");
  const [todayReport, setTodayReport] = useState<Partial<SholatReport> | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  useEffect(() => {
    // Fetch siswa list
    supabase.from('siswa').select('*').then(({ data }) => {
      if (data) setSiswaList(data);
    });
  }, []);

  useEffect(() => {
    if (selectedId) {
      // Fetch today's report for selected siswa
      setLoading(true);
      supabase.from('sholat_reports')
        .select('*')
        .eq('siswa_id', selectedId)
        .eq('tanggal', todayStr)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setTodayReport(data);
            setEditMode(true);
            setGender(siswaList.find(s => s.id === selectedId)?.gender || "");
          } else {
            setTodayReport(null);
            setEditMode(false);
            setGender(siswaList.find(s => s.id === selectedId)?.gender || "");
          }
          setLoading(false);
        });
    } else {
      setTodayReport(null);
      setEditMode(false);
      setGender("");
    }
  }, [selectedId, siswaList]);

  const handleCheck = (key: string) => {
    setTodayReport((prev) => ({
      ...(prev || {}),
      [key]: !(prev && prev[key]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!selectedId) {
      setError("Pilih nama siswa terlebih dahulu.");
      setLoading(false);
      return;
    }
    const payload = {
      siswa_id: selectedId,
      tanggal: todayStr,
      ...SHOLAT_LIST.reduce((acc, s) => ({ ...acc, [s.key]: todayReport?.[s.key] || false }), {}),
    };
    let res;
    if (editMode && todayReport?.id) {
      res = await supabase.from('sholat_reports').update(payload).eq('id', todayReport.id);
    } else {
      res = await supabase.from('sholat_reports').insert(payload);
    }
    if (res.error) {
      setError(res.error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      // Refetch
      supabase.from('sholat_reports')
        .select('*')
        .eq('siswa_id', selectedId)
        .eq('tanggal', todayStr)
        .single()
        .then(({ data }) => setTodayReport(data));
    }
    setLoading(false);
  };

  const nameDisabled = !!todayReport;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {showInfo ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-center mb-4">Perhatian!</h1>
            <ul className="list-disc list-inside space-y-3 mb-6 text-gray-700">
              <li>Pilih nama <span className="font-bold text-red-600 underline">masing masing</span>!</li>
              <li><span className="font-bold text-red-600 underline">Jangan memanipulasi</span> data teman lainnya!</li>
              <li><span className="font-bold text-red-600 underline">Jujur</span> dalam mengisi.</li>
              <li>Laporan ini digunakan untuk <span className="font-bold">penilaian mulok</span>.</li>
              <li>Submit laporan <span className="font-bold text-red-600 underline">hanya 1x per hari</span>.</li>
              <li>Jika ada kesalahan, laporan <span className="font-bold text-red-600 underline">hanya bisa diedit</span> pada hari yang sama.</li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full button"
            >
              Saya Mengerti & Lanjutkan
            </button>
          </div>
        ) : (
          <div className="card">
            <h1 className="text-2xl font-bold text-center mb-1">Laporan Sholat Harian</h1>
            <p className="text-center text-gray-500 mb-6">Isi laporan sesuai sholat yang dikerjakan.</p>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="font-semibold mb-2 block">Nama Siswa</label>
                <select
                  value={selectedId ?? ""}
                  onChange={e => setSelectedId(Number(e.target.value) || null)}
                  disabled={nameDisabled}
                  required
                >
                  <option value="">Pilih nama</option>
                  {siswaList.map(s => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
                {gender && <p className="text-sm text-gray-500 mt-2">Gender: {gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>}
              </div>

              <div className="mt-2">
                <label className="font-semibold mb-2 block">Sholat yang dikerjakan hari ini:</label>
                <div className="grid grid-cols-2 gap-3">
                  {SHOLAT_LIST.map(s => (
                    <label key={s.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={!!todayReport?.[s.key]}
                        onChange={() => handleCheck(s.key)}
                        disabled={!selectedId}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="text-red-500 text-sm font-medium p-3 bg-red-50 rounded-md">{error}</div>}
              {success && <div className="text-green-600 text-sm font-medium p-3 bg-green-50 rounded-md">Tersimpan!</div>}

              <button
                type="submit"
                className="w-full bg-blue-600 disabled:bg-gray-400 mt-4 p-2 button"
                disabled={loading || !selectedId}
              >
                {loading ? 'Menyimpan...' : (editMode ? 'Update Laporan' : 'Submit')}
              </button>

              {nameDisabled && (
                <p className="text-xs text-center text-gray-500 mt-2">Nama tidak bisa diubah setelah submit hari ini. Jika salah isi, silakan edit laporan.</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}