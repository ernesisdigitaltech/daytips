// Central config for every payment corridor DayTips supports.
// Fill in each 'TODO' with the real Flutterwave Payment Link once created.
// Leaving a link as 'TODO' automatically shows it as "Coming soon" and
// disables the button — nothing breaks if you fill these in gradually.

export const PAYMENT_OPTIONS = [
  {
    key: 'nigeria',
    label: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    links: {
      weekly: 'https://flutterwave.com/pay/wpmtjihhvtjg',
      monthly: 'https://flutterwave.com/pay/jaspekwdxlsj',
      coins20: 'https://flutterwave.com/pay/ivbihowminhv',
      coins50: 'https://flutterwave.com/pay/1fv92hui9oit',
    },
    prices: {
      coins20: '₦1,000',
      coins50: '₦2,000',
      weekly: '₦3,000',
      monthly: '₦10,000',
    },
  },
  {
    key: 'ghana',
    label: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    links: {
      weekly: 'https://flutterwave.com/pay/egysjn5foeav',
      monthly: 'https://flutterwave.com/pay/abttjvdhbyat',
      coins20: 'https://flutterwave.com/pay/v4lp3zwtgdjv',
      coins50: 'https://flutterwave.com/pay/g7h1brsyuu0s',
    },
    prices: {
      coins20: 'GH₵9',
      coins50: 'GH₵18',
      weekly: 'GH₵26',
      monthly: 'GH₵85',
    },
  },
  {
    key: 'kenya',
    label: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    links: {
      weekly: 'https://flutterwave.com/pay/2yaxukg9dz1u',
      monthly: 'https://flutterwave.com/pay/fdqslznanyfv',
      coins20: 'https://flutterwave.com/pay/66ppuifkm06a',
      coins50: 'https://flutterwave.com/pay/kn6kkug6gnnh',
    },
    prices: {
      coins20: 'KSh 85',
      coins50: 'KSh 168',
      weekly: 'KSh 260',
      monthly: 'KSh 850',
    },
  },
  {
    key: 'zambia',
    label: 'Zambia',
    flag: '🇿🇲',
    currency: 'ZMW',
    links: {
      weekly: 'https://flutterwave.com/pay/64dklhbgy7sf',
      monthly: 'https://flutterwave.com/pay/q6aa83jbvcbe',
      coins20: 'https://flutterwave.com/pay/aje2ks2730cc',
      coins50: 'https://flutterwave.com/pay/qtgykqhd3mdq',
    },
    prices: {
      coins20: 'K18',
      coins50: 'K36',
      weekly: 'K53',
      monthly: 'K174',
    },
  },
  {
    key: 'south_africa',
    label: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    links: {
      weekly: 'https://flutterwave.com/pay/txdssmr6cyc3',
      monthly: 'https://flutterwave.com/pay/yp0gsgzpev8r',
      coins20: 'https://flutterwave.com/pay/es9tk73tprlg',
      coins50: 'https://flutterwave.com/pay/g6unswld8olp',
    },
    prices: {
      coins20: 'R13',
      coins50: 'R24',
      weekly: 'R34',
      monthly: 'R118',
    },
  },
  {
    key: 'tanzania',
    label: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    links: {
      weekly: 'https://flutterwave.com/pay/enostjhquwsk',
      monthly: 'https://flutterwave.com/pay/rjwasfcl8vvv',
      coins20: 'https://flutterwave.com/pay/7gsujfwgv69c',
      coins50: 'https://flutterwave.com/pay/fttx6xoxkstt',
    },
    prices: {
      coins20: 'TSh 1,800',
      coins50: 'TSh 3,500',
      weekly: 'TSh 5,200',
      monthly: 'TSh 17,000',
    },
  },
  {
    key: 'uganda',
    label: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    links: {
      weekly: 'https://flutterwave.com/pay/f22eo15bwmzl',
      monthly: 'https://flutterwave.com/pay/f271lkul3qqr',
      coins20: 'https://flutterwave.com/pay/p3qihyqevnyk',
      coins50: 'https://flutterwave.com/pay/2snffyxxworc',
    },
    prices: {
      coins20: 'USh 2,500',
      coins50: 'USh 4,800',
      weekly: 'USh 7,200',
      monthly: 'USh 23,800',
    },
  },
  {
    key: 'usd',
    label: 'International (USD)',
    flag: '🌍',
    currency: 'USD',
    links: {
      weekly: 'https://flutterwave.com/pay/ojjuitwkx4th',
      monthly: 'https://flutterwave.com/pay/vxzcq8t3twoy',
      coins20: 'https://flutterwave.com/pay/qfaejnlweg6j',
      coins50: 'https://flutterwave.com/pay/qfaejnlweg6j',
    },
    prices: {
      coins20: '$1.50',
      coins50: '$1.50',
      weekly: '$2',
      monthly: '$7',
    },
  },
  {
    key: 'crypto',
    label: 'Crypto',
    flag: 'USDT (TRC20)',
    currency: 'USDT (TRC20)',
    isCrypto: true,
    walletAddress: 'TDcBk225WjCzQGve5tZoHE9rMk65XE7jhR',
  },
]

export function isRealLink(link) {
  return typeof link === 'string' && link.startsWith('http')
}