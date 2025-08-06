export type Gender = 'L' | 'P';

export interface Siswa {
  id: number;
  nama: string;
  gender: Gender;
}

export interface SholatReport {
  id: number;
  siswa_id: number;
  tanggal: string; // YYYY-MM-DD
  subuh: boolean;
  dzuhur: boolean;
  ashar: boolean;
  maghrib: boolean;
  isya: boolean;
  updated_at: string;
  siswa?: Siswa;
  // [key: string]: string | number | boolean | undefined; // Removed to fix TS error
}
