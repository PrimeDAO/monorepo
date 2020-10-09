# PrimeDAO Landing-Page

This is the home page of PrimeDAO, accessible at [primedao.eth.link](primedao.eth.link).

## Technical Description

The web page is written in Javascript and Typescript, it uses ReactJS and Webpack.

## Install
Note this is part of a monorepo.  Install dependencies with the following command:
```
npx lerna bootstrap
```
To add a new dependency:

```
npx lerna add [package name] --scope @primedao/landingPage
```

## Test
No front-end tests at the moment.

## Formatting and Linting
- run `npm run lint` to confirm lint succeeds before git commits.

### Local Development

 - Execute `npm run start` , this will start the site in http//:localhost:3200
    
## Deployment

To make the build of the dapp use the command `npm run build`. It will create production build that can be hosted anywhere. We host and support the builds in IPFS and Swarm networks.

### IPFS

The fastest way to deploy the landingpage on ipfs is using Pinata. Make sure you added your Pinata `IPFS_DEPLOY_PINATA__API_KEY` and `IPFS_DEPLOY_PINATA__SECRET_API_KEY` in the .env file and run the following command:

```
npm run ipfs-deploy
```

Alternativly you can follow the installation instructions here https://docs-beta.ipfs.io/how-to/command-line-quick-start/#install-ipfs.

Executables for ipfs-update can be downloaded from https://dist.ipfs.io/#ipfs-update.

The build can be upload to ipfs with the following command:
```
ipfs add -r build
```

### Verification Instructions

To calculate the same ipfs hash used for the application deployed you will need the ENV variables that were used for build. Make
Once you have your ENV variables set you should delete the `node_modules` and `build` folders, run `npm run` to have fresh dependencies installed and at last run `npm run build` to generate a clean build.
Now with the build at your disposal you can calculate the hash of the folder by running `ipfs add -r -n build`.
