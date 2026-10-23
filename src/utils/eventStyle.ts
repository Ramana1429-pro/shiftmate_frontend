import {
  Briefcase,
  CalendarDays,
  GraduationCap,
  Heart,
  Music,
  PartyPopper,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

export interface EventLook {
  icon: LucideIcon;
  color: string;
  soft: string;
}

const looks: Record<string, EventLook> = {
  wedding: { icon: Heart, color: '#DB2777', soft: '#FCE7F3' },
  concert: { icon: Music, color: '#7C3AED', soft: '#EDE9FE' },
  'college fest': { icon: GraduationCap, color: '#0EA5E9', soft: '#E0F2FE' },
  expo: { icon: Store, color: '#059669', soft: '#D1FAE5' },
  corporate: { icon: Briefcase, color: '#4F46E5', soft: '#EEF2FF' },
  catering: { icon: UtensilsCrossed, color: '#D97706', soft: '#FEF3C7' },
  party: { icon: PartyPopper, color: '#E11D48', soft: '#FFE4E6' },
};

const fallback: EventLook = { icon: CalendarDays, color: '#4F46E5', soft: '#EEF2FF' };

export const EVENT_TYPES = ['Wedding', 'Concert', 'College fest', 'Expo', 'Corporate', 'Catering', 'Party'];

export function eventLook(type: string | null | undefined): EventLook {
  return looks[(type ?? '').toLowerCase()] ?? fallback;
}
