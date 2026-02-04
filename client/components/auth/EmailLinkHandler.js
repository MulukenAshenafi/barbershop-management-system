/**
 * Handles app open via email sign-in link: completes sign-in and refreshes auth state.
 * Must be mounted inside AuthProvider.
 */
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import {
  isEmailSignInLink,
  completeEmailLinkSignIn,
  getStoredEmailLinkEmail,
} from '../../services/authService';

export default function EmailLinkHandler() {
  const { checkAuth } = useAuth();
  const toast = useToast();
  const handledRef = useRef(false);

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url || !isEmailSignInLink(url)) return;
      if (handledRef.current) return;
      const email = await getStoredEmailLinkEmail();
      if (!email) {
        toast.show('Open this link on the same device where you requested the sign-in email.', { type: 'error' });
        return;
      }
      handledRef.current = true;
      const { success, error } = await completeEmailLinkSignIn(email, url);
      if (success) {
        toast.show('Signed in successfully.', { type: 'success' });
        await checkAuth();
      } else {
        handledRef.current = false;
        toast.show(error || 'Sign-in link failed. Request a new link.', { type: 'error' });
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => {
      sub.remove();
      handledRef.current = false;
    };
  }, [checkAuth, toast]);

  return null;
}
