/**
 * BarbershopSelector – dropdown to switch tenant context when user has multiple shops.
 * Visible in Admin screens; updates X-Barbershop-Id and refetches context.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useBarbershop } from '../../context/BarbershopContext';
import { colors, fontSizes, spacing, typography } from '../../theme';

export default function BarbershopSelector() {
  const { myShops, activeBarbershop, setActiveBarbershop } = useBarbershop();
  const [open, setOpen] = useState(false);

  if (!myShops || myShops.length <= 1) return null;

  const current = activeBarbershop
    ? myShops.find((s) => Number(s.id) === Number(activeBarbershop.id))
    : null;
  const label = current?.name || (activeBarbershop?.id ? `Shop #${activeBarbershop.id}` : 'Select shop');

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.triggerText} numberOfLines={1}>{label}</Text>
        <Text style={styles.triggerSubtext}>{myShops.length} shop(s)</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.title}>Switch barbershop</Text>
            <FlatList
              data={myShops}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isActive = activeBarbershop && Number(activeBarbershop.id) === Number(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.item, isActive && styles.itemActive]}
                    onPress={() => {
                      setActiveBarbershop(item.id);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.name}</Text>
                    {item.subdomain && (
                      <Text style={styles.itemSub}>{item.subdomain}</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { minWidth: 120 },
  trigger: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: 8,
  },
  triggerText: { ...typography.body, fontWeight: '600' },
  triggerSubtext: { ...typography.caption, marginTop: 2 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    maxHeight: 360,
  },
  title: { ...typography.sectionTitle, marginBottom: spacing.sm },
  item: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  itemActive: { backgroundColor: colors.primaryLight },
  itemText: { ...typography.body },
  itemTextActive: { color: colors.white },
  itemSub: { ...typography.caption, marginTop: 2 },
  cancel: { marginTop: spacing.md, padding: spacing.sm, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.primary },
});
