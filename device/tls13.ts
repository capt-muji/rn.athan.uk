/**
 * TLS 1.3 observability for Android 9 and older
 *
 * www.londonprayertimes.com accepts TLS 1.3 only; Android 9's platform
 * provider ships TLS 1.3 disabled (the platform enables it from Android
 * 10). Google Play Services' ProviderInstaller - already in the app's
 * dependency tree - swaps in a current security provider, and
 * modules/tls13's Tls13InitProvider runs that install before any
 * HTTP client is built (see that file for the ordering rationale).
 * This module only reports the resulting first security provider.
 */

import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import logger from '@/shared/logger';

// The report feeds the logger, which prod and preview silence (shared/logger.ts),
// so the synchronous native call has no reader there: skip it. Literal
// comparisons so Metro folds the clause out of store builds, the same shape
// device/backgroundTaskDebug.ts gates its diagnostics with.
const isObservabilityEnabled = () =>
  __DEV__ || (process.env.EXPO_PUBLIC_ENV !== 'prod' && process.env.EXPO_PUBLIC_ENV !== 'preview');

if (Platform.OS === 'android' && isObservabilityEnabled()) {
  try {
    logger.info('TLS13: first security provider', { provider: requireNativeModule('Tls13').status() as string });
  } catch (error) {
    logger.warn('TLS13: module unavailable', { error });
  }
}
