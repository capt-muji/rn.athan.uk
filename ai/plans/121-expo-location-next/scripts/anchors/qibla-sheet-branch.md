      unwatchNativeRef.current?.();
      unwatchNativeRef.current = watchFusedHeading(({ headingDegrees, attitude }) => {
        // A sensor that is delivering has not lost north. All it lacks is the wave the hint is already asking for,
        // so the report is not owed, and is taken back if a slow first sample let it go up
        if (endLostWait()) setState((previous) => ({ ...previous, lost: false }));
        // Counted before the reading is judged, and before the position is known, so no part of a wave is lost
        waveRef.current = advanceWave(waveRef.current, attitude);
        processReading(headingDegrees);
      });
    } else {
      unwatchPromise = watchHeading(({ trueHeading }) => processReading(trueHeading));
      unwatchNativeRef.current = watchHeadingAccuracy((accuracyDegrees) => {
        accuracyRef.current = accuracyDegrees;
      });
    }
