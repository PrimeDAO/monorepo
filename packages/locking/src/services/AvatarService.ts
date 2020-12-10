import { Contract } from "ethers";
import { ContractNames, ContractsService } from "services/ContractsService";
import { autoinject } from "aurelia-framework";

@autoinject
export class AvatarService {
  public avatar: Contract | any;
  public reputation: Contract | any;

  constructor(
    private contractsService: ContractsService) {
  }

  public async initialize(): Promise<void> {
    this.avatar = await this.contractsService.getContractFor(ContractNames.Avatar);
    this.reputation = await this.contractsService.getContractAtAddress(
      ContractNames.Reputation,
      await this.avatar.nativeReputation(),
    );
  }
}
