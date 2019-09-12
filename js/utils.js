export function isWebAuthnSupported() {
    return !(window.PublicKeyCredential === undefined &&
        typeof window.PublicKeyCredential !== "function")
}

export function str2bin(string) {
    return Uint8Array.from(string, c => c.charCodeAt(0))
}

