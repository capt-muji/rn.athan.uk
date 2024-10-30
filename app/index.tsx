import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS } from '../constants';
import Timer from '../components/Timer';
import Date from '../components/Date';
import Prayer from '../components/Prayer';
import Footer from '../components/Footer';

export default function Index() {
  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        <Timer/>
        <Date />
        <Prayer />
        <Footer />

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    margin: 15,
    marginTop: 60,
  },
});
