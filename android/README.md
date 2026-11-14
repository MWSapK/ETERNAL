# MrMWSK’s AI — native Android project

The existing website remains at the repository root. This directory is a separate native Android application; it is not a WebView, PWA, Trusted Web Activity, or website wrapper.

## Milestone 1 status

This is the first native project foundation: Kotlin + Jetpack Compose navigation shell, a Room schema for conversations/messages, a DataStore preference store, WorkManager dependency for later downloads, best-effort device facts, and a conservative resource-policy unit test. The app does not make network requests, does not include a model, and does not generate pretend AI answers. The feature destinations visibly report what is not implemented.

## Project baseline

- Gradle Kotlin DSL and version catalog (`gradle/libs.versions.toml`).
- Initial SDK baseline: min API 26, compile/target API 36. These values must be checked against runtime compatibility and current Google Play requirements before release.
- Java 17.
- Backup disabled by default so private conversation data is not included in Android backup.
- No model bundled in the app.
- No signing keys, credentials, or provider API keys in the repository.

## Open and build

Open `android/` in Android Studio. Install JDK 17 and Android SDK Platform 36, then sync Gradle. The repository does not yet include Gradle wrapper scripts/JAR; generate the wrapper from the installed Gradle distribution after sync.

```bash
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

A signed APK/AAB is not configured in this milestone. Release builds require user-provided signing configuration kept outside source control.

## Next milestones

1. Verify dependency versions and clean Gradle sync/build in Android Studio; add wrapper and build CI. **NOT VERIFIED in this environment.**
2. Evaluate and integrate a native inference runtime behind a runtime interface, and add one license-reviewed model as a separately downloadable, checksum-verified asset. **NOT IMPLEMENTED.**
3. Implement streaming/cancellation chat, model management/download recovery, richer database entities and migrations, local documents, consent-based online providers, diagnostics, and release preparation. **NOT IMPLEMENTED.**

No physical-device tests, inference tests, benchmark results, signed release APK, or AAB have been produced. Runtime acceleration and local inference are not claimed.
