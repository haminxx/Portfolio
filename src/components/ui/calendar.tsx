import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon } from 'lucide-react'
import type * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { ClassNames, CustomComponents, DayPickerProps, Formatters } from 'react-day-picker'

const buttonClassNames =
  "relative flex size-(--cell-size) text-base sm:text-sm items-center justify-center rounded-lg text-foreground not-in-data-selected:hover:bg-accent disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"

const defaultClassNames = {
  root: cn('rdp-root', 'w-fit border-0 bg-transparent p-0 shadow-none'),
  chevron: '',
  months: 'relative flex flex-col sm:flex-row gap-2',
  month: 'w-full',
  month_caption:
    'relative mx-(--cell-size) px-1 mb-1 flex h-(--cell-size) items-center justify-center z-2',
  caption_label:
    'text-base sm:text-sm font-medium flex items-center gap-2 h-full text-foreground',
  nav: 'absolute top-0 flex w-full justify-between z-1',
  button_previous: buttonClassNames,
  button_next: buttonClassNames,
  month_grid: '',
  weekdays: '',
  weekday:
    'size-(--cell-size) p-0 text-xs font-medium text-muted-foreground/72',
  weeks: '',
  week: '',
  day: 'size-(--cell-size) text-sm py-px',
  day_button: cn(
    buttonClassNames,
    "in-data-disabled:pointer-events-none in-[.range-middle]:rounded-none in-[.range-end:not(.range-start)]:rounded-s-none in-[.range-start:not(.range-end)]:rounded-e-none in-[.range-middle]:in-data-selected:bg-accent in-data-selected:bg-primary in-[.range-middle]:in-data-selected:text-foreground in-data-disabled:text-muted-foreground/72 in-data-outside:text-muted-foreground/72 in-data-selected:in-data-outside:text-primary-foreground in-data-selected:text-primary-foreground in-data-disabled:line-through outline-none in-[[data-selected]:not(.range-middle)]:transition-[color,background-color,border-radius,box-shadow] focus-visible:z-1 focus-visible:ring-[3px] focus-visible:ring-ring/50",
  ),
  dropdowns:
    'w-full flex items-center text-base sm:text-sm justify-center h-(--cell-size) gap-1.5 *:[span]:font-medium',
  dropdown_root:
    "relative has-focus:border-ring has-focus:ring-ring/50 has-focus:ring-[3px] border border-input shadow-xs/5 rounded-lg px-[calc(--spacing(3)-1px)] h-9 sm:h-8 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-me-1",
  dropdown: 'absolute bg-popover inset-0 opacity-0',
  months_dropdown: '',
  years_dropdown: '',
  week_number_header: '',
  week_number:
    'size-(--cell-size) p-0 text-xs font-medium text-muted-foreground/72',
  footer: '',
  outside:
    'text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground',
  disabled: '',
  hidden: 'invisible',
  focused: '',
  /* Today styling is handled in DesktopWidgets.css (white tile + dot). */
  today: '',
  selected: '',
  range_start: 'range-start',
  range_middle: 'range-middle',
  range_end: 'range-end',
  weeks_before_enter: '',
  weeks_before_exit: '',
  weeks_after_enter: '',
  weeks_after_exit: '',
  caption_after_enter: '',
  caption_after_exit: '',
  caption_before_enter: '',
  caption_before_exit: '',
} satisfies ClassNames

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  mode = 'single',
  ...props
}: DayPickerProps): React.ReactElement {
  const mergedClassNames = (Object.keys(defaultClassNames) as (keyof ClassNames)[]).reduce(
    (acc, key) => {
      const userClass = classNames?.[key]
      const baseClass = defaultClassNames[key]
      acc[key] = userClass ? cn(baseClass, userClass) : baseClass
      return acc
    },
    { ...defaultClassNames } as ClassNames,
  )

  const defaultComponents: Partial<CustomComponents> = {
    Chevron: ({
      className: chClass,
      orientation,
      ...rest
    }: {
      className?: string
      orientation?: 'left' | 'right' | 'up' | 'down'
    }): React.ReactElement => {
      if (orientation === 'left') {
        return (
          <ChevronLeftIcon className={cn(chClass, 'rtl:rotate-180')} {...rest} aria-hidden="true" />
        )
      }
      if (orientation === 'right') {
        return (
          <ChevronRightIcon className={cn(chClass, 'rtl:rotate-180')} {...rest} aria-hidden="true" />
        )
      }
      return <ChevronsUpDownIcon className={chClass} {...rest} aria-hidden="true" />
    },
  }

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  }

  const formatters: Partial<Formatters> = {
    formatMonthDropdown: (date: Date) => date.toLocaleString('default', { month: 'short' }),
    ...props.formatters,
  }

  return (
    <DayPicker
      {...props}
      data-slot="calendar"
      className={cn(
        'w-full max-w-full [--cell-size:1.65rem] sm:[--cell-size:1.65rem]',
        className,
      )}
      classNames={mergedClassNames}
      components={mergedComponents}
      formatters={formatters}
      mode={mode}
      showOutsideDays={showOutsideDays}
    />
  )
}
