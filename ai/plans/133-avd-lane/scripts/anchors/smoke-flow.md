appId: com.example.athan
name: smoke
tags:
  - baseline
---
- launchApp
- extendedWaitUntil:
    visible: 'London, UK'
    timeout: 15000
