import { isWebAuthnSupported } from './utils.js'

function Register() {}

document.addEventListener("DOMContentLoaded", () => {
    if (!isWebAuthnSupported()) {
        console.log("WebAuthn not supported... ;-(")
    } else {
        console.log("WebAuthn supported :-)")
    }
})
