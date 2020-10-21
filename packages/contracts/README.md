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

To deploy DAO to rinkeby:

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

To deploy DAO to kovan:

prepare env vars
```
export NETWORK=`kovan`
export PROVIDER=`your-infura-provider`
export KEY=`your-private-key`
```

deploy dapp to kovan
```
npm run deploy:dapp:kovan
```

deploy dao to kovan
```
npm run deploy:dao:kovan
```
