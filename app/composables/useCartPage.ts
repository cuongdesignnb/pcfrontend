import type { CartItem, CartResponse } from '~/types/cart'

export const useCartPage = () => {
  const cart = useCart()
  const toast = useToast()
  const response = cart.state as Ref<CartResponse>
  const started = ref(false)
  const bulkBusy = ref(false)
  const pendingConfirmation = ref<'bulk' | 'clear' | null>(null)
  const busyItemIds = ref<number[]>([])
  const removingItemIds = ref<number[]>([])
  const pendingQuantities = ref<Record<number, number>>({})
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  const items = computed(() => response.value.items)
  const allSelected = computed(() => items.value.length > 0 && items.value.every(item => item.selected))
  const selectedLineCount = computed(() => response.value.summary.selected_line_count)
  const hasSelected = computed(() => selectedLineCount.value > 0)
  const hasInvalidSelected = computed(() => items.value.some(item => item.selected && !item.inventory.purchasable))
  const canCheckout = computed(() => hasSelected.value && !hasInvalidSelected.value && !cart.loading.value)
  const initialLoading = computed(() => !started.value || (cart.loading.value && items.value.length === 0))
  const hasError = computed(() => started.value && Boolean(cart.error.value) && items.value.length === 0)

  const addId = (target: Ref<number[]>, id: number) => {
    if (!target.value.includes(id)) target.value = [...target.value, id]
  }
  const removeId = (target: Ref<number[]>, id: number) => {
    target.value = target.value.filter(itemId => itemId !== id)
  }
  const clearTimer = (id: number) => {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
  }

  const commitQuantity = async (item: CartItem) => {
    const next = pendingQuantities.value[item.id]
    if (next === undefined) return
    addId(busyItemIds, item.id)
    const success = await cart.updateItem(item.id, next)
    if (! success) {
      toast.add({ title: 'Không thể cập nhật số lượng', description: 'Số lượng có thể đã vượt tồn kho hiện tại.', color: 'error' })
    }
    const updated = { ...pendingQuantities.value }
    delete updated[item.id]
    pendingQuantities.value = updated
    removeId(busyItemIds, item.id)
  }

  const queueQuantity = (item: CartItem, next: number) => {
    const max = item.inventory.max_quantity
    if (next < 1 || next > max || !item.inventory.purchasable || busyItemIds.value.includes(item.id)) return
    pendingQuantities.value = { ...pendingQuantities.value, [item.id]: next }
    clearTimer(item.id)
    timers.set(item.id, setTimeout(() => {
      timers.delete(item.id)
      void commitQuantity(item)
    }, 280))
  }

  const toggleSelected = async (item: CartItem, selected: boolean) => {
    addId(busyItemIds, item.id)
    if (! await cart.setItemSelected(item.id, selected)) {
      toast.add({ title: 'Không thể cập nhật lựa chọn', description: 'Vui lòng thử lại sau.', color: 'error' })
    }
    removeId(busyItemIds, item.id)
  }

  const selectAll = async (selected: boolean) => {
    bulkBusy.value = true
    if (! await cart.selectAll(selected)) {
      toast.add({ title: 'Không thể cập nhật lựa chọn', description: 'Vui lòng thử lại sau.', color: 'error' })
    }
    bulkBusy.value = false
  }

  const removeItem = async (item: CartItem) => {
    clearTimer(item.id)
    const next = { ...pendingQuantities.value }
    delete next[item.id]
    pendingQuantities.value = next
    addId(removingItemIds, item.id)
    if (! await cart.removeItem(item.id)) {
      toast.add({ title: 'Không thể xóa sản phẩm', description: 'Vui lòng thử lại sau.', color: 'error' })
    }
    removeId(removingItemIds, item.id)
  }

  const removeSelected = async () => {
    if (! hasSelected.value || bulkBusy.value) return
    pendingConfirmation.value = 'bulk'
  }

  const clearAll = async () => {
    if (! items.value.length || bulkBusy.value) return
    pendingConfirmation.value = 'clear'
  }

  const cancelConfirmation = () => {
    pendingConfirmation.value = null
  }

  const confirmConfirmation = async () => {
    const action = pendingConfirmation.value
    pendingConfirmation.value = null
    if (! action) return

    bulkBusy.value = true
    const success = action === 'bulk'
      ? await cart.removeItems(items.value.filter(item => item.selected).map(item => item.id))
      : await cart.clearCart()
    if (! success) {
      toast.add({ title: 'Không thể xóa sản phẩm', description: 'Vui lòng thử lại sau.', color: 'error' })
    }
    bulkBusy.value = false
  }

  const start = async () => {
    await cart.fetchCart()
    started.value = true
  }

  const refresh = async () => {
    await cart.fetchCart()
    started.value = true
  }

  const checkout = async () => {
    if (! hasSelected.value) {
      toast.add({ title: 'Chưa chọn sản phẩm', description: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.', color: 'warning' })
      return
    }
    if (hasInvalidSelected.value) {
      toast.add({ title: 'Sản phẩm chưa thể thanh toán', description: 'Bỏ chọn hoặc cập nhật sản phẩm đã hết hàng trước khi tiếp tục.', color: 'warning' })
      return
    }
    await navigateTo('/thanh-toan')
  }

  onBeforeUnmount(() => {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
  })

  return {
    response,
    items,
    started,
    loading: cart.loading,
    error: cart.error,
    initialLoading,
    hasError,
    allSelected,
    selectedLineCount,
    hasSelected,
    hasInvalidSelected,
    canCheckout,
    busyItemIds,
    removingItemIds,
    pendingQuantities,
    bulkBusy,
    start,
    refresh,
    queueQuantity,
    toggleSelected,
    selectAll,
    removeItem,
    removeSelected,
    clearAll,
    pendingConfirmation,
    confirmationOpen: computed({
      get: () => pendingConfirmation.value !== null,
      set: (open: boolean) => { if (! open) cancelConfirmation() },
    }),
    confirmationTitle: computed(() => pendingConfirmation.value === 'clear' ? 'Xóa toàn bộ giỏ hàng?' : 'Xóa sản phẩm đã chọn?'),
    confirmationDescription: computed(() => pendingConfirmation.value === 'clear'
      ? 'Tất cả sản phẩm trong giỏ sẽ bị xóa và không thể hoàn tác.'
      : 'Các sản phẩm đang chọn sẽ bị xóa khỏi giỏ hàng.'),
    cancelConfirmation,
    confirmConfirmation,
    checkout,
  }
}
