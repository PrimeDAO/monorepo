# PrimeDAO contracts package

## Development

To compile contract

```
truffle compile
```


To run unit tests

```
npm run test
```

### Deploy DAO to rinkeby:

prepare env vars
```
export NETWORK=`rinkeby`
export PROVIDER=`your-infura-provider`
export KEY=`your-private-key`
```

deploy dapp to rinkeby
```
npm run deploy:dapp:rinkeby
```

deploy dao to rinkeby
```
npm run deploy:dao:rinkeby
```

### Deploy DAO to kovan:

prepare env vars
```
export NETWORK=`kovan`
export PROVIDER=`your-infura-provider`
export KEY=`your-private-key`
```

deploy dapp to rinkeby
```
npm run deploy:dapp:kovan
```

### Setup deployed contracts on kovan:
set up price oracle
```
npm run setup:oracle:kovan
```

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
