import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { translateText } from '../translation/translationClient'

// onSave(comment) - persists the comment for the currently selected equipment. Must resolve on
// success or throw an Error whose message is already a user-facing translated string.
export default function EquipmentCommentPanel({ selectedItem, onSave }) {
  const { t, i18n } = useTranslation()
  const { authFetch } = useAuth()
  const [commentText, setCommentText] = useState(selectedItem?.comment ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [translatedComment, setTranslatedComment] = useState(null)
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    setCommentText(selectedItem?.comment ?? '')
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id])

  // Read-only translated preview of the ORIGINAL comment - the editable textarea below always
  // shows/edits the raw original text regardless of viewing language, so saving never overwrites
  // it with a machine translation.
  useEffect(() => {
    let cancelled = false
    setTranslatedComment(null)

    const needsTranslation =
      selectedItem && selectedItem.comment && selectedItem.commentLanguage && selectedItem.commentLanguage !== i18n.language

    if (!needsTranslation) return undefined

    setTranslating(true)
    authFetch((token) =>
      translateText(token, {
        text: selectedItem.comment,
        fromLanguageIsoCode: selectedItem.commentLanguage,
        toLanguageIsoCode: i18n.language,
      })
    )
      .then((res) => {
        if (!cancelled) setTranslatedComment(res.translatedText)
      })
      .catch(() => {
        // Translation unavailable/unsupported language pair - the plain "written in X" note
        // below is the fallback, so just leave translatedComment as null.
      })
      .finally(() => {
        if (!cancelled) setTranslating(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id, selectedItem?.commentLanguage, selectedItem?.comment, i18n.language])

  if (!selectedItem) {
    return (
      <div className="equipments-comment-pane">
        <p className="equipments-comment-no-selection">{t('equipment.commentNoSelection')}</p>
      </div>
    )
  }

  const dirty = commentText !== (selectedItem.comment ?? '')

  let languageName = null
  if (selectedItem.commentLanguage && selectedItem.commentLanguage !== i18n.language) {
    try {
      languageName = new Intl.DisplayNames([i18n.language], { type: 'language' }).of(selectedItem.commentLanguage)
    } catch {
      // Intl.DisplayNames couldn't resolve the code - skip the note rather than show a broken label.
    }
  }

  async function handleSave() {
    setError(null)
    setBusy(true)
    try {
      await onSave(commentText)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="equipments-comment-pane">
      <h3>{t('equipment.commentLabel')}</h3>
      {languageName && translating && <p className="equipments-comment-language-note">{t('equipment.translatingStatus')}</p>}
      {languageName && !translating && translatedComment !== null && (
        <div className="equipments-comment-translated">
          <p className="equipments-comment-language-note">{t('equipment.commentTranslatedFromLabel', { language: languageName })}</p>
          <p className="equipments-comment-translated-text">{translatedComment}</p>
        </div>
      )}
      {languageName && !translating && translatedComment === null && (
        <p className="equipments-comment-language-note">{t('equipment.commentWrittenInLabel', { language: languageName })}</p>
      )}
      <textarea
        className="equipments-comment-textarea"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder={t('equipment.commentPlaceholder')}
      />
      {error && <p className="login-error">{error}</p>}
      <div className="equipments-comment-actions">
        <button type="button" className="login-submit" disabled={!dirty || busy} onClick={handleSave}>
          {t('equipment.saveButton')}
        </button>
      </div>
    </div>
  )
}
