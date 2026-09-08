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

let firstProvider = 'unavailable';

if (Platform.OS === 'android') {
  try {
    firstProvider = requireNativeModule('Tls13').status() as string;
  } catch (error) {
    logger.warn('TLS13: module unavailable', { error });
  }
}

export const tls13FirstProvider = firstProvider;
