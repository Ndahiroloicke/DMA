/**
 * WORD DETAIL SCREEN — displays API JSON on screen (Activity 2)
 * ------------------------------------------------------------
 * Data arrives two ways:
 *   A) From SearchScreen: route.params.wordData already contains the API array
 *   B) From drawer history / synonym tap: only route.params.word → fetchWord() calls API again
 *
 * API array structure (each item is one dictionary entry):
 *   wordData[0].word          → title in hero card
 *   wordData[0].phonetics[]   → pronunciation text + audio URLs (Activity 3)
 *   wordData[].meanings[]     → partOfSpeech, definitions[], synonyms, antonyms
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Asset } from 'expo-asset';
import { searchWord } from '../services/apiService';
import { useSearchHistory } from '../context/SearchHistoryContext';
import { useTheme } from '../context/ThemeContext';
import { getPartOfSpeechColor } from '../theme/colors';

/** Some API audio URLs start with "//cdn..." — prepend https: so the player can fetch them. */
const normalizeAudioUrl = (audio) => {
  if (!audio || !audio.trim()) return null;
  return audio.startsWith('http') ? audio : `https:${audio}`;
};

/** Parse region label from filename, e.g. ".../hello-uk.mp3" → "UK" shown as badge in UI. */
const getRegionFromAudioUrl = (url) => {
  const match = url.match(/-([a-z]{2})\.mp3(?:\?|$)/i);
  return match ? match[1].toUpperCase() : null;
};

export default function WordDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [wordData, setWordData] = useState(null);
  const [activeWord, setActiveWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioState, setAudioState] = useState('idle'); // idle | loading | playing | paused | error
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);

  const { addToHistory } = useSearchHistory();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const playerRef = useRef(null);
  const listenerRef = useRef(null);

  const releasePlayer = useCallback(() => {
    if (listenerRef.current?.remove) {
      listenerRef.current.remove();
    }
    listenerRef.current = null;
    if (playerRef.current?.remove) {
      playerRef.current.remove();
    }
    playerRef.current = null;
  }, []);

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  /**
   * fetchWord — second API path (when screen opens WITHOUT cached wordData).
   * Used when user taps a word in drawer history or a synonym/antonym chip.
   * Same searchWord() as SearchScreen; errors use the same 404/network mapping.
   */
  const fetchWord = useCallback(async (word) => {
    setLoading(true);
    setError(null);
    setWordData(null);
    try {
      const data = await searchWord(word);
      setWordData(data); // store API array in local state → triggers re-render of meanings UI
      addToHistory(word);
      animateIn();
    } catch (err) {
      if (err.response?.status === 404) {
        setError({
          type: 'not_found',
          message: `"${word}" was not found in the dictionary.`,
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
  }, [addToHistory, animateIn]);

  /**
   * Route params effect — decides whether to USE passed data or FETCH from API.
   *
   * SearchScreen passes: { word, wordData, fromHistory: false, searchId }
   * Drawer/history passes: { word, fromHistory: true, searchId } — no wordData
   *
   * searchId in the dependency array ensures a new search refreshes this screen
   * even when React Navigation reuses the same mounted component.
   */
  useEffect(() => {
    const params = route.params || {};
    const { word, wordData: incomingData, fromHistory: isFromHistory } = params;

    if (!word && !incomingData) {
      return undefined;
    }

    releasePlayer();
    setAudioState('idle');
    setCurrentAudioUrl(null);
    setError(null);

    if (isFromHistory && word && !incomingData) {
      // Path B: history/synonym — only the word string; must call API
      setActiveWord(word);
      fetchWord(word);
    } else if (incomingData && word) {
      // Path A: SearchScreen already fetched — display immediately, no API call
      setActiveWord(word);
      setWordData(incomingData);
      setLoading(false);
      animateIn();
    }

    return () => {
      releasePlayer();
    };
  }, [route.params?.searchId, route.params?.word, fetchWord, releasePlayer, animateIn]);

  useEffect(() => {
    return () => {
      releasePlayer();
    };
  }, [releasePlayer]);

  /**
   * getAudioPhonetics — flatten API phonetics[] into rows for the hero card.
   *
   * Loops wordData (API returns an array; usually one entry) → entry.phonetics[]
   * Each row: { url, text, region }
   *   - text  → IPA string from API field "text" (e.g. "/juːˈbɪkwɪtəs/")
   *   - url   → mp3 link from API field "audio"
   *   - region → derived from URL suffix (-uk, -us) for the AU/UK/US badge
   * Deduplicates by URL so the same mp3 is not shown twice.
   */
  const getAudioPhonetics = useCallback(() => {
    if (!wordData) return [];

    const items = [];
    const seen = new Set();

    for (const entry of wordData) {
      if (!entry.phonetics) continue;

      for (const ph of entry.phonetics) {
        const url = normalizeAudioUrl(ph.audio);
        if (!url || seen.has(url)) continue;

        seen.add(url);
        const region = getRegionFromAudioUrl(url);
        const text = ph.text?.trim() || '';

        items.push({ url, text, region });
      }
    }

    return items;
  }, [wordData]);

  const handleRetry = () => {
    if (activeWord) {
      fetchWord(activeWord);
    }
  };

  /** Tap synonym/antonym → navigate with fromHistory so we re-fetch that word from API. */
  const openRelatedWord = (relatedWord) => {
    navigation.navigate('WordDetail', {
      word: relatedWord,
      fromHistory: true,
      searchId: Date.now(),
    });
  };

  /**
   * handlePlayAudio — Activity 3: play pronunciation mp3 from API phonetics[].audio
   *
   * 1. Download remote mp3 to device cache (expo-asset) — required on mobile
   * 2. createAudioPlayer with local URI
   * 3. Listen for playbackStatusUpdate to update play/pause UI
   */
  const handlePlayAudio = async (url) => {
    try {
      if (playerRef.current && currentAudioUrl === url) {
        if (playerRef.current.playing) {
          playerRef.current.pause();
          setAudioState('paused');
        } else {
          playerRef.current.play();
          setAudioState('playing');
        }
        return;
      }

      releasePlayer();
      setAudioState('loading');
      setCurrentAudioUrl(url);

      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'duckOthers',
        });
      } catch {
        // Audio mode setup is best-effort; playback can still work without it.
      }

      // Download API audio URL before playback (remote URLs often fail without this step)
      const asset = Asset.fromURI(url);
      await asset.downloadAsync();
      const audioUri = asset.localUri || asset.uri;

      const player = createAudioPlayer({ uri: audioUri });
      playerRef.current = player;

      listenerRef.current = player.addListener('playbackStatusUpdate', (status) => {
        if (status.playing) {
          setAudioState('playing');
        }
        if (status.didJustFinish) {
          setAudioState('idle');
          setCurrentAudioUrl(null);
        }
      });

      player.play();
      setAudioState('playing');
    } catch (e) {
      releasePlayer();
      setAudioState('error');
      setTimeout(() => setAudioState('idle'), 3000);
    }
  };

  const getAudioButtonIcon = (url) => {
    if (currentAudioUrl === url) {
      if (audioState === 'loading') return '⏳';
      if (audioState === 'playing') return '⏸';
      if (audioState === 'paused') return '▶';
      if (audioState === 'error') return '⚠️';
    }
    return '🔊';
  };

  // --- Derive display values from API response (first entry is primary word) ---
  const entry = wordData?.[0];
  const word = entry?.word || activeWord;
  const audioPhonetics = getAudioPhonetics();
  const activePhonetic = audioPhonetics.find((item) => item.url === currentAudioUrl);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {word ? word.charAt(0).toUpperCase() + word.slice(1) : 'Word Details'}
        </Text>
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

      {/* Shown while fetchWord() is calling the API (history / synonym path) */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Looking up "{activeWord}"...</Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorEmoji}>
            {error.type === 'not_found' ? '🔎' : error.type === 'network' ? '📡' : '⚠️'}
          </Text>
          <Text style={styles.errorTitle}>{error.message}</Text>
          <Text style={styles.errorSuggestion}>{error.suggestion}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.goBackBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <Text style={styles.goBackBtnText}>Go Back to Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Word Content */}
      {!loading && !error && wordData && (
        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card — word title + phonetics from API entry.phonetics[] */}
          <View style={styles.wordHeroCard}>
            <Text style={styles.wordTitle}>
              {word?.charAt(0).toUpperCase() + word?.slice(1)}
            </Text>

            {/* Each row = one phonetic object: text (IPA), region badge, speaker button */}
            {audioPhonetics.length > 0 ? (
              <View style={styles.pronunciationList}>
                {audioPhonetics.map((item) => {
                  const isActive = currentAudioUrl === item.url;
                  const isPlaying = isActive && audioState === 'playing';
                  const isLoading = isActive && audioState === 'loading';

                  return (
                    <TouchableOpacity
                      key={item.url}
                      style={[
                        styles.pronunciationRow,
                        isPlaying && styles.pronunciationRowActive,
                        isActive && audioState === 'error' && styles.pronunciationRowError,
                      ]}
                      onPress={() => handlePlayAudio(item.url)}
                      activeOpacity={0.75}
                      disabled={audioState === 'loading' && !isActive}
                    >
                      <View style={styles.pronunciationTextWrap}>
                        {item.text ? (
                          <Text style={styles.pronunciationText}>{item.text}</Text>
                        ) : (
                          <Text style={styles.pronunciationFallback}>
                            {item.region ? `${item.region} pronunciation` : 'Pronunciation'}
                          </Text>
                        )}
                        {item.region ? (
                          <View style={styles.regionBadge}>
                            <Text style={styles.regionBadgeText}>{item.region}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.audioButton,
                          isPlaying && styles.audioButtonActive,
                          isActive && audioState === 'error' && styles.audioButtonError,
                        ]}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.audioIcon}>{getAudioButtonIcon(item.url)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noAudioNote}>No audio pronunciation available</Text>
            )}

            {audioState === 'error' && (
              <Text style={styles.audioErrorNote}>⚠️ Could not play audio</Text>
            )}

            {audioState === 'playing' && activePhonetic && (
              <View style={styles.playingBadge}>
                <Text style={styles.playingText}>
                  🎵 Playing{activePhonetic.text ? `: ${activePhonetic.text}` : activePhonetic.region ? ` (${activePhonetic.region})` : '...'}
                </Text>
              </View>
            )}
          </View>

          {/*
            Meanings section — maps API structure to UI:
              wordData[]           → outer loop (rarely more than one entry)
              entry.meanings[]     → one card per part of speech (noun, verb, …)
              meaning.definitions[]→ numbered list with definition + optional example
              meaning.synonyms / antonyms → tappable chips (openRelatedWord re-fetches API)
          */}
          {wordData.map((entry, entryIdx) =>
            entry.meanings?.map((meaning, mIdx) => {
              const posColor = getPartOfSpeechColor(meaning.partOfSpeech, colors);
              return (
                <View key={`${entryIdx}-${mIdx}`} style={styles.meaningCard}>
                  {/* API field: meaning.partOfSpeech → colored badge */}
                  <View
                    style={[
                      styles.posBadge,
                      { backgroundColor: posColor.bg },
                    ]}
                  >
                    <Text style={[styles.posText, { color: posColor.text }]}>
                      {meaning.partOfSpeech}
                    </Text>
                  </View>

                  {/* API field: meaning.definitions[] → definition text + example + inline synonyms */}
                  {meaning.definitions?.map((def, dIdx) => (
                    <View key={dIdx} style={styles.definitionItem}>
                      <View style={styles.defNumberContainer}>
                        <Text style={[styles.defNumber, { color: posColor.text }]}>
                          {dIdx + 1}
                        </Text>
                      </View>
                      <View style={styles.defContent}>
                        <Text style={styles.defText}>{def.definition}</Text>
                        {def.example ? (
                          <View style={styles.exampleContainer}>
                            <Text style={styles.exampleQuote}>"</Text>
                            <Text style={styles.exampleText}>{def.example}</Text>
                            <Text style={styles.exampleQuote}>"</Text>
                          </View>
                        ) : null}
                        {def.synonyms?.length > 0 && (
                          <View style={styles.synonymsRow}>
                            <Text style={styles.synonymsLabel}>Synonyms: </Text>
                            <Text style={styles.synonymsText}>
                              {def.synonyms.slice(0, 5).join(', ')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}

                  {/* API field: meaning.synonyms[] at meaning level (not per-definition) */}
                  {meaning.synonyms?.length > 0 && (
                    <View style={styles.tagsSection}>
                      <Text style={styles.tagsLabel}>Synonyms</Text>
                      <View style={styles.tagsRow}>
                        {meaning.synonyms.slice(0, 8).map((syn, sIdx) => (
                          <TouchableOpacity
                            key={sIdx}
                            style={[styles.tag, { borderColor: posColor.text }]}
                            onPress={() => openRelatedWord(syn)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.tagText, { color: posColor.text }]}>{syn}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* API field: meaning.antonyms[] */}
                  {meaning.antonyms?.length > 0 && (
                    <View style={styles.tagsSection}>
                      <Text style={styles.tagsLabel}>Antonyms</Text>
                      <View style={styles.tagsRow}>
                        {meaning.antonyms.slice(0, 8).map((ant, aIdx) => (
                          <TouchableOpacity
                            key={aIdx}
                            style={[styles.tag, styles.antonymTag]}
                            onPress={() => openRelatedWord(ant)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.tagText, styles.antonymTagText]}>{ant}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            }),
          )}

          {/* Source */}
          {entry?.sourceUrls?.length > 0 && (
            <View style={styles.sourceCard}>
              <Text style={styles.sourceLabel}>Source</Text>
              {entry.sourceUrls.map((url, i) => (
                <Text key={i} style={styles.sourceUrl} numberOfLines={1}>
                  {url}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
      )}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSuggestion: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  goBackBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    width: '100%',
    alignItems: 'center',
  },
  goBackBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  wordHeroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pronunciationList: {
    gap: 8,
    marginTop: 4,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 12,
  },
  pronunciationRowActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: '#FFFFFF',
  },
  pronunciationRowError: {
    borderColor: '#EF9A9A',
  },
  pronunciationTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pronunciationText: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.92)',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  pronunciationFallback: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  regionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  regionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    flexShrink: 0,
  },
  audioButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#FFFFFF',
  },
  audioButtonError: {
    backgroundColor: 'rgba(211,47,47,0.3)',
    borderColor: '#EF9A9A',
  },
  audioIcon: {
    fontSize: 18,
  },
  noAudioNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  audioErrorNote: {
    fontSize: 12,
    color: '#FFCDD2',
    marginTop: 6,
  },
  playingBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  meaningCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  posBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  posText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  definitionItem: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  defNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  defNumber: {
    fontSize: 11,
    fontWeight: '800',
  },
  defContent: {
    flex: 1,
  },
  defText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 23,
    fontWeight: '400',
  },
  exampleContainer: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: colors.exampleBackground,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    flexWrap: 'wrap',
  },
  exampleQuote: {
    fontSize: 18,
    color: colors.primary,
    lineHeight: 20,
    fontWeight: '700',
  },
  exampleText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    flex: 1,
    paddingHorizontal: 4,
  },
  synonymsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  synonymsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  synonymsText: {
    fontSize: 12,
    color: colors.primary,
    flex: 1,
  },
  tagsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  antonymTag: {
    borderColor: colors.error,
  },
  antonymTagText: {
    color: colors.error,
  },
  sourceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sourceUrl: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: 20,
  },
});
