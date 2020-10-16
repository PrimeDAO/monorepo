const fs = require('fs-extra');
const { exit } = require("process");

const srcPath = "../contracts/build/contracts";
const destPath = "./src/contracts";

if (!fs.existsSync(srcPath)) {
  console.error(`${srcPath} does not exist`);
  exit(1);
}

fs.ensureDirSync(destPath);
fs.emptyDirSync(destPath);
fs.copySync(srcPath, destPath,
  {
    preserveTimestamps: true
  });

exit(0);
