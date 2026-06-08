# Alimenta+

## App Name

Alimenta+

## Description

Alimenta+ is a mobile app for food donation and redistribution. It connects donors who have available food with people who can request and collect those donations, helping reduce food waste and improve access to food.

The app supports account creation, donor registration, donation listings, location-aware browsing, donation requests, request management, user profiles, and donation history.

## Features

- Email and password authentication with Firebase.
- User sign-up with CPF validation.
- Password recovery flow.
- Google login support on web.
- Donor registration with CNPJ, pickup address, and consent terms.
- Donation listing with search, categories, availability status, expiration filtering, and distance sorting.
- Location support using GPS or manual address input.
- Donation details with photos, quantity, expiration date, pickup address, donor information, and pickup scheduling.
- Donation request flow with acceptance terms.
- Donor-only donation creation with up to three food photos.
- Image upload for donation photos through Cloudinary.
- Received request management for donors, including approve/reject actions and rejection reasons.
- Donation history for both donor and receiver activity.
- User profile management with profile photo upload, phone editing, donor status, and logout.
- Bottom tab navigation using Expo Router.

## Technologies

- Expo
- React Native
- TypeScript
- Expo Router
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Cloudinary
- NativeWind
- Tailwind CSS
- Gluestack UI
- Zustand
- Zod
- React Hook Form
- Expo Location
- Expo Image Picker
- Expo Linear Gradient

## How to Run

### Prerequisites

- Node.js 20 or newer.
- npm or Bun.
- Expo Go on a physical device, or Android Studio/Xcode for emulators.
- A Firebase project configured for Authentication, Firestore, and Storage.
- A Cloudinary account with an unsigned upload preset, if donation photo uploads are required.

### Environment Variables

Create a `.env` file in the project root and fill in the public Expo variables:

```env
EXPO_PUBLIC_FB_API_KEY=
EXPO_PUBLIC_FB_AUTH_DOMAIN=
EXPO_PUBLIC_FB_PROJECT_ID=
EXPO_PUBLIC_FB_STORAGE_BUCKET=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

### Install Dependencies

Using Bun:

```bash
bun install
```

Or using npm:

```bash
npm install
```

### Start the App

Using Bun:

```bash
bun start
```

Or using npm:

```bash
npm run start
```

After Expo starts, choose where to run the app:

- Press `a` to open Android.
- Press `i` to open iOS.
- Press `w` to open the web version.
- Scan the QR code with Expo Go to run on a physical device.

You can also run platform scripts directly:

```bash
bun run android
bun run ios
bun run web
```

### Run with Docker

Set `EXPO_LAN_IP` to your host machine LAN IP, then start the Expo container:

```bash
docker compose up --build
```

If LAN mode does not work, enable tunnel mode:

```bash
EXPO_USE_TUNNEL=1 docker compose up --build
```

### Lint

```bash
bun run lint
```