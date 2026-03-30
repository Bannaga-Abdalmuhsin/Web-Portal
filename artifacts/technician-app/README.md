# ACES Technician App — Build & Distribution Guide

## Overview

A React Native (Expo) mobile app for field technicians to:
- Receive mission assignments and push notifications
- View fueling task details (fuel readings, site info, driver notes)
- Submit daily follow-up reports (reviewed / issue / pending)
- Connect to the ACES Managed Services API

---

## Quick Start (Testing via Expo Go)

Technicians can test the app immediately on their phones without installing an APK:

1. Install **Expo Go** from the App Store (iOS) or Google Play (Android)
2. Scan the QR code shown in the Replit preview sidebar
3. Log in with your technician credentials (email + password)

---

## Building the APK (Android)

### Prerequisites

1. Create a free account at [expo.dev](https://expo.dev)
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```

### Steps

```bash
cd artifacts/technician-app

# Initialize your EAS project (first time only)
eas project:init

# Build APK for internal distribution (no Play Store)
eas build --platform android --profile preview
```

The build runs in Expo's cloud (~10-15 minutes). When done, you'll get a download link for the `.apk` file.

### Installing on Android devices

1. Download the `.apk` from the EAS dashboard
2. Send the file to technicians via email or WhatsApp
3. On Android: Settings → Security → Enable "Install from unknown sources"
4. Open the `.apk` file to install

---

## Building for iOS (iPhone/iPad)

### Prerequisites

- Apple Developer Program membership ($99/year) at [developer.apple.com](https://developer.apple.com)
- macOS with Xcode (for local builds) or EAS Build (cloud)

### Steps

```bash
# Build for iOS via EAS (cloud, recommended)
eas build --platform ios --profile preview

# This will ask for your Apple credentials
# Output: a .ipa file that can be distributed via TestFlight or Ad Hoc
```

### Distribution via TestFlight (recommended for iOS)

1. Build the `.ipa` using EAS
2. Upload to App Store Connect → TestFlight
3. Add testers by email
4. Testers receive an email to install TestFlight, then the app

---

## Push Notifications Setup

The app uses **Expo Push Notifications** (no Firebase account needed):

1. When technicians log in, the app registers their device token with the API
2. When an admin assigns a mission, the API sends a push notification via Expo's push service
3. Works on both iOS and Android via Expo's infrastructure

**Important:** Full push notification support (receiving while app is closed) requires a production build (not Expo Go). In Expo Go, foreground notifications work but background delivery may be limited.

---

## Environment Variables

The app uses `EXPO_PUBLIC_DOMAIN` to connect to the API. This is automatically set in the Replit environment. For production builds, configure it in:

```json
// eas.json → build → production → env
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_DOMAIN": "your-production-domain.replit.app"
      }
    }
  }
}
```

---

## Credentials

Default technician account for testing:
- **Email:** ahmed@aces-sa.com
- **Password:** Tech@1234

Create additional technician accounts via the ACES Admin Portal → Technicians section.

---

## Architecture

```
artifacts/technician-app/
  app/
    _layout.tsx          # Root layout (auth context, providers)
    index.tsx            # Redirect to login or tabs
    login.tsx            # Login screen
    (tabs)/
      _layout.tsx        # Bottom tab bar
      index.tsx          # Tasks (mission list)
      notifications.tsx  # Alerts
      profile.tsx        # Profile & sign out
    mission/
      [id].tsx           # Mission detail + follow-up form
  contexts/auth.tsx      # Auth state (AsyncStorage)
  lib/api.ts             # API fetch helper
  constants/colors.ts    # ACES brand colors
```
