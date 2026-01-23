// Mock for react-native
export const Platform = {
  OS: 'ios',
  select: (options: { ios?: unknown; android?: unknown; default?: unknown }) => options.ios ?? options.default,
};
