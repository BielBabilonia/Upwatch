import { useI18n, LOCALES, LOCALE_LABELS, type Locale } from '../../i18n/i18n-context'
import { useTheme, type ThemePreference } from '../../theme/theme-context'
import { MonitorIcon, MoonIcon, SunIcon } from '../ui/icons'
import { SegmentedControl } from '../ui/SegmentedControl'

export function ThemeToggle() {
  const { t } = useI18n()
  const { preference, setPreference } = useTheme()
  return (
    <SegmentedControl<ThemePreference>
      label={t('theme.label')}
      size="sm"
      value={preference}
      onChange={setPreference}
      options={[
        { value: 'system', label: <MonitorIcon />, ariaLabel: t('theme.system') },
        { value: 'light', label: <SunIcon />, ariaLabel: t('theme.light') },
        { value: 'dark', label: <MoonIcon />, ariaLabel: t('theme.dark') },
      ]}
    />
  )
}

export function LanguageToggle() {
  const { t, locale, setLocale } = useI18n()
  return (
    <SegmentedControl<Locale>
      label={t('language.label')}
      size="sm"
      value={locale}
      onChange={setLocale}
      options={LOCALES.map((value) => ({
        value,
        // Visible text is the accessible name (WCAG 2.5.3); the full name is a hint.
        label: value === 'en' ? 'EN' : 'PT',
        title: LOCALE_LABELS[value],
        lang: value,
      }))}
    />
  )
}
