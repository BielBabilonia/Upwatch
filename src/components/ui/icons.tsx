import { useId, type ComponentProps } from 'react'

type IconProps = ComponentProps<'svg'>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      {children}
    </svg>
  )
}

export function LogoMark(props: IconProps) {
  // Unique per instance: the logo appears more than once on a page.
  const gradientId = useId()
  return (
    <svg viewBox="0 0 32 32" aria-hidden focusable={false} {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-from)" />
          <stop offset="100%" stopColor="var(--accent-to)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M6 17h5l2.5-6 4 11 3-8 1.5 3H26"
        fill="none"
        stroke="var(--accent-fg)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
)
export const ArrowLeftIcon = (p: IconProps) => <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Icon>
export const ChevronRightIcon = (p: IconProps) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>
export const ExternalLinkIcon = (p: IconProps) => (
  <Icon {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Icon>
)
export const PauseIcon = (p: IconProps) => <Icon {...p}><path d="M9 5v14M15 5v14" /></Icon>
export const PlayIcon = (p: IconProps) => <Icon {...p}><path d="M7 4.5v15l12-7.5z" /></Icon>
export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></Icon>
)
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Icon>
)
export const XIcon = (p: IconProps) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="m5 12 5 5L20 7" /></Icon>
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></Icon>
)
export const SunIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
)
export const MoonIcon = (p: IconProps) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Icon>
export const MonitorIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></Icon>
)
export const GlobeIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></Icon>
)
export const ActivityIcon = (p: IconProps) => <Icon {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Icon>
export const GithubIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} {...p}>
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
  </svg>
)
