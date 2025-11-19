<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label?: string;
  icon?: string;
  iconPos?: 'left' | 'right';
  severity?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'help';
  size?: 'small' | 'normal' | 'large';
  variant?: 'text' | 'outlined';
  rounded?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  iconPos: 'left',
  severity: 'primary',
  size: 'normal',
  rounded: false,
  disabled: false,
  loading: false,
});

const buttonClasses = computed(() => [
  'p-button',
  `p-button-${props.severity}`,
  `p-button-${props.size}`,
  {
    'p-button-outlined': props.variant === 'outlined',
    'p-button-text': props.variant === 'text',
    'p-button-rounded': props.rounded,
    'p-button-icon-only': !props.label && props.icon,
    'p-button-loading': props.loading,
  },
]);

const iconClass = computed(() => {
  const classes = ['p-button-icon'];
  if (props.iconPos === 'left') classes.push('p-button-icon-left');
  if (props.iconPos === 'right') classes.push('p-button-icon-right');
  return classes.join(' ');
});
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    type="button"
  >
    <i v-if="loading" class="pi pi-spinner pi-spin p-button-icon p-button-icon-left"></i>
    <i v-else-if="icon && iconPos === 'left'" :class="[icon, iconClass]"></i>
    <span v-if="label" class="p-button-label">{{ label }}</span>
    <i v-if="icon && iconPos === 'right' && !loading" :class="[icon, iconClass]"></i>
    <slot />
  </button>
</template>

<style scoped>
.p-button {
  --btn-bg: var(--bgColor-inset);
  --btn-text: var(--fgColor-default);
  --btn-border: var(--button-default-borderColor-rest);

  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  padding: 0.625rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;

  border-radius: 6px;
  border: 1px solid var(--btn-border);
  background-color: var(--btn-bg);
  color: var(--btn-text);
  cursor: pointer;
  user-select: none;

  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.p-button-label {
  margin-bottom: 1px;
}

.p-button:focus-visible {
  outline: 2px solid var(--btn-border);
  outline-offset: 2px;
}

.p-button:hover:not(:disabled) {
  filter: brightness(90%);
}

.p-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sizes */
.p-button-small {
  font-size: 0.85rem;
}

.p-button-large {
  font-size: 1rem;
}

/* =========================================
 * Severity Classes
 * =========================================
 */
.p-button-primary {
  --btn-bg: var(--fgColor-default);
  --btn-text: var(--bgColor-inset);
  --btn-border: var(--fgColor-default);
}

.p-button-secondary {
  --btn-bg: var(--control-bgColor-rest);
  --btn-text: var(--fgColor-default);
  --btn-border: var(--control-bgColor-rest);
}

.p-button-success {
  --btn-bg: var(--color-ansi-green-bright);
  --btn-text: var(--fgColor-onEmphasis);
  --btn-border: var(--color-ansi-green-bright);
}

.p-button-info {
  --btn-bg: var(--data-blue-color-emphasis);
  --btn-text: var(--fgColor-onEmphasis);
  --btn-border: var(--data-blue-color-emphasis);
}

.p-button-warning {
  --btn-bg: var(--progressBar-bgColor-severe);
  --btn-text: var(--fgColor-onEmphasis);
  --btn-border: var(--progressBar-bgColor-severe);
}

.p-button-help {
  --btn-bg: var(--data-purple-color-emphasis);
  --btn-text: var(--fgColor-onEmphasis);
  --btn-border: var(--data-purple-color-emphasis);
}

.p-button-danger {
  --btn-bg: var(--display-red-scale-5);
  --btn-text: var(--fgColor-onEmphasis);
  --btn-border: var(--display-red-scale-5);
}

/* =========================================
 * Variant Styles
 * (These OVERRIDE the base styles)
 * =========================================
 */

/* --- Outlined Variant --- */
.p-button-outlined {
  background-color: transparent;
  color: var(--btn-border);
  border-color: var(--borderColor-default);
}

.p-button-outlined:hover:not(:disabled) {
  filter: none;
  background-color: var(--bgColor-inset);
}

.p-button-outlined.p-button-secondary {
  background-color: transparent;
  color: var(--fgColor-muted);
  border-color: var(--borderColor-default);
}

.p-button-outlined.p-button-secondary:hover:not(:disabled) {
  filter: none;
  background-color: var(--bgColor-muted);
  color: var(--fgColor-muted);
}

.p-button-outlined.p-button-success {
  background-color: transparent;
  color: var(--color-ansi-green-bright);
  border-color: var(--display-green-scale-2);
}

.p-button-outlined.p-button-success:hover:not(:disabled) {
  filter: none;
  background-color: rgb(from var(--display-green-scale-0) r g b / 0.4);
}

.p-button-outlined.p-button-info {
  background-color: transparent;
  color: var(--data-blue-color-emphasis);
  border-color: var(--display-blue-scale-2);
}

.p-button-outlined.p-button-info:hover:not(:disabled) {
  filter: none;
  background-color: rgb(from var(--display-blue-scale-0) r g b / 0.4);
}

.p-button-outlined.p-button-warning {
  background-color: transparent;
  color: var(--progressBar-bgColor-severe);
  border-color: var(--display-orange-scale-3);
}

.p-button-outlined.p-button-warning:hover:not(:disabled) {
  filter: none;
  background-color: rgb(from var(--display-orange-scale-0) r g b / 0.4);
}

.p-button-outlined.p-button-help {
  background-color: transparent;
  color: var(--data-purple-color-emphasis);
  border-color: var(--display-purple-scale-2);
}

.p-button-outlined.p-button-help:hover:not(:disabled) {
  filter: none;
  background-color: rgb(from var(--display-purple-scale-0) r g b / 0.4);
}

.p-button-outlined.p-button-danger {
  background-color: transparent;
  color: var(--display-red-scale-5);
  border-color: var(--display-red-scale-2);
}

.p-button-outlined.p-button-danger:hover:not(:disabled) {
  filter: none;
  background-color: rgb(from var(--display-red-scale-0) r g b / 0.4);
}

/* --- Text Variant --- */
.p-button-text {
  background-color: transparent;
  border-color: transparent;
  color: var(--btn-bg);
}

.p-button-text:hover:not(:disabled) {
  filter: none;
  background-color: rgba(from var(--btn-bg) r g b / 0.1);
  color: var(--btn-bg);
}

.p-button-text.p-button-primary {
  background-color: transparent;
  border-color: transparent;
  color: var(--btn-bg);
}

.p-button-text.p-button-primary:hover:not(:disabled) {
  filter: none;
  background-color: var(--bgColor-inset);
  color: var(--btn-bg);
}

.p-button-text.p-button-secondary {
  background-color: transparent;
  border-color: transparent;
  color: var(--fgColor-muted);
}

.p-button-text.p-button-secondary:hover:not(:disabled) {
  filter: none;
  background-color: var(--bgColor-muted);
  color: var(--fgColor-muted);
}

/* =========================================
 * Icon & Label Styles
 * =========================================
 */
.p-button-icon-only {
  padding: 10px;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
}

.p-button-icon-only .p-button-icon {
  margin: 0;
}

.p-button-icon-only.p-button-small {
  padding: 8px;
}

.p-button-icon-only.p-button-large {
  padding: 12px;
}

/* Rounded - Applicable to all button types */
.p-button-rounded {
  border-radius: 9999px;
}

/* Loading */
.p-button-loading {
  position: relative;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pi-spin {
  animation: spin 1s linear infinite;
}
</style>
