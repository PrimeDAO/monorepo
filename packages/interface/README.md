# The PrimeDAO’s Home for Network Members

This is the [PrimeDAO](primedao.eth.link) web interface enabling interaction with PrimeDAO contracts.

## Technical Description

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).

It is write mostly in Typescript, and is bundled using Webpack.

For more information, go to https://aurelia.io/docs/cli/webpack

## Install
Note this is part of a monorepo.  Install dependencies with the following command:
```
npx lerna bootstrap
```

To add a new dependency:

```
npx lerna add [package name] --scope @primedao/interface
```

## Formatting and Linting

Run `npm run lint` to confirm lint succeeds before git commits.

## Run dev app

Run `npm start`, then open `http://localhost:3300`. Or more simply, run `au run --open`.

You can change the standard webpack configurations from CLI easily with something like this: `npm start -- --open --port 8888`. However, it is better to change the respective npm scripts or `webpack.config.js` with these options, as per your need.

To enable Webpack Bundle Analyzer, do `npm run analyze` (production build).

To enable hot module reload, do `npm start -- --hmr`.

To change dev server port, do `npm start -- --port 8888`.

To change dev server host, do `npm start -- --host 127.0.0.1`

**PS:** You could mix all the flags as well, `npm start -- --host 127.0.0.1 --port 7070 --open --hmr`

For long time aurelia-cli user, you can still use `au run` with those arguments like `au run --env prod --open --hmr`. But `au run` now simply executes `npm start` command.

## Build for production

Run `npm run build`, or the old way `au build --env prod`.

## Unit tests

Run `au test` (or `au jest`).

To run in watch mode, `au test --watch` or `au jest --watch`.

## Deployment

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
