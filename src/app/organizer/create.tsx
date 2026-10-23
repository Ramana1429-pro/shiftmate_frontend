import { useLocalSearchParams, useRouter } from 'expo-router';
import { Crosshair, MapPin, Plus, Trash2, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { errorMessage } from '../../api';
import type { ShiftInput } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { Input } from '../../components/Input';
import { Footer, Header, Screen, SectionTitle } from '../../components/Screen';
import { Text } from '../../components/Text';
import { DateStrip, TimeField } from '../../components/TimeAndDate';
import { useToast } from '../../components/Toast';
import { useCreateEvent } from '../../hooks/queries';
import { getCurrentCoords } from '../../lib/location';
import { colors } from '../../theme';
import { EVENT_TYPES } from '../../utils/eventStyle';
import { formatDate, formatTime, rupees, startOfDay } from '../../utils/format';

interface ShiftDraft {
  key: number;
  role_name: string;
  pay: string;
  slots: string;
  dress_code: string;
  auto_confirm: boolean;
}

let keySeq = 1;
const newShift = (): ShiftDraft => ({ key: keySeq++, role_name: '', pay: '', slots: '', dress_code: '', auto_confirm: true });

const STEPS = ['Details', 'When & where', 'Shifts'] as const;

function nextQuarter(offsetMin: number): number {
  const d = new Date(Date.now() + offsetMin * 60000);
  const m = d.getHours() * 60 + d.getMinutes();
  return Math.ceil(m / 15) * 15 % 1440;
}

/** Combine a calendar day with minutes since midnight into a Date (local time). */
function at(day: Date, minutes: number): Date {
  const d = startOfDay(day);
  d.setMinutes(minutes);
  return d;
}

export default function CreateEvent() {
  const router = useRouter();
  const toast = useToast();
  const { urgent } = useLocalSearchParams<{ urgent?: string }>();
  const isUrgent = urgent === '1';
  const create = useCreateEvent();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [startMin, setStartMin] = useState(() => (isUrgent ? nextQuarter(90) : 18 * 60));
  const [endMin, setEndMin] = useState(() => (isUrgent ? nextQuarter(90 + 240) : 22 * 60));
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locating, setLocating] = useState(false);

  const [shifts, setShifts] = useState<ShiftDraft[]>(() => [newShift()]);
  const [tried, setTried] = useState(false);

  const startDate = useMemo(() => at(day, startMin), [day, startMin]);
  // An end time earlier than the start means the event runs past midnight.
  const endDate = useMemo(() => {
    const e = at(day, endMin);
    return e <= startDate ? new Date(e.getTime() + 86400000) : e;
  }, [day, endMin, startDate]);

  const latN = Number(lat);
  const lngN = Number(lng);
  const hasCoords = lat.trim() !== '' && lng.trim() !== '' && Number.isFinite(latN) && Number.isFinite(lngN) && Math.abs(latN) <= 90 && Math.abs(lngN) <= 180;

  const errors = {
    title: title.trim().length < 3 ? 'Give the event a name (3+ letters)' : null,
    start: startDate.getTime() <= Date.now() ? 'Start time must be in the future' : null,
    venue: venue.trim() ? null : 'Where is it happening?',
    coords: hasCoords ? null : 'Add the venue location so workers can check in',
  };
  const shiftErrors = shifts.map((s) => ({
    role: s.role_name.trim() ? null : 'Role needed',
    pay: Number(s.pay) >= 1 && Number(s.pay) <= 100000 ? null : 'Pay 1 – 1,00,000',
    slots: Number(s.slots) >= 1 && Number(s.slots) <= 1000 && Number.isInteger(Number(s.slots)) ? null : 'Workers 1 – 1000',
  }));
  const shiftsOk = shiftErrors.every((e) => !e.role && !e.pay && !e.slots);
  const stepOk = [!errors.title, !errors.start && !errors.venue && !errors.coords, shiftsOk];

  const patchShift = (key: number, patch: Partial<ShiftDraft>) =>
    setShifts((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      setLat(c.latitude.toFixed(6));
      setLng(c.longitude.toFixed(6));
    } catch (e) {
      toast(errorMessage(e) || 'Could not get your location. Type it in instead.', 'error');
    } finally {
      setLocating(false);
    }
  };

  const next = () => {
    setTried(true);
    if (!stepOk[step]) return;
    setTried(false);
    setStep((s) => s + 1);
  };

  const publish = async () => {
    setTried(true);
    if (!stepOk[2]) return;
    const payload: ShiftInput[] = shifts.map((s) => ({
      role_name: s.role_name.trim(),
      pay_amount: Number(s.pay),
      slots_total: Number(s.slots),
      dress_code: s.dress_code.trim() || null,
      auto_confirm: s.auto_confirm,
    }));
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        event_type: type,
        venue_name: venue.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        latitude: latN,
        longitude: lngN,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        shifts: payload,
      });
      toast('Event published. Workers can book now.');
      router.replace('/organizer/events' as never);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const totalSlots = shifts.reduce((n, s) => n + (Number(s.slots) || 0), 0);

  return (
    <>
      <Header title={isUrgent ? 'Urgent staffing' : 'New event'} subtitle={`Step ${step + 1} of 3 · ${STEPS[step]}`} onBack={step > 0 ? () => setStep(step - 1) : undefined} />
      <Screen
        edges={['bottom']}
        footer={
          <Footer>
            {step < 2 ? (
              <Button title="Continue" size="lg" fullWidth onPress={next} testID="create-next" />
            ) : (
              <Button title="Publish event" size="lg" fullWidth loading={create.isPending} onPress={publish} testID="create-publish" />
            )}
          </Footer>
        }
      >
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? colors.primary : colors.border }} />
          ))}
        </View>

        {isUrgent && step === 0 ? (
          <Card style={{ backgroundColor: colors.accentSoft, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Zap size={20} color={colors.accent} />
            <Text style={{ flex: 1 }} variant="small">
              Starting soon? We set the start time to about 90 minutes from now. Add roles and pay, and workers nearby are notified.
            </Text>
          </Card>
        ) : null}

        {step === 0 ? (
          <>
            <Input label="Event name" placeholder="e.g. Sharma wedding reception" value={title} onChangeText={setTitle} testID="ev-title" error={tried ? errors.title : null} />
            <View style={{ gap: 8 }}>
              <Text variant="label">Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {EVENT_TYPES.map((t) => (
                  <Chip key={t} label={t} selected={type === t} onPress={() => setType(type === t ? null : t)} testID={`type-${t}`} />
                ))}
              </View>
            </View>
            <Input label="Notes for workers (optional)" placeholder="What will they be doing? Food provided?" value={description} onChangeText={setDescription} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} testID="ev-desc" />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <SectionTitle title="Date" />
            <DateStrip value={day} onChange={setDay} days={30} />
            <TimeField label="Starts" minutes={startMin} onChange={setStartMin} testID="start" />
            <TimeField label="Ends" minutes={endMin} onChange={setEndMin} testID="end" />
            {tried && errors.start ? <Text style={{ color: colors.danger }} variant="small">{errors.start}</Text> : null}
            <Text variant="small" style={{ color: colors.textMuted }}>
              {formatDate(startDate)} · {formatTime(startDate)} to {formatTime(endDate)}
            </Text>

            <SectionTitle title="Venue" />
            <Input label="Venue name" icon={MapPin} placeholder="e.g. Grand Palace Banquet" value={venue} onChangeText={setVenue} testID="ev-venue" error={tried ? errors.venue : null} />
            <Input label="Address (optional)" placeholder="Street, area" value={address} onChangeText={setAddress} testID="ev-address" />
            <Input label="City (optional)" placeholder="e.g. Hyderabad" value={city} onChangeText={setCity} testID="ev-city" />

            <Button title={locating ? 'Locating…' : 'Use my current location'} icon={Crosshair} variant="outline" fullWidth loading={locating} onPress={useMyLocation} testID="use-location" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Latitude" keyboardType="numbers-and-punctuation" value={lat} onChangeText={setLat} placeholder="17.385" testID="ev-lat" /></View>
              <View style={{ flex: 1 }}><Input label="Longitude" keyboardType="numbers-and-punctuation" value={lng} onChangeText={setLng} placeholder="78.486" testID="ev-lng" /></View>
            </View>
            {tried && errors.coords ? <Text style={{ color: colors.danger }} variant="small">{errors.coords}</Text> : null}
            <Text variant="small" style={{ color: colors.textMuted }}>
              Stand at the venue and tap the button for the most accurate spot. Check-in only works within 200 m of it.
            </Text>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {shifts.map((s, i) => (
              <Card key={s.key} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="h3">Shift {i + 1}</Text>
                  {shifts.length > 1 ? (
                    <Pressable onPress={() => setShifts((l) => l.filter((x) => x.key !== s.key))} hitSlop={10} accessibilityLabel="Remove shift" testID={`remove-shift-${i}`}>
                      <Trash2 size={18} color={colors.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <Input label="Role" placeholder="e.g. Server, Usher, Registration" value={s.role_name} onChangeText={(v) => patchShift(s.key, { role_name: v })} testID={`shift-role-${i}`} error={tried ? shiftErrors[i].role : null} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Input label="Pay per worker (₹)" keyboardType="number-pad" placeholder="800" value={s.pay} onChangeText={(v) => patchShift(s.key, { pay: v.replace(/\D/g, '') })} testID={`shift-pay-${i}`} error={tried ? shiftErrors[i].pay : null} /></View>
                  <View style={{ flex: 1 }}><Input label="Workers needed" keyboardType="number-pad" placeholder="10" value={s.slots} onChangeText={(v) => patchShift(s.key, { slots: v.replace(/\D/g, '') })} testID={`shift-slots-${i}`} error={tried ? shiftErrors[i].slots : null} /></View>
                </View>
                <Input label="Dress code (optional)" placeholder="e.g. White shirt, black pants" value={s.dress_code} onChangeText={(v) => patchShift(s.key, { dress_code: v })} testID={`shift-dress-${i}`} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="label">Auto-confirm workers</Text>
                    <Text variant="small" style={{ color: colors.textMuted }}>
                      {s.auto_confirm ? 'First come, first booked. Fastest way to fill.' : 'You approve each worker from Applicants.'}
                    </Text>
                  </View>
                  <Switch value={s.auto_confirm} onValueChange={(v) => patchShift(s.key, { auto_confirm: v })} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel="Auto-confirm" testID={`shift-auto-${i}`} />
                </View>
              </Card>
            ))}
            {shifts.length < 20 ? (
              <Button title="Add another role" icon={Plus} variant="outline" fullWidth onPress={() => setShifts((l) => [...l, newShift()])} testID="add-shift" />
            ) : null}

            <Card style={{ backgroundColor: colors.primarySoft, gap: 4 }}>
              <Text variant="label">Summary</Text>
              <Text variant="small">{title.trim() || 'Untitled event'} · {formatDate(startDate)}, {formatTime(startDate)} to {formatTime(endDate)}</Text>
              <Text variant="small">{venue.trim() || 'No venue'}{city.trim() ? `, ${city.trim()}` : ''}</Text>
              <Text variant="small">
                {totalSlots} worker{totalSlots === 1 ? '' : 's'} across {shifts.length} role{shifts.length === 1 ? '' : 's'}
                {shifts.length === 1 && Number(shifts[0].pay) ? ` · ${rupees(Number(shifts[0].pay))} each` : ''}
              </Text>
            </Card>
          </>
        ) : null}
      </Screen>
    </>
  );
}
