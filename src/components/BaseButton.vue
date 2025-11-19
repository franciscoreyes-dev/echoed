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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 7px 10px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  line-height: 1.5;
  user-select: none;
}

.p-button-label {
  margin-bottom: 1px;
}

.p-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Sizes */
.p-button-small {
  font-size: 0.875rem;
}

.p-button-large {
  font-size: 1.125rem;
}

/* Primary - White text with dark background */
.p-button-primary:not(.p-button-text):not(.p-button-outlined) {
  background: var(--bgColor-emphasis, #3d444d);
  color: var(--fgColor-default), #ffffff;
  border-color: var(--bgColor-emphasis, #3d444d);
}

.p-button-primary:not(.p-button-text):not(.p-button-outlined):hover:not(:disabled) {
  background: var(--bgColor-neutral-emphasis, #656c76);
  border-color: var(--bgColor-neutral-emphasis, #656c76);
}

.p-button-primary:not(.p-button-text):not(.p-button-outlined):active:not(:disabled) {
  background: var(--borderColor-emphasis, #656c76);
  border-color: var(--borderColor-emphasis, #656c76);
}

/* Secondary - Dark text with light grey background */
.p-button-secondary:not(.p-button-text):not(.p-button-outlined) {
  background: var(--bgColor-muted, #f6f8fa);
  color: var(--fgColor-default, #1f2328);
  border-color: var(--borderColor-default, #d1d9e0);
}

.p-button-secondary:not(.p-button-text):not(.p-button-outlined):hover:not(:disabled) {
  background: var(--bgColor-emphasis, #eaeef2);
  border-color: var(--borderColor-emphasis, #8c959f);
}

/* Success */
.p-button-success {
  background: var(--bgColor-success-emphasis, #238636);
  color: var(--fgColor-default, #ffffff);
  border-color: var(--bgColor-success-emphasis, #238636);
}

.p-button-success:hover:not(:disabled) {
  opacity: 0.9;
}

/* Danger */
.p-button-danger {
  background: var(--bgColor-danger-emphasis, #da3633);
  color: var(--fgColor-default, #ffffff);
  border-color: var(--bgColor-danger-emphasis, #da3633);
}

.p-button-danger:hover:not(:disabled) {
  background: var(--button-danger-bgColor-hover, #b62324);
  border-color: var(--button-danger-bgColor-hover, #b62324);
}

/* Warning */
.p-button-warning {
  background: var(--bgColor-attention-emphasis, #9e6a03);
  color: var(--fgColor-default, #ffffff);
  border-color: var(--bgColor-attention-emphasis, #9e6a03);
}

.p-button-warning:hover:not(:disabled) {
  opacity: 0.9;
}

/* Info */
.p-button-info {
  background: var(--bgColor-accent-emphasis, #1f6feb);
  color: var(--fgColor-default, #ffffff);
  border-color: var(--bgColor-accent-emphasis, #1f6feb);
}

.p-button-info:hover:not(:disabled) {
  opacity: 0.9;
}

/* Outlined variant */
.p-button-outlined {
  background: transparent;
  border-color: var(--borderColor-default);
}

.p-button-outlined.p-button-primary {
  color: var(--fgColor-default);
  border-color: var(--borderColor-emphasis);
}

.p-button-outlined.p-button-primary:hover:not(:disabled) {
  background: var(--bgColor-muted);
  border-color: var(--borderColor-emphasis);
}

.p-button-outlined.p-button-secondary {
  color: var(--fgColor-muted);
  border-color: var(--borderColor-default);
}

.p-button-outlined.p-button-secondary:hover:not(:disabled) {
  background: var(--bgColor-muted);
  color: var(--fgColor-default);
}

.p-button-outlined.p-button-danger {
  color: var(--bgColor-danger-emphasis);
  border-color: var(--bgColor-danger-emphasis);
}

.p-button-outlined.p-button-danger:hover:not(:disabled) {
  background: var(--bgColor-danger-muted);
}

/* Text variant - No background, only text */
.p-button-text {
  background: transparent;
  border-color: transparent;
}

.p-button-text.p-button-primary {
  color: var(--fgColor-default);
}

.p-button-text.p-button-secondary {
  color: var(--fgColor-muted);
}

.p-button-text:hover:not(:disabled) {
  background: var(--bgColor-muted);
}

/* Rounded - Applicable to all button types */
.p-button-rounded {
  border-radius: 50%;
}

.p-button-rounded.p-button-icon-only {
  border-radius: 50%;
}

/* Icon only - Always squared */
.p-button-icon-only {
  padding: 10px;
  width: 38px;
  height: 38px;
  border-radius: 6px;
}

.p-button-icon-only.p-button-small {
  width: 38px;
  height: 38px;
  padding: 8px;
}

.p-button-icon-only.p-button-large {
  width: 3rem;
  height: 3rem;
  padding: 12px;
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
