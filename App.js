import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SearchHistoryProvider } from './src/context/SearchHistoryContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SearchHistoryProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SearchHistoryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
