import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '../common/Card';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../theme';

const FooterServicesCard = ({ s }) => {
  const navigation = useNavigation();
  const id = s._id ?? s.id;
  const name = s?.name ?? '';
  const description = s?.description ?? '';
  const truncated = description.length > 60 ? `${description.substring(0, 60)}…` : description;

  const handleDetails = () => {
    navigation.navigate('serviceDetails', { _id: id, service: s });
  };

  const handleBookNow = () => {
    Alert.alert('Book now', 'Open the service details and tap "Book now" to schedule.');
    navigation.navigate('serviceDetails', { _id: id, service: s });
  };

  return (
    <Card style={styles.card}>
      <Image
        style={styles.cardImage}
        resizeMode="cover"
        source={{ uri: s?.imageUrl }}
      />
      <Text style={styles.cardTitle}>{name}</Text>
      <Text style={styles.cardDescription}>{truncated}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={handleDetails}
          activeOpacity={0.9}
        >
          <Text style={styles.btnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={handleBookNow}
          activeOpacity={0.9}
        >
          <Text style={styles.btnText}>Book now</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

export default FooterServicesCard;

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardImage: {
    height: 200,
    width: '100%',
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray200,
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.text,
  },
  cardDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});
