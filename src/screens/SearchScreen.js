import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { searchWord } from '../services/apiService';
import { useSearchHistory } from '../context/SearchHistoryContext';
import { useTheme } from '../context/ThemeContext';

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { addToHistory } = useSearchHistory();
  const inputRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validateInput = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError('Please enter a word to search.');
      return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      setValidationError('Please enter a valid English word.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!validateInput(query)) {
      shakeInput();
      return;
    }

    setLoading(true);
    try {
      const data = await searchWord(query.trim());
      addToHistory(query.trim());
      navigation.navigate('WordDetail', {
        wordData: data,
        word: query.trim(),
        fromHistory: false,
        searchId: Date.now(),
      });
      setQuery('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError({
          type: 'not_found',
          message: `"${query.trim()}" was not found in the dictionary.`,
          suggestion: 'Check spelling or try a different word.',
        });
      } else if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
        setError({
          type: 'network',
          message: 'No internet connection.',
          suggestion: 'Please check your network and try again.',
        });
      } else {
        setError({
          type: 'generic',
          message: 'Something went wrong.',
          suggestion: 'Please try again in a moment.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSearch();
  };

  const handleChangeText = (text) => {
    setQuery(text);
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      setError(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.primary} />

      {/* Top header bar */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>LexiSearch</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Hero Section */}
          <Animated.View style={[styles.hero, { opacity: logoAnim }]}>
            <Text style={styles.heroEmoji}>📖</Text>
            <Text style={styles.heroTitle}>Dictionary</Text>
            <Text style={styles.heroSubtitle}>
              Discover meanings, pronunciations,{'\n'}and usage examples
            </Text>
          </Animated.View>

          {/* Search Card */}
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>Search for a word</Text>

            <Animated.View
              style={[
                styles.inputRow,
                inputFocused && styles.inputRowFocused,
                validationError ? styles.inputRowError : null,
                { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <Text style={styles.inputIcon}>🔍</Text>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="e.g. serendipity, eloquent..."
                placeholderTextColor={colors.placeholder}
                value={query}
                onChangeText={handleChangeText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                editable={!loading}
                maxLength={60}
              />
              {query.length > 0 && !loading && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery('');
                    setValidationError('');
                    setError(null);
                    inputRef.current?.focus();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {validationError ? (
              <Text style={styles.validationError}>{validationError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonLoading]}
              onPress={handleSearch}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error Card */}
          {error && (
            <View
              style={[
                styles.errorCard,
                error.type === 'network' && styles.errorCardNetwork,
              ]}
            >
              <Text style={styles.errorEmoji}>
                {error.type === 'not_found' ? '🔎' : error.type === 'network' ? '📡' : '⚠️'}
              </Text>
              <View style={styles.errorText}>
                <Text style={styles.errorTitle}>{error.message}</Text>
                <Text style={styles.errorSuggestion}>{error.suggestion}</Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.7}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          {!error && !loading && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Quick tips</Text>
              <View style={styles.tipsRow}>
                {['💡 Try "ephemeral"', '📚 Try "ubiquitous"', '🌟 Try "serendipity"'].map(
                  (tip, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.tipChip}
                      onPress={() => {
                        const word = tip.split('"')[1];
                        setQuery(word);
                        setError(null);
                        setValidationError('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tipText}>{tip}</Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroEmoji: {
    fontSize: 52,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: colors.inputBackground,
    gap: 10,
    marginBottom: 4,
  },
  inputRowFocused: {
    borderColor: colors.inputFocusBorder,
    backgroundColor: colors.inputFocusedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputRowError: {
    borderColor: colors.error,
    backgroundColor: colors.inputErrorBackground,
  },
  inputIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
    fontWeight: '400',
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  validationError: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 10,
    marginLeft: 4,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonLoading: {
    backgroundColor: colors.primaryDark,
    opacity: 0.85,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorCard: {
    backgroundColor: colors.errorBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorCardNetwork: {
    backgroundColor: colors.networkErrorBg,
    borderLeftColor: colors.networkErrorBorder,
  },
  errorEmoji: {
    fontSize: 24,
  },
  errorText: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 2,
  },
  errorSuggestion: {
    fontSize: 12,
    color: colors.errorText,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tipsContainer: {
    marginTop: 4,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  tipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
