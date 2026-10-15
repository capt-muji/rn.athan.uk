    const parts = hijriFormatter.formatToParts(getDayAnchor(date));
    const hijriMonth = Number(parts.find((part) => part.type === 'month')?.value);
    const hijriDay = parts.find((part) => part.type === 'day')?.value;
    const hijriYear = parts.find((part) => part.type === 'year')?.value;
    const composed = `${t(HIJRI_MONTH_KEYS[hijriMonth - 1])} ${String(hijriDay)}, ${String(hijriYear)}`;
    return composed;
  } catch {
    return formatDateLocalized(date);
  }
