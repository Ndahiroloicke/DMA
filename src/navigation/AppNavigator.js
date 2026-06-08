import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SearchScreen from '../screens/SearchScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DrawerContent from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Search"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.5)',
        lazy: true,
        drawerStyle: {
          width: 300,
        },
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="Search" component={SearchScreen} />
      <Drawer.Screen name="WordDetail" component={WordDetailScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}
