import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Text, SafeAreaView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import Icon from '../assets/mosque.svg';

// Set notification behavior for iOS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Function to request permissions and schedule notification
const scheduleNotification = async () => {
  console.log('Scheduling notification for 5 seconds later');

  // Request notification permissions
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      console.log('Permission not granted!');
      return; // Exit if permission is not granted
    }
  }

  // Schedule the notification with sound
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Magrib", // this is left aligned because it is english/
      body: "\u200Eالمغرب", // but this is right aligned because it is arabic. i want this text to be left aligned
      sound: 'athan.wav',
    },
    trigger: { seconds: 5 }, // Change to 5 seconds
  });
};

export default function Index() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(handleNotification);
    return () => subscription.remove();
  }, []);

  const handleNotification = () => {
    console.log('Notification received - sound should play now.');
  };

  return (
    <LinearGradient
      colors={['#031a4c', '#660ca1']}
      style={styles.gradient}
    >

      <SafeAreaView style={styles.safeArea}>

        <Text style={[styles.prayerIn,]}>Dhuhr in</Text>
        <Text style={[styles.timer]}>3h 19m 12s</Text>

        <View style={styles.heading}>
          <View>
            <Text style={[styles.location]}>London, UK</Text>
            <Text style={[styles.date]}>Mon, 28 Oct 2024</Text>
          </View>
          <Icon style={styles.icon} width={55} height={55} />
        </View>

        <Pressable style={[styles.prayer, styles.passed]}>
          <Text style={[styles.text, styles.english]}>Fajr</Text>
          <Text style={[styles.text, styles.time]}>05:09</Text>
          <Text style={[styles.text, styles.arabic]}>الفجر</Text>
        </Pressable>

        <Pressable style={[styles.prayer, styles.passed]}>
          <Text style={[styles.text, styles.english]}>Sunrise</Text>
          <Text style={[styles.text, styles.time]}>06:45</Text>
          <Text style={[styles.text, styles.arabic]}>الشروق</Text>
        </Pressable>

        <Pressable style={[styles.prayer, styles.next]} onPress={scheduleNotification}>
          <Text style={[styles.text, styles.english]}>Dhuhr</Text>
          <Text style={[styles.text, styles.time]}>11:49</Text>
          <Text style={[styles.text, styles.arabic]}>الظهر</Text>
        </Pressable>

        <Pressable style={[styles.prayer]}>
          <Text style={[styles.text, styles.english]}>Asr</Text>
          <Text style={[styles.text, styles.time]}>14:11</Text>
          <Text style={[styles.text, styles.arabic]}>العصر</Text>
        </Pressable>

        <Pressable style={[styles.prayer]}>
          <Text style={[styles.text, styles.english]}>Magrib</Text>
          <Text style={[styles.text, styles.time]}>16:43</Text>
          <Text style={[styles.text, styles.arabic]}>المغرب</Text>
        </Pressable>

        <Pressable style={[styles.prayer]}>
          <Text style={[styles.text, styles.english]}>Isha</Text>
          <Text style={[styles.text, styles.time]}>18:10</Text>
          <Text style={[styles.text, styles.arabic]}>العشاء</Text>
        </Pressable>

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
  prayerIn: {
    color: 'white',
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 5,
  },
  timer: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  heading: {
    marginBottom: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  location: {
    opacity: 0.5,
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  date: {
    color: 'white',
    fontSize: 18,
  },
  icon: {
    shadowColor: 'hsla(263, 99%, 65%, 1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,                   
    shadowRadius: 3,                      
  },
  prayer: {
    flexDirection: 'row',
    padding: 15,
    opacity: 0.5
  },
  passed: {
    opacity: 1,
  },
  next: {
    opacity: 1,
    backgroundColor: '#0d6cda',
    shadowColor: '#0a296a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 17,
    textAlign: 'center',
    color: 'white',
  },
  english: {
    flex: 1,
    textAlign: 'left'
  },
  time: {
    flex: 1,
  },
  arabic: {
    flex: 1,
    textAlign: 'right'
  },
});
