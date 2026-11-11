# The residual at 5658 settlements, 2026

Cells: 12,391,020 (2,065,170 settlement-days x 6 columns).

## Per column

| column | exact % | within-1 % | beyond 1 min | MAE | bias | worst | -2 | -1 | 0 | +1 | +2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| fajr | 89.6 | 100.0 | 1 | 0.104 | 0.002 | -9 | 1 | 104916 | 1850784 | 109469 | 0 |
| sunrise | 94.4 | 100.0 | 0 | 0.056 | -0.001 | 1 | 0 | 58946 | 1948744 | 57480 | 0 |
| dhuhr | 99.5 | 100.0 | 0 | 0.005 | -0.001 | 1 | 0 | 6405 | 2055073 | 3692 | 0 |
| asr | 62.5 | 100.0 | 0 | 0.375 | 0.000 | -1 | 0 | 387714 | 1290617 | 386839 | 0 |
| maghrib | 94.1 | 100.0 | 0 | 0.059 | -0.001 | 1 | 0 | 62326 | 1942453 | 60391 | 0 |
| isha | 85.0 | 100.0 | 8 | 0.150 | 0.002 | 108 | 0 | 152715 | 1755116 | 157331 | 8 |

## The latitude slope of exactness

Regression of per-settlement exact percentage on latitude, each settlement weighted once.

| series | slope (pc/deg) | r | settlements |
|---|---|---|---|
| all six columns | -0.661 | -0.968 | 5658 |
| fajr | -1.054 | -0.940 | 5658 |
| sunrise | -0.395 | -0.811 | 5658 |
| dhuhr | -0.001 | -0.011 | 5658 |
| asr | -1.438 | -0.915 | 5658 |
| maghrib | -0.413 | -0.817 | 5658 |
| isha | -0.664 | -0.843 | 5658 |
| twilight columns averaged (fajr, asr, isha) | -1.052 | -0.961 | 5658 |
| solar columns averaged (sunrise, dhuhr, maghrib) | -0.270 | -0.887 | 5658 |

Control: the same regression on the 91 settlements O1m-25 banked (its 96 less the
five the API refuses) reads -0.650 pc/deg at r -0.965, against the -0.653 at r -0.965
recorded there on the page-rendered tables. The two readings use the same recipe and differ only
in whether the five page-only settlements are present.

## The slope by region

Each region regressed across its own settlements. Regions with fewer than 8 settlements are
reported with the national pooled reading instead of a slope of their own.

| region | settlements | lat span | exact % | slope (pc/deg) | r | fajr slope | asr slope | isha slope | dhuhr slope |
|---|---|---|---|---|---|---|---|---|---|
| Түркістан облысы | 731 | 42.0 | 91.3 | -0.442 | -0.647 | -0.385 | -0.935 | -0.848 | 0.012 |
| Жамбыл облысы | 376 | 43.2 | 90.9 | -0.446 | -0.368 | -0.541 | -0.993 | -0.609 | -0.009 |
| Алматы облысы | 376 | 43.5 | 90.9 | -0.548 | -0.425 | -0.528 | -1.209 | -0.927 | -0.002 |
| Маңғыстау облысы | 50 | 44.2 | 90.1 | -0.623 | -0.698 | -0.820 | -1.083 | -0.914 | -0.110 |
| Жетісу облысы | 227 | 45.1 | 90.2 | -0.506 | -0.547 | -0.628 | -1.041 | -0.814 | 0.073 |
| Қызылорда облысы | 203 | 45.2 | 89.7 | -0.687 | -0.795 | -0.789 | -1.606 | -0.909 | -0.051 |
| Республикалық маңызы бар қалалар | 3 | 45.6 | 89.3 | n/a | n/a | n/a | n/a | n/a | n/a |
| Атырау облысы | 136 | 47.5 | 87.9 | -0.580 | -0.619 | -1.123 | -0.891 | -0.401 | -0.031 |
| Ұлытау облысы | 55 | 48.5 | 87.8 | -0.477 | -0.402 | -1.210 | -0.908 | 0.145 | -0.187 |
| Абай облысы | 286 | 49.0 | 87.8 | -0.619 | -0.834 | -1.159 | -1.366 | -0.567 | 0.014 |
| Шығыс Қазақстан облысы | 266 | 49.2 | 87.8 | -0.635 | -0.736 | -1.148 | -1.337 | -0.466 | 0.016 |
| Қарағанды облысы | 299 | 49.5 | 87.2 | -0.719 | -0.761 | -1.351 | -1.603 | -0.711 | 0.007 |
| Ақтөбе облысы | 325 | 49.6 | 86.8 | -0.596 | -0.751 | -1.135 | -1.239 | -0.465 | 0.025 |
| Батыс Қазақстан облысы | 409 | 50.3 | 86.1 | -0.778 | -0.754 | -1.429 | -1.694 | -0.447 | -0.024 |
| Ақмола облысы | 550 | 52.0 | 85.2 | -0.913 | -0.744 | -1.518 | -2.072 | -0.752 | -0.003 |
| Павлодар облысы | 293 | 52.6 | 84.9 | -0.857 | -0.768 | -1.566 | -1.691 | -0.598 | 0.047 |
| Қостанай облысы | 546 | 52.8 | 84.3 | -0.927 | -0.841 | -1.676 | -1.973 | -0.698 | -0.003 |
| Солтүстік Қазақстан облысы | 527 | 54.0 | 83.4 | -1.103 | -0.728 | -1.864 | -2.238 | -1.022 | -0.020 |

## Reading

North of 50 N: 2567 settlements, mean exact 84.9 pc.
South of 45 N: 1698 settlements, mean exact 91.0 pc.
