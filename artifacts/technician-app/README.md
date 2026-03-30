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

> **Note:** Push notifications are not active in Expo Go. All other features (login, missions, follow-ups) work fully.

---

## Firebase Setup (Required for Push Notifications)

Push notifications use the **Expo Push API** backed by Firebase Cloud Messaging (FCM). You need a Firebase project for Android push delivery.

### Step 1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g., `ACES Technician`)
3. Disable Google Analytics (optional) → **Create project**

### Step 2 — Add an Android app to Firebase

1. In your project overview, click the **Android** icon
2. Set **Android package name**: `com.acessa.technician`
3. Click **Register app**
4. Download the `google-services.json` file

### Step 3 — Replace the placeholder google-services.json

Copy the downloaded file into the project:

```bash
cp ~/Downloads/google-services.json artifacts/technician-app/google-services.json
```

The placeholder at `artifacts/technician-app/google-services.json` must be replaced before building.

### Step 4 — Add FCM key to Expo

1. In Firebase Console → Project settings → **Cloud Messaging** tab
2. Copy the **Server key** (Legacy) or create a Cloud Messaging API (V1) key
3. In [expo.dev](https://expo.dev) → your project → **Credentials** → Android → set the FCM key

---

## Building the APK (Android)

### Prerequisites

1. Create a free account at [expo.dev](https://expo.dev)
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. Complete the Firebase Setup above and ensure `google-services.json` is replaced.

### Steps

```bash
cd artifacts/technician-app

# Initialize your EAS project (first time only)
eas project:init

# Install expo-notifications for the native build
pnpm add expo-notifications@~0.32.16

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

## Push Notifications — How It Works

1. On login (in a native EAS build), the app calls `registerPushToken()` which:
   - Requests notification permissions from the OS
   - Gets an Expo Push Token from the Expo service
   - Registers it with the ACES API at `PUT /api/technicians/:id/fcm-token`
2. When an admin assigns a mission in the web portal, the API sends a push notification via `https://exp.host/--/api/v2/push/send`
3. The technician receives the notification even if the app is in the background

> The push notification delivery code (`lib/push.ts`) uses a dynamic import so it gracefully skips registration in Expo Go and web previews, avoiding any runtime errors.

---

## Environment Variables

The app uses `EXPO_PUBLIC_DOMAIN` to connect to the API. This is automatically set in the Replit environment. For production builds, configure it in `eas.json`:

```json
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

## App Identifiers

| Platform | Identifier               |
|----------|--------------------------|
| iOS      | `com.acessa.technician`  |
| Android  | `com.acessa.technician`  |

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
      _layout.tsx        # Bottom tab bar (NativeTabs + BlurView fallback)
      index.tsx          # Tasks (mission list)
      notifications.tsx  # Alerts
      profile.tsx        # Profile & sign out
    mission/
      [id].tsx           # Mission detail + follow-up form
  contexts/auth.tsx      # Auth state (AsyncStorage)
  lib/api.ts             # API fetch helper
  lib/push.ts            # Push token registration (graceful fallback)
  constants/colors.ts    # ACES brand colors
  google-services.json   # Firebase config placeholder (replace before EAS build)
  eas.json               # EAS Build profiles
```
