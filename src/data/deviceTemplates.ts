import { DeviceTemplate } from '@/types/simulation';

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  // HVAC & Climate Control
  {
    id: 'central-ac',
    name: 'Central Air Conditioning',
    category: 'HVAC',
    powerRating: 3500,
    icon: 'Snowflake',
    description: 'Whole house cooling system',
    usagePattern: {
      baseUsage: 0.3,
      peakHours: [12, 13, 14, 15, 16, 17, 18],
      peakMultiplier: 1.8,
      randomVariance: 0.2,
      weatherDependent: true,
      seasonalVariance: 0.4
    },
    features: ['Temperature Control', 'Schedule', 'Eco Mode']
  },
  {
    id: 'heat-pump',
    name: 'Heat Pump',
    category: 'HVAC',
    powerRating: 2800,
    icon: 'Wind',
    description: 'Efficient heating and cooling',
    usagePattern: {
      baseUsage: 0.4,
      peakHours: [6, 7, 8, 18, 19, 20, 21],
      peakMultiplier: 1.5,
      randomVariance: 0.15,
      weatherDependent: true
    },
    features: ['Dual Mode', 'Smart Thermostat', 'Energy Star']
  },
  {
    id: 'smart-thermostat',
    name: 'Smart Thermostat',
    category: 'HVAC',
    powerRating: 15,
    icon: 'Thermometer',
    description: 'Intelligent climate control',
    usagePattern: {
      baseUsage: 1.0,
      peakHours: [],
      peakMultiplier: 1.0,
      randomVariance: 0.05
    },
    features: ['Learning', 'Remote Control', 'Scheduling']
  },

  // Kitchen Appliances
  {
    id: 'refrigerator',
    name: 'Smart Refrigerator',
    category: 'Kitchen',
    powerRating: 150,
    icon: 'Package',
    description: 'Energy efficient cooling',
    usagePattern: {
      baseUsage: 0.8,
      peakHours: [11, 12, 18, 19, 20],
      peakMultiplier: 1.3,
      randomVariance: 0.1,
      weatherDependent: true
    },
    features: ['Smart Cooling', 'Ice Maker', 'Energy Monitor']
  },
  {
    id: 'dishwasher',
    name: 'Smart Dishwasher',
    category: 'Kitchen',
    powerRating: 1800,
    icon: 'Waves',
    description: 'Efficient cleaning cycles',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [19, 20, 21],
      peakMultiplier: 1.0,
      randomVariance: 0.1
    },
    features: ['Eco Wash', 'Delay Start', 'Load Sensing']
  },
  {
    id: 'electric-stove',
    name: 'Electric Stove/Oven',
    category: 'Kitchen',
    powerRating: 3000,
    icon: 'Flame',
    description: 'High-efficiency cooking',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [7, 8, 12, 17, 18, 19],
      peakMultiplier: 1.0,
      randomVariance: 0.2
    },
    features: ['Induction', 'Timer', 'Temperature Control']
  },
  {
    id: 'microwave',
    name: 'Smart Microwave',
    category: 'Kitchen',
    powerRating: 1200,
    icon: 'Microwave',
    description: 'Quick heating solution',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [7, 8, 12, 17, 18],
      peakMultiplier: 1.0,
      randomVariance: 0.1
    },
    features: ['Sensor Cooking', 'Voice Control', 'Quick Heat']
  },

  // Laundry
  {
    id: 'washing-machine',
    name: 'Smart Washing Machine',
    category: 'Laundry',
    powerRating: 2000,
    icon: 'WashingMachine',
    description: 'Efficient fabric care',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [9, 10, 15, 16],
      peakMultiplier: 1.0,
      randomVariance: 0.15
    },
    features: ['Load Sensing', 'Eco Mode', 'Remote Start']
  },
  {
    id: 'dryer',
    name: 'Smart Dryer',
    category: 'Laundry',
    powerRating: 3000,
    icon: 'RotateCw',
    description: 'Heat pump drying technology',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [10, 11, 16, 17],
      peakMultiplier: 1.0,
      randomVariance: 0.2
    },
    features: ['Moisture Sensing', 'Steam Refresh', 'Energy Save']
  },

  // Entertainment
  {
    id: 'smart-tv-65',
    name: '65" Smart TV',
    category: 'Entertainment',
    powerRating: 120,
    icon: 'Tv',
    description: 'Large screen entertainment',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [18, 19, 20, 21, 22, 23],
      peakMultiplier: 1.0,
      randomVariance: 0.1
    },
    features: ['HDR', 'Smart Apps', 'Voice Control']
  },
  {
    id: 'sound-system',
    name: 'Home Theater System',
    category: 'Entertainment',
    powerRating: 300,
    icon: 'Volume2',
    description: 'Surround sound audio',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [19, 20, 21, 22],
      peakMultiplier: 1.0,
      randomVariance: 0.15
    },
    features: ['Dolby Atmos', 'Wireless', 'Voice Assistant']
  },
  {
    id: 'gaming-console',
    name: 'Gaming Console',
    category: 'Entertainment',
    powerRating: 180,
    icon: 'Gamepad2',
    description: 'Next-gen gaming experience',
    usagePattern: {
      baseUsage: 0.1,
      peakHours: [16, 17, 18, 19, 20, 21, 22],
      peakMultiplier: 1.0,
      randomVariance: 0.2
    },
    features: ['4K Gaming', 'Quick Resume', 'Media Center']
  },

  // Lighting
  {
    id: 'smart-lights-living',
    name: 'Living Room Smart Lights',
    category: 'Lighting',
    powerRating: 60,
    icon: 'Lightbulb',
    description: 'Color-changing LED lights',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [18, 19, 20, 21, 22, 23],
      peakMultiplier: 1.0,
      randomVariance: 0.1
    },
    features: ['Color Changing', 'Dimming', 'Scheduling']
  },
  {
    id: 'outdoor-lighting',
    name: 'Outdoor Security Lighting',
    category: 'Lighting',
    powerRating: 45,
    icon: 'Lamp',
    description: 'Motion-activated security',
    usagePattern: {
      baseUsage: 0.1,
      peakHours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
      peakMultiplier: 1.0,
      randomVariance: 0.2
    },
    features: ['Motion Detection', 'Weather Resistant', 'Solar Backup']
  },

  // Water & Pool
  {
    id: 'pool-pump',
    name: 'Variable Speed Pool Pump',
    category: 'Pool & Spa',
    powerRating: 1500,
    icon: 'Waves',
    description: 'Efficient water circulation',
    usagePattern: {
      baseUsage: 0.5,
      peakHours: [10, 11, 12, 13, 14, 15],
      peakMultiplier: 1.8,
      randomVariance: 0.1,
      weatherDependent: true
    },
    features: ['Variable Speed', 'Timer Control', 'Energy Efficient']
  },
  {
    id: 'pool-heater',
    name: 'Pool Heat Pump',
    category: 'Pool & Spa',
    powerRating: 4000,
    icon: 'Thermometer',
    description: 'Maintain perfect water temperature',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [8, 9, 10, 16, 17, 18],
      peakMultiplier: 1.0,
      randomVariance: 0.2,
      weatherDependent: true,
      seasonalVariance: 0.6
    },
    features: ['Heat Pump Technology', 'Smart Control', 'Weather Adaptive']
  },
  {
    id: 'hot-water-heater',
    name: 'Electric Water Heater',
    category: 'Water',
    powerRating: 4500,
    icon: 'Droplets',
    description: 'On-demand hot water',
    usagePattern: {
      baseUsage: 0.3,
      peakHours: [6, 7, 8, 18, 19, 20, 21],
      peakMultiplier: 1.6,
      randomVariance: 0.2
    },
    features: ['Smart Scheduling', 'Leak Detection', 'Temperature Control']
  },

  // EV & Transportation
  {
    id: 'ev-charger-level2',
    name: 'Level 2 EV Charger',
    category: 'EV Charging',
    powerRating: 7200,
    icon: 'Car',
    description: 'Fast home charging',
    usagePattern: {
      baseUsage: 0.0,
      peakHours: [22, 23, 0, 1, 2, 3, 4, 5],
      peakMultiplier: 1.0,
      randomVariance: 0.1
    },
    features: ['Smart Scheduling', 'Load Balancing', 'Solar Integration']
  },

  // Office & Computing
  {
    id: 'home-office-setup',
    name: 'Home Office Workstation',
    category: 'Office',
    powerRating: 400,
    icon: 'Monitor',
    description: 'Complete work setup',
    usagePattern: {
      baseUsage: 0.1,
      peakHours: [8, 9, 10, 11, 13, 14, 15, 16, 17],
      peakMultiplier: 1.0,
      randomVariance: 0.15
    },
    features: ['Multi-Monitor', 'USB-C Charging', 'Ergonomic']
  },

  // Security & Smart Home
  {
    id: 'security-system',
    name: 'Smart Security System',
    category: 'Security',
    powerRating: 50,
    icon: 'Shield',
    description: 'Complete home monitoring',
    usagePattern: {
      baseUsage: 1.0,
      peakHours: [],
      peakMultiplier: 1.0,
      randomVariance: 0.05
    },
    features: ['24/7 Monitoring', 'Mobile Alerts', 'Cloud Storage']
  }
];

export const DEVICE_CATEGORIES = [
  'All',
  'HVAC',
  'Kitchen',
  'Laundry',
  'Entertainment',
  'Lighting',
  'Pool & Spa',
  'Water',
  'EV Charging',
  'Office',
  'Security'
];