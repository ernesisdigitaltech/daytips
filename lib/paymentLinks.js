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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
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
      coins20: 'TODO',
      coins50: 'TODO',
    },
  },
  {
    key: 'crypto',
    label: 'Crypto',
    flag: '₿',
    currency: 'USDT (TRC20)',
    isCrypto: true,
    // TODO: replace with your real wallet address(es)
    walletAddress: 'TDcBk225WjCzQGve5tZoHE9rMk65XE7jhR',
  },
]

export function isRealLink(link) {
  return typeof link === 'string' && link.startsWith('http')
}