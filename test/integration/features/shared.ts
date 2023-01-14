import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  Given,
  Then,
  When,
  World,
} from '@cucumber/cucumber'
import { assocPath, pipe } from 'ramda'
import WebSocket from 'ws'

import { connect, createIdentity, createSubscription } from './helpers'
import { AppWorker } from '../../../src/app/worker'
import { CacheClient } from '../../../src/@types/cache'
import { DatabaseClient } from '../../../src/@types/base'
import { getCacheClient } from '../../../src/cache/client'
import { getDbClient } from '../../../src/database/client'
import { SettingsStatic } from '../../../src/utils/settings'
import { workerFactory } from '../../../src/factories/worker-factory'

let worker: AppWorker

let dbClient: DatabaseClient
let cacheClient: CacheClient

BeforeAll({ timeout: 6000 }, async function () {
  process.env.RELAY_PORT = '18808'
  cacheClient = getCacheClient()
  dbClient = getDbClient()
  await dbClient.raw('SELECT 1=1')

  const settings = SettingsStatic.createSettings()

  SettingsStatic._settings = pipe(
    assocPath(['limits', 'event', 'createdAt', 'maxPositiveDelta'], 0),
    assocPath(['limits', 'event', 'rateLimits'], []),
  )(settings) as any

  worker = workerFactory()
  worker.run()
})

AfterAll(async function() {
  worker.close(async () => {
    await Promise.all([
      cacheClient.disconnect(),
      dbClient.destroy(),
    ])
  })
})

Before(async function () {
  this.parameters.identities = {}
  this.parameters.subscriptions = {}
  this.parameters.clients = {}
  this.parameters.events = {}
})

After(async function () {
  this.parameters.events = {}
  this.parameters.subscriptions = {}
  for (const ws of Object.values(this.parameters.clients as Record<string, WebSocket>)) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  }
  this.parameters.clients = {}

  const dbClient = getDbClient()

  for (const identity of Object.values(this.parameters.identities as Record<string, { pubkey: string }>)) {
    await dbClient('events').where({ event_pubkey: Buffer.from(identity.pubkey, 'hex') }).del()
  }
  this.parameters.identities = {}
})

Given(/someone called (\w+)/, async function(name: string) {
  const connection = connect(name)
  this.parameters.identities[name] = this.parameters.identities[name] ?? createIdentity(name)
  this.parameters.clients[name] = await connection
  this.parameters.subscriptions[name] = []
  this.parameters.events[name] = []
})

When(/(\w+) subscribes to author (\w+)$/, async function(this: World<Record<string, any>>, from: string, to: string) {
  const ws = this.parameters.clients[from] as WebSocket
  const pubkey = this.parameters.identities[to].pubkey
  const subscription = { name: `test-${Math.random()}`, filters: [{ authors: [pubkey] }] }
  this.parameters.subscriptions[from].push(subscription)

  await createSubscription(ws, subscription.name, subscription.filters)
})

Then(/(\w+) unsubscribes from author \w+/, async function(from: string) {
  const ws = this.parameters.clients[from] as WebSocket
  const subscription = this.parameters.subscriptions[from].pop()
  ws.send(JSON.stringify(['CLOSE', subscription.name]))
})
