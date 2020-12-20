// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'fs'.
import fs from 'fs-extra';
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'path'.
import path from 'path';
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'sendToAllW... Remove this comment to see the full error message
import sendToAllWindows from './send-to-all-windows';
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'LOCALIZATI... Remove this comment to see the full error message
import { LOCALIZATION_FOLDER } from '../constants/paths';
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'index18n'.
import index18n from './i18n';

// Electron-specific; must match mainIpc
const readFileRequest = 'ReadFile-Request';
const writeFileRequest = 'WriteFile-Request';
const readFileResponse = 'ReadFile-Response';
const writeFileResponse = 'WriteFile-Response';
const changeLanguageRequest = 'ChangeLanguage-Request';

// This is the code that will go into the preload.js file
// in order to set up the contextBridge api
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'preloadBin... Remove this comment to see the full error message
const preloadBindings = function (ipcRenderer: any) {
  return {
    send: (channel: any, data: any) => {
      const validChannels = [readFileRequest, writeFileRequest];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    onReceive: (channel: any, function_: any) => {
      const validChannels = [readFileResponse, writeFileResponse];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes "sender"
        ipcRenderer.on(channel, (event: any, arguments_: any) => function_(arguments_));
      }
    },
    onLanguageChange: (function_: any) => {
      // Deliberately strip event as it includes "sender"
      ipcRenderer.on(changeLanguageRequest, (event: any, arguments_: any) => {
        function_(arguments_);
      });
    },
  };
};

// This is the code that will go into the main.js file
// in order to set up the ipc main bindings
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'mainBindin... Remove this comment to see the full error message
const mainBindings = function (ipcMain: any, browserWindow: any) {
  ipcMain.on(readFileRequest, (IpcMainEvent: any, arguments_: any) => {
    const localeFilePath = path.join(LOCALIZATION_FOLDER, arguments_.filename);
    fs.readFile(localeFilePath, 'utf8', (error: any, data: any) => {
      sendToAllWindows(readFileResponse, {
        key: arguments_.key,
        error,
        data: typeof data !== 'undefined' && data !== null ? data.toString() : '',
      });
    });
  });

  ipcMain.on(writeFileRequest, (IpcMainEvent: any, arguments_: any) => {
    const localeFilePath = path.join(LOCALIZATION_FOLDER, arguments_.filename);
    const localeFileFolderPath = path.dirname(localeFilePath);
    fs.ensureDir(localeFileFolderPath, (directoryCreationError: any) => {
      if (directoryCreationError) {
        console.error(directoryCreationError);
        return;
      }
      fs.writeFile(localeFilePath, JSON.stringify(arguments_.data), (error: any) => {
        sendToAllWindows(writeFileResponse, {
          keys: arguments_.keys,
          error,
        });
      });
    });
  });
};

// Clears the bindings from ipcMain;
// in case app is closed/reopened (only on macos)
const clearMainBindings = function (ipcMain: any) {
  ipcMain.removeAllListeners(readFileRequest);
  ipcMain.removeAllListeners(writeFileRequest);
};

const whitelistMap = JSON.parse(fs.readFileSync(path.join(LOCALIZATION_FOLDER, 'whitelist.json'), 'utf-8'));

const whiteListedLanguages = Object.keys(whitelistMap);

// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'getLanguag... Remove this comment to see the full error message
function getLanguageMenu() {
  const subMenu = [];
  for (const language of whiteListedLanguages) {
    subMenu.push({
      label: whitelistMap[language],
      click: (menuItem: any, browserWindow: any, event: any) => {
        // eslint-disable-next-line global-require
        const { setPreference } = require('./preferences');
        setPreference('language', language);
        index18n.changeLanguage(language);
        // eslint-disable-next-line global-require
        const { onEachView } = require('./views');
        onEachView((view: any) => {
          view.webContents.send(changeLanguageRequest, {
            lng: language,
          });
        });
        sendToAllWindows(changeLanguageRequest, {
          lng: language,
        });
      },
    });
  }

  return subMenu;
}

export {
  getLanguageMenu,
  readFileRequest,
  writeFileRequest,
  readFileResponse,
  writeFileResponse,
  changeLanguageRequest,
  preloadBindings,
  mainBindings,
  clearMainBindings,
};
