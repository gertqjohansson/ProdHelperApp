import { useState } from 'react'
import { callRelayService } from './relayClient'

function App() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  const handleClick = async () => {
    setStatus('loading')
    setMessage('')
    try {
      const result = await callRelayService()
      setMessage(result)
      setStatus('success')
    } catch (err) {
      setMessage(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Azure Relay Demo</h1>
        <p className="subtitle">
          Pressing the button calls a local .NET service through an Azure
          Relay Hybrid Connection.
        </p>

        <button
          className="try-me-button"
          onClick={handleClick}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Calling service…' : 'Try Me'}
        </button>

        {status === 'success' && (
          <pre className="result result-success">{message}</pre>
        )}
        {status === 'error' && (
          <pre className="result result-error">Error: {message}</pre>
        )}
      </div>
    </div>
  )
}

export default App
