var keccak = require('keccak');
var crypto = require('crypto');
var secp256k1 = require('secp256k1');
//var common = require('../util/common');

module.exports = {
	Wallet: Wallet,
}

function Wallet(privateKeyParam) {

	let privateKeyBuffer;

	if (privateKeyParam === undefined) {
		privateKeyBuffer = crypto.randomBytes(32);
	} else {
		if (!Buffer.isBuffer(privateKeyParam)) {
			throw "private key must be buffer";
		} 
		if (privateKeyParam.length != 32) {
			throw "private key must be 32 bytes";
		}
		privateKeyBuffer = Buffer.from(privateKeyParam);
	} 
	// generate random private key if not given
	this.privateKey = Uint8Array.from(privateKeyBuffer);
	this.privateKeyBuffer = privateKeyBuffer;

	let publicKeyBuffer = secp256k1.publicKeyCreate(privateKeyBuffer, false);
  console.log(publicKeyBuffer)
	this.publicKey = Uint8Array.from(publicKeyBuffer);

	// convert public key buffer data to 
	let pubKeyNoPrefixArray = Array.prototype.slice.call(publicKeyBuffer, 1);
	let pubKeyNoPrefixBuffer = Buffer.from(pubKeyNoPrefixArray);

	// hash the public key and slice the result to obtain the address
	let hasher = keccak('keccak256');
	hasher.update(pubKeyNoPrefixBuffer);
	let addressBaseBuffer = hasher.digest();
	let addressArray = Array.prototype.slice.call(addressBaseBuffer, 12);
	let addressBuffer = Buffer.from(addressArray);
	this.address = Uint8Array.from(addressBuffer);

	hasher = keccak('keccak256');
	hasher.update(Buffer.from(publicKeyBuffer));
	let bzzKeyBuffer = hasher.digest();
	this.bzzkey = Uint8Array.from(bzzKeyBuffer);

this.getPublicKey = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.publicKey);
	} else {
		return this.publicKey;
	}
}

this.getAddress = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.address);
	} else {
		return this.address;	
	}
}

this.getBzzKey = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.bzzkey);
	} else {
		return this.bzzkey;
	}
}

this.getPrivateKey = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.privateKey);
	} else {
		return this.privateKey;
	}
}


this.signDigest32 = function(buffer) {
	//if (!Buffer.isBuffer(buffer)) {
		//throw "input to sign must be buffer";
	//} else if (!buffer.length == 32) {
		//throw "input to sign must be buffer length 32";
	//}
 let b = crypto.createHash('sha256').update(buffer, 'utf8').digest()


  let bbb = Uint8Array.from(b)
	return secp256k1.ecdsaSign(bbb, this.privateKeyBuffer);
}


  return this
}






uint8ToHex = function(val) {  
return Buffer.from(val).toString('hex');
}

Wallet.prototype.getPublicKey = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.publicKey);
	} else {
		return this.publicKey;
	}
}

Wallet.prototype.getAddress = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.address);
	} else {
		return this.address;	
	}
}

Wallet.prototype.getBzzKey = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.bzzkey);
	} else {
		return this.bzzkey;
	}
}

Wallet.prototype.getPrivateKey = function(format='hex') {
	if (format == 'hex') {
		return uint8ToHex(this.privateKey);
	} else {
		return this.privateKey;
	}
}


Wallet.prototype.signDigest32 = function(buffer) {
	if (!Buffer.isBuffer(buffer)) {
		throw "input to sign must be buffer";
	} else if (!buffer.length == 32) {
		throw "input to sign must be buffer length 32";
	}
	return secp256k1.sign(buffer, this.privateKeyBuffer);
}


