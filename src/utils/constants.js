import { AlertTriangle, Map, Newspaper, Heart } from 'lucide-react';

export const PACKET_TYPES = {
  ALERT: 'alert',
  SAFE_ROUTE: 'safe_route',
  NEWS: 'news',
  MEDICAL: 'medical'
};

export const PACKET_CONFIG = {
  [PACKET_TYPES.ALERT]: {
    label: 'Emergency Alert',
    shortLabel: 'Alert',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    accentColor: '#ef4444',
    icon: AlertTriangle,
    glowClass: 'glow-red',
  },
  [PACKET_TYPES.SAFE_ROUTE]: {
    label: 'Safe Route',
    shortLabel: 'Route',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    accentColor: '#22c55e',
    icon: Map,
    glowClass: 'glow-green',
  },
  [PACKET_TYPES.NEWS]: {
    label: 'Community Update',
    shortLabel: 'News',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    accentColor: '#3b82f6',
    icon: Newspaper,
    glowClass: 'glow-blue',
  },
  [PACKET_TYPES.MEDICAL]: {
    label: 'Medical Aid',
    shortLabel: 'Medical',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    accentColor: '#06b6d4',
    icon: Heart,
    glowClass: 'glow-cyan',
  },
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-500' },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/20', dot: 'bg-blue-500' },
  low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/20', dot: 'bg-slate-500' },
};
