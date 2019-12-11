'use strict'

export const isWebAuthnSupported = () => {
    return !(window.PublicKeyCredential === undefined &&
        typeof window.PublicKeyCredential !== 'function')
}

export const copyToClipBoard = elm => {
    elm.select()
    elm.setSelectionRange(0, 99999)
    document.execCommand('copy')
    alert('copied!')
}
