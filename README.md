# ShiftMate app (Expo + React Native + TypeScript)

Event-staffing marketplace. Organizers post events and shifts, workers book them.
Talks to the FastAPI backend (`shift-backend`) for all data and writes, and to Supabase for login, photo upload and live updates.

## Run it
1. `npm install`
2. `cp .env.example .env` and fill in the three values (API URL, Supabase URL, Supabase anon key). Use your PC's LAN IP for the API URL when testing on a phone (not `localhost`).
3. `npx expo start`, then scan the QR code with Expo Go, or press `w` for the browser.
   Note: Expo Go cannot do everything (push notifications need a dev build, see below).

## Screens
- Shared: intro, sign up / log in, role pick, profile setup, edit profile, settings, public profile.
- Worker: Home feed (urgent, search, filters, nearby), event detail and booking, "You're booked", My shifts, geofenced check-in / check-out (QR optional), rate organizer, Earnings, Profile.
- Organizer: Dashboard, My events, Applicants (accept / decline), create-event wizard (3 steps + urgent mode), event manager, live attendance, venue QR, rate worker.

## Folders
- `src/api` typed API client (token refresh, retries on GET, readable errors)
- `src/hooks` React Query hooks and Supabase realtime
- `src/app` expo-router screens
- `src/components`, `src/theme`, `src/utils` design system (indigo / amber, Inter, 16 px cards, 12 px buttons)

## Release to the Play Store
1. Change `package` / `bundleIdentifier` in `app.json` from `com.yourcompany.shiftmate` to your own.
2. `npm i -g eas-cli`, `eas login`, `eas init` (this creates the project id that push notifications need), then `eas build -p android --profile production` (an .aab file).
3. Upload to Play Console (closed test with 12 testers for 14 days first).
4. Set the three EXPO_PUBLIC_* values as EAS environment variables.

## Tested vs not tested
Tested: type-check clean; web build driven in a real browser against the real backend on Postgres (organizer: sign up, profile, create event, applicants accept, event manager, live attendance, QR; worker: sign up, feed, book instant and approval shifts, geofenced check-in, earnings, profile). Supabase login was replaced by a local stand-in that issues the same kind of JWT.
Not tested: real phones (camera QR scan, GPS accuracy, push notifications, image picker), real Supabase Auth / Realtime / Storage, EAS build. Expect small fixes there.
