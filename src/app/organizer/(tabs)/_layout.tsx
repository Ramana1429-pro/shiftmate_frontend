import { Tabs } from 'expo-router';
import { CalendarDays, LayoutDashboard, User, Users } from 'lucide-react-native';
import React from 'react';

import { useApplicants } from '../../../hooks/queries';
import { tabIcon, tabScreenOptions } from '../../../components/TabBar';

export default function OrganizerTabs() {
  const { items } = useApplicants();
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon(LayoutDashboard), tabBarButtonTestID: 'tab-dashboard' }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: tabIcon(CalendarDays), tabBarButtonTestID: 'tab-events' }} />
      <Tabs.Screen
        name="applicants"
        options={{ title: 'Applicants', tabBarIcon: tabIcon(Users), tabBarBadge: items.length || undefined, tabBarButtonTestID: 'tab-applicants' }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon(User), tabBarButtonTestID: 'tab-profile' }} />
    </Tabs>
  );
}
