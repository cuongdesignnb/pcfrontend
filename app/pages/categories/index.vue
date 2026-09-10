<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/danh-muc', query: route.query }, { redirectCode: 301 })
</script>
