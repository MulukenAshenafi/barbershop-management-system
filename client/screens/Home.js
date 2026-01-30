import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Layout from '../components/Layout/Layout';
import Categories from '../components/category/Categories';
import Banner from '../components/Banner/Banner';
import Header from '../components/Layout/Header';
import Products from '../components/Products/Products';
import Services from '../components/Services/Service';
import { useTheme } from '../context/ThemeContext';
import { fontSizes, spacing, borderRadius, typography, shadows } from '../theme';

const Home = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [activeSection, setActiveSection] = useState('Products');

  return (
    <Layout>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Abush Barber Shop</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Style meets excellence — book your cut or explore our products.
          </Text>
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ExploreShops')}
            activeOpacity={0.9}
          >
            <Text style={styles.exploreBtnText}>Explore Shops</Text>
          </TouchableOpacity>
        </View>
        <Categories />

        <View style={styles.bannerSection}>
          <Banner />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse</Text>
          <View style={[styles.tabs, { backgroundColor: colors.gray200 }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'Products' && [styles.tabActive, { backgroundColor: colors.card }, shadows.sm],
              ]}
              onPress={() => setActiveSection('Products')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  activeSection === 'Products' && { color: colors.primary },
                ]}
              >
                Products
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'Services' && [styles.tabActive, { backgroundColor: colors.card }, shadows.sm],
              ]}
              onPress={() => setActiveSection('Services')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.textSecondary },
                  activeSection === 'Services' && { color: colors.primary },
                ]}
              >
                Services
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeSection === 'Products' && (
          <View style={styles.section}>
            <Products />
          </View>
        )}
        {activeSection === 'Services' && (
          <View style={styles.section}>
            <Services />
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Layout>
  );
};

export default Home;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  hero: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  exploreBtnText: {
    ...typography.body,
    fontWeight: '600',
    color: '#fff',
  },
  bannerSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {},
  tabText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  tabTextActive: {},
  section: {
    marginTop: spacing.sm,
    width: '100%',
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
