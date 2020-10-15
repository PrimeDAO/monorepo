// const RightsManager = ('../build/contracts/RightsManager');
// const SmartPoolManager = ('../build/contracts/SmartPoolManager');
// const CRPFactory = ('../build/contracts/CRPFactory');
// const BFactory = ('../build/contracts/BFactory');
// const BalancerSafeMath = ('../build/contracts/BalancerSafeMath');
// const BalancerSafeMathMock = ('../build/contracts/BalancerSafeMathMock');
//
// module.exports = async function (deployer, network, accounts) {
//     await deployer.deploy(BalancerSafeMath);
//     console.log('******* DEPLOYED BALANCERSAFEMATH @: ' + BalancerSafeMath.address + ' *******')
//     await deployer.deploy(RightsManager);
//     await deployer.deploy(SmartPoolManager);
//     await deployer.deploy(BFactory);
//     // await deployer.deploy(BalancerSafeMath);
//     await deployer.deploy(BalancerSafeMathMock);
//     await deployer.deploy(BalancerProxy);
//
//     deployer.link(BalancerSafeMath, CRPFactory);
//     deployer.link(RightsManager, CRPFactory);
//     deployer.link(SmartPoolManager, CRPFactory);
//
//     await deployer.deploy(CRPFactory);
// }
