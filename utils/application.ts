import { deleteCache } from "!utils/cache";
import { version } from '../package.json';

export const logAppVersion = () => console.log(`App version: ${version}`);

export const forceAppRefresh = (): void => {
  deleteCache("data");
  location.reload();
};
