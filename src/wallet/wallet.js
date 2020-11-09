var keccak = require('keccak');
var crypto = require('crypto');
const secp256k1 = require('secp256k1-native')

module.exports = {
	Wallet: Wallet,
}

function Wallet() {
	var signCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_SIGN)
	let seckey
	do {
		seckey = crypto.randomBytes(32)
	} while (!secp256k1.secp256k1_ec_seckey_verify(signCtx, seckey))

	const pubkey = Buffer.alloc(64)
	signCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_SIGN)
	secp256k1.secp256k1_ec_pubkey_create(signCtx, pubkey, seckey)
	const pubK = Buffer.alloc(65)
	secp256k1.secp256k1_ec_pubkey_serialize(signCtx, pubK, pubkey, secp256k1.secp256k1_ec_UNCOMPRESSED)
	this.privateKey = seckey;
	this.publicKey = pubkey

	hasher = keccak('keccak256');
	hasher.update(Buffer.from(this.publicKey));

	let overlay = hasher.digest();
	this.overlay = Uint8Array.from(overlay);

	this.getPublicKey = function () {
		return this.publicKey;
	}

	this.getOverlay = function () {
		return this.overlay;
	}

	this.getPrivateKey = function () {
		return this.privateKey;
	}

	this.signDigest32 = function (buffer) {
		let b = crypto.createHash('sha256').update(buffer,'utf-8').digest()
		let signCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_SIGN)
		let output = Buffer.alloc(secp256k1.secp256k1_ecdsa_recoverable_SIGBYTES)
		secp256k1.secp256k1_ecdsa_sign_recoverable(signCtx, output, b, this.privateKey)
    console.log(output)
    let v1 = output[output.length]
    let v2 = output[0]
    output[0]=v1
    output[output.length]=v2
    console.log(output)

    return output
	}
	return this
}
