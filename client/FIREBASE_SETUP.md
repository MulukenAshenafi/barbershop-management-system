# Enable "Send sign-in link to my email"

Your backend already uses Firebase project **bsbs-local**. To show and use the "Send sign-in link to my email" option:

## 1. Web app config (you’ve done this if the option is visible)

- **Project settings** (gear) → **General** → **Your apps** → Web app config → copy into `client/.env` as `EXPO_PUBLIC_FIREBASE_*`.

## 2. Fix "auth/configuration-not-found" (required for Send link)

1. Open [Firebase Console](https://console.firebase.google.com/) → project **bsbs-local**.
2. Go to **Authentication** → **Sign-in method**.
3. Click **Email/Password** → turn **Enable** ON → **Save**.
4. In the same **Email/Password** provider, turn **Email link** (passwordless sign-in) ON and save.

## 3. Fix "Domain not allowlisted" (auth/unauthorized-continue-uri)

Firebase only allows redirect URLs whose **domain** is in **Authorized domains**. The app now uses `https://bsbs-local.firebaseapp.com/email-signin` by default (that domain is already authorized).

**One-time: deploy the redirect page** so that when the user taps the link in the email, they are sent to the app:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. From the project root: `firebase use bsbs-local` (or create the project in Console first)
4. Deploy hosting: `firebase deploy --only hosting`

This deploys `firebase-hosting/public/email-signin.html` to `https://bsbs-local.firebaseapp.com/email-signin`, which redirects to the app (`barberbook://email-signin`) so sign-in can complete.

**Optional:** To use your own domain instead, set `EXPO_PUBLIC_EMAIL_LINK_URL=https://yourdomain.com/email-signin` in `client/.env` and add `yourdomain.com` under **Authentication** → **Settings** → **Authorized domains**.
