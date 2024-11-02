import React from 'react';
import { View } from 'react-native';

import Timer from '../components/Timer';
import Date from '../components/Date';
import Prayer from '../components/Prayer';
import Footer from '../components/Footer';
import { ENGLISH } from '../constants';

export default function Main() {
  return (
    <View>
      <Timer />
      <Date />
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
      <Footer />
    </View>
  );
}