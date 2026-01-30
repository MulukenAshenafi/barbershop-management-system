import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Layout from '../components/Layout/Layout';
import api from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { LoadingScreen } from '../components/common/LoadingScreen';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  typography,
} from '../theme';

const ServiceDetails = ({ route }) => {
  const [serviceDetails, setServiceDetails] = useState(route.params?.service ?? {});
  const [loading, setLoading] = useState(!route.params?.service && !!route.params?._id);
  const { params } = route;
  const navigation = useNavigation();

  useEffect(() => {
    if (params?.service) {
      setServiceDetails(params.service);
      return;
    }
    const id = params?._id;
    if (!id) return;
    let cancelled = false;
    api.get(`service/${id}`)
      .then((res) => {
        if (!cancelled && res.data?.service) setServiceDetails(res.data.service);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params?._id, params?.service]);

  const handleBookService = () => {
    navigation.navigate('BookService', {
      serviceId: serviceDetails?._id ?? serviceDetails?.id,
      serviceName: serviceDetails?.name,
      servicePrice: serviceDetails?.price,
      serviceImage: serviceDetails?.imageUrl ?? serviceDetails?.image?.[0]?.url,
    });
  };

  if (loading) {
    return (
      <Layout>
        <LoadingScreen message="Loading service…" />
      </Layout>
    );
  }

  const imageUrl = serviceDetails?.imageUrl ?? serviceDetails?.image?.[0]?.url;

  return (
    <Layout>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.imageCard} noShadow>
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../assets/icon.png')}
            style={styles.image}
            resizeMode="cover"
          />
        </Card>
        <Card style={styles.detailsCard}>
          <Text style={styles.title}>{serviceDetails?.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>{serviceDetails?.price ?? 0} ETB</Text>
            {serviceDetails?.duration ? (
              <Text style={styles.duration}>{serviceDetails.duration}</Text>
            ) : null}
          </View>
          {serviceDetails?.description ? (
            <Text style={styles.desc}>{serviceDetails.description}</Text>
          ) : null}
          <Button
            title="Book now"
            onPress={handleBookService}
            variant="primary"
            fullWidth
            style={styles.bookBtn}
          />
        </Card>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  imageCard: {
    padding: 0,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  image: {
    height: 220,
    width: '100%',
    borderRadius: 0,
  },
  detailsCard: {
    padding: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  price: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.secondary,
  },
  duration: {
    ...typography.bodySmall,
  },
  desc: {
    ...typography.body,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  bookBtn: {
    marginTop: spacing.sm,
  },
});

export default ServiceDetails;
