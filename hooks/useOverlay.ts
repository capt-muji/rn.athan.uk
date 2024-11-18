import useStore from '@/stores/store';

export default function useOverlay() {
  const { overlay } = useStore();

  const toggle = () => {
    overlay.setIsOn (!overlay.isOn);
  };

  return {
    isOn: overlay.isOn,
    toggle
  };
}
