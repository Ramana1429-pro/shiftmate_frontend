import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { CalendarCheck, MapPin, Star, type LucideIcon } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { colors } from '../theme';
import { SEEN_INTRO_KEY } from '../lib/flags';

const SLIDES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: MapPin, title: 'Find shifts near you', body: 'See weddings, concerts, expos and parties hiring part-time staff around your city.' },
  { icon: CalendarCheck, title: 'Get booked instantly', body: 'Pick a role, tap Book, done. Organizers see who is coming and you see exactly where to be.' },
  { icon: Star, title: 'Build your reputation', body: 'Show up, check in on time and earn ratings. Better ratings mean organizers pick you first.' },
];

export default function Intro() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);

  const finish = async () => {
    try {
      await AsyncStorage.setItem(SEEN_INTRO_KEY, '1');
    } catch {}
    router.replace('/auth');
  };
  const last = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <View style={{ alignItems: 'flex-end', padding: 16, height: 56 }}>
        {!last ? (
          <Pressable onPress={finish} hitSlop={10} testID="skip">
            <Text variant="label" color={colors.textMuted}>
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 }}>
              <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={48} color={colors.white} strokeWidth={1.8} />
                </View>
              </View>
              <Text variant="h1" center>
                {item.title}
              </Text>
              <Text muted center>
                {item.body}
              </Text>
            </View>
          );
        }}
      />
      <View style={{ padding: 24, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={{ width: i === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? colors.primary : colors.border }} />
          ))}
        </View>
        <Button
          title={last ? 'Get started' : 'Next'}
          size="lg"
          fullWidth
          testID="intro-next"
          onPress={() => {
            if (last) void finish();
            else {
              list.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
              setIndex(index + 1);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
