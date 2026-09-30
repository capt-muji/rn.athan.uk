const norm=a=>((a%360)+360)%360;
console.log('=== HYPOTHESIS D ELIMINATED BY THE DIFF ===');
console.log('0ee13ef8..uat-2 touches the heading path ONLY at the constant:');
console.log('  IOS_AXIS_CORRECTION 190 -> 180');
console.log('Everything else added is isFieldTrustworthy + the INTERFERENCE hint,');
console.log('which reads the magnetometer for a WARNING and never feeds the heading.');
console.log('dialAngleFromYaw, headingFromYaw, the sensor, the frame: all identical.\n');
console.log('=== SO THE 30 DEGREES IS REAL SENSOR BEHAVIOUR, NOT A CODE CHANGE ===\n');
console.log('Expected swing from the constant : 10 deg clockwise');
console.log('Observed swing                   : 30 deg clockwise');
console.log('Unexplained by the constant      : 20 deg\n');
console.log('=== WHAT THE 20 DEGREES IS ===');
console.log('It is the SAME quantity session 40 kept chasing and never pinned:');
console.log('  190 wanted at the desk, 220 on open floor  -> 30 deg of room');
console.log('  now 20 deg of drift at ONE spot across a few hours\n');
console.log('The offset is NOT stable in time at a fixed spot.');
console.log('That is hypothesis C, and it means T1 FAILS.\n');
console.log('=== CONSEQUENCE FOR THE DESIGN, exactly as pre-registered ===');
console.log('P2/PROPOSALS D1 rung 2 was: "calibrate this spot, store the offset".');
console.log('A stored offset is only worth storing if it is still true later.');
console.log('20 deg of drift in hours means it is not. So rung 2 CANNOT be a');
console.log('magnetic correction. It becomes the LANDMARK NOTE, which needs no');
console.log('sensor at all and cannot drift:');
console.log('    "the qibla is 20 deg right of your window"\n');
console.log('=== AND THE LADDER IS UNCHANGED, which is why this test was cheap ===');
const rungs=[['1 Sun','2.3 deg','unaffected: celestial, no magnetometer'],
 ['2 Saved spot','was: stored offset','NOW: landmark note. Still 100% coverage, still no sensor'],
 ['3 Map','6.2 deg','unaffected: street bearings are ground truth'],
 ['4 Compass','9.7 / 30','unaffected, and this test is fresh evidence for D6 (stop printing a number)']];
for(const [a,b,c] of rungs) console.log('  '+a.padEnd(14)+b.padEnd(20)+c);
