import { isWebAuthnSupported } from './utils.js'

function Register() {}

document.addEventListener("DOMContentLoaded", () => {
    if (!isWebAuthnSupported()) {
        console.log("WebAuthn not supported... ;-(")
    } else {
        console.log("WebAuthn supported :-)")
    }

    const btn_register = document.getElementById("btn-register")
    btn_register.addEventListener("click", Register)
})
