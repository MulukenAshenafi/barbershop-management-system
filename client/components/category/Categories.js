import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CategoriesData } from '../../data/CategoriesData';
import { colors, fontSizes, spacing, borderRadius, typography } from '../../theme';

const Categories = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {(CategoriesData || []).map((item) => (
          <TouchableOpacity
            key={item._id}
            style={styles.chip}
            onPress={() => navigation.navigate(item.path)}
            activeOpacity={0.85}
          >
            <Ionicons name={item.icon} size={24} color={colors.primary} style={styles.icon} />
            <Text style={styles.label} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Categories;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: colors.text,
  },
});
