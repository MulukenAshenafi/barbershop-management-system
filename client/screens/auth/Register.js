import React, { useState, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api, { getApiErrorMessage } from '../../services/api';
import { setAuth } from '../../services/auth';
import { signUpWithEmail, isFirebaseConfigured } from '../../services/authService';
import { getFileForFormData } from '../../utils/imageUpload';
import { fontSizes, spacing, borderRadius, typography } from '../../theme';

const defaultProfileImage =
  'https://uxwing.com/wp-content/themes/uxwing/download/editing-user-action/signup-icon.png';

const Register = ({ navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const { checkAuth } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Media library permission is needed to select a photo.', { type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSignUp = async () => {
    if (loading) return;
    if (isFirebaseConfigured()) {
      if (!email?.trim() || !password) {
        toast.show('Please enter email and password', { type: 'error' });
        return;
      }
      setLoading(true);
      setError(null);
      const { success, error: errMsg } = await signUpWithEmail(email, password, name || undefined);
      setLoading(false);
      if (success) {
        toast.show('Account created. Welcome!', { type: 'success' });
        checkAuth();
        navigation.reset({ index: 0, routes: [{ name: 'home' }] });
      } else {
        setError(errMsg || 'Sign up failed');
      }
      return;
    }
    if (!name || !email || !password || !contact || !location) {
      toast.show('Please fill in all required fields', { type: 'error' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phone', contact);
      formData.append('location', location);
      if (image) {
        const file = await getFileForFormData(image, 'profile-pic.jpg', 'image/jpeg');
        if (file) formData.append('file', file);
      }
      const res = await api.post('customers/signup', formData, {
        headers: { 'Content-Type': false },
      });
      setResponse(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'An unknown error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!response) return;
    if (response.success && response.token) {
      setAuth({
        token: response.token,
        refreshToken: response.refreshToken || null,
        user: {
          id: response.user?.id,
          _id: response.user?.id,
          name: response.user?.name,
          email: response.user?.email,
          role: response.user?.role,
          profilePic: response.user?.profilePic,
        },
      });
      toast.show('Account created. Welcome!', { type: 'success' });
      checkAuth().then(() => {
        navigation.reset({ index: 0, routes: [{ name: 'home' }] });
      });
    } else if (response.success) {
      toast.show('Account created.', { type: 'success' });
      navigation.navigate('login');
    } else {
      toast.show(response.message || 'Registration failed', { type: 'error' });
    }
  }, [response, navigation, toast, checkAuth]);

  useEffect(() => {
    if (error) toast.show(error, { type: 'error' });
  }, [error, toast]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join BarberBook</Text>
        </View>

        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: image || defaultProfileImage }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: colors.primary }]}
            onPress={handleImagePick}
            activeOpacity={0.9}
          >
            <Text style={styles.avatarBtnText}>
              {image ? 'Change photo' : 'Add photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.card}>
          <InputBox placeholder="Full name" value={name} setValue={setName} autoComplete="name" />
          <InputBox placeholder="Email" value={email} setValue={setEmail} autoComplete="email" />
          <InputBox placeholder="Password" value={password} setValue={setPassword} inputType="password" />
          <InputBox placeholder="Phone" value={contact} setValue={setContact} autoComplete="tel" />
          <InputBox placeholder="Location" value={location} setValue={setLocation} />
          <Button
            title="Sign up"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.primaryBtn}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.navigate('login')}>
              Sign in
            </Text>
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.subtitle, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.sm,
  },
  avatarBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  avatarBtnText: { color: '#fff', fontSize: fontSizes.sm, fontWeight: '600' },
  card: {
    padding: spacing.lg,
  },
  primaryBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  helperText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  link: { fontWeight: '600' },
});

export default Register;
