import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { searchWord } from '../services/apiService';
import { useSearchHistory } from '../context/SearchHistoryContext';

const COLORS = {
  primary: '#1A73E8',
  primaryDark: '#0D47A1',
  primaryLight: '#E8F0FE',
  background: '#F8F9FF',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6E6E73',
  border: '#E5E5EA',
  error: '#D32F2F',
  errorBg: '#FFEBEE',
  success: '#2E7D32',
  successBg: '#E8F5E9',
  noun: '#1565C0',
  nounBg: '#E3F2FD',
  verb: '#6A1B9A',
  verbBg: '#F3E5F5',
  adjective: '#E65100',
  adjectiveBg: '#FFF3E0',
  adverb: '#2E7D32',
  adverbBg: '#E8F5E9',
  other: '#37474F',
  otherBg: '#ECEFF1',
};

const PART_OF_SPEECH_COLORS = {
  noun: { text: COLORS.noun, bg: COLORS.nounBg },
  verb: { text: COLORS.verb, bg: COLORS.verbBg },
  adjective: { text: COLORS.adjective, bg: COLORS.adjectiveBg },
  adverb: { text: COLORS.adverb, bg: COLORS.adverbBg },
};

const getPoSColor = (pos) => {
  const key = pos?.toLowerCase();
  return PART_OF_SPEECH_COLORS[key] || { text: COLORS.other, bg: COLORS.otherBg };
};

export default function WordDetailScreen({ route, navigation }) {
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

  const fetchWord = useCallback(async (word) => {
    setLoading(true);
    setError(null);
    setWordData(null);
    try {
      const data = await searchWord(word);
      setWordData(data);
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
      setActiveWord(word);
      fetchWord(word);
    } else if (incomingData && word) {
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

  const getAudioUrls = useCallback(() => {
    if (!wordData) return [];
    const urls = [];
    for (const entry of wordData) {
      if (entry.phonetics) {
        for (const ph of entry.phonetics) {
          if (ph.audio && ph.audio.trim() !== '') {
            const url = ph.audio.startsWith('http') ? ph.audio : `https:${ph.audio}`;
            if (!urls.includes(url)) urls.push(url);
          }
        }
      }
    }
    return urls;
  }, [wordData]);

  const handleRetry = () => {
    if (activeWord) {
      fetchWord(activeWord);
    }
  };

  const openRelatedWord = (relatedWord) => {
    navigation.navigate('WordDetail', {
      word: relatedWord,
      fromHistory: true,
      searchId: Date.now(),
    });
  };

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

      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
      });

      const player = createAudioPlayer(url, { downloadFirst: true });
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

  const entry = wordData?.[0];
  const word = entry?.word || activeWord;
  const phonetics = entry?.phonetics || [];
  const phonetic = phonetics.find((p) => p.text)?.text || entry?.phonetic || '';
  const audioUrls = getAudioUrls();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

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

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
          {/* Word Hero Card */}
          <View style={styles.wordHeroCard}>
            <View style={styles.wordRow}>
              <Text style={styles.wordTitle}>
                {word?.charAt(0).toUpperCase() + word?.slice(1)}
              </Text>
              {audioUrls.length > 0 && (
                <View style={styles.audioButtons}>
                  {audioUrls.slice(0, 3).map((url, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.audioButton,
                        currentAudioUrl === url && audioState === 'playing' && styles.audioButtonActive,
                        audioState === 'error' && currentAudioUrl === url && styles.audioButtonError,
                      ]}
                      onPress={() => handlePlayAudio(url)}
                      activeOpacity={0.75}
                      disabled={audioState === 'loading' && currentAudioUrl !== url}
                    >
                      {audioState === 'loading' && currentAudioUrl === url ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <Text style={styles.audioIcon}>{getAudioButtonIcon(url)}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {phonetic ? (
              <Text style={styles.phonetic}>{phonetic}</Text>
            ) : null}

            {audioUrls.length === 0 && (
              <Text style={styles.noAudioNote}>No audio pronunciation available</Text>
            )}

            {audioState === 'error' && (
              <Text style={styles.audioErrorNote}>⚠️ Could not play audio</Text>
            )}

            {audioState === 'playing' && (
              <View style={styles.playingBadge}>
                <Text style={styles.playingText}>🎵 Playing...</Text>
              </View>
            )}
          </View>

          {/* Meanings */}
          {wordData.map((entry, entryIdx) =>
            entry.meanings?.map((meaning, mIdx) => {
              const posColor = getPoSColor(meaning.partOfSpeech);
              return (
                <View key={`${entryIdx}-${mIdx}`} style={styles.meaningCard}>
                  {/* Part of Speech Badge */}
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

                  {/* Definitions */}
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

                  {/* Meaning-level synonyms */}
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

                  {/* Antonyms */}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSuggestion: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
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
    borderColor: COLORS.primary,
    width: '100%',
    alignItems: 'center',
  },
  goBackBtnText: {
    color: COLORS.primary,
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
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: 0.5,
  },
  audioButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
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
  phonetic: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    marginTop: 4,
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
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
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
    lineHeight: 23,
    fontWeight: '400',
  },
  exampleContainer: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#F8F9FF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    flexWrap: 'wrap',
  },
  exampleQuote: {
    fontSize: 18,
    color: COLORS.primary,
    lineHeight: 20,
    fontWeight: '700',
  },
  exampleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  synonymsText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
  },
  tagsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
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
    borderColor: COLORS.error,
  },
  antonymTagText: {
    color: COLORS.error,
  },
  sourceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sourceUrl: {
    fontSize: 12,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: 20,
  },
});
