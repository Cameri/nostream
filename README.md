# [nostr-ts-relay](https://github.com/Cameri/nostr-ts-relay)

<p align="center">
  <a href="https://github.com/Cameri/nostr-ts-relay/issues">
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/Cameri/nostr-ts-relay?style=plastic" />
  </a>
  <a href="https://github.com/Cameri/nostr-ts-relay/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/Cameri/nostr-ts-relay" />
  </a>
  <a href="https://github.com/Cameri/nostr-ts-relay/network">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/Cameri/nostr-ts-relay" />
  </a>
  <a href="https://github.com/Cameri/nostr-ts-relay/blob/main/LICENSE">
    <img alt="GitHub license" src="https://img.shields.io/github/license/Cameri/nostr-ts-relay" />
  </a>
  <a href='https://coveralls.io/github/Cameri/nostr-ts-relay?branch=main'>
    <img  alt='Coverage Status' src='https://coveralls.io/repos/github/Cameri/nostr-ts-relay/badge.svg?branch=main' />
  </a>
  <a href='https://github.com/Cameri/nostr-ts-relay/actions'>
    <img alt='Build status' src='https://github.com/Cameri/nostr-ts-relay/actions/workflows/checks.yml/badge.svg?branch=main&event=push' />
  </a>
</p>

This is a [nostr](https://github.com/fiatjaf/nostr) relay, written in
Typescript.

This implementation is production-ready. See below for supported features.

The project master repository is available on [GitHub](https://github.com/Cameri/nostr-ts-relay).

## Features

NIPs with a relay-specific implementation are listed here.

- [x] NIP-01: Basic protocol flow description
- [x] NIP-02: Contact list and petnames
- [ ] NIP-03: OpenTimestams Attestations for Events
- [x] NIP-04: Encrypted Direct Message
- [x] NIP-09: Event deletion
- [x] NIP-11: Relay information document
- [x] NIP-12: Generic tag queries
- [x] NIP-13: Proof of Work
- [x] NIP-15: End of Stored Events Notice
- [x] NIP-16: Event Treatment
- [x] NIP-22: Event `created_at` Limits
- [x] NIP-26: Delegated Event Signing (DRAFT)

## Requirements

- PostgreSQL
- Node
- Typescript
- Docker (optional, version 20 or higher)

## Quick Start (Docker)

  ```
  npm run docker:compose:up
  ```

## Quick Start (Standalone)

Set the following environment variables:

  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=nostr_ts_relay
  DB_USER=postgres
  DB_PASSWORD=postgres
  ```

Create `nostr_ts_relay` database:

  ```
  $ psql -h $DB_HOST -p $DB_PORT -U $DB_USER -W
  postgres=# create database nostr_ts_relay;
  postgres=# quit
  ```

Install dependencies:

  ```
  npm install -g knex
  npm install
  ```

Run migrations:

  ```
  npm run db:migrate
  ```

Create ~/.nostr folder:

  ```
  mkdir ~/.nostr
  ```

To start in development mode:

  ```
  npm run dev
  ```

Or, start in production mode:

  ```
  npm run start
  ```

## Configuration

You can change the default folder by setting the `NOSTR_CONFIG_DIR` environment variable to a different path.

Run nostr-ts-relay using one of the quick-start guides at least once and `~/.nostr/settings.json` will be created.
Any changes made to the settings file will be read on the next start.

See [CONFIGURATION.md](CONFIGURATION.md) for a detailed explanation of each environment variable and setting.

## Dev Channel

For development discussions, please use the [Nostr Typescript Relay Dev Channel](https://t.me/nostr_ts_relay).

For discussions about the protocol, please feel free to use the [Nostr Telegram Channel](https://t.me/nostr_protocol).

## License

This project is MIT licensed.
