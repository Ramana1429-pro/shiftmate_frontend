import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { colors, fonts } from '../theme';
import { addDays, isSameDay, startOfDay } from '../utils/format';
import { Chip } from './Chip';
import { Text } from './Text';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Horizontal strip of the next days. Works on every platform, no native picker needed. */
export function DateStrip({ value, onChange, days = 30 }: { value: Date; onChange: (d: Date) => void; days?: number }) {
  const today = startOfDay(new Date());
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {Array.from({ length: days }).map((_, i) => {
        const day = addDays(today, i);
        const selected = isSameDay(day, value);
        return (
          <Pressable
            key={i}
            testID={`day-${i}`}
            onPress={() => onChange(day)}
            style={{
              width: 56,
              height: 72,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: selected ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <Text variant="caption" color={selected ? '#E0E7FF' : colors.textMuted}>
              {i === 0 ? 'Today' : DAYS[day.getDay()]}
            </Text>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 20, color: selected ? colors.white : colors.text }}>{day.getDate()}</Text>
            <Text variant="caption" color={selected ? '#E0E7FF' : colors.textMuted}>
              {MONTHS[day.getMonth()]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Stepper({ label, value, onMinus, onPlus, testID }: { label: string; value: string; onMinus: () => void; onPlus: () => void; testID: string }) {
  const btn = { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft } as const;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable testID={`${testID}-minus`} onPress={onMinus} style={btn} accessibilityLabel={`${label} less`}>
          <Minus size={16} color={colors.primary} />
        </Pressable>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 22, minWidth: 34, textAlign: 'center' }}>{value}</Text>
        <Pressable testID={`${testID}-plus`} onPress={onPlus} style={btn} accessibilityLabel={`${label} more`}>
          <Plus size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

/** Time of day as hour stepper, minute steps of 15, and AM/PM. `minutes` is minutes since midnight. */
export function TimeField({ label, minutes, onChange, testID }: { label: string; minutes: number; onChange: (m: number) => void; testID: string }) {
  const wrap = (m: number) => ((m % 1440) + 1440) % 1440;
  const h24 = Math.floor(minutes / 60);
  const min = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const pm = h24 >= 12;
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
      <Text variant="label">{label}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Stepper label="Hour" value={String(h12)} testID={`${testID}-h`} onMinus={() => onChange(wrap(minutes - 60))} onPlus={() => onChange(wrap(minutes + 60))} />
        <Stepper label="Minute" value={String(min).padStart(2, '0')} testID={`${testID}-m`} onMinus={() => onChange(wrap(minutes - 15))} onPlus={() => onChange(wrap(minutes + 15))} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Chip label="AM" selected={!pm} onPress={() => pm && onChange(wrap(minutes - 720))} testID={`${testID}-am`} />
          <Chip label="PM" selected={pm} onPress={() => !pm && onChange(wrap(minutes + 720))} testID={`${testID}-pm`} />
        </View>
      </View>
    </View>
  );
}
