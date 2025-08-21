import { useState, useEffect } from 'react';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate per kWh in local currency
}

const currencyMap: Record<string, CurrencyInfo> = {
  // Europe
  'DE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.30 },
  'FR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.28 },
  'ES': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.25 },
  'IT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.32 },
  'NL': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.35 },
  
  // UK
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.25 },
  
  // North America
  'US': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.16 },
  
  // Asia Pacific
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.18 },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 18 },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 10 },
  'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.17 },
  
  // Default fallback
  'DEFAULT': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 }
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