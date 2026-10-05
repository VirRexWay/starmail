import { contextBridge, ipcRenderer } from 'electron'
import type { Api } from '@shared/types'

const call =
  (channel: string) =>
  (...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args)

const api: Api = {
  accounts: {
    list: call('accounts:list'),
    add: call('accounts:add'),
    update: call('accounts:update'),
    remove: call('accounts:remove'),
    test: call('accounts:test')
  } as Api['accounts'],
  mail: {
    folders: call('mail:folders'),
    list: call('mail:list'),
    get: call('mail:get'),
    action: call('mail:action'),
    search: call('mail:search'),
    send: call('mail:send'),
    saveAttachment: call('mail:saveAttachment'),
    pickAttachments: call('mail:pickAttachments')
  } as Api['mail'],
  settings: {
    get: call('settings:get'),
    set: call('settings:set')
  } as Api['settings'],
  app: {
    openExternal: call('app:openExternal'),
    notify: call('app:notify'),
    titleBarColor: call('app:titleBarColor')
  } as Api['app']
}

contextBridge.exposeInMainWorld('api', api)
