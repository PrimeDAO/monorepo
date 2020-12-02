# PrimeDAO's friendly module for token holders to generate voting power

This is the [PrimeDAO](primedao.eth.link) web interface enabling token holders to generate voting power in the PrimeDAO.

## Technical Description

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).

It is written mostly in Typescript, and is bundled using Webpack.

For more information, go to https://aurelia.io/docs/cli/webpack

## Install
Note this is part of a monorepo.  Install dependencies at the root of the monorepo with the following command:
```
npx lerna bootstrap
```

Or within this package with:
```
npm ci
```

To add a new dependency to this package, run:

```
npm i [package name] [--save | --save-dev ]
npx lerna boostrap
```
## Import the required contracts

The contract addresses and ABIs originate in the sibling package "contracts".
Whenever you need to update the contract addresses or ABIs, run:

```
npm run fetchContracts
```

## Run dev app

Run `npm start`, then open `http://localhost:3300`.

You can change the standard webpack configurations from CLI easily with something like this: `npm start -- --open --port 8888`. However, it is better to change the respective npm scripts or `webpack.config.js` with these options, as per your need.

To run the Webpack Bundle Analyzer, do `npm run analyze` (production build).

To enable hot module reload, do `npm start -- --hmr`.

To change dev server port, do `npm start -- --port 8888`.

To change dev server host, do `npm start -- --host 127.0.0.1`

**PS:** You could mix all the flags as well, `npm start -- --host 127.0.0.1 --port 7070 --open --hmr`

## Build for production

Run `npm run build`.

## Formatting and Linting

Run `npm run lint` to confirm lint succeeds before git commits.

## Unit tests

Run `npm run test`.

To run in watch mode, `npm run test --watch`.

## Deployment

Make sure you have in your environment (or in a .env file) the following:

```
IPFS_DEPLOY_PINATA__SECRET_API_KEY=
IPFS_DEPLOY_PINATA__API_KEY=
RIVET_ID=
INFURA_ID=
```

To make the build of the dapp use the command `npm run build`. It will create production build that can be hosted anywhere. We host in IPFS.

### IPFS

The fastest way to deploy the site on ipfs is using Pinata. Make sure you added your Pinata `IPFS_DEPLOY_PINATA__API_KEY` and `IPFS_DEPLOY_PINATA__SECRET_API_KEY` in a .env file and run the following command:

```
npm run ipfs-deploy
```

Alternativly you can follow the installation instructions here https://docs-beta.ipfs.io/how-to/command-line-quick-start/#install-ipfs.

Executables for ipfs-update can be downloaded from https://dist.ipfs.io/#ipfs-update.

You can be upload to ipfs using the following command:
```
ipfs add dist -r dist
```

### Verification Instructions

To calculate the same ipfs hash used for the application deployed you will need the ENV variables that were used for build.

Once you have your ENV variables set you should delete the `node_modules` and `dist` folders, run `npm ci` to install fresh dependencies, then run `npm run build` to generate a clean build.

Now with the build at your disposal you can calculate the hash of the folder by running `ipfs add dist -r -n dist`.
