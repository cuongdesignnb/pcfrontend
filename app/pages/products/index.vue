<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/san-pham', query: route.query }, { redirectCode: 301 })
</script>
