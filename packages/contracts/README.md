# PrimeDAO contracts package

> 🤖 PrimeDAO Smart contracts 

## Development

To install node modules

```
npm i
```

To compile contract

```
truffle compile
```

To run tests

```
npm run test
```

To run coverage

```
npm run coverage
```

### Deploy DAO to kovan

prepare `.env` file and add your config variables, it should look as follows:
```
NETWORK=kovan
PROVIDER=https://kovan.infura.io/v3/your-infura-provider-key
KEY=your-private-key
```

deploy external contracts
```
npm run deploy:contracts:kovan
```

### Setup deployed contracts on kovan

create configurable rights pool
```
npm run setup:pool:create:kovan
```

transfer ownership of crpool to dao
```
npm run setup:pool:transfer:kovan
```

initialize staking rewards contract  
```
npm run setup:staking:innit:kovan
```

notify reward amount in staking contract
```
npm run setup:staking:confirm:kovan
```

set up price oracle
```
npm run setup:oracle:kovan
```

## License
```
Copyright 2020 Prime Foundation

Licensed under the GNU General Public License v3.0.
You may obtain a copy of this license at:

  https://www.gnu.org/licenses/gpl-3.0.en.html

```

