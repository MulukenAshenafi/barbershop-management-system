/**
 * Handles app open via email sign-in link: completes sign-in and refreshes auth state.
 * Must be mounted inside AuthProvider.
 */
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  isEmailSignInLink,
  completeEmailLinkSignIn,
  getStoredEmailLinkEmail,
} from '../../services/authService';

export default function EmailLinkHandler() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url || !isEmailSignInLink(url)) return;
      const email = await getStoredEmailLinkEmail();
      if (!email) return;
      const { success } = await completeEmailLinkSignIn(email, url);
      if (success) await checkAuth();
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [checkAuth]);

  return null;
}
