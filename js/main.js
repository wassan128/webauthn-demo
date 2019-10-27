import { isWebAuthnSupported, str2bin } from './utils.js'
import { Base64 } from './lib/base64.js'

function getAssertionOptions() {
    const name = document.getElementById('name').value
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    document.getElementById('register_challenge').value = Base64.encode(challenge)

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
        'authenticatorSelection': {
            'userVerification': 'discouraged'
        },
        'attestation': 'direct'

    }

    return credentialCreationOptions
}

async function Register() {
    const publicKey = getAssertionOptions()

    const credential = await navigator.credentials.create({ publicKey: publicKey })
    const {id, rawId, response, type} = credential
    const {attestationObject, clientDataJSON} = response

    const clientData = JSON.parse(
        String.fromCharCode(...new Uint8Array(clientDataJSON))
    )

    if (clientData.type !== 'webauthn.create') {
        console.error(`Invalid clientData type: ${clientData.type}`)
        return
    }

    const challenge = document.getElementById('register_challenge').value.replace(/=/g, '')
    if (clientData.challenge !== challenge) {
        console.error(`Incorrect clientData challenge: ${clientData.challenge} !==  ${challenge}`)
        return
    }

    if (clientData.origin !== 'http://localhost:8000') {
        console.error(`Invalid clientData origin: ${clientData.origin}`)
        return
    }

    const clientDataHash = sha256(clientDataJSON)
    console.log(clientDataHash)

    const {fmt, authData, attStmt} = CBOR.decode(attestationObject)
    console.log(fmt, authData, attStmt)

    const rpIdHash = authData.slice(0, 32).reduce((res, x) => res+`0${x.toString(16)}`.slice(-2), '')
    if (rpIdHash !== sha256('localhost')) {
        console.error('Incorrect RP id hash not equal sha256(localhost)')
    }

    const [uv, up] = [authData[32] & 0x04, authData[32] & 0x01]
    if (uv !== 1) {
        console.warn('UserVerified is not 1')
    }
    if (up !== 1) {
        console.warn('UserPresent is not 1')
    }

    const counter = authData.slice(33, 37)
    console.log('counter: ', new Uint8Array(counter))

    const aaguid = authData.slice(37, 53)
    console.log(aaguid)

    const credentialIdLength = (authData[53] << 8) + authData[54]
    const credentialId = Base64.encode(authData.slice(55, 55 + credentialIdLength))

    document.getElementById('register_credentialId').value = credentialId

    const publicKeyBytes = authData.slice(55 + credentialIdLength)
    const publicKeyObj = CBOR.decode(publicKeyBytes.buffer)
    console.log(publicKeyObj)
}

async function Authenticate() {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credentialId = document.getElementById('register_credentialId').value
    const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
            id: Uint8Array.from(credentialId, c => c.charCodeAt(0)),
            type: 'public-key',
            transports: ['usb', 'ble', 'nfc'],
        }],
        userVerification: 'discouraged',
        timeout: 60000,
    }
    const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
    })

    console.log(assertion)
}

function sha256(target) {
    const SHA_OBJ = new jsSHA('SHA-256', 'TEXT')
    SHA_OBJ.update(target)
    return SHA_OBJ.getHash('HEX')
}

document.addEventListener('DOMContentLoaded', () => {
    if (!isWebAuthnSupported()) {
        console.error('WebAuthn not supported... ;-(')
    } else {
        console.info('WebAuthn supported :-)')
    }

    const btn_register = document.getElementById('btn-register')
    btn_register.addEventListener('click', Register)

    const btn_login = document.getElementById('btn-login')
    btn_login.addEventListener('click', Authenticate)
})
