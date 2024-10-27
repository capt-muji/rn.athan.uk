import React, { useEffect } from 'react';
import { StyleSheet, Button } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

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
      <Button title="Schedule Athan Notification" onPress={scheduleNotification} />
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
    justifyContent: 'center',
  },
});
