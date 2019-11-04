export function isWebAuthnSupported() {
    return !(window.PublicKeyCredential === undefined &&
        typeof window.PublicKeyCredential !== "function")
}

