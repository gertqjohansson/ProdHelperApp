// Codes match ProdHelperService.AdminApp/SupportedLanguages.cs — keep both lists in sync
// by hand when adding a language, there's no shared codegen across the JS/C# boundary.
//
// Flag SVGs are imported individually (rather than the flag-icons package's bundled CSS,
// which references all ~270 country flags) so the build only ships the 23 actually used.
import flagSe from 'flag-icons/flags/4x3/se.svg'
import flagDk from 'flag-icons/flags/4x3/dk.svg'
import flagNo from 'flag-icons/flags/4x3/no.svg'
import flagFi from 'flag-icons/flags/4x3/fi.svg'
import flagDe from 'flag-icons/flags/4x3/de.svg'
import flagGb from 'flag-icons/flags/4x3/gb.svg'
import flagFr from 'flag-icons/flags/4x3/fr.svg'
import flagIt from 'flag-icons/flags/4x3/it.svg'
import flagEs from 'flag-icons/flags/4x3/es.svg'
import flagPt from 'flag-icons/flags/4x3/pt.svg'
import flagGr from 'flag-icons/flags/4x3/gr.svg'
import flagPl from 'flag-icons/flags/4x3/pl.svg'
import flagCz from 'flag-icons/flags/4x3/cz.svg'
import flagSk from 'flag-icons/flags/4x3/sk.svg'
import flagHu from 'flag-icons/flags/4x3/hu.svg'
import flagBg from 'flag-icons/flags/4x3/bg.svg'
import flagHr from 'flag-icons/flags/4x3/hr.svg'
import flagRs from 'flag-icons/flags/4x3/rs.svg'
import flagSi from 'flag-icons/flags/4x3/si.svg'
import flagLt from 'flag-icons/flags/4x3/lt.svg'
import flagLv from 'flag-icons/flags/4x3/lv.svg'
import flagEe from 'flag-icons/flags/4x3/ee.svg'
import flagAl from 'flag-icons/flags/4x3/al.svg'

// `dateLocale` is a region-qualified BCP-47 tag used only for Intl.DateTimeFormat (the
// footer clock) — kept separate from `code` (the i18next resource key) because bare language
// codes like "en" resolve to ICU's generic (US-biased) date format rather than the region
// implied by the flag shown next to it.
export const SUPPORTED_LANGUAGES = [
  { code: 'sv', nativeName: 'Svenska', flag: flagSe, dateLocale: 'sv-SE' },
  { code: 'da', nativeName: 'Dansk', flag: flagDk, dateLocale: 'da-DK' },
  { code: 'nb', nativeName: 'Norsk (bokmål)', flag: flagNo, dateLocale: 'nb-NO' },
  { code: 'fi', nativeName: 'Suomi', flag: flagFi, dateLocale: 'fi-FI' },
  { code: 'de', nativeName: 'Deutsch', flag: flagDe, dateLocale: 'de-DE' },
  { code: 'en', nativeName: 'English', flag: flagGb, dateLocale: 'en-GB' },
  { code: 'fr', nativeName: 'Français', flag: flagFr, dateLocale: 'fr-FR' },
  { code: 'it', nativeName: 'Italiano', flag: flagIt, dateLocale: 'it-IT' },
  { code: 'es', nativeName: 'Español', flag: flagEs, dateLocale: 'es-ES' },
  { code: 'pt-PT', nativeName: 'Português', flag: flagPt, dateLocale: 'pt-PT' },
  { code: 'el', nativeName: 'Ελληνικά', flag: flagGr, dateLocale: 'el-GR' },
  { code: 'pl', nativeName: 'Polski', flag: flagPl, dateLocale: 'pl-PL' },
  { code: 'cs', nativeName: 'Čeština', flag: flagCz, dateLocale: 'cs-CZ' },
  { code: 'sk', nativeName: 'Slovenčina', flag: flagSk, dateLocale: 'sk-SK' },
  { code: 'hu', nativeName: 'Magyar', flag: flagHu, dateLocale: 'hu-HU' },
  { code: 'bg', nativeName: 'Български', flag: flagBg, dateLocale: 'bg-BG' },
  { code: 'hr', nativeName: 'Hrvatski', flag: flagHr, dateLocale: 'hr-HR' },
  { code: 'sr-Latn', nativeName: 'Srpski (latinica)', flag: flagRs, dateLocale: 'sr-Latn-RS' },
  { code: 'sl', nativeName: 'Slovenščina', flag: flagSi, dateLocale: 'sl-SI' },
  { code: 'lt', nativeName: 'Lietuvių', flag: flagLt, dateLocale: 'lt-LT' },
  { code: 'lv', nativeName: 'Latviešu', flag: flagLv, dateLocale: 'lv-LV' },
  { code: 'et', nativeName: 'Eesti', flag: flagEe, dateLocale: 'et-EE' },
  { code: 'sq', nativeName: 'Shqip', flag: flagAl, dateLocale: 'sq-AL' },
]
