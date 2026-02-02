/**
 * JoinBarbershopScreen – join existing shop via invite code or search.
 * Input: invite code (token) or search by shop name (public API).
 * Enter token → POST accept → setActiveBarbershop, go to home/adminPanel.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import InputBox from '../../components/Form/InputBox';
import { colors, fontSizes, spacing, typography } from '../../theme';
import api from '../../services/api';
import { useBarbershop } from '../../context/BarbershopContext';
import { getPendingInviteToken, setPendingInviteToken } from '../../services/auth';

const SEARCH_DEBOUNCE_MS = 400;

export default function JoinBarbershopScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { setActiveBarbershop, loadMyShops } = useBarbershop();
  const prefilledToken = (route.params?.token || '').trim();

  const [mode, setMode] = useState(prefilledToken ? 'code' : 'choose');
  const [token, setToken] = useState(prefilledToken);
  const [pendingLoaded, setPendingLoaded] = useState(false);

  useEffect(() => {
    if (pendingLoaded) return;
    getPendingInviteToken().then((t) => {
      if (t && !token) {
        setToken(t.trim());
        setMode('code');
        setPendingInviteToken(null);
      }
      setPendingLoaded(true);
    });
  }, [pendingLoaded, token]);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchPublicShops = useCallback(async (q) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get('/barbershops/public/', {
        params: { search: q.trim() },
      });
      const list = data.results || [];
      setSearchResults(list);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleAcceptInvite = async () => {
    const t = (token || '').trim();
    if (!t) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/barbershops/invite/accept/', { token: t });
      if (data.barbershop?.id) {
        await loadMyShops();
        await setActiveBarbershop(data.barbershop.id);
        navigation.replace('adminPanel');
      }
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Invalid or expired invite code.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = () => {
    searchPublicShops(searchQuery);
  };

  const handleSelectShop = (shop) => {
    navigation.navigate('ShopPublicProfile', { shopId: shop.id });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Join a Barbershop</Text>
      <Text style={styles.subtitle}>Enter an invite code from your shop owner, or search for a shop.</Text>

      {mode === 'choose' && !prefilledToken && (
        <View style={styles.modeRow}>
          <Button title="Enter invite code" onPress={() => setMode('code')} variant="primary" fullWidth style={styles.modeBtn} />
          <Button title="Search by shop name" onPress={() => setMode('search')} variant="outline" fullWidth style={styles.modeBtn} />
        </View>
      )}

      {mode === 'code' && (
        <View style={styles.section}>
          <InputBox
            value={token}
            setValue={setToken}
            placeholder="Invite code (paste from owner)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            title={submitting ? 'Joining…' : 'Join with code'}
            onPress={handleAcceptInvite}
            disabled={submitting || !token.trim()}
            loading={submitting}
            fullWidth
            style={styles.submitBtn}
          />
          {!prefilledToken && (
            <Button title="Back" onPress={() => setMode('choose')} variant="ghost" fullWidth />
          )}
        </View>
      )}

      {mode === 'search' && (
        <View style={styles.section}>
          <InputBox
            value={searchQuery}
            setValue={setSearchQuery}
            placeholder="Shop name or city"
          />
          <Button title="Search" onPress={handleSearch} variant="secondary" fullWidth style={styles.searchBtn} />
          {searching && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
          {!searching && searchResults.length > 0 && (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>Shops</Text>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.shopCard} onPress={() => handleSelectShop(item)}>
                    <Text style={styles.shopName}>{item.name}</Text>
                    <Text style={styles.shopCity}>{item.city}, {item.country}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          {!searching && searchQuery.trim() && searchResults.length === 0 && (
            <Text style={styles.hint}>No shops found. Ask your owner for an invite code.</Text>
          )}
          <Button title="Back" onPress={() => setMode('choose')} variant="ghost" fullWidth style={styles.backBtn} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: { ...typography.bodySmall, marginBottom: spacing.lg },
  modeRow: { marginBottom: spacing.lg },
  modeBtn: { marginBottom: spacing.sm },
  section: { marginBottom: spacing.lg },
  submitBtn: { marginTop: spacing.md },
  searchBtn: { marginTop: spacing.sm },
  loader: { marginVertical: spacing.md },
  results: { marginTop: spacing.md },
  resultsTitle: { ...typography.sectionTitle, marginBottom: spacing.sm },
  shopCard: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  shopName: { ...typography.body, fontWeight: '600' },
  shopCity: { ...typography.caption, marginTop: 4 },
  hint: { ...typography.bodySmall, marginTop: spacing.md, color: colors.textSecondary },
  backBtn: { marginTop: spacing.lg },
});
