import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SearchScreen from '../screens/SearchScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import DrawerContent from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: {
          width: 300,
        },
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="Search" component={SearchScreen} />
      <Drawer.Screen name="WordDetail" component={WordDetailScreen} />
    </Drawer.Navigator>
  );
}
