# 📍 Field Workforce Management System

<p align="center">
  <img src="assets/images/icon.png" alt="App Icon" width="120" height="120" />
</p>

<p align="center">
  <strong>Enterprise-grade mobile application for managing 500+ field officers (On Progress)</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-52.0.0-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-0.76-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Demo Credentials](#-demo-credentials)
- [Screenshots](#-screenshots)
- [API Documentation](#-api-documentation)
- [Offline Mode](#-offline-mode)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Field Workforce Management System adalah aplikasi mobile enterprise untuk perusahaan dengan **500+ field officer**. Aplikasi ini menyediakan solusi lengkap untuk:

| Problem | Solution |
|---------|----------|
| Tracking lokasi field officer | Real-time GPS tracking dengan background updates |
| Assignment tugas | Task management dengan status workflow |
| Absensi dengan validasi lokasi | Geo-fenced attendance dengan foto capture |
| Laporan dari lapangan | Report submission dengan foto & offline support |
| Koneksi tidak stabil | Offline-first architecture dengan auto sync |

---

## ✨ Features

### 🔐 Authentication & Authorization
- [x] Multi-role login (Admin, Supervisor, Field Officer)
- [x] Biometric authentication (Face ID / Fingerprint)
- [x] Secure token storage with encryption
- [x] Auto session refresh

### 📍 Location Tracking
- [x] Real-time GPS tracking
- [x] Background location updates
- [x] Battery-optimized tracking modes
- [x] Location history & trail

### ✅ Attendance Management
- [x] Geo-fenced check-in/check-out
- [x] Photo capture verification
- [x] Multiple geo-fence zones
- [x] Attendance history & statistics
- [x] Late/early detection

### 📋 Task Management
- [x] Task assignment & scheduling
- [x] Priority levels (Low, Medium, High, Urgent)
- [x] Status workflow (Pending → In Progress → Completed)
- [x] Checklist items tracking
- [x] Task notes & attachments

### 📝 Report Submission
- [x] Multiple report types (Daily, Incident, Visit, etc.)
- [x] Photo attachments with compression
- [x] Custom form fields
- [x] Draft & submit workflow
- [x] Offline report queue

### 🔔 Push Notifications
- [x] FCM integration
- [x] Task assignment alerts
- [x] Attendance reminders
- [x] System announcements
- [x] In-app notification center

### 📴 Offline Mode (Critical)
- [x] Offline-first architecture
- [x] Local data persistence
- [x] Automatic sync when online
- [x] Conflict resolution strategy
- [x] Sync status indicator

### 👥 Supervisor Features
- [x] Team dashboard & statistics
- [x] Live map with officer locations
- [x] Task assignment interface
- [x] Report review & approval
- [x] Performance analytics

---

## 🛠 Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | 52.0.0 | Development platform |
| **React Native** | 0.76 | Mobile framework |
| **TypeScript** | 5.3 | Type safety |
| **Expo Router** | 4.0 | File-based navigation |

### State Management
| Technology | Purpose |
|------------|---------|
| **Zustand** | Global state with persistence |
| **React Query** | Server state & caching |
| **MMKV** | Fast key-value storage |

### Location & Maps
| Technology | Purpose |
|------------|---------|
| **expo-location** | GPS tracking |
| **react-native-maps** | Map visualization |
| **expo-task-manager** | Background tasks |

### Security
| Technology | Purpose |
|------------|---------|
| **expo-secure-store** | Encrypted storage |
| **expo-local-authentication** | Biometrics |
| **expo-crypto** | Cryptographic functions |

### UI/UX
| Technology | Purpose |
|------------|---------|
| **expo-image** | Optimized images |
| **expo-haptics** | Haptic feedback |
| **expo-blur** | Blur effects |
| **react-native-reanimated** | Animations |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Screens   │  │  Components │  │   Layouts   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Zustand   │  │ React Query │  │   Context   │          │
│  │   Stores    │  │   Cache     │  │  Providers  │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVICES                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │
│  │  API   │  │Location│  │ Offline│  │  Push  │            │
│  │ Client │  │Service │  │ Queue  │  │ Notif  │            │
│  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘            │
└───────┼───────────┼───────────┼───────────┼─────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  REST API   │  │ Secure Store│  │    MMKV    │          │
│  │  (Backend)  │  │ (Encrypted) │  │  (Cache)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Feature-Based Structure
```
src/features/
├── auth/           # Authentication & authorization
├── attendance/     # Check-in/out & geo-fencing
├── tasks/          # Task management
├── reports/        # Report submission
├── map/            # Live tracking & maps
└── notifications/  # Push notifications
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for quick testing)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/field-workforce-app.git
cd field-workforce-app

# Install dependencies
npm install

# Start development server
npm start
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run on Web (limited features)
npm run web
```

### Development Build (for full features)

```bash
# Create iOS development build
npx expo run:ios

# Create Android development build
npx expo run:android
```

> ⚠️ **Note**: Some features like background location and native maps require a development build. Expo Go has limitations.

---

## 📁 Project Structure

```
AttendanceApp/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Home/Dashboard
│   │   ├── attendance.tsx   # Attendance tab
│   │   ├── tasks.tsx        # Tasks tab
│   │   ├── reports.tsx      # Reports tab
│   │   ├── team.tsx         # Team tab (Supervisor)
│   │   └── profile.tsx      # Profile tab
│   ├── attendance/          # Attendance screens
│   ├── tasks/               # Task screens
│   ├── reports/             # Report screens
│   ├── team/                # Team management
│   ├── map/                 # Live map
│   ├── notifications/       # Notifications
│   └── _layout.tsx          # Root layout
│
├── src/
│   ├── components/          # Shared UI components
│   │   ├── ui/              # Base UI components
│   │   └── ...              # Feature components
│   │
│   ├── features/            # Feature modules
│   │   ├── auth/
│   │   ├── attendance/
│   │   ├── tasks/
│   │   ├── reports/
│   │   ├── map/
│   │   └── notifications/
│   │
│   ├── store/               # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── attendance-store.ts
│   │   ├── task-store.ts
│   │   ├── report-store.ts
│   │   └── app-store.ts
│   │
│   ├── services/            # Business logic
│   │   ├── api/             # API client
│   │   ├── location/        # Location services
│   │   ├── offline/         # Offline queue
│   │   └── notifications/   # Push notifications
│   │
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── config/              # Configuration
│   └── types/               # TypeScript types
│
├── assets/                  # Static assets
├── docs/                    # Documentation
└── package.json
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@company.com` | `password123` |
| **Supervisor** | `supervisor@company.com` | `password123` |
| **Field Officer** | `officer@company.com` | `password123` |

> 💡 You can also login with just the role name: `admin`, `supervisor`, or `officer`

---

## 📱 Screenshots

<table>
  <tr>
    <td align="center">
      <img src="docs/screenshots/login.png" width="200" alt="Login" />
      <br />
      <sub><b>Login</b></sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/dashboard.png" width="200" alt="Dashboard" />
      <br />
      <sub><b>Dashboard</b></sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/attendance.png" width="200" alt="Attendance" />
      <br />
      <sub><b>Attendance</b></sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/tasks.png" width="200" alt="Tasks" />
      <br />
      <sub><b>Tasks</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/reports.png" width="200" alt="Reports" />
      <br />
      <sub><b>Reports</b></sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/map.png" width="200" alt="Live Map" />
      <br />
      <sub><b>Live Map</b></sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/team.png" width="200" alt="Team" />
      <br />
      <sub><b>Team</b></sub>
    </td>
    <td align="center">
      <img src="docs/screenshots/profile.png" width="200" alt="Profile" />
      <br />
      <sub><b>Profile</b></sub>
    </td>
  </tr>
</table>

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:3000/api/v1
Production:  https://api.yourcompany.com/api/v1
```

### Endpoints

<details>
<summary><b>Authentication</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Get current user |

</details>

<details>
<summary><b>Attendance</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attendance` | Get attendance records |
| POST | `/attendance/check-in` | Check in |
| POST | `/attendance/check-out` | Check out |
| GET | `/attendance/today` | Get today's record |

</details>

<details>
<summary><b>Tasks</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get task detail |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| PUT | `/tasks/:id/status` | Update status |

</details>

<details>
<summary><b>Reports</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports` | Get all reports |
| GET | `/reports/:id` | Get report detail |
| POST | `/reports` | Create report |
| PUT | `/reports/:id` | Update report |
| DELETE | `/reports/:id` | Delete report |

</details>

<details>
<summary><b>Location</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/location/update` | Update location |
| GET | `/location/officers` | Get officer locations |
| GET | `/geo-fences` | Get geo-fence zones |

</details>

---

## 📴 Offline Mode

### How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────▶│  Local Queue │────▶│   Server     │
│   Action     │     │   (MMKV)     │     │    API       │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  Sync Manager│
                    │  (Auto Retry)│
                    └──────────────┘
```

### Supported Offline Actions
- ✅ Check-in / Check-out
- ✅ Task status updates
- ✅ Report submission (with photos)
- ✅ Location updates

### Conflict Resolution
- **Server-wins** for concurrent edits
- **Timestamp-based** merge for attendance
- **Queue-based** retry for failed syncs

### Storage Limits
| Data Type | Max Items | Auto Cleanup |
|-----------|-----------|--------------|
| Pending Syncs | 100 | After 7 days |
| Location Cache | 1000 | After 24 hours |
| Report Drafts | 50 | Manual |

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires development build)
npm run test:e2e
```

---

## 📦 Build & Deploy

### Production Build

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build for both
eas build --platform all --profile production
```

### OTA Updates

```bash
# Publish update
eas update --branch production --message "Bug fixes"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [COMMIT_CONVENTION.md](docs/COMMIT_CONVENTION.md) for commit message guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Your Name** - *Initial work* - [GitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- [Expo Team](https://expo.dev) for the amazing platform
- [React Native Community](https://reactnative.dev) for the ecosystem
- All contributors who helped shape this project

---

<p align="center">
  Made with ❤️ for Field Workforce Management
</p>