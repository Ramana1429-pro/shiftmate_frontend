import { Building2, Camera, MapPin, Phone, User as UserIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import type { ProfileInput, Role, User } from '../api/types';
import { pickAndUploadPhoto } from '../lib/photo';
import { publicMediaUrl } from '../lib/supabase';
import { colors } from '../theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Chip } from './Chip';
import { Input } from './Input';
import { Text } from './Text';
import { useToast } from './Toast';

export const SKILLS = ['Serving', 'Hosting', 'Registration desk', 'Crowd control', 'Setup crew', 'Cleaning', 'Cooking help', 'Ushering', 'Promotion'];

/** Shared by onboarding and Edit profile. */
export function ProfileForm({
  role,
  initial,
  submitLabel,
  onSubmit,
}: {
  role: Role;
  initial?: User | null;
  submitLabel: string;
  onSubmit: (input: ProfileInput) => Promise<void>;
}) {
  const toast = useToast();
  const [name, setName] = useState(initial?.full_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [company, setCompany] = useState(initial?.company_name ?? '');
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [photo, setPhoto] = useState<string | null>(initial?.photo_path ?? null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePhoto = async () => {
    setUploading(true);
    try {
      const path = await pickAndUploadPhoto();
      if (path) setPhoto(path);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not upload the photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Please enter your full name.');
    if (role === 'worker' && phone.replace(/\D/g, '').length < 10) return setError('Enter a 10 digit phone number so organizers can reach you.');
    if (role === 'organizer' && !company.trim()) return setError('Enter your company or event name.');
    setBusy(true);
    try {
      await onSubmit({
        role,
        full_name: name.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        bio: bio.trim() || null,
        photo_path: photo,
        skills: role === 'worker' ? skills : null,
        company_name: role === 'organizer' ? company.trim() : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Pressable onPress={choosePhoto} testID="photo" accessibilityLabel="Change photo">
          <Avatar name={name || '?'} uri={publicMediaUrl(photo)} size={88} />
          <View style={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={14} color={colors.white} />
          </View>
        </Pressable>
        <Text variant="caption" muted>
          {uploading ? 'Uploading…' : 'Add a photo (optional)'}
        </Text>
      </View>

      <Input label="Full name" icon={UserIcon} value={name} onChangeText={setName} placeholder="Your name" testID="name" />
      {role === 'organizer' ? (
        <Input label="Company or event name" icon={Building2} value={company} onChangeText={setCompany} placeholder="e.g. Priya Events" testID="company" />
      ) : null}
      <Input
        label={role === 'worker' ? 'Phone number' : 'Phone number (optional)'}
        icon={Phone}
        value={phone}
        onChangeText={setPhone}
        placeholder="10 digit mobile number"
        keyboardType="phone-pad"
        hint={role === 'worker' ? 'Organizers see this only after you are confirmed for their shift.' : undefined}
        testID="phone"
      />
      <Input label="City" icon={MapPin} value={city} onChangeText={setCity} placeholder="e.g. Coimbatore" testID="city" />
      <Input label="About you (optional)" value={bio} onChangeText={setBio} placeholder={role === 'worker' ? 'Experience, languages, anything useful' : 'What kind of events do you run?'} multiline testID="bio" />

      {role === 'worker' ? (
        <View style={{ gap: 8 }}>
          <Text variant="label">What can you do?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SKILLS.map((s) => {
              const key = s.toLowerCase();
              const on = skills.includes(key);
              return <Chip key={s} label={s} selected={on} onPress={() => setSkills(on ? skills.filter((x) => x !== key) : [...skills, key])} testID={`skill-${key}`} />;
            })}
          </View>
        </View>
      ) : null}

      {error ? (
        <Text variant="small" color={colors.dangerDark} testID="form-error">
          {error}
        </Text>
      ) : null}
      <Button title={submitLabel} size="lg" fullWidth loading={busy} onPress={submit} testID="save-profile" />
    </View>
  );
}
