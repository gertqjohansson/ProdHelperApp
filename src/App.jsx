import { useState } from 'react'
import './App.css'
import { callController } from './relayClient'

const TRY1 = {
  controller: 'Oee',
  function: 'Calculate',
  parameters: ['id', 1, 'Start', '2026-07-01', 'end', '2026-07-12']
}

const TRY2 = {
  controller: 'Planner',
  function: 'GetInteruption',
  parameters: ['id', 5, 'Start', '2026-07-01', 'end', '2026-07-12', 'break', 'true']
}

function App() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function callRelay(call) {
    setStatus('sending')
    setError(null)
    setResult(null)
    try {
      const body = await callController(call.controller, call.function, call.parameters)
      setResult({ sent: call, body })
      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="app">
      <h1>ProdHelper</h1>
      <p>Call a controller on the on-prem service straight from the browser via an Azure Relay Hybrid Connection.</p>

      <div className="buttons">
        <button type="button" onClick={() => callRelay(TRY1)} disabled={status === 'sending'}>
          Try1
        </button>
        <button type="button" onClick={() => callRelay(TRY2)} disabled={status === 'sending'}>
          Try2
        </button>
      </div>

      {status === 'sending' && <p className="status">Sending...</p>}

      {result && (
        <div className="panel">
          <h2>Called {result.sent.controller}/{result.sent.function}</h2>
          <pre>{JSON.stringify(result.sent.parameters, null, 2)}</pre>
          <h2>Relay response</h2>
          <pre>{result.body}</pre>
        </div>
      )}

      {error && (
        <div className="panel error">
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
    </div>
  )
}

export default App
