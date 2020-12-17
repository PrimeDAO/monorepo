import { EventAggregator } from "aurelia-event-aggregator";
import { EthereumService, Networks } from "services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { LockService } from "services/LockService";
import { ITransferEvent } from "services/TokenService";
import { BigNumber } from "ethers";
import TransactionsService from "services/TransactionsService";
import { DateService } from "services/DateService";

describe("Events", () => {
  let ethereumService: EthereumService;
  let contractsService: ContractsService;
  let eventAggregator: EventAggregator;
  let transactionsService: TransactionsService;
  let dateService: DateService;

  const getLockingService = () => {
    return new LockService(
      contractsService,
      eventAggregator,
      ethereumService,
      transactionsService,
      dateService,
    );
  };

  const getPrimeToken = () => {
    return contractsService.getContractFor(ContractNames.PRIMETOKEN);
  };

  beforeAll(() => {
    eventAggregator = new EventAggregator();
    transactionsService = new TransactionsService(eventAggregator);
    ethereumService = new EthereumService(eventAggregator);
    ethereumService.initialize(Networks.Kovan);
    contractsService = new ContractsService(eventAggregator, ethereumService);
    dateService = new DateService();
  });

  // beforeEach(() => {
  // });

  //   afterEach(() => component.dispose());
  afterAll(() => {
    ethereumService.dispose();
  });

  it("has readonly provider", () => {
    expect(ethereumService).toBeTruthy();
    expect(ethereumService.readOnlyProvider).toBeTruthy();
  });

  it("has LockingService", () => {
    const lockService = getLockingService();
    expect(lockService).toBeTruthy();
  });

  it("has PRIMEToken", async () => {
    const primeToken = await getPrimeToken();
    expect(primeToken).toBeTruthy();
  });

  it("can get PRIMEToken events", async () => {
    const primeToken = await getPrimeToken();
    const filter = primeToken.filters.Transfer();
    const transfers = await primeToken.queryFilter(filter, 0);
    expect(transfers).toBeTruthy();
    expect(transfers.length).toBeGreaterThan(0);

    const args: ITransferEvent = transfers[0].args;
    expect(args.from).toBeTruthy();
    expect(args.to).toBeTruthy();
    expect(args.value).toBeTruthy();
    expect((args.value as BigNumber)._isBigNumber).toBeTruthy();
  });
});
