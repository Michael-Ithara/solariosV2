import { useState, useEffect } from 'react';
import { useProfile } from './useProfile';

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
  'BE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.27 },
  'AT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.22 },
  'PT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.21 },
  'GR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.19 },
  'IE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.28 },
  'FI': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.17 },
  'SE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 1.50 },
  'NO': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', rate: 1.20 },
  'DK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone', rate: 2.10 },
  'PL': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 0.65 },
  'CZ': { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', rate: 3.20 },
  'CH': { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.25 },
  
  // UK
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.25 },
  
  // North America
  'US': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.16 },
  'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso', rate: 2.50 },
  
  // Asia Pacific
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.18 },
  'NZ': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 0.20 },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 18 },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 10 },
  'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.17 },
  'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 0.65 },
  'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 140 },
  'HK': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', rate: 0.95 },
  'TW': { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', rate: 3.50 },
  'MY': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 0.45 },
  'TH': { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 4.20 },
  'ID': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 1800 },
  'PH': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', rate: 6.50 },
  'VN': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', rate: 2800 },
  
  // Middle East
  'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.35 },
  'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rate: 0.32 },
  'IL': { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', rate: 0.48 },
  'TR': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rate: 2.50 },
  
  // Africa
  'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 1.80 },
  'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 65 },
  'EG': { code: 'EGP', symbol: '£', name: 'Egyptian Pound', rate: 3.50 },
  
  // South America
  'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 0.65 },
  'AR': { code: 'ARS', symbol: '$', name: 'Argentine Peso', rate: 75 },
  'CL': { code: 'CLP', symbol: '$', name: 'Chilean Peso', rate: 95 },
  'CO': { code: 'COP', symbol: '$', name: 'Colombian Peso', rate: 550 },
  
  // Default fallback
  'DEFAULT': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 }
};

export const getCurrencyInfo = (countryCode: string): CurrencyInfo => {
  return currencyMap[countryCode] || currencyMap.DEFAULT;
};

export function useCurrency() {
  const { profile, isLoading: profileLoading } = useProfile();
  const [currency, setCurrency] = useState<CurrencyInfo>(currencyMap.DEFAULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use profile currency first, then auto-detect
  useEffect(() => {
    if (profileLoading) return;

    if (profile?.currency) {
      // Find country code that matches profile currency
      const countryCode = Object.keys(currencyMap).find(
        code => code !== 'DEFAULT' && currencyMap[code].code === profile.currency
      );
      if (countryCode) {
        setCurrency(currencyMap[countryCode]);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to auto-detection if no profile currency
    detectUserLocation();
  }, [profile?.currency, profileLoading]);

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
        // Americas
        'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 
        'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
        'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA',
        'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR',
        'America/Santiago': 'CL', 'America/Bogota': 'CO',
        
        // Europe
        'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
        'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
        'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Lisbon': 'PT',
        'Europe/Athens': 'GR', 'Europe/Dublin': 'IE', 'Europe/Helsinki': 'FI',
        'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
        'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Zurich': 'CH',
        'Europe/Istanbul': 'TR',
        
        // Asia
        'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN',
        'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG', 'Asia/Kolkata': 'IN',
        'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH',
        'Asia/Taipei': 'TW', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Ho_Chi_Minh': 'VN',
        'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Jerusalem': 'IL',
        
        // Oceania
        'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
        'Pacific/Auckland': 'NZ',
        
        // Africa
        'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Cairo': 'EG',
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