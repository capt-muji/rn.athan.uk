export declare class NativeLocationModuleNextClass extends NativeModule {
  requestForegroundPermissions(
    options?: RequestPermissionsOptions
  ): Promise<LocationPermissionResponse>;
  getForegroundPermissions(): Promise<LocationPermissionResponse>;
  requestBackgroundPermissions(
    options?: RequestPermissionsOptions
  ): Promise<LocationPermissionResponse>;
  getBackgroundPermissions(): Promise<LocationPermissionResponse>;
  requestNotificationPermissions(): Promise<PermissionResponse>;
  getNotificationPermissions(): Promise<PermissionResponse>;
  setLocationProvider(provider: SharedRef<LocationProviderRefType>): void;
  getSelectedLocationProviderName(): string;
  hasLocationServicesEnabled(): boolean;
  enableLocationServices(): Promise<boolean>;
