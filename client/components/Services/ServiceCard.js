import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../theme';

const ServiceCard = ({ s }) => {
  const navigation = useNavigation();
  const name = s?.name ?? '';
  const desc = s?.description ?? '';
  const truncatedDesc = desc.length > 35 ? `${desc.substring(0, 35)}…` : desc;

  const handleMoreButton = () => {
    navigation.navigate('serviceDetails', { _id: s._id ?? s.id, service: s });
  };

  return (
    <View style={styles.card}>
      <Image
        style={styles.cardImage}
        resizeMode="cover"
        source={{ uri: s?.imageUrl }}
      />
      <Text style={styles.cardTitle} numberOfLines={2}>{name}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{truncatedDesc}</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={handleMoreButton}
        activeOpacity={0.9}
      >
        <Text style={styles.btnText}>Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  cardImage: {
    height: 100,
    width: '100%',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  cardDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default ServiceCard;
