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
        'authenticatorSelection': {
            'requireResidentKey': false,
            'authenticatorAttachment': 'cross-platform',
            'userVerification': 'preferred'
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

function Register() {
    console.log("Regsiter event")

    const publicKey = getCredCreationOptions()
    console.log(`publicKey: ${publicKey}`)

    const name = document.getElementById("name").value

    navigator.credentials.create({ publicKey: publicKey }).then(newCredInfo => {
        console.log(`newCredInfo: ${newCredInfo}`)
        const { id, rawId, response, type } = newCredInfo
        console.log(`id: ${id}, rawId: ${rawId}, response: ${response}, type: ${type}`)
        const { attestationObj, clientDataJSON } = response
        console.log(`attestationObj: ${attestationObj}, clientDataJSON: ${clientDataJSON}`)
        ids[name] = rawId

        attestation = CBOR.decode(attestationObj)
        console.log("attestation.decode done")
        attestation.authData = parseAuthData(attestation.authData)
    }).catch(err => {
        alert(err)
    })
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
