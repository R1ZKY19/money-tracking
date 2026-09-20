import { createContext, useContext } from 'react';

const CurrencyContext = createContext(null);

export { };

export function CurrencyProvider({ children }) {
  const defaultCurrency = 'IDR';

  const formatDefault = (amount) => {
    if (!amount || isNaN(amount)) return 'Rp 0';
    return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`;
  };

  const convertToDefault = (amount) => amount || 0;
  const convert = (amount) => amount || 0;

  return (
    <CurrencyContext.Provider value={{
      defaultCurrency,
      setDefaultCurrency: () => {},
      rates: { IDR: 1 },
      lastSync: null,
      syncStatus: 'success',
      loading: false,
      convertToDefault,
      convert,
      formatDefault,
      refreshRates: async () => {},
      loadRates: async () => {},
      COUNTRY_CURRENCIES: [
        { country: 'Indonesia', code: 'IDR', name: 'Rupiah', symbol: 'Rp', flag: '🇮🇩' }
      ]
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}