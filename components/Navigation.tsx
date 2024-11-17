import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';

import { COLORS, OVERLAY } from '@/constants';
import Main from '../app/index';
import Settings from './Settings';
import { PRAYERS_ENGLISH, EXTRAS_ENGLISH } from '../constants';

const { width } = Dimensions.get('window');

export default function Navigation() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <PagerView
        style={styles.pager}
        initialPage={1}
        pageMargin={0}
        overdrag={false}
        scrollEnabled={true}
        layoutDirection="ltr"
        overScrollMode="never"
      >
        <View key="1"><Settings /></View>
        <View key="2"><Main list={PRAYERS_ENGLISH} /></View>
        <View key="3"><Main list={EXTRAS_ENGLISH} /></View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY.zindexes.background
  },
  pager: {
    flex: 1,
  },
});