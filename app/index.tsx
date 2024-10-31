import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, ActivityIndicator} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAtom } from 'jotai';

import { MOCK_DATA_FULL } from '../mocks/data';
import { COLORS } from '../constants';
import Timer from '../components/Timer';
import Date from '../components/Date';
import Prayer from '../components/Prayer';
import Footer from '../components/Footer';
import { storage } from '../storage/mmkv';
import { filterTodayOrFutureDays } from '@/utils/filterTodayOrFutureDays';
import { transformPrayerSchedule } from '@/utils/transformPrayerSchedule';
import { transformTodaysStructure } from '@/utils/transformTodaysStructure';
import { ENGLISH } from '../constants';
import { todaysPrayersAtom } from '@/store';


export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [_, setTodaysPrayers] = useAtom(todaysPrayersAtom);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Filter the mock data to only include today's and future prayer times
        const filteredDays = filterTodayOrFutureDays(MOCK_DATA_FULL.times);
        
        // Step 2: Modify the schedules to remove unwanted keys and include duha prayer
        const transformedSchedules = transformPrayerSchedule(filteredDays);
        
        // Step 3: Store the transformed schedules in storage
        storage.storeManyDays(transformedSchedules);
        
        // Step 4: Retrieve today's prayers from storage
        const todaysPrayers = storage.getTodaysPrayers();
        
        // Step 5: Handle the case where no today's prayers are found
        if (!todaysPrayers) throw new Error('No date found');
        
        // Step 6: Transform today's prayers into a structured format
        const todaysPrayersStructured = transformTodaysStructure(todaysPrayers);
        
        // Step 7: Update the state with today's structured prayers
        setTodaysPrayers(todaysPrayersStructured);
      } catch (error) {
        console.error(error);
      } finally {
        // Delay the loading state change by 1 second
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    fetchData();
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

        {isLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          ENGLISH.map((_, index) => (
            <Prayer key={index} index={index} />
          ))
        )}

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
