import bundledLocationDataset from '~/data/locations.json'
import type { CheckoutLocation, CheckoutLocationDataset } from '~/types/checkout'

type LocationCollectionResponse =
  | CheckoutLocation[]
  | {
      provinces?: CheckoutLocation[]
      wards?: CheckoutLocation[]
    }

const bundledDataset = bundledLocationDataset as unknown as CheckoutLocationDataset

export const useCheckoutLocations = () => {
  const config = useRuntimeConfig()
  const provinces = ref<CheckoutLocation[]>([])
  const wards = ref<CheckoutLocation[]>([])
  const provincesLoading = ref(false)
  const wardsLoading = ref(false)
  const error = ref<string | null>(null)
  const wardError = ref<string | null>(null)
  const localDataset = shallowRef<CheckoutLocationDataset | null>(null)
  let wardRequestId = 0

  const loadLocalDataset = async (): Promise<CheckoutLocationDataset | null> => {
    if (localDataset.value) return localDataset.value

    if (Array.isArray(bundledDataset.provinces)) {
      localDataset.value = bundledDataset
      return localDataset.value
    }

    try {
      const dataset = await $fetch<CheckoutLocationDataset>('/data/locations.json')
      if (Array.isArray(dataset.provinces)) localDataset.value = dataset
    } catch {
      return null
    }
    return localDataset.value
  }

  const loadProvinces = async () => {
    provincesLoading.value = true
    error.value = null

    const dataset = await loadLocalDataset()
    if (dataset) provinces.value = dataset.provinces.map(normaliseLocation)

    try {
      const data = await $fetch<LocationCollectionResponse>(`${config.public.apiBase}/locations/provinces`, {
        timeout: 8000,
      })
      const remoteProvinces = extractLocations(data, 'provinces')
      if (remoteProvinces.length) provinces.value = remoteProvinces.map(normaliseLocation)
    } catch {
      if (!provinces.value.length) error.value = 'Không thể tải danh sách tỉnh/thành phố.'
    } finally {
      provincesLoading.value = false
    }
  }

  const loadWards = async (provinceCode: string) => {
    const requestId = ++wardRequestId
    wards.value = []
    wardError.value = null
    if (!provinceCode) {
      wardsLoading.value = false
      return
    }
    wardsLoading.value = true

    const dataset = await loadLocalDataset()
    const localProvince = dataset?.provinces.find(item => item.code === provinceCode)
    if (requestId === wardRequestId && localProvince) {
      wards.value = localProvince.wards.map(normaliseLocation)
      wardsLoading.value = false
    }

    try {
      const data = await $fetch<LocationCollectionResponse>(`${config.public.apiBase}/locations/provinces/${encodeURIComponent(provinceCode)}/wards`, {
        timeout: 8000,
      })
      const remoteWards = extractLocations(data, 'wards')
      if (requestId === wardRequestId && remoteWards.length) wards.value = remoteWards.map(normaliseLocation)
    } catch {
      if (requestId === wardRequestId && !wards.value.length) wardError.value = 'Không thể tải danh sách xã/phường.'
    } finally {
      if (requestId === wardRequestId) wardsLoading.value = false
    }
  }

  const retryProvinces = () => loadProvinces()
  const retryWards = (provinceCode: string) => loadWards(provinceCode)

  // Expose a reactive object so nested refs are unwrapped for both templates and
  // consumers. Returning a plain object of refs makes `locations.provinces`
  // resolve to the Ref object in templates, which renders blank options and
  // leaves the controls permanently disabled.
  return reactive({
    provinces,
    wards,
    provincesLoading,
    wardsLoading,
    error,
    wardError,
    loadProvinces,
    loadWards,
    retryProvinces,
    retryWards,
  })
}

const extractLocations = (payload: LocationCollectionResponse, key: 'provinces' | 'wards'): CheckoutLocation[] => {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload[key]) ? payload[key] : []
}

const normaliseLocation = (location: CheckoutLocation): CheckoutLocation => ({
  name: String(location.name ?? ''),
  code: String(location.code ?? ''),
  type: String(location.type ?? ''),
  typename: String(location.typename ?? ''),
  fullname: String(location.fullname ?? location.name ?? ''),
})
