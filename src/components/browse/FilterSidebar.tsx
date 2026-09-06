import type { ChangeEvent } from "react"
import {
  LOCATION_FILTERS,
  MOTORCYCLE_CATEGORIES,
  type BrowseFilters,
  type LocationFilter,
  type MotorcycleCategory,
} from "../../types/marketplace"
import { Button } from "../ui/Button"
import { categoryLabel, locationLabel, useLanguage } from "../../i18n"

type Props = {
  filters: BrowseFilters
  onChange: (filters: BrowseFilters) => void
  onClear: () => void
  showHeading?: boolean
  idPrefix?: string
}

function FieldLabel({ children }: { children: string }) {
  return <p className="text-ui font-semibold text-navy">{children}</p>
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-meta text-navy-muted">{label}</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-line bg-white px-3 text-ui text-navy placeholder:text-navy-muted/80 focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </label>
  )
}

export function FilterSidebar({
  filters,
  onChange,
  onClear,
  showHeading = true,
  idPrefix = "",
}: Props) {
  const { locale, t } = useLanguage()

  function toggleCategory(category: MotorcycleCategory) {
    const selected = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category]
    onChange({ ...filters, categories: selected })
  }

  function toggleLocation(location: LocationFilter) {
    const selected = filters.locations.includes(location)
      ? filters.locations.filter((item) => item !== location)
      : [...filters.locations, location]
    onChange({ ...filters, locations: selected })
  }

  return (
    <aside className="space-y-5">
      {showHeading ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-ui font-bold text-navy">{t("browse.filters")}</h2>
          <Button variant="text" className="px-0 py-0 text-ui text-brand hover:text-brand-hover" onClick={onClear}>
            {t("browse.clearAll")}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button variant="text" className="px-0 py-0 text-ui text-brand hover:text-brand-hover" onClick={onClear}>
            {t("browse.clearAll")}
          </Button>
        </div>
      )}

      <fieldset>
        <legend className="mb-3">
          <FieldLabel>{t("browse.category")}</FieldLabel>
        </legend>
        <div className="space-y-2.5">
          {MOTORCYCLE_CATEGORIES.map((category) => (
            <label key={category} className="flex cursor-pointer items-center gap-2 text-ui text-navy">
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="size-4 rounded border-line text-brand accent-brand"
              />
              {categoryLabel(locale, category)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3">
          <FieldLabel>{t("browse.price")}</FieldLabel>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id={`${idPrefix}min-price`}
            label={t("browse.minPrice")}
            value={filters.minPrice}
            placeholder="e.g. 50000000"
            onChange={(minPrice) => onChange({ ...filters, minPrice })}
          />
          <NumberField
            id={`${idPrefix}max-price`}
            label={t("browse.maxPrice")}
            value={filters.maxPrice}
            placeholder="e.g. 300000000"
            onChange={(maxPrice) => onChange({ ...filters, maxPrice })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3">
          <FieldLabel>{t("browse.year")}</FieldLabel>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id={`${idPrefix}min-year`}
            label={t("browse.minYear")}
            value={filters.minYear}
            placeholder="e.g. 2016"
            onChange={(minYear) => onChange({ ...filters, minYear })}
          />
          <NumberField
            id={`${idPrefix}max-year`}
            label={t("browse.maxYear")}
            value={filters.maxYear}
            placeholder="e.g. 2024"
            onChange={(maxYear) => onChange({ ...filters, maxYear })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3">
          <FieldLabel>{t("browse.location")}</FieldLabel>
        </legend>
        <div className="space-y-2.5">
          {LOCATION_FILTERS.map((location) => (
            <label key={location} className="flex cursor-pointer items-center gap-2 text-ui text-navy">
              <input
                type="checkbox"
                checked={filters.locations.includes(location)}
                onChange={() => toggleLocation(location)}
                className="size-4 rounded border-line text-brand accent-brand"
              />
              {locationLabel(locale, location)}
            </label>
          ))}
        </div>
      </fieldset>
    </aside>
  )
}
