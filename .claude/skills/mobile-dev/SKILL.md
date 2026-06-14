---
name: mobile-dev
description: iOS/Android app development with React Native and Expo. Use when building or modifying mobile apps, setting up React Native projects, or debugging mobile-specific issues.
---

## Mobile Development Skill

Expertise in cross-platform mobile development:

### 1. React Native / Expo Development

#### Project Setup
- Use Expo for rapid development and easy deployment
- For complex native modules, use React Native CLI
- Recommended starter: `npx create-expo-app@latest`

#### Project Structure (React Native / Expo):
```
my-app/
├── app/                    # Expo Router (file-based routing)
│   ├── (tabs)/            # Tab navigation
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry screen
├── components/            # Reusable components
├── hooks/                 # Custom hooks
├── utils/                 # Utility functions
├── assets/                # Images, fonts
├── app.json              # Expo config
└── package.json
```

### 2. UI Development for Mobile

#### Key Principles:
- Use `flex` layout (default in React Native)
- Touch targets minimum 44x44 points
- Safe area handling with `react-native-safe-area-context`
- Platform-specific styling with `Platform.select()`
- Responsive design with `useWindowDimensions()`

#### Common Patterns:
```jsx
// Safe area wrapper
import { SafeAreaView } from 'react-native-safe-area-context';

// Platform-specific
import { Platform, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
});

// Responsive
import { useWindowDimensions } from 'react-native';
const { width } = useWindowDimensions();
const isTablet = width > 768;
```

### 3. Navigation
- Expo Router (recommended for Expo projects)
- React Navigation (for complex navigation needs)
- Tab navigators, stack navigators, drawer navigators

### 4. State Management
- React Context + useReducer (simple)
- Zustand (lightweight, recommended)
- Redux Toolkit (complex apps)

### 5. Data & APIs
- Fetch API / Axios for HTTP requests
- AsyncStorage for local data
- Expo SQLite for local database
- Supabase / Firebase for backend

### 6. Key Libraries
- `expo-camera` - Camera access
- `expo-location` - Geolocation
- `expo-notifications` - Push notifications
- `expo-image-picker` - Image selection
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Touch gestures

### 7. Testing
- Unit tests: Jest + React Native Testing Library
- E2E: Detox or Maestro
- Component testing: Storybook for React Native

### 8. Build & Deploy
- Expo EAS Build for cloud builds
- TestFlight (iOS) / Internal Testing (Android)
- App Store Connect / Google Play Console
- Over-the-air updates with EAS Update

### Mobile Dev Checklist
- [ ] Safe areas handled
- [ ] Touch targets >= 44pt
- [ ] Platform-specific code tested on both platforms
- [ ] Keyboard avoidance implemented
- [ ] Loading/error states handled
- [ ] Offline support considered
- [ ] App icons and splash screen configured
- [ ] Permissions properly requested
