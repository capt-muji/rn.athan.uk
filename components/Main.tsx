import React from 'react';

import Timer from '@/components/Timer';
import DateDisplay from '@/components/DateDisplay';
import Prayer from '@/components/Prayer';
import Footer from '@/components/Footer';
import { ENGLISH } from '@/constants';

export default function Main() {
  return (
    <>
      <Timer />
      <DateDisplay />
      {ENGLISH.map((_, index) => (
        <Prayer key={index} index={index} />
      ))}
      <Footer />
    </>
  );
}