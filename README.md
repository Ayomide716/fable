# Fable — a mindful Android launcher

A minimalist home screen that helps you use your phone on purpose.

## Features
- **Calm home screen:** clock, date and up to 7 favourite apps as plain text.
- **App drawer:** swipe up for an A–Z list with instant search. One match opens automatically.
- **Mindful pause:** mark apps as *distracting* and Fable shows a breathing countdown
  ("You've reached for Instagram 6 times today") before opening them.
- **Mindful skips counter** on the home screen for each time you chose *Not now*.
- **Long-press any app:** add to home, move up, mark distracting, app info, uninstall.
- **Settings:** long-press an empty part of the home screen.

## Getting the APK
Every push builds the app with GitHub Actions:
1. Open the repository's **Actions** tab and pick the latest **Build APK** run.
2. Download **fable-launcher-apk** under *Artifacts* and unzip it.
3. Copy the `.apk` to your Android phone and open it (allow "install unknown apps").
4. Press Home and choose **Fable**, or use *Settings → Set Fable as default home app*.

Requires Android 8.0+.

## Building locally
```
./gradlew assembleRelease
```
Needs the Android SDK (set `ANDROID_HOME`) and JDK 17.
