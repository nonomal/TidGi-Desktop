import type { BrowserView, BrowserWindow, WebPreferences } from 'electron';
import { ProxyPropertyType } from 'electron-ipc-cat/common';

import { ViewChannel } from '@/constants/channels';
import type { WindowNames } from '@services/windows/WindowProperties';
import type { IWorkspace } from '@services/workspaces/interface';

export type INewWindowAction =
  | {
    action: 'deny';
  }
  | {
    action: 'allow';
    overrideBrowserWindowOptions?: Electron.BrowserWindowConstructorOptions | undefined;
  };

/**
 * BrowserView related things, the BrowserView is the webview like frame that renders our wiki website.
 */
export interface IViewService {
  /**
   * Add a new browserView and load the url
   */
  addView: (workspace: IWorkspace, windowName: WindowNames) => Promise<void>;
  /**
   * Check if we can skip the addView() for a workspace
   */
  alreadyHaveView(workspace: IWorkspace): Promise<boolean>;
  createViewAddToWindow(workspace: IWorkspace, browserWindow: BrowserWindow, sharedWebPreferences: WebPreferences, windowName: WindowNames): Promise<BrowserView>;
  forEachView: (functionToRun: (view: BrowserView, workspaceID: string, windowName: WindowNames) => void) => void;
  /**
   * If menubar is open, we get menubar browser view, else we get main window browser view
   */
  getActiveBrowserView: () => Promise<BrowserView | undefined>;
  /**
   * Get active workspace's main window and menubar browser view.
   */
  getActiveBrowserViews: () => Promise<Array<BrowserView | undefined>>;
  getAllViewOfWorkspace: (workspaceID: string) => BrowserView[];
  getSharedWebPreferences(workspace: IWorkspace): Promise<WebPreferences>;
  getView: (workspaceID: string, windowName: WindowNames) => BrowserView | undefined;
  getViewCount(): Promise<number>;
  getViewCurrentUrl(workspaceID?: string): Promise<string | undefined>;
  hideView(browserWindow: BrowserWindow): Promise<void>;
  initializeWorkspaceViewHandlersAndLoad(workspace: IWorkspace, browserWindow: BrowserWindow, view: BrowserView, sharedWebPreferences: WebPreferences, uri?: string): Promise<void>;
  /**
   * Try catch loadUrl, other wise it will throw unhandled promise rejection Error: ERR_CONNECTION_REFUSED (-102) loading 'http://localhost:5212/
   * We will set `didFailLoadErrorMessage`, it will set didFailLoadErrorMessage, and we throw actuarial error after that
   */
  loadUrlForView(workspace: IWorkspace, view: BrowserView): Promise<void>;
  realignActiveView: (browserWindow: BrowserWindow, activeId: string) => Promise<void>;
  reloadActiveBrowserView: () => Promise<void>;
  reloadViewsWebContents(workspaceID?: string | undefined): Promise<void>;
  reloadViewsWebContentsIfDidFailLoad: () => Promise<void>;
  removeAllViewOfWorkspace: (workspaceID: string) => void;
  removeView: (workspaceID: string, windowName: WindowNames) => void;
  /**
   * Bring an already created view to the front. If it happened to not created, will call `addView()` to create one.
   * @param workspaceID id, can only be main workspace id, because only main workspace will have view created.
   * @param windowName you can control main window or menubar window to have this view.
   * @returns
   */
  setActiveView: (workspaceID: string, windowName: WindowNames) => Promise<void>;
  setActiveViewForAllBrowserViews(workspaceID: string): Promise<void>;
  setViewsAudioPref: (_shouldMuteAudio?: boolean) => void;
  setViewsNotificationsPref: (_shouldPauseNotifications?: boolean) => void;
}
export const ViewServiceIPCDescriptor = {
  channel: ViewChannel.name,
  properties: {
    addView: ProxyPropertyType.Function,
    alreadyHaveView: ProxyPropertyType.Function,
    forEachView: ProxyPropertyType.Function,
    getActiveBrowserView: ProxyPropertyType.Function,
    getAllViewOfWorkspace: ProxyPropertyType.Function,
    getSharedWebPreferences: ProxyPropertyType.Function,
    getView: ProxyPropertyType.Function,
    getViewCount: ProxyPropertyType.Function,
    getViewCurrentUrl: ProxyPropertyType.Function,
    hideView: ProxyPropertyType.Function,
    initializeWorkspaceViewHandlersAndLoad: ProxyPropertyType.Function,
    realignActiveView: ProxyPropertyType.Function,
    reloadActiveBrowserView: ProxyPropertyType.Function,
    reloadViewsWebContents: ProxyPropertyType.Function,
    reloadViewsWebContentsIfDidFailLoad: ProxyPropertyType.Function,
    removeAllViewOfWorkspace: ProxyPropertyType.Function,
    removeView: ProxyPropertyType.Function,
    setActiveView: ProxyPropertyType.Function,
    setActiveViewForAllBrowserViews: ProxyPropertyType.Function,
    setViewsAudioPref: ProxyPropertyType.Function,
    setViewsNotificationsPref: ProxyPropertyType.Function,
  },
};
