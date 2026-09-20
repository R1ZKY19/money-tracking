// Data bank Indonesia & umum dengan logo URL
export const BANKS = [
  // Indonesia — warna sesuai brand asli
  { id: 'tring',     name: 'Tring',       fullName: 'Tring',                  logo: 'https://i.ibb.co/vC6qjJRL/image.png',                                                                           color: '#FF6B35', category: 'ewallet' },
  { id: 'aba',       name: 'ABA',         fullName: 'ABA Bank',               logo: 'https://i.pinimg.com/1200x/e2/33/f5/e233f5b0c5a358449398f202b03f063a.jpg',                                     color: '#003087', category: 'bank_id' },
  { id: 'bca',       name: 'BCA',         fullName: 'Bank Central Asia',      logo: 'https://i.ibb.co/VY1zWqZ2/image.png',                                                                           color: '#005BAC', category: 'bank_id' },
  { id: 'mybca',     name: 'myBCA',       fullName: 'myBCA',                  logo: 'https://i.ibb.co/VY1zWqZ2/image.png',                                                                           color: '#005BAC', category: 'bank_id' },
  { id: 'bcablue',   name: 'BCA Blue',    fullName: 'BCA Blue',               logo: 'https://i.pinimg.com/736x/a6/25/b6/a625b66adb51d3a9db411d4ac37914e1.jpg',                                     color: '#1565C0', category: 'bank_id' },
  // warna Mandiri: kuning-emas #F4A100 + biru tua #003F8A — pakai kuning sebagai aksen utama
  { id: 'mandiri',   name: 'Mandiri',     fullName: 'Bank Mandiri',           logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/89c06853de7863819e5997c0edcfa728/mandiri-png.png', color: '#003F8A', category: 'bank_id' },
  // BRI: biru tua #003D8F
  { id: 'bri',       name: 'BRI',         fullName: 'Bank Rakyat Indonesia',  logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/4864e0fac9a28e7722560bbda9a08240/logo-bri.png',   color: '#003D8F', category: 'bank_id' },
  // BNI: oranye #F37021
  { id: 'bni',       name: 'BNI',         fullName: 'Bank Negara Indonesia',  logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/f54d50372413ffc93fdfa726a4dd8bcd/bni-png.png',   color: '#F37021', category: 'bank_id' },
  // BSI: hijau tua #00704A
  { id: 'bsi',       name: 'BSI',         fullName: 'Bank Syariah Indonesia', logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/11056336f102f73dd74196941f88f581/bsi-png.png',   color: '#00704A', category: 'bank_id' },
  // CIMB: merah #D71920
  { id: 'cimb',      name: 'CIMB Niaga',  fullName: 'CIMB Niaga',             logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/e0503f13b210ad617be2ca1a150da05c/cimb-png.png', color: '#D71920', category: 'bank_id' },
  // Danamon: merah #E31837
  { id: 'danamon',   name: 'Danamon',     fullName: 'Bank Danamon',           logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/71008e251e65e4a2d5d929888ff4a8f8/danamon-png.png', color: '#E31837', category: 'bank_id' },
  // SeaBank: hijau cerah #2DBA4E (Shopee-green)
  { id: 'seabank',   name: 'SeaBank',     fullName: 'SeaBank Indonesia',      logo: 'https://i.pinimg.com/736x/2c/88/9e/2c889e721850036d20987bf62639353d.jpg',                                       color: '#2DBA4E', category: 'bank_id' },
  // Maybank: kuning #F7B731
  { id: 'maybank',   name: 'Maybank',     fullName: 'Maybank Indonesia',      logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/ed8f2d4138037a391bc8e845d11e9930/maybank-png.png', color: '#F7B731', category: 'bank_id' },
  // Permata: biru #003DA5
  { id: 'permata',   name: 'Permata',     fullName: 'Bank Permata',           logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/PermataBank_logo.svg/200px-PermataBank_logo.svg.png',  color: '#003DA5', category: 'bank_id' },
  // BTN: oranye #F47920
  { id: 'btn',       name: 'BTN',         fullName: 'Bank Tabungan Negara',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Logo_BTN.svg/200px-Logo_BTN.svg.png',                  color: '#F47920', category: 'bank_id' },
  { id: 'panin',     name: 'Panin',       fullName: 'Panin Bank',             logo: null,                                                                                                               color: '#0057A8', category: 'bank_id' },

  // E-wallet — warna brand asli
  // DANA: biru #1890FF
  { id: 'dana',      name: 'DANA',        fullName: 'DANA',       logo: 'https://cdn.areabermain.club/assets/cdn/az9/2024/11/27/20241127/607c2871daa01187d8cb15c436bd2c36/dana-png.png',    color: '#1890FF', category: 'ewallet' },
  // OVO: ungu #4C3494
  { id: 'ovo',       name: 'OVO',         fullName: 'OVO',        logo: 'https://i.pinimg.com/1200x/7a/26/4c/7a264cf3739eaf849cd7145d06fc4421.jpg',                                         color: '#4C3494', category: 'ewallet' },
  // GoPay: biru-toska #00AAD2
  { id: 'gopay',     name: 'GoPay',       fullName: 'GoPay',      logo: 'https://i.pinimg.com/736x/18/93/ef/1893eff1a30b8a4df90feff9f2768f5f.jpg',                                          color: '#00AAD2', category: 'ewallet' },
  // ShopeePay: oranye #EE4D2D
  { id: 'shopeepay', name: 'ShopeePay',   fullName: 'ShopeePay',  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/200px-Shopee.svg.png',                       color: '#EE4D2D', category: 'ewallet' },
  // LinkAja: merah #E82529
  { id: 'linkaja',   name: 'LinkAja',     fullName: 'LinkAja',    logo: 'https://i.pinimg.com/736x/a3/ac/dc/a3acdc5237d8c3cd9634b8eb7561c16f.jpg',                                          color: '#E82529', category: 'ewallet' },

  // Internasional
  { id: 'paypal',     name: 'PayPal',     fullName: 'PayPal',     logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png',                        color: '#003087', category: 'international' },
  { id: 'visa',       name: 'Visa',       fullName: 'Visa Card',  logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',        color: '#1A1F71', category: 'international' },
  { id: 'mastercard', name: 'Mastercard', fullName: 'Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',      color: '#EB001B', category: 'international' },

  // Umum
  { id: 'cash',   name: 'Tunai/Cash', fullName: 'Uang Tunai',   logo: null, color: '#10B981', category: 'other' },
  { id: 'custom', name: 'Lainnya',    fullName: 'Bank Lainnya', logo: null, color: '#6366F1', category: 'other' },
];

export const getBankById = (id) => BANKS.find(b => b.id === id) || null;

export const getBankByName = (name) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  // Alias map untuk keyword khusus
  const aliases = {
    'tring': 'tring',
    'aba bank': 'aba', 'aba': 'aba',
    'mybca': 'mybca', 'my bca': 'mybca',
    'bca blue': 'bcablue', 'blue bca': 'bcablue',
    'seabank indonesia': 'seabank', 'seabank': 'seabank', 'sea bank': 'seabank',
    'gopay': 'gopay', 'go pay': 'gopay',
    'linkaja': 'linkaja', 'link aja': 'linkaja',
    'shopeepay': 'shopeepay', 'shopee pay': 'shopeepay',
    'ovo': 'ovo',
    'dana': 'dana',
  };
  for (const [keyword, bankId] of Object.entries(aliases)) {
    if (lower.includes(keyword)) {
      const found = BANKS.find(b => b.id === bankId);
      if (found) return found;
    }
  }
  return BANKS.find(b =>
    b.name.toLowerCase() === lower ||
    b.fullName.toLowerCase() === lower ||
    lower.includes(b.name.toLowerCase())
  ) || null;
};

export const BANK_CATEGORIES = {
  bank_id: 'Bank Indonesia',
  ewallet: 'E-Wallet',
  international: 'Internasional',
  other: 'Lainnya',
};