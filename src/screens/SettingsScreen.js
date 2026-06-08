import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, setDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, styles.menuLineMid]} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Appearance</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Dark theme</Text>
              <Text style={styles.settingSubtitle}>
                Switch to a darker look while keeping the LexiSearch blue style
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.switchTrackFalse}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About LexiSearch</Text>
          <Text style={styles.infoText}>
            Your dictionary companion for quick word meanings, pronunciations, and examples.
          </Text>
          <Text style={styles.infoBrand}>© 2025 Lexitech Solutions Ltd</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
      paddingBottom: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 22,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      flex: 1,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    menuButton: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 5,
    },
    menuLine: {
      height: 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
      width: 22,
    },
    menuLineMid: {
      width: 16,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 4,
      marginBottom: 20,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 14,
    },
    settingIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingIcon: {
      fontSize: 22,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    infoBrand: {
      fontSize: 12,
      color: colors.textSecondary,
      opacity: 0.7,
    },
  });
