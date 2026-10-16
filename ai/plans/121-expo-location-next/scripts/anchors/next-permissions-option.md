export enum RequestPermissionsAccuracyOption {
  /**
   * Asks for the precise location.
   *
   * On Android, requests `ACCESS_FINE_LOCATION` together with `ACCESS_COARSE_LOCATION`.
   *
   * On iOS, when the app holds a reduced accuracy, shows the system prompt for temporary full
   * accuracy after the permission is granted. The prompt needs the purpose string the config plugin
   * writes by default; `locationFullAccuracyPermission: false` removes it and skips the prompt.
   */
  FULL = 'full',
  /**
   * Asks for an approximate location only.
   *
