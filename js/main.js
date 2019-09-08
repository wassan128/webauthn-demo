import { isWebAuthnSupported } from './utils.js'

function Register() {
    const publicKey = getCredOptions()
    const name = document.getElementyById("name").value

    navigator.credentials.create({ publicKey }).then(newCredInfo => {
        const { id, rawId, resposne, type } = newCredInfo
        const { attestationObj, clientDataJSON } = response
        ids[name] = rawId

        attestation = CBOR.decode(attestationObj)
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
