import { Tabs } from 'expo-router';
import { CalendarCheck, Home, User, Wallet } from 'lucide-react-native';
import React from 'react';

import { tabIcon, tabScreenOptions } from '../../../components/TabBar';

export default function WorkerTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon(Home), tabBarButtonTestID: 'tab-home' }} />
      <Tabs.Screen name="shifts" options={{ title: 'My shifts', tabBarIcon: tabIcon(CalendarCheck), tabBarButtonTestID: 'tab-shifts' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings', tabBarIcon: tabIcon(Wallet), tabBarButtonTestID: 'tab-earnings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon(User), tabBarButtonTestID: 'tab-profile' }} />
    </Tabs>
  );
}
