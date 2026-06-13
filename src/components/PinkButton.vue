<script setup>
// 原生 button 封装的粉色按钮，替代项目里 type="primary" 的 el-button
// 放在 src/components 下，配合 unplugin-vue-components 自动全局可用 <PinkButton>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  icon: { type: [Object, Function], default: null }, // 图标组件，如 Edit
  loading: { type: Boolean, default: false }, // 加载态（图标旋转 + 禁用）
  disabled: { type: Boolean, default: false }, // 禁用
  plain: { type: Boolean, default: false }, // 朴素（浅底粉字，悬浮填充）
  circle: { type: Boolean, default: false }, // 圆形（图标按钮）
  round: { type: Boolean, default: false }, // 圆角胶囊
  size: { type: String, default: 'default' }, // large | default | small
  nativeType: { type: String, default: 'button' } // 原生 type
})
// 不额外 emit click：单根原生 button，父级 @click 会自动透传到它
</script>

<template>
  <button
    class="pink-btn"
    :class="[
      `pink-btn--${size}`,
      {
        'is-plain': plain,
        'is-circle': circle,
        'is-round': round,
        'is-loading': loading,
        'is-disabled': disabled
      }
    ]"
    :type="nativeType"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="pink-btn__icon is-spin"><Loading /></span>
    <span v-else-if="icon" class="pink-btn__icon"><component :is="icon" /></span>
    <span v-if="$slots.default" class="pink-btn__text"><slot /></span>
  </button>
</template>

<style scoped>
.pink-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--bili-gradient);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease,
    background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.pink-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(251, 114, 153, 0.4);
  opacity: 0.95;
}
.pink-btn:active {
  transform: translateY(0);
}
.pink-btn:focus,
.pink-btn:focus-visible {
  outline: none;
}

/* 尺寸 */
.pink-btn--large {
  height: 40px;
  padding: 0 20px;
  font-size: 16px;
}
.pink-btn--small {
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
}

/* 朴素：浅粉底 + 粉字 + 粉边，悬浮变为实心渐变 */
.pink-btn.is-plain {
  background: var(--el-color-primary-light-9);
  color: var(--bili-pink);
  border-color: var(--el-color-primary-light-5);
}
.pink-btn.is-plain:hover {
  background: var(--bili-gradient);
  color: #fff;
  border-color: transparent;
}

/* 胶囊 / 圆形 */
.pink-btn.is-round {
  border-radius: 999px;
}
.pink-btn.is-circle {
  width: 32px;
  padding: 0;
  border-radius: 50%;
}
.pink-btn--large.is-circle {
  width: 40px;
}
.pink-btn--small.is-circle {
  width: 28px;
}

/* 禁用 / 加载 */
.pink-btn.is-disabled,
.pink-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.pink-btn.is-disabled:hover,
.pink-btn:disabled:hover {
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 图标 */
.pink-btn__icon {
  display: inline-flex;
  align-items: center;
}
.pink-btn__icon :deep(svg) {
  width: 1em;
  height: 1em;
}
.pink-btn.is-circle .pink-btn__icon :deep(svg) {
  width: 1.15em;
  height: 1.15em;
}
.pink-btn__icon.is-spin :deep(svg) {
  animation: pink-btn-spin 1s linear infinite;
}
@keyframes pink-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
