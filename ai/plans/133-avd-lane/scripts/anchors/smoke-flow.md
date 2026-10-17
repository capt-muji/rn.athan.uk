appId: com.mugtaba.athan
name: smoke
tags:
  - baseline
---
- launchApp
- extendedWaitUntil:
    visible: 'London, UK'
    timeout: 15000
