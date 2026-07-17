// relayClient.js
//
// Calls the Azure Relay Hybrid Connection listener (ProdHelperService, the
// C# project alongside this app) directly from the browser, using the
// "direct HTTP" invocation method documented here:
// https://learn.microsoft.com/azure/azure-relay/relay-hybrid-connections-protocol
//
// Azure Relay forwards the *entire* path under the Hybrid Connection name to
// the listener, not just the connection name itself. That lets the browser
// call a specific controller/function as if it were a REST API:
//
//   POST https://{namespace}.servicebus.windows.net/{hcName}/{Controller}/{Function}?sb-hc-token={SAS token}
//
// Azure Relay strips the sb-hc-token query parameter, validates it, and if
// valid, forwards the request (full path included) over the existing
// outbound connection that ProdHelperService has open to Azure Relay, which
// routes on Controller/Function itself (see RelayListener.HandleRequest).
//
// The SAS token is scoped to the Hybrid Connection root (namespace + hcName),
// not the full controller/function path — Relay/Service Bus SAS validation
// authorizes any path below the token's signed resource, so one token works
// for every controller.
//
// The request body is sent with Content-Type: text/plain instead of
// application/json. That keeps it a CORS "simple request" (no custom
// headers, one of the three safelisted content types), so the browser never
// sends a preflight OPTIONS request — which the on-prem listener doesn't
// handle. The body is still a valid JSON string; the listener just needs to
// parse it regardless of the declared content type.
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

// Carries an i18next key + interpolation params instead of a fixed English
// message, so callers (this module has no React/i18next dependency of its
// own) can translate it at display time.
export class RelayError extends Error {
  constructor(i18nKey, i18nParams) {
    super(i18nKey)
    this.i18nKey = i18nKey
    this.i18nParams = i18nParams
  }
}

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

// Builds a fully-signed relay URL for any path under the Hybrid Connection
// root (e.g. "Oee/Calculate" or "Auth/Login"), throwing RelayError if the
// four VITE_RELAY_* env vars aren't configured. Shared by callController
// below and by authClient.js, so every caller reaches the on-prem listener
// through the same relay + SAS-token mechanism.
export async function buildRelayRequestUrl(path) {
  if (!RELAY_NAMESPACE || !HYBRID_CONNECTION_NAME || !SAS_KEY_NAME || !SAS_KEY) {
    throw new RelayError('errors.configMissing')
  }

  const hcRoot = `https://${RELAY_NAMESPACE}/${HYBRID_CONNECTION_NAME}`
  const token = await createSasToken(hcRoot, SAS_KEY_NAME, SAS_KEY)

  // Passing the token as a query string parameter avoids a CORS preflight
  // (no custom header is sent), which keeps the on-premises listener simple.
  return `${hcRoot}/${path}?sb-hc-token=${encodeURIComponent(token)}`
}

// Calls a controller/function on the on-prem service through the relay, as
// if it were a REST endpoint, and returns the response body as text.
//
//   callController('Oee', 'Calculate', ['id', 1, 'Start', '2026-07-01', 'end', '2026-07-12'])
//   -> POST {hcRoot}/Oee/Calculate  body: {"Parameters":["id",1,"Start","2026-07-01","end","2026-07-12"]}
export async function callController(controller, functionName, parameters = []) {
  const url = await buildRelayRequestUrl(`${encodeURIComponent(controller)}/${encodeURIComponent(functionName)}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ Parameters: parameters })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new RelayError('errors.httpStatus', { status: res.status, text })
  }

  return await res.text()
}
