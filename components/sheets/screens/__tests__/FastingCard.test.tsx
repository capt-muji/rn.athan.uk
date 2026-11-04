/**
 * The fasting card: the mode picker, the add-on row, and the preview of what
 * the current selection arms. The sheet flows live in Alert.test.tsx, beside
 * the rest of the sheet's own commits.
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

import { formatShownDate } from '@/components/day/shownDate';
import { london } from '@/hooks/__tests__/londonDays';
import { __resetHijriMemoForTests } from '@/shared/fasting';
import { t } from '@/shared/i18n';
import { minutesToRecord, toDayMinutes } from '@/shared/timetableDecode';
import { type FastingSelection, ScheduleType } from '@/shared/types';
import { fastingDawoodAnchorAtom } from '@/stores/notifications';
import { setSequence } from '@/stores/schedule';
import { __installTimetableDays, __resetTimetableForTest } from '@/stores/timetable';

import FastingCard from '../FastingCard';

const store = getDefaultStore();

const TIMES = { fajr: '05:50', sunrise: '07:30', dhuhr: '13:00', asr: '16:00', magrib: '19:00', isha: '20:30' };

const installAprilDays = (breakFajrOn = '') =>
  __installTimetableDays(
    Array.from({ length: 4 }, (_, i) => {
      const date = new Date(Date.parse('2026-04-01T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
      const times = date === breakFajrOn ? { ...TIMES, fajr: null } : TIMES;
      return minutesToRecord(date, toDayMinutes(times));
    })
  );

/** Wednesday 1 April 2026 at noon: a white day of Shawwal 1447, the 2nd a Thursday */
const showAprilWindow = (breakFajrOn = '') => {
  const now = london('2026-04-01', '12:00');
  jest.useFakeTimers({ now });
  installAprilDays(breakFajrOn);
  setSequence(ScheduleType.Standard, now);
  setSequence(ScheduleType.Extra, now);
};

const settle = () => act(() => jest.runAllTimersAsync());

const selection = (over: Partial<FastingSelection> = {}): FastingSelection => ({
  mode: 'everyDay',
  whiteDaysAddOn: false,
  ...over,
});

afterEach(() => {
  jest.useRealTimers();
  __resetTimetableForTest();
});

describe('the mode picker', () => {
  it('draws the four modes with the selection marked', async () => {
    showAprilWindow();
    await render(<FastingCard selection={selection({ mode: 'whiteDays' })} onSelectionChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: t('fasting.mode.everyDay') })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: t('fasting.mode.whiteDays') })).toBeSelected();
    expect(screen.getByRole('radio', { name: t('fasting.mode.muhammad') })).not.toBeSelected();
  });

  it('hands the sheet the whole selection, keeping the add-on', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await render(
      <FastingCard
        selection={selection({ mode: 'muhammad', whiteDaysAddOn: true })}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.press(screen.getByRole('radio', { name: t('fasting.mode.dawood') }));
    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'dawood', whiteDaysAddOn: true });
  });
});

describe('the white-days add-on', () => {
  it('appears beside the two regimens alone', async () => {
    showAprilWindow();
    await render(
      <FastingCard selection={selection({ mode: 'everyDay', whiteDaysAddOn: true })} onSelectionChange={jest.fn()} />
    );
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('hands its press to the sheet', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await render(<FastingCard selection={selection({ mode: 'muhammad' })} onSelectionChange={onSelectionChange} />);

    await fireEvent.press(screen.getByRole('switch', { name: t('fasting.addOn.whiteDays') }));
    await settle();
    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'muhammad', whiteDaysAddOn: true });
  });
});

describe('the preview', () => {
  it("names tomorrow's Sahur after today's has already fired", async () => {
    // Noon on the white-day Wednesday: its 05:30 suhoor is spent, so the next one is the 2nd's
    showAprilWindow();
    await render(<FastingCard selection={selection({ mode: 'whiteDays' })} onSelectionChange={jest.fn()} />);

    expect(screen.getByText(new RegExp(t('fasting.preview.next')))).toBeOnTheScreen();
    expect(screen.getByText(new RegExp(formatShownDate('2026-04-02', false)))).toBeOnTheScreen();
    expect(screen.queryByText(new RegExp(formatShownDate('2026-04-01', false)))).toBeNull();
  });

  it("names today's Sahur while it is still ahead", async () => {
    jest.useFakeTimers({ now: london('2026-04-01', '04:00') });
    installAprilDays();
    await render(<FastingCard selection={selection({ mode: 'whiteDays' })} onSelectionChange={jest.fn()} />);

    expect(screen.getByText(new RegExp(t('fasting.preview.next')))).toBeOnTheScreen();
    expect(screen.getByText(new RegExp(formatShownDate('2026-04-01', false)))).toBeOnTheScreen();
    expect(screen.getByText(`${t('fasting.preview.today')}: ${t('fasting.state.on')}`)).toBeOnTheScreen();
  });

  it('keeps the sheet alive when no day arms at all', async () => {
    showAprilWindow();
    __resetHijriMemoForTests();
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    spy.mockImplementation(() => {
      throw new Error('no calendar support');
    });

    await expect(
      render(<FastingCard selection={selection({ mode: 'whiteDays' })} onSelectionChange={jest.fn()} />)
    ).resolves.toBeDefined();

    expect(screen.queryByText(new RegExp(t('fasting.preview.next')))).toBeNull();
    expect(screen.getByText(`${t('fasting.preview.today')}: ${t('fasting.state.off')}`)).toBeOnTheScreen();
    spy.mockRestore();
  });

  it('reads a Wednesday off and a Thursday on under muhammad', async () => {
    showAprilWindow();
    await render(<FastingCard selection={selection({ mode: 'muhammad' })} onSelectionChange={jest.fn()} />);

    expect(screen.getByText(`${t('fasting.preview.today')}: ${t('fasting.state.off')}`)).toBeOnTheScreen();
    expect(screen.getByText(`${t('fasting.preview.tomorrow')}: ${t('fasting.state.on')}`)).toBeOnTheScreen();
  });

  it('badges upcoming fasts with the regimen under everyDay, whose days carry none', async () => {
    showAprilWindow();
    await render(<FastingCard selection={selection({ mode: 'everyDay' })} onSelectionChange={jest.fn()} />);

    expect(screen.getAllByText(t('fasting.mode.everyDay')).length).toBeGreaterThan(1);
  });

  it('hides the preview when the next fast falls on a day with no row', async () => {
    // Noon on the 4th: the next white day is the 30th, which the installed window does not carry
    const now = london('2026-04-04', '12:00');
    jest.useFakeTimers({ now });
    installAprilDays();
    setSequence(ScheduleType.Standard, now);
    setSequence(ScheduleType.Extra, now);
    await render(<FastingCard selection={selection({ mode: 'whiteDays' })} onSelectionChange={jest.fn()} />);

    expect(screen.queryByText(new RegExp(t('fasting.preview.next')))).toBeNull();
    expect(screen.getByText(`${t('fasting.preview.today')}: ${t('fasting.state.off')}`)).toBeOnTheScreen();
  });

  it('previews from today when dawood is selected with no stored cycle', async () => {
    showAprilWindow();
    store.set(fastingDawoodAnchorAtom, 0);
    await render(<FastingCard selection={selection({ mode: 'dawood' })} onSelectionChange={jest.fn()} />);

    expect(screen.getByText(`${t('fasting.preview.today')}: ${t('fasting.state.off')}`)).toBeOnTheScreen();
    expect(screen.getByText(`${t('fasting.preview.tomorrow')}: ${t('fasting.state.on')}`)).toBeOnTheScreen();
  });

  it('passes over a day with no row when the dawood preview resolves its cycle', async () => {
    // The anchor sits after the 2nd's suhoor and the 3rd carries no Fajr, so the cycle starts on the 4th
    showAprilWindow('2026-04-03');
    store.set(fastingDawoodAnchorAtom, london('2026-04-02', '15:00').getTime());
    await render(<FastingCard selection={selection({ mode: 'dawood' })} onSelectionChange={jest.fn()} />);

    expect(screen.getByText(`${t('fasting.preview.tomorrow')}: ${t('fasting.state.off')}`)).toBeOnTheScreen();
    expect(screen.getAllByText(t('fasting.mode.dawood')).length).toBeGreaterThan(1);
  });
});
