export class Utils {
  public static sleep(milliseconds: number): Promise<any> {
    return new Promise((resolve: () => void): any => setTimeout(resolve, milliseconds));
  }

  public static smallHexString(str: string): string {
    if (!str) {
      return "";
    }
    const len = str.length;
    return `${str.slice(0, 6)}...${str.slice(len - 5, len - 1)}`;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  // public static getObjectKeys(obj: any): Array<string> {
  //   const temp = [];
  //   for (const prop in obj) {
  //     if (obj.hasOwnProperty(prop)) {
  //       temp.push(prop);
  //     }
  //   }
  //   return temp;
  // }

  /**
   * Returns the last mined block in the chain.
   */
  // public static async lastBlockDate(web3: Web3): Promise<Date> {
  //   let block;
  //   do {
  //     block = await (Promise as any).promisify((callback: any): any =>
  //       web3.eth.getBlock("latest", callback))() as BlockWithoutTransactionData;
  //   }
  //   while (!block);

  //   return new Date(block.timestamp * 1000);
  // }

  /**
   * run a timer after a count of milliseconds greater than the 32-bit max that chrome can handle
   * @param date
   * @param func
   */
  // public static runTimerAtDate(date: Date, func: () => void): void {
  //   const now = (new Date()).getTime();
  //   const then = date.getTime();
  //   const diff = Math.max((then - now), 0);
  //   if (diff > 0x7FFFFFFF) { // setTimeout limit is MAX_INT32=(2^31-1)
  //     setTimeout(() => { Utils.runTimerAtDate(date, func); }, 0x7FFFFFFF);
  //   } else {
  //     setTimeout(func, diff);
  //   }
  // }
}
