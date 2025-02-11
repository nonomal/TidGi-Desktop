import type { PreferenceSections } from '@services/preferences/interface';

export enum WindowNames {
  about = 'about',
  addWorkspace = 'addWorkspace',
  /**
   * Open any website URL, this is a popup window that user can open a help resource.
   */
  any = 'any',
  auth = 'auth',
  editWorkspace = 'editWorkspace',
  /**
   * Window with workspace list and new wiki button on left side bar
   * We only have a single instance of main window, that is the app window.
   */
  main = 'main',
  menuBar = 'menuBar',
  notifications = 'notifications',
  preferences = 'preferences',
  /**
   * Second wiki window in a popup window.
   */
  secondary = 'secondary',
  spellcheck = 'spellcheck',
  /**
   * browserView that loads the wiki webpage
   * We will have multiple view window, each main workspace will have one.
   */
  view = 'view',
}

/**
 * Width height of windows
 */
export const windowDimension: Record<WindowNames, { height?: number; width?: number }> = {
  [WindowNames.main]: {
    width: 1200,
    height: 768,
  },
  [WindowNames.secondary]: {
    width: 961,
    height: 768,
  },
  [WindowNames.any]: {
    width: 1200,
    height: 768,
  },
  [WindowNames.menuBar]: {
    width: 400,
    height: 500,
  },
  [WindowNames.about]: {
    width: 400,
    height: 420,
  },
  [WindowNames.auth]: {
    width: 400,
    height: 220,
  },
  [WindowNames.view]: {
    width: undefined,
    height: undefined,
  },
  [WindowNames.addWorkspace]: {
    width: 690,
    height: 800,
  },
  [WindowNames.editWorkspace]: {
    width: 420,
    height: 600,
  },
  [WindowNames.preferences]: {
    width: 840,
    height: 700,
  },
  [WindowNames.notifications]: {
    width: 400,
    height: 585,
  },
  [WindowNames.spellcheck]: {
    width: 400,
    height: 590,
  },
};

export interface IPreferenceWindowMeta {
  gotoTab?: PreferenceSections;
  preventClosingWindow?: boolean;
}

/**
 * metadata that send to window when create them.
 * Please make all property partial (?:), so wo can always assign {} as default metadata without type warning
 */
export interface WindowMeta {
  [WindowNames.about]: undefined;
  [WindowNames.addWorkspace]: undefined;
  [WindowNames.any]: { uri: string };
  [WindowNames.auth]: undefined;
  [WindowNames.editWorkspace]: { workspaceID?: string };
  [WindowNames.main]: { forceClose?: boolean };
  [WindowNames.menuBar]: undefined;
  [WindowNames.notifications]: undefined;
  [WindowNames.preferences]: IPreferenceWindowMeta;
  [WindowNames.spellcheck]: undefined;
  [WindowNames.secondary]: undefined;
  [WindowNames.view]: { workspaceID?: string };
}
export type IPossibleWindowMeta<M extends WindowMeta[WindowNames] = WindowMeta[WindowNames.main]> = {
  windowName: WindowNames;
} & M;

/**
 * Similar to WindowMeta, but is for BrowserView (workspace web content) and popup window from the BrowserView
 */
export interface IBrowserViewMetaData {
  isPopup?: boolean;
  workspaceID?: string;
}
