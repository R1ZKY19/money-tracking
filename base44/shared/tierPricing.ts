// Sumber tunggal harga & role paket di sisi server (jangan dibaca dari frontend).
export const TIER_PRICING = {
  STAF: { label: 'Paket Staf', price: 600000, role: 'staf' },
  MASTER_2: { label: 'Paket Master II', price: 1000000, role: 'master_2' },
  MASTER_1: { label: 'Paket Master I', price: 1300000, role: 'master_1' },
};

export const ROLE_LEVEL = { staf: 1, master_2: 2, master_1: 3, super_master: 4 };