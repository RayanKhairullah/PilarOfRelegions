"use client";
import React from "react";

type Props = {
  genderInput: string;
  setGenderInput: (v: string) => void;
  searchInput: string;
  setSearchInput: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  dateInput: string;
  setDateInput: (v: string) => void;
  weekInput: string;
  setWeekInput: (v: string) => void;
  monthInput: string;
  setMonthInput: (v: string) => void;
  clearTanggal: () => void;
};

export default function FilterBar({
  genderInput,
  setGenderInput,
  searchInput,
  setSearchInput,
  search,
  setSearch,
  dateInput,
  setDateInput,
  weekInput,
  setWeekInput,
  monthInput,
  setMonthInput,
  clearTanggal,
}: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-4 mb-6 text-gray-700 dark:text-neutral-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
        <select
          onChange={(e) => {
            const val = e.target.value;
            setGenderInput(val);
          }}
          value={genderInput}
          className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700"
        >
          <option value="">Semua Gender</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari nama siswa..."
            onChange={(e) => setSearchInput(e.target.value)}
            value={searchInput}
            className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-neutral-900 placeholder-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400"
          />
          {search || searchInput ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              title="Bersihkan pencarian"
            >
              Clear
            </button>
          ) : null}
        </div>
        <input
          type="date"
          onChange={(e) => {
            const val = e.target.value;
            setDateInput(val);
            setWeekInput("");
            setMonthInput("");
          }}
          value={dateInput}
          className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-neutral-900 placeholder-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400"
        />
        <input
          type="week"
          onChange={(e) => {
            const val = e.target.value;
            setWeekInput(val);
            setDateInput("");
            setMonthInput("");
          }}
          value={weekInput}
          className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-neutral-900 placeholder-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400"
        />
        <input
          type="month"
          onChange={(e) => {
            const val = e.target.value;
            setMonthInput(val);
            setDateInput("");
            setWeekInput("");
          }}
          value={monthInput}
          className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-neutral-900 placeholder-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400"
        />
        <button
          type="button"
          onClick={clearTanggal}
          className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          title="Bersihkan filter tanggal"
        >
          Clear Tanggal
        </button>
      </div>
    </div>
  );
}
