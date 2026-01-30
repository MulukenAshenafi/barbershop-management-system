import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { spacing, typography, borderRadius } from '../../theme';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

function resolveAvatarUri(profilePic) {
  if (!profilePic) return DEFAULT_AVATAR;
  if (typeof profilePic === 'string') return profilePic;
  if (Array.isArray(profilePic) && profilePic.length > 0) {
    const first = profilePic[0];
    return typeof first === 'string' ? first : (first?.url ?? DEFAULT_AVATAR);
  }
  return DEFAULT_AVATAR;
}

const Profile = ({ route, navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const { user } = route.params;

  const [email, setEmail] = useState(user.email ?? '');
  const [profilePic, setProfilePic] = useState(resolveAvatarUri(user.profilePic ?? ''));
  const [name, setName] = useState(user.name ?? '');
  const [location, setLocation] = useState(user.location ?? '');
  const [contact, setContact] = useState(user.phone ?? '');
  const [extraField, setExtraField] = useState(
    user.role === 'Customer' ? (user.preferences ?? '') : (user.specialization ?? '')
  );
  const [newImage, setNewImage] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

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
    if (!result.canceled) setNewImage(result.assets[0].uri);
  };

  const handleUpdate = async () => {
    if (!email || !name || !location || !contact || !extraField) {
      toast.show('Please provide all fields', { type: 'error' });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', contact);
      formData.append('location', location);
      formData.append('preferencesOrSpecialization', extraField);
      if (newImage) {
        const uriParts = newImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('file', {
          uri: newImage,
          name: `profile-pic.${fileType}`,
          type: `image/${fileType}`,
        });
      }
      const res = await api.put('customers/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponse(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'An unknown error occurred.'
      );
    }
  };

  useEffect(() => {
    if (response?.success) {
      toast.show('Profile updated', { type: 'success' });
      navigation.navigate('account');
    } else if (response && !response.success) {
      toast.show(response.message || 'An error occurred.', { type: 'error' });
    }
  }, [response, navigation, toast]);

  useEffect(() => {
    if (error) toast.show(error, { type: 'error' });
  }, [error, toast]);

  const extraPlaceholder =
    user.role === 'Customer'
      ? 'Preferences'
      : 'Specialization';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarSection}>
        <OptimizedImage
          source={{ uri: newImage || resolveAvatarUri(profilePic) }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.avatarBtn, { backgroundColor: colors.primary }]}
          onPress={handleImagePick}
          activeOpacity={0.9}
        >
          <Text style={styles.avatarBtnText}>
            {newImage ? 'Change photo' : 'Add photo'}
          </Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.formCard}>
        <InputBox
          value={name}
          setValue={setName}
          placeholder="Name"
          autoComplete="name"
        />
        <InputBox
          value={email}
          setValue={setEmail}
          placeholder="Email"
          autoComplete="email"
        />
        <InputBox
          value={location}
          setValue={setLocation}
          placeholder="Location"
          autoComplete="address-line1"
        />
        <InputBox
          value={contact}
          setValue={setContact}
          placeholder="Phone"
          autoComplete="tel"
        />
        <InputBox
          value={extraField}
          setValue={setExtraField}
          placeholder={extraPlaceholder}
          autoComplete="off"
        />
        <Button
          title="Update profile"
          onPress={handleUpdate}
          variant="primary"
          fullWidth
          style={styles.updateBtn}
        />
      </Card>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.sm,
  },
  avatarBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  avatarBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  formCard: {
    padding: spacing.lg,
  },
  updateBtn: {
    marginTop: spacing.sm,
  },
});
