import type { CheckoutLocation, CheckoutLocationDataset } from '~/types/checkout'

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
    try {
      const data = await $fetch<CheckoutLocation[]>(`${config.public.apiBase}/locations/provinces`)
      provinces.value = data.map(normaliseLocation)
      return
    } catch {
      const dataset = await loadLocalDataset()
      if (dataset) {
        provinces.value = dataset.provinces.map(normaliseLocation)
        return
      }
      error.value = 'Không thể tải danh sách tỉnh/thành phố.'
    } finally {
      provincesLoading.value = false
    }
  }

  const loadWards = async (provinceCode: string) => {
    const requestId = ++wardRequestId
    wards.value = []
    wardError.value = null
    if (!provinceCode) return
    wardsLoading.value = true
    try {
      const data = await $fetch<CheckoutLocation[]>(`${config.public.apiBase}/locations/provinces/${encodeURIComponent(provinceCode)}/wards`)
      if (requestId === wardRequestId) wards.value = data.map(normaliseLocation)
      return
    } catch {
      const dataset = await loadLocalDataset()
      const province = dataset?.provinces.find(item => item.code === provinceCode)
      if (requestId === wardRequestId && province) {
        wards.value = province.wards.map(normaliseLocation)
        return
      }
      if (requestId === wardRequestId) wardError.value = 'Không thể tải danh sách xã/phường.'
    } finally {
      if (requestId === wardRequestId) wardsLoading.value = false
    }
  }

  const retryProvinces = () => loadProvinces()
  const retryWards = (provinceCode: string) => loadWards(provinceCode)

  return {
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
  }
}

const normaliseLocation = (location: CheckoutLocation): CheckoutLocation => ({
  name: String(location.name ?? ''),
  code: String(location.code ?? ''),
  type: String(location.type ?? ''),
  typename: String(location.typename ?? ''),
  fullname: String(location.fullname ?? location.name ?? ''),
})
