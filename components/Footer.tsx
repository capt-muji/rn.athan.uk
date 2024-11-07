import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants';

export default function Footer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>East London Mosque</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    opacity: 0.10,
    alignSelf: 'center',
  },
  text: {
    color: COLORS.textPrimary,
  }
});
