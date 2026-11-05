/**
 * The fasting card as design 427: the four toggle rows with their always-on
 * identity dots, the sky note's six description states, the next-two Suhoor
 * entries with their identity dots, and the ten-day strip calendar below the
 * note - the whole schedule section hidden on Every day. The sheet's own flows
 * (the draft-and-commit at close) live in Alert.test.tsx.
 */

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';

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

/** 1-10 April 2026: the 1st-3rd are the white days of Shawwal 1447, the 2nd a Thursday */
const installAprilDays = (breakFajrOn = '') =>
  __installTimetableDays(
    Array.from({ length: 10 }, (_, i) => {
      const date = new Date(Date.parse('2026-04-01T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
      const times = date === breakFajrOn ? { ...TIMES, fajr: null } : TIMES;
      return minutesToRecord(date, toDayMinutes(times));
    })
  );

/** Wednesday 1 April 2026 at noon: today's 05:30 suhoor is already spent */
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

const rowSwitch = (mode: string) => screen.getByRole('switch', { name: t(`fasting.mode.${mode}` as never) });

const renderCard = async (sel: FastingSelection, onSelectionChange = jest.fn()) => {
  const view = await render(<FastingCard selection={sel} onSelectionChange={onSelectionChange} />);
  await settle();
  return view;
};

afterEach(() => {
  jest.useRealTimers();
  __resetTimetableForTest();
});

describe('the rows', () => {
  it('draws the four options with their toggles, the selection marked', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'whiteDays' }));

    expect(rowSwitch('everyDay')).not.toBeChecked();
    expect(rowSwitch('whiteDays')).toBeChecked();
    expect(rowSwitch('muhammad')).not.toBeChecked();
    expect(rowSwitch('dawood')).not.toBeChecked();
  });

  it('marks the add-on on its regimen row beside the white-days row', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(rowSwitch('muhammad')).toBeChecked();
    expect(rowSwitch('whiteDays')).toBeChecked();
  });

  it('reads a stored pair off the six sets before drafting', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'whiteDays', whiteDaysAddOn: true }));

    expect(rowSwitch('whiteDays')).toBeChecked();
    expect(screen.getByText(t('fasting.description.whiteDays'))).toBeOnTheScreen();
  });

  it('hands the sheet the tap rule landing from a toggle press', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }), onSelectionChange);

    await fireEvent.press(rowSwitch('dawood'));
    await settle();

    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'dawood', whiteDaysAddOn: true });
  });

  it('hands the sheet the same landing from a press on the row itself', async () => {
    showAprilWindow();
    const onSelectionChange = jest.fn();
    await renderCard(selection({ mode: 'everyDay' }), onSelectionChange);

    await fireEvent.press(screen.getAllByLabelText(t('fasting.mode.muhammad'))[0]);
    await settle();

    expect(onSelectionChange).toHaveBeenCalledWith({ mode: 'muhammad', whiteDaysAddOn: false });
  });
});

describe('the sky note', () => {
  it('speaks the whole selection, following the draft', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(screen.getByText(t('fasting.description.muhammadWhiteDays'))).toBeOnTheScreen();
  });
});

describe('the schedule section', () => {
  it('hides entirely on every day', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'everyDay' }));

    expect(screen.queryByText(t('fasting.next.label'))).toBeNull();
    expect(screen.getByText(t('fasting.description.everyDay'))).toBeOnTheScreen();
  });

  it('names the next two triggers with their spoken distance and wall time', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    expect(screen.getByText(t('fasting.next.label'))).toBeOnTheScreen();
    // Thursday the 2nd is the first armed day ahead at noon on the 1st; the 3rd follows
    expect(screen.getByText(t('fasting.next.hours', { n: 18 }))).toBeOnTheScreen();
    expect(
      screen.getByText(
        t('fasting.next.withWeekday', {
          distance: t('fasting.next.days', { n: 2 }),
          weekday: t('calendar.weekdayShort.5'),
        })
      )
    ).toBeOnTheScreen();
    expect(screen.getAllByText('05:30')).toHaveLength(2);
  });

  it('survives a dead Hijri engine with no armed days at all', async () => {
    showAprilWindow();
    __resetHijriMemoForTests();
    const spy = jest.spyOn(Intl, 'DateTimeFormat');
    spy.mockImplementation(() => {
      throw new Error('no calendar support');
    });

    await expect(renderCard(selection({ mode: 'whiteDays' }))).resolves.toBeDefined();

    expect(screen.getByText(t('fasting.next.label'))).toBeOnTheScreen();
    expect(screen.queryByText(/05:30/)).toBeNull();
    spy.mockRestore();
    // The walk memoised null Hijri parts for these dates under the dead engine;
    // clear them or the next suite member reads the poison as gospel
    __resetHijriMemoForTests();
  });

  it('speaks the singular hour and the singular day at their own distances', async () => {
    // 04:30 on the white-day 1st: today's own suhoor is one hour ahead
    const early = london('2026-04-01', '04:30');
    jest.useFakeTimers({ now: early });
    installAprilDays();
    setSequence(ScheduleType.Standard, early);
    setSequence(ScheduleType.Extra, early);
    await renderCard(selection({ mode: 'whiteDays' }));

    expect(screen.getByText(t('fasting.next.hour', { n: 1 }))).toBeOnTheScreen();

    // 00:30 under muhammad: the Thursday trigger is the one-day distance
    const midnight = london('2026-04-01', '00:30');
    jest.useFakeTimers({ now: midnight });
    await renderCard(selection({ mode: 'muhammad' }));

    expect(
      screen.getByText(
        t('fasting.next.withWeekday', {
          distance: t('fasting.next.day', { n: 1 }),
          weekday: t('calendar.weekdayShort.4'),
        })
      )
    ).toBeOnTheScreen();
  });

  it('renders a Ramadan entry with no cluster beside it', async () => {
    // 10 February 2027 falls in Ramadan 1448, which subsumes every regimen:
    // the entries speak, but carry no identity dots of their own
    const now = london('2027-02-10', '12:00');
    jest.useFakeTimers({ now });
    __installTimetableDays(
      Array.from({ length: 4 }, (_, i) => {
        const date = new Date(Date.parse('2027-02-10T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10);
        return minutesToRecord(date, toDayMinutes(TIMES));
      })
    );
    setSequence(ScheduleType.Standard, now);
    setSequence(ScheduleType.Extra, now);

    await renderCard(selection({ mode: 'muhammad' }));

    // Tomorrow's suhoor is the first armed day ahead; Ramadan names it, no dots beside it
    expect(screen.getByText(t('fasting.next.hours', { n: 18 }))).toBeOnTheScreen();
  });
});

describe('the calendar strip', () => {
  it('carries ten squares from today, today first', async () => {
    showAprilWindow();
    await renderCard(selection({ mode: 'muhammad', whiteDaysAddOn: true }));

    for (const day of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(screen.getAllByText(String(day)).length).toBeGreaterThan(0);
    }
  });

  it('alternates from now under dawood with no stored cycle', async () => {
    showAprilWindow();
    store.set(fastingDawoodAnchorAtom, 0);
    await renderCard(selection({ mode: 'dawood' }));

    // No anchor: the cycle starts on the first day whose suhoor is ahead - the 2nd,
    // seventeen and a half hours away at noon on the 1st; the next on day is the 4th
    expect(screen.getByText(t('fasting.next.hours', { n: 18 }))).toBeOnTheScreen();
    expect(
      screen.getByText(
        t('fasting.next.withWeekday', {
          distance: t('fasting.next.days', { n: 3 }),
          weekday: t('calendar.weekdayShort.6'),
        })
      )
    ).toBeOnTheScreen();
  });

  it('keeps the section to the window the timetable carries', async () => {
    // Noon on the 10th: the installed window ends there, so no trigger is ahead
    const now = london('2026-04-10', '12:00');
    jest.useFakeTimers({ now });
    installAprilDays();
    setSequence(ScheduleType.Standard, now);
    setSequence(ScheduleType.Extra, now);

    await renderCard(selection({ mode: 'muhammad' }));

    expect(screen.getByText(t('fasting.next.label'))).toBeOnTheScreen();
    expect(screen.queryByText(/05:30/)).toBeNull();
  });
});
