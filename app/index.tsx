import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MMKV } from 'react-native-mmkv';

import { MOCK_DATA_FULL } from '../mock';
import * as Api from "../api";
import { COLORS } from '../constants';
import Timer from '../components/Timer';
import Date from '../components/Date';
import Prayer from '../components/Prayer';
import Footer from '../components/Footer';

import { storage } from '../storage/mmkv';





export default function Index() {
  // Store prayer records on component mount
  useEffect(() => {
    storage.storeAllPrayerRecords(MOCK_DATA_FULL.times); // Adjust this if your data structure is different
    console.log('====================================');
    console.log('COMPLETED ADDING RECORDS TO MMKV');
    console.log('====================================');
  }, []);


  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        <Timer/>
        <Date />

        {/* <Prayer /> */}

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
