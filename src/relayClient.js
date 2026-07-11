// relayClient.js
//
// Calls an Azure Relay Hybrid Connection listener directly from the browser,
// using the "direct HTTP" invocation method documented here:
// https://learn.microsoft.com/azure/azure-relay/relay-hybrid-connections-protocol
//
// The call is a plain HTTPS GET to:
//   https://{namespace}.servicebus.windows.net/{hcName}?sb-hc-token={SAS token}
//
// Azure Relay strips the sb-hc-token query parameter, validates it, and if
// valid, forwards the request over the existing outbound connection that the
// on-premises listener (RelayService) has open to Azure Relay.
//
// SECURITY NOTE:
// Embedding a Shared Access Key directly in browser-side JavaScript is only
// appropriate for local testing / demos, because anyone who opens the app can
// read the key from the network tab / bundle. For a production deployment,
// put this token-generation logic in a small trusted backend (e.g. an Azure
// Function or an App Service API route) and have the browser call that
// backend instead. The React button would then call your backend, and only
// the backend would hold the Shared Access Key.

const RELAY_NAMESPACE = import.meta.env.VITE_RELAY_NAMESPACE // e.g. myrelayns.servicebus.windows.net
const HYBRID_CONNECTION_NAME = import.meta.env.VITE_HC_NAME // e.g. my-hybrid-connection
const SAS_KEY_NAME = import.meta.env.VITE_SAS_KEY_NAME // e.g. RootManageSharedAccessKey
const SAS_KEY = import.meta.env.VITE_SAS_KEY // the primary/secondary key value

async function hmacSha256Base64(key, data) {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

// Builds a Service Bus / Relay Shared Access Signature (SAS) token.
async function createSasToken(resourceUri, keyName, key, expiryInSeconds = 300) {
  const encodedUri = encodeURIComponent(resourceUri)
  const expiry = Math.floor(Date.now() / 1000) + expiryInSeconds
  const stringToSign = `${encodedUri}\n${expiry}`
  const signature = await hmacSha256Base64(key, stringToSign)
  return `SharedAccessSignature sr=${encodedUri}&sig=${encodeURIComponent(signature)}&se=${expiry}&skn=${keyName}`
}

export async function callRelayService() {
  if (!RELAY_NAMESPACE || !HYBRID_CONNECTION_NAME || !SAS_KEY_NAME || !SAS_KEY) {
    throw new Error(
      'Relay configuration missing. Set VITE_RELAY_NAMESPACE, VITE_HC_NAME, VITE_SAS_KEY_NAME and VITE_SAS_KEY in your .env file.'
    )
  }

  const resourceUri = `https://${RELAY_NAMESPACE}/${HYBRID_CONNECTION_NAME}`
  const token = await createSasToken(resourceUri, SAS_KEY_NAME, SAS_KEY)

  // Passing the token as a query string parameter avoids a CORS preflight
  // (no custom header is sent), which keeps the on-premises listener simple.
  const url = `${resourceUri}?sb-hc-token=${encodeURIComponent(token)}`

  const res = await fetch(url, { method: 'GET' })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Service returned HTTP ${res.status}. ${text}`)
  }

  return await res.text()
}
