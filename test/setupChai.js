//this file contains all plugins or common elemtns we use in testing process
"use strict"
var chai = require("chai");
var BN = web3.utils.BN;
var chaiBN = require("chai-bn")(BN);
chai.use(chaiBN);

var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

module.exports = chai;
