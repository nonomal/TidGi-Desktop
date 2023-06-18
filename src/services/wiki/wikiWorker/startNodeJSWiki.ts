import { getTidGiAuthHeaderWithToken } from '@/constants/auth';
import { defaultServerIP } from '@/constants/urls';
import { TiddlyWiki } from '@tiddlygit/tiddlywiki';
import intercept from 'intercept-stdout';
import { nanoid } from 'nanoid';
import inspector from 'node:inspector';
import path from 'path';
import { Observable } from 'rxjs';
import { IWikiMessage, WikiControlActions } from '../interface';
import { IStartNodeJSWikiConfigs, IUtilsWithSqlite } from '.';
import { getCacheDatabase, setWikiInstance } from './globals';
import { ipcServerRoutes } from './ipcServerRoutes';
import { adminTokenIsProvided } from './wikiWorkerUtils';

export function startNodeJSWiki({
  adminToken,
  constants: { TIDDLYWIKI_PACKAGE_FOLDER, EXTRA_TIDGI_PLUGINS_PATH },
  excludedPlugins = [],
  homePath,
  https,
  isDev,
  openDebugger,
  readOnlyMode,
  rootTiddler = '$:/core/save/lazy-images',
  tiddlyWikiHost = defaultServerIP,
  tiddlyWikiPort = 5112,
  tokenAuth,
  userName,
}: IStartNodeJSWikiConfigs): Observable<IWikiMessage> {
  if (openDebugger === true) {
    inspector.open();
    inspector.waitForDebugger();
    // eslint-disable-next-line no-debugger
    debugger;
  }
  return new Observable<IWikiMessage>((observer) => {
    let fullBootArgv: string[] = [];
    observer.next({ type: 'control', actions: WikiControlActions.start, argv: fullBootArgv });
    intercept(
      (newStdOut: string) => {
        observer.next({ type: 'stdout', message: newStdOut });
      },
      (newStdError: string) => {
        observer.next({ type: 'control', source: 'intercept', actions: WikiControlActions.error, message: newStdError, argv: fullBootArgv });
      },
    );

    try {
      const wikiInstance = TiddlyWiki();
      setWikiInstance(wikiInstance);
      const cacheDatabase = getCacheDatabase();
      // mount database to $tw
      if (wikiInstance !== undefined && cacheDatabase !== undefined) {
        (wikiInstance.utils as IUtilsWithSqlite).TidgiCacheDB = cacheDatabase;
        (wikiInstance.utils as IUtilsWithSqlite).Sqlite = cacheDatabase.database;
      }
      process.env.TIDDLYWIKI_PLUGIN_PATH = path.resolve(homePath, 'plugins');
      process.env.TIDDLYWIKI_THEME_PATH = path.resolve(homePath, 'themes');
      const builtInPluginArguments = [
        // add tiddly filesystem back if is not readonly https://github.com/Jermolene/TiddlyWiki5/issues/4484#issuecomment-596779416
        readOnlyMode === true ? undefined : '+plugins/tiddlywiki/filesystem',
        // '+plugins/tiddlywiki/tiddlyweb', // we use $:/plugins/linonetwo/tidgi instead
        // '+plugins/linonetwo/watch-fs',
      ].filter(Boolean) as string[];
      /**
       * Make wiki readonly if readonly is true. This is normally used for server mode, so also enable gzip.
       *
       * The principle is to configure anonymous reads, but writes require a login, and then give an unguessable random password here.
       *
       * @url https://wiki.zhiheng.io/static/TiddlyWiki%253A%2520Readonly%2520for%2520Node.js%2520Server.html
       */
      const readonlyArguments = readOnlyMode === true ? ['gzip=yes', 'readers=(anon)', `writers=${userName}`, `username=${userName}`, `password=${nanoid()}`] : [];
      /**
       * Use authenticated-user-header to provide `TIDGI_AUTH_TOKEN_HEADER` as header key to receive a value as username (we use it as token).
       *
       * For example, when server starts with `"readers=s0me7an6om3ey" writers=s0me7an6om3ey" authenticated-user-header=x-tidgi-auth-token`, only when other app query with header `x-tidgi-auth-token: s0me7an6om3ey`, can it get access to the wiki.
       *
       * When this is not enabled, provide a `anon-username` for any users.
       *
       * @url https://github.com/Jermolene/TiddlyWiki5/discussions/7469
       */
      let tokenAuthenticateArguments: string[] = [`anon-username=${userName}`];
      if (tokenAuth === true) {
        if (adminTokenIsProvided(adminToken)) {
          tokenAuthenticateArguments = [`authenticated-user-header=${getTidGiAuthHeaderWithToken(adminToken)}`, `readers=${userName}`, `writers=${userName}`];
        } else {
          observer.next({ type: 'control', actions: WikiControlActions.error, message: 'tokenAuth is true, but adminToken is empty, this can be a bug.', argv: fullBootArgv });
        }
      }
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      const httpsArguments = https?.enabled && https.tlsKey && https.tlsCert
        ? [`tls-key=${https.tlsKey}`, `tls-cert=${https.tlsCert}`]
        : [];
      /**
       * Set excluded plugins or tiddler content to empty string.
       * Should disable plugins/tiddlywiki/filesystem (so only work in readonly mode), otherwise will write empty string to tiddlers.
       * @url https://github.com/linonetwo/wiki/blob/8f1f091455eec23a9f016d6972b7f38fe85efde1/tiddlywiki.info#LL35C1-L39C20
       */
      const excludePluginsArguments = readOnlyMode === true
        ? [
          '--setfield',
          excludedPlugins.map((pluginOrTiddlerTitle) =>
            // allows filter like `[is[binary]] [type[application/msword]] -[type[application/pdf]]`, but also auto add `[[]]` to plugin title to be like `[[$:/plugins/tiddlywiki/filesystem]]`
            pluginOrTiddlerTitle.includes('[') && pluginOrTiddlerTitle.includes(']') ? pluginOrTiddlerTitle : `[[${pluginOrTiddlerTitle}]]`
          ).join(' '),
          'text',
          '',
          'text/plain',
        ]
        : [];

      fullBootArgv = [
        ...builtInPluginArguments,
        homePath,
        '--listen',
        `port=${tiddlyWikiPort}`,
        `host=${tiddlyWikiHost}`,
        `root-tiddler=${rootTiddler}`,
        ...httpsArguments,
        ...readonlyArguments,
        ...tokenAuthenticateArguments,
        ...excludePluginsArguments,
        // `debug-level=${isDev ? 'full' : 'none'}`,
      ];
      wikiInstance.boot.argv = [...fullBootArgv];

      wikiInstance.hooks.addHook('th-server-command-post-start', function(listenCommand, server) {
        server.on('error', function(error: Error) {
          observer.next({ type: 'control', actions: WikiControlActions.error, message: error.message, argv: fullBootArgv });
        });
        server.on('listening', function() {
          observer.next({
            type: 'control',
            actions: WikiControlActions.booted,
            message:
              `Tiddlywiki booted at http://${tiddlyWikiHost}:${tiddlyWikiPort} (webview uri ip may be different, being nativeService.getLocalHostUrlWithActualInfo(appUrl, workspace.id)) with args ${
                wikiInstance === undefined ? '(wikiInstance is undefined)' : fullBootArgv.join(' ')
              }`,
            argv: fullBootArgv,
          });
        });
      });
      wikiInstance.boot.startup({ bootPath: TIDDLYWIKI_PACKAGE_FOLDER });
      /**
       * Install $:/plugins/linonetwo/tidgi instead of +plugins/tiddlywiki/tiddlyweb to speedup (without JSON.parse) and fix http errors when network change.
       */
      const tidgiPlugin = wikiInstance.loadPluginFolder(path.join(EXTRA_TIDGI_PLUGINS_PATH, 'linonetwo/tidgi'));
      if (tidgiPlugin !== null) {
        wikiInstance.wiki.addTiddler(tidgiPlugin);
      }
      // after setWikiInstance, ipc server routes will start serving content
      ipcServerRoutes.setWikiInstance(wikiInstance);
    } catch (error) {
      const message = `Tiddlywiki booted failed with error ${(error as Error).message} ${(error as Error).stack ?? ''}`;
      observer.next({ type: 'control', source: 'try catch', actions: WikiControlActions.error, message, argv: fullBootArgv });
    }
  });
}