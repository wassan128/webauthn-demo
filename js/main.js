import { isWebAuthnSupported } from './utils.js'
import { Base64 } from './lib/base64.js'

const getAttestationOptions = () => {
    const name = document.getElementById('username').value
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const user_id = crypto.getRandomValues(new Uint8Array(32))
    document.getElementById('register_challenge').value = Base64.encode(challenge)

    const credentialCreationOptions = {
        'challenge': challenge,
        'rp': {
            'id': 'localhost',
            'name': 'localhost webAuthn learn'
        },
        'user': {
            'id': user_id,
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

const getAssertionOptions = () => {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credentialId = document.getElementById('register_credentialId').value

    const credentialGetOptions = {
        'challenge': challenge,
        'allowCredentials': [{
            'id': new Uint8Array(Base64.decode(credentialId)),
            'type': 'public-key',
            'transports': ['usb', 'ble', 'nfc'],
        }],
        'userVerification': 'discouraged',
        'timeout': 60000,
    }
    return credentialGetOptions
}

const Register = async () =>  {
    const publicKey = getAttestationOptions()

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
    const {fmt, authData, attStmt} = CBOR.decode(attestationObject)
    const rpIdHash = authData.slice(0, 32).reduce((res, x) => res+`0${x.toString(16)}`.slice(-2), '')
    if (rpIdHash !== sha256('localhost')) {
        console.error('Incorrect RP id hash not equal sha256(localhost)')
    }

    const flag = authData[32]
    const [ed, at, uv, up] = [
        (flag & 0x80) >> 7,
        (flag & 0x40) >> 6,
        (flag & 0x04) >> 2,
        flag & 0x01
    ]
    if (uv !== 1) {
        console.warn('UserVerified is not 1')
    }
    if (up !== 1) {
        console.warn('UserPresent is not 1')
    }

    const counter = authData.slice(33, 37)
    const aaguid = authData.slice(37, 53)

    const credentialIdLength = (authData[53] << 8) + authData[54]
    const credentialId = Base64.encode(authData.slice(55, 55 + credentialIdLength))

    document.getElementById('register_credentialId').value = credentialId

    const publicKeyBytes = authData.slice(55 + credentialIdLength)
    const publicKeyObj = CBOR.decode(publicKeyBytes.buffer)

    const parsedAttesatationObject = {
        id,
        rawId: Base64.encode(rawId),
        response: {
            attestationObject: {
                attStmt: {
                    sig: attStmt.sig ? Base64.encode(attStmt.sig) : '',
                    x5c: attStmt.x5c ? Base64.encode(attStmt.x5c[0]) : [],
                },
                authData: {
                    rpIdHash: Base64.encode(rpIdHash),
                    flag: {
                        UP: up,
                        UV: uv,
                        AT: at,
                        ED: ed,
                    },
                    counter: counter[0] + (counter[1] << 1) + (counter[2] << 2) + (counter[3] << 3),
                    aaguid: Base64.encode(aaguid),
                    credentialId: credentialId
                },
                fmt
            },
            clientDataJSON: clientDataJSON
        }
    }
    console.log('attestation Object: ', parsedAttesatationObject)

    document.getElementById('attobj').value = JSON.stringify(parsedAttesatationObject, null, 2)
}

const Authenticate = async () => {
    const publicKey = getAssertionOptions()
    const assertion = await navigator.credentials.get({ publicKey: publicKey })

    console.log(assertion)
    const {id, rawId, response, type} = assertion
    const {authData, clientDataJSON, signature, userHandle} = response

    const parsedAssertionObject = {
        id: id,
        rawId: rawId,
        response: {
        }
    }

    document.getElementById('asrtobj').value = JSON.stringify(parsedAssertionObject, null, 2)
}

const sha256 = (target) => {
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
