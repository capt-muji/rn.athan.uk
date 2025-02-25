import { useState, useEffect } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import ICON_PATHS from '@/assets/icons/icons';
import Modal from '@/components/Modal';
import { TEXT } from '@/shared/constants';
import { AlertIcon } from '@/shared/types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ModalTips({ visible, onClose }: Props) {
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsDisabled(true);
      const timer = setTimeout(() => setIsDisabled(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} title="Quick Tip!">
      <Text style={styles.message}>
        To switch athan{'\n'}hold the{'  '}
        <Svg width={16} height={16} viewBox="0 0 256 256" style={styles.icon}>
          <Path d={ICON_PATHS[AlertIcon.BELL_SLASH]} fill="#000" />
        </Svg>
        {'  '}
        icon
      </Text>
      <Pressable style={[styles.button, isDisabled && styles.buttonDisabled]} onPress={onClose} disabled={isDisabled}>
        <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>Close</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.regular,
    textAlign: 'center',
    color: '#344e5c',
    lineHeight: 22,
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: 4,
  },
  icon: {
    transform: [{ translateY: 3 }],
  },
  button: {
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
  },
  buttonText: {
    color: '#fff',
    fontSize: TEXT.sizeSmall,
    fontFamily: TEXT.family.medium,
  },
  buttonDisabled: {
    backgroundColor: '#d4dae2',
  },
  buttonTextDisabled: {
    color: '#738799',
  },
});
