/**
 * ManageStaffScreen – list staff, invite (email + role), remove with confirmation.
 * GET /api/barbershops/<id>/staff/, POST /api/barbershops/invite/, DELETE /api/barbershops/staff/<id>/
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Layout from '../../components/Layout/Layout';
import { Button } from '../../components/common/Button';
import InputBox from '../../components/Form/InputBox';
import { useBarbershop } from '../../context/BarbershopContext';
import api from '../../services/api';
import { colors, fontSizes, spacing, typography } from '../../theme';

const ROLES = [
  { value: 'Barber', label: 'Barber' },
  { value: 'Admin', label: 'Admin' },
];

export default function ManageStaffScreen() {
  const navigation = useNavigation();
  const { activeBarbershop, loadMyShops } = useBarbershop();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Barber');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const fetchStaff = useCallback(async () => {
    if (!activeBarbershop?.id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/barbershops/${activeBarbershop.id}/staff/`);
      setStaff(data.staff || []);
    } catch (e) {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [activeBarbershop?.id]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleInvite = async () => {
    const email = (inviteEmail || '').trim();
    if (!email) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }
    setInviteSubmitting(true);
    setInviteResult(null);
    try {
      const { data } = await api.post('/barbershops/invite/', { email, role: inviteRole });
      setInviteResult(data.invite_url || data.invitation?.token || 'Invite sent.');
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || 'Invite failed.';
      Alert.alert('Error', msg);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveStaff = (member) => {
    Alert.alert(
      'Remove staff',
      `Remove ${member.user_name || member.user_email} from this barbershop?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/barbershops/staff/${member.id}/`);
              await fetchStaff();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.detail || e.message || 'Failed to remove.');
            }
          },
        },
      ]
    );
  };

  const closeInviteModal = () => {
    setInviteModalVisible(false);
    setInviteEmail('');
    setInviteRole('Barber');
    setInviteResult(null);
    fetchStaff();
  };

  if (!activeBarbershop) {
    return (
      <Layout>
        <View style={styles.center}>
          <Text style={styles.hint}>Select a barbershop first.</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.header}>
        <Text style={styles.title}>Staff</Text>
        <Button title="Invite Staff" onPress={() => setInviteModalVisible(true)} variant="primary" />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={staff}
            keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.name}>{item.user_name || item.user_email}</Text>
                <Text style={styles.role}>{item.role}</Text>
              </View>
              {!item.is_owner ? (
                <TouchableOpacity onPress={() => handleRemoveStaff(item)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}

      <Modal visible={inviteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Staff</Text>
            <InputBox value={inviteEmail} setValue={setInviteEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.roleRow}>
              <Text style={styles.roleLabel}>Role:</Text>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleOption, inviteRole === r.value && styles.roleOptionActive]}
                  onPress={() => setInviteRole(r.value)}
                >
                  <Text style={[styles.roleOptionText, inviteRole === r.value && styles.roleOptionTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {inviteResult && (
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Invite link (copied to clipboard):</Text>
                <Text style={styles.resultText} selectable>{inviteResult}</Text>
              </View>
            )}
            <Button
              title={inviteSubmitting ? 'Sending…' : inviteResult ? 'Done' : 'Send invite'}
              onPress={inviteResult ? closeInviteModal : handleInvite}
              disabled={inviteSubmitting}
              loading={inviteSubmitting}
              fullWidth
              style={styles.modalBtn}
            />
            <Button title="Cancel" onPress={closeInviteModal} variant="ghost" fullWidth />
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { ...typography.bodySmall },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.sm },
  title: { ...typography.sectionTitle },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.card, borderRadius: 8, marginBottom: spacing.sm },
  rowInfo: { flex: 1 },
  name: { ...typography.body, fontWeight: '600' },
  role: { ...typography.caption, marginTop: 4 },
  removeBtn: { padding: spacing.sm },
  removeText: { ...typography.bodySmall, color: colors.error },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.card, borderRadius: 12, padding: spacing.lg },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.md },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  roleLabel: { ...typography.body, marginRight: spacing.sm },
  roleOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, borderRadius: 8, backgroundColor: colors.gray200 },
  roleOptionActive: { backgroundColor: colors.primary },
  roleOptionText: { ...typography.body },
  roleOptionTextActive: { color: colors.white },
  resultBox: { marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.gray100, borderRadius: 8 },
  resultLabel: { ...typography.caption, marginBottom: 4 },
  resultText: { ...typography.bodySmall },
  modalBtn: { marginTop: spacing.sm },
});
