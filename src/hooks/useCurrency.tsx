import { useState, useEffect } from 'react';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate per kWh in local currency
}

export const currencyMap: Record<string, CurrencyInfo> = {
  // Europe
  'DE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.30 },
  'FR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.28 },
  'ES': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.25 },
  'IT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.32 },
  'NL': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.35 },
  'PT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.27 },
  'IE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.29 },
  
  // UK
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.25 },
  
  // North America
  'US': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.16 },
  'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso', rate: 2.2 },
  
  // Asia Pacific
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.18 },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 18 },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 10 },
  'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.17 },
  'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 0.75 },
  'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 160 },
  'NZ': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 0.22 },

  // Africa
  'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 120 },
  'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 2.8 },
  'GH': { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', rate: 2.5 },
  'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 25 },
  'EG': { code: 'EGP', symbol: '£', name: 'Egyptian Pound', rate: 4.5 },
  'TZ': { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', rate: 300 },
  'UG': { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', rate: 350 },
  'MA': { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', rate: 1.0 },
  'DZ': { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', rate: 20 },
  'TN': { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', rate: 0.8 },
  'RW': { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', rate: 250 },
  'ET': { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', rate: 25 },
  'ZM': { code: 'ZMW', symbol: 'K', name: 'Zambian Kwacha', rate: 3.2 },
  'BW': { code: 'BWP', symbol: 'P', name: 'Botswana Pula', rate: 1.6 },
  'MU': { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', rate: 5.2 },
  // Currency unions
  'SN': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'CI': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'ML': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'BF': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'BJ': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'TG': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'NE': { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc', rate: 90 },
  'GN': { code: 'GNF', symbol: 'FG', name: 'Guinean Franc', rate: 1200 },
  'CM': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc', rate: 90 },
  'GA': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc', rate: 90 },
  'CG': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc', rate: 90 },
  'TD': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc', rate: 90 },
  'CF': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc', rate: 90 },
  'GQ': { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc', rate: 90 },
  
  // Default fallback
  'DEFAULT': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 }
};

export const getCurrencyInfo = (countryCode: string): CurrencyInfo => {
  return currencyMap[countryCode] || currencyMap.DEFAULT;
};

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyInfo>(currencyMap.DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try multiple geolocation methods
      let countryCode = await getCountryFromIP();
      
      if (!countryCode) {
        countryCode = await getCountryFromTimezone();
      }

      if (!countryCode) {
        countryCode = getCountryFromLanguage();
      }

      const currencyInfo = currencyMap[countryCode] || currencyMap.DEFAULT;
      setCurrency(currencyInfo);
    } catch (err) {
      console.warn('Failed to detect location, using default currency:', err);
      setError('Failed to detect location');
      setCurrency(currencyMap.DEFAULT);
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryFromIP = async (): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      return data.country_code || null;
    } catch {
      return null;
    }
  };

  const getCountryFromTimezone = async (): Promise<string | null> => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneToCountry: Record<string, string> = {
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Madrid': 'ES',
        'Europe/Rome': 'IT',
        'Europe/Amsterdam': 'NL',
        'Asia/Tokyo': 'JP',
        'Asia/Kolkata': 'IN',
        'Asia/Singapore': 'SG',
        'Australia/Sydney': 'AU',
      };
      
      return timezoneToCountry[timezone] || null;
    } catch {
      return null;
    }
  };

  const getCountryFromLanguage = (): string => {
    const language = navigator.language.toLowerCase();
    
    if (language.includes('en-us')) return 'US';
    if (language.includes('en-gb')) return 'GB';
    if (language.includes('en-ca')) return 'CA';
    if (language.includes('en-au')) return 'AU';
    if (language.includes('de')) return 'DE';
    if (language.includes('fr')) return 'FR';
    if (language.includes('es')) return 'ES';
    if (language.includes('it')) return 'IT';
    if (language.includes('nl')) return 'NL';
    if (language.includes('ja')) return 'JP';
    if (language.includes('hi') || language.includes('en-in')) return 'IN';
    if (language.includes('en-ng') || language.endsWith('-ng')) return 'NG';
    if (language.includes('en-za') || language.endsWith('-za')) return 'ZA';
    if (language.includes('en-gh') || language.endsWith('-gh')) return 'GH';
    if (language.includes('en-ke') || language.endsWith('-ke')) return 'KE';
    if (language.includes('ar-eg') || language.endsWith('-eg')) return 'EG';
    if (language.endsWith('-tz')) return 'TZ';
    if (language.endsWith('-ug')) return 'UG';
    if (language.endsWith('-ma')) return 'MA';
    if (language.endsWith('-dz')) return 'DZ';
    if (language.endsWith('-tn')) return 'TN';
    if (language.endsWith('-rw')) return 'RW';
    if (language.endsWith('-et')) return 'ET';
    if (language.endsWith('-zm')) return 'ZM';
    if (language.endsWith('-bw')) return 'BW';
    if (language.endsWith('-mu')) return 'MU';
    
    return 'US'; // Default fallback
  };

  const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
    if (currency.code === 'JPY' || currency.code === 'INR') {
      // No decimal places for JPY and INR
      const formatted = Math.round(amount).toLocaleString();
      return showSymbol ? `${currency.symbol}${formatted}` : formatted;
    }
    
    const formatted = amount.toFixed(2);
    return showSymbol ? `${currency.symbol}${formatted}` : formatted;
  };

  const formatRate = (rate: number): string => {
    return `${formatCurrency(rate)}/${currency.code === 'JPY' || currency.code === 'INR' ? 'kWh' : 'kWh'}`;
  };

  const convertFromUSD = (usdAmount: number): number => {
    // Simple conversion based on energy rates
    const usdRate = 0.12; // Base USD rate
    return (usdAmount / usdRate) * currency.rate;
  };

  const manuallySetCurrency = (countryCode: string) => {
    const currencyInfo = currencyMap[countryCode] || currencyMap.DEFAULT;
    setCurrency(currencyInfo);
    setError(null);
  };

  return {
    currency,
    isLoading,
    error,
    formatCurrency,
    formatRate,
    convertFromUSD,
    manuallySetCurrency,
    detectUserLocation,
    availableCountries: Object.keys(currencyMap).filter(key => key !== 'DEFAULT'),
  };
}