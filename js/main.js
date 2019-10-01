import { isWebAuthnSupported, str2bin } from './utils.js'
import { Base64 } from './lib/base64.js'

let ids = {}

function getCredCreationOptions() {
    const name = document.getElementById("name").value
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    document.getElementById("register_challenge").value = Base64.encode(challenge)

    const credentialCreationOptions = {
        'challenge': challenge,
        'rp': {
            'id': 'localhost',
            'name': 'localhost webAuthn learn'
        },
        'user': {
            'id': str2bin(name),
            'name': name,
            'displayName': name
        },
        'pubKeyCredParams': [
            { 'type': 'public-key', 'alg': -7 }
        ],
        'timeout': 60000,
        'attestation': 'direct'

    }
    console.log("getCredCreationOptions done")

    return credentialCreationOptions
}

async function Register() {
    const publicKey = getCredCreationOptions()
    const name = document.getElementById("name").value

    const credential = await navigator.credentials.create({ publicKey: publicKey })
    const {id, rawId, response, type} = credential
    const {attestationObject, clientDataJSON} = response

    const clientData = JSON.parse(
        String.fromCharCode(...new Uint8Array(clientDataJSON))
    )

    if (clientData.type !== "webauthn.create") {
        console.log(`Invalid clientData type: ${clientData.type}`)
        return
    }

    const challenge = document.getElementById("register_challenge").value.replace(/=/g, "")
    if (clientData.challenge !== challenge) {
        console.log(`Incorrect clientData challenge: ${clientData.challenge} !==  ${challenge}`)
        return
    }

    if (clientData.origin !== "http://localhost:8000") {
        console.log(`Invalid clientData origin: ${clientData.origin}`)
        return
    }

    const clientDataHash = sha256(clientDataJSON)
    console.log(clientDataHash)
}

function sha256(target) {
    const SHA_OBJ = new jsSHA("SHA-256", "TEXT")
    SHA_OBJ.update(target)
    return SHA_OBJ.getHash("HEX")
}

document.addEventListener("DOMContentLoaded", () => {
    if (!isWebAuthnSupported()) {
        console.log("WebAuthn not supported... ;-(")
    } else {
        console.log("WebAuthn supported :-)")
    }

    const btn_register = document.getElementById("btn-register")
    btn_register.addEventListener("click", Register)
})
