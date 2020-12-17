<h1 align="center">
<br>

 <img src="https://i.ibb.co/SwxJNhJ/2020-11-24-17-49-46.jpg" alt="PrimeDAO" width="200">
  <br>
  PrimeDAO monorepo
  <br>
  <br>
</h1>

## Overview

PrimeDAO monorepo is a single repository which hosts multiple packages  providing functionality for PrimeDAO Decentralized Autonomous Organisation.

## Packages

| Package                                | Version | Description                                                                                       |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| [`contracts`](/packages/contracts)     |         | PrimeDAO smart contracts for [liquidity pool](primepool.eth.link) and token locking (coming soon) |
| [`interface`](/packages/interface)     |         | PrimeDAO user interface at [primedao.eth.link](primedao.eth.link)                                 |
| [`landingPage`](/packages/landingPage) |         | PrimeDAO liquidity pool interface at [primepool.eth.link](primepool.eth.link)                     |


## Installation
This is a monorepo using [Lerna](https://github.com/lerna/lerna) to manage packages.  After cloning the monorepo from github, at the repo folder, run the following to install all packages.

```
npm run bootstrap
```

## Contribution Guidelines

*These guidelines presume that you wish to contribute actively to PrimeDAO as a builder, "creating value through labor". If you instead see yourself as an Ambassador to the project, check out the [contribution documentation](https://docs.primedao.io/primedao/call-for-contributors/create-your-first-proposal) to find out more.*

PrimeDAO is built and maintained by a collective of co-contributors, and there are two ways of contributing to its development:

1. Choose one of the active issues tagged with `help wanted` from the PrimeDAO [monorepo repository](https://github.com/PrimeDAO/monorepo/issues) and comment in this issue that you are working on this. Fork the repository when developing, and submit a pull request on completion.  Alternatively, create new functionality in a fork of the repository, and submit a pull request on completion.
2. Using the [proposal template](https://docs.google.com/document/d/1HpemX04E4k7BZwmZyYfnbH6d2K3KhV2YnKWpZShQctY/edit?usp=sharing), submit evidence of your contribution to the DAO, as well as proposed payment via the [Alchemy interface](https://xdai.alchemy.do/dao/0xe3a89ed4956c4f7173418e4dec2a77a5f60807de/plugin/0x09d67b005de1d43ccb79a70a3f21a2f4ba8e1824bd3366b0078ff94d20e6c825). PrimeDAO currently exists on the xDai sidechain, so if it is your first time interacting with this chain you will have to add the [xDai custom RPC](https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup) to your Metamask account, and convert Dai to xDai using the [Token Bridge](https://www.xdaichain.com/for-users/converting-xdai-via-bridge) in order to submit your proposal.

Note that whilst it is possible to submit a proposal prior to any contribution being made, this would necessitate the DAO voting to provide payment up front. Furthermore, it is not necessary to become a member of the DAO in order to submit a proposal. For information on becoming a member, see [here](https://docs.primedao.io/primedao/call-for-contributors/submit-your-first-proposal).

If you wish to contribute, join the [Discord](https://discord.com/invite/x8v59pG) and introduce yourself in `#🤝-contribute`, or check out the [Telegram](https://t.me/primedao) channel. Before posting please also check the [code of conduct](https://docs.primedao.io/primedao/code-of-conduct).
