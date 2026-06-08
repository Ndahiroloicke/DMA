import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSearchHistory } from '../context/SearchHistoryContext';
import { useTheme } from '../context/ThemeContext';

export default function DrawerContent({ navigation, ...props }) {
  const { history, clearHistory } = useSearchHistory();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleWordPress = (word) => {
    navigation.navigate('WordDetail', {
      word,
      fromHistory: true,
      searchId: Date.now(),
    });
    navigation.closeDrawer();
  };

  const handleClear = () => {
    Alert.alert('Clear History', 'Are you sure you want to clear all search history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>📖</Text>
          <View>
            <Text style={styles.appName}>LexiSearch</Text>
            <Text style={styles.appTagline}>Your Dictionary Companion</Text>
          </View>
        </View>
      </View>

      <View style={styles.navSection}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            navigation.navigate('Search');
            navigation.closeDrawer();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navItemSecondary]}
          onPress={() => {
            navigation.navigate('Settings');
            navigation.closeDrawer();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Search History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyIcon}>🕐</Text>
            <Text style={styles.emptyText}>No search history yet</Text>
            <Text style={styles.emptySubText}>Words you search will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) => `${item}-${index}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyItem}
                onPress={() => handleWordPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.historyIcon}>🕐</Text>
                <Text style={styles.historyWord} numberOfLines={1}>
                  {item}
                </Text>
                <Text style={styles.historyArrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Free Dictionary API</Text>
        <Text style={styles.footerBrand}>© 2025 Lexitech Solutions Ltd</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.surface,
      paddingBottom: 20,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 50,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logoIcon: {
      fontSize: 36,
    },
    appName: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    appTagline: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 2,
    },
    navSection: {
      paddingHorizontal: 12,
      paddingTop: 16,
      gap: 8,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.accent,
      gap: 12,
    },
    navItemSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    navIcon: {
      fontSize: 18,
    },
    navLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      marginVertical: 16,
    },
    historySection: {
      paddingHorizontal: 12,
      flex: 1,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    clearText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: '600',
    },
    emptyHistory: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 16,
    },
    emptyIcon: {
      fontSize: 32,
      marginBottom: 8,
      opacity: 0.4,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    emptySubText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      opacity: 0.7,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 4,
      gap: 10,
    },
    historyIcon: {
      fontSize: 14,
      opacity: 0.5,
    },
    historyWord: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    historyArrow: {
      fontSize: 18,
      color: colors.textSecondary,
      fontWeight: '300',
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 16,
      marginHorizontal: 12,
    },
    footerText: {
      fontSize: 11,
      color: colors.textSecondary,
      opacity: 0.7,
    },
    footerBrand: {
      fontSize: 11,
      color: colors.textSecondary,
      opacity: 0.5,
      marginTop: 2,
    },
  });
