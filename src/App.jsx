import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { callController, RelayError } from './relayClient'
import TopBar from './components/TopBar'
import Footer from './components/Footer'
import Modal from './components/Modal'

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
  const { t } = useTranslation()
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [plannerModalOpen, setPlannerModalOpen] = useState(false)

  async function callRelay(call) {
    setStatus('sending')
    setError(null)
    setResult(null)
    try {
      const body = await callController(call.controller, call.function, call.parameters)
      setResult({ sent: call, body })
      setStatus('done')
    } catch (err) {
      setError(err instanceof RelayError ? t(err.i18nKey, err.i18nParams) : err.message)
      setStatus('error')
    }
  }

  return (
    <div className="page">
      <TopBar onPlannerSelected={() => setPlannerModalOpen(true)} />

      <main className="app">
        <h1>ProdHelper</h1>
        <p>{t('app.description')}</p>

        <div className="buttons">
          <button type="button" onClick={() => callRelay(TRY1)} disabled={status === 'sending'}>
            {t('buttons.try1')}
          </button>
          <button type="button" onClick={() => callRelay(TRY2)} disabled={status === 'sending'}>
            {t('buttons.try2')}
          </button>
        </div>

        {status === 'sending' && <p className="status">{t('status.sending')}</p>}

        {result && (
          <div className="panel">
            <h2>{t('result.calledHeading', { controller: result.sent.controller, function: result.sent.function })}</h2>
            <pre>{JSON.stringify(result.sent.parameters, null, 2)}</pre>
            <h2>{t('result.relayResponseHeading')}</h2>
            <pre>{result.body}</pre>
          </div>
        )}

        {error && (
          <div className="panel error">
            <h2>{t('result.errorHeading')}</h2>
            <pre>{error}</pre>
          </div>
        )}
      </main>

      <Footer />

      {plannerModalOpen && (
        <Modal
          title="Planner"
          message={t('modal.itemSelected', { item: 'Planner' })}
          onClose={() => setPlannerModalOpen(false)}
        />
      )}
    </div>
  )
}

export default App
