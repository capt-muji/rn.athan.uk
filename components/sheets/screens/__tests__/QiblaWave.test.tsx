/**
 * The calibration wave's mirror: the figure keys on the locale's own direction (row 80),
 * the sibling read row 73 reported — a starved crossing leaves the bridge snapshot at the
 * launch direction while the app already renders the other language
 */
import { render, screen } from '@testing-library/react-native';
import { I18nManager } from 'react-native';

import { setActiveLocale } from '@/shared/i18n/locale';
import { WAVE, wavePath } from '@/shared/qiblaWave';

import QiblaWave from '../QiblaWave';

const SIZE = 300;
const figureWidth = SIZE * WAVE.width;
const figureHeight = SIZE * WAVE.height;

/** The guide path the figure is drawn from, reached through the step's own testID; the stage
 * hides its subtree from accessibility (it is a drawn gesture), so queries include hidden elements */
const guidePath = () => screen.getByTestId('qibla-wave-guide', { includeHiddenElements: true }).props.d;

describe('the calibration wave mirror', () => {
  afterEach(() => {
    setActiveLocale('en');
  });

  it('draws the figure unmirrored under the app English locale', async () => {
    await render(<QiblaWave size={SIZE} />);

    expect(guidePath()).toBe(wavePath(figureWidth, figureHeight, false));
  });

  it('draws the figure mirrored under the app Arabic locale, the bridge snapshot notwithstanding', async () => {
    setActiveLocale('ar');

    await render(<QiblaWave size={SIZE} />);

    expect(I18nManager.getConstants().isRTL).toBe(false);
    expect(guidePath()).toBe(wavePath(figureWidth, figureHeight, true));
  });
});
