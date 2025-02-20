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
  return (
    <Modal visible={visible} onClose={onClose} title="Quick Tip!" hideCloseButton>
      <Text style={styles.message}>
        To switch athan{'\n'}hold the{'  '}
        <Svg width={16} height={16} viewBox="0 0 256 256" style={styles.icon}>
          <Path d={ICON_PATHS[AlertIcon.BELL_SLASH]} fill="#000" />
        </Svg>
        {'  '}
        icon
      </Text>
      <Pressable style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>Close</Text>
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
    transform: [{ translateY: 2 }],
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
});
