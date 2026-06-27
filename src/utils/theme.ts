export const Colors = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
};

export const Typography = {
  heading: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subheading: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  body: { fontSize: 15, color: '#0F172A', fontWeight: '400' },
  caption: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
};

export const isTablet = (): boolean => {
  const { width } = require('react-native').Dimensions.get('window');
  return width > 768;
};

export const hp = (percentage: number): number => {
  const { height } = require('react-native').Dimensions.get('window');
  return (percentage * height) / 100;
};

export const wp = (percentage: number): number => {
  const { width } = require('react-native').Dimensions.get('window');
  return (percentage * width) / 100;
};
