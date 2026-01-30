# Clean install (Expo SDK 54)

After updating dependencies for Expo Go compatibility, run a clean install:

1. **Remove existing install**
   - Delete the `node_modules` folder.
   - Lock file already removed (`package-lock.json`).

2. **Reinstall**
   ```bash
   npm install
   ```

3. **Start with a clean cache**
   ```bash
   npx expo start -c
   ```

4. **Optional: let Expo fix versions**
   If you see any version warnings, run:
   ```bash
   npx expo install --fix
   ```
   This aligns listed packages to the versions expected by the current Expo SDK.

5. **Verify in Expo Go**
   - Scan the QR code with Expo Go (same major SDK as the project).
   - App should load without a red screen and with no React Native version mismatch in the terminal.
