<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label?: string;
  icon?: string;
  iconPos?: 'left' | 'right';
  severity?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'help';
  size?: 'small' | 'normal' | 'large';
  outlined?: boolean;
  text?: boolean;
  rounded?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  iconPos: 'left',
  severity: 'primary',
  size: 'normal',
  outlined: false,
  text: false,
  rounded: false,
  disabled: false,
  loading: false,
});

const buttonClasses = computed(() => [
  'p-button',
  `p-button-${props.severity}`,
  `p-button-${props.size}`,
  {
    'p-button-outlined': props.outlined,
    'p-button-text': props.text,
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
  padding: 0.5rem 1rem;
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

.p-button:focus {
  outline: 2px solid var(--fgColor-accent, #4493f8);
  outline-offset: 2px;
}

.p-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Sizes */
.p-button-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.p-button-large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* Primary */
.p-button-primary {
  background: var(--button-primary-bgColor-rest, #238636);
  color: var(--button-primary-fgColor-rest, #ffffff);
  border-color: var(--button-primary-bgColor-rest, #238636);
}

.p-button-primary:hover:not(:disabled) {
  background: var(--button-primary-bgColor-hover, #29903b);
  border-color: var(--button-primary-bgColor-hover, #29903b);
}

.p-button-primary:active:not(:disabled) {
  background: var(--button-primary-bgColor-active, #2e9a40);
  border-color: var(--button-primary-bgColor-active, #2e9a40);
}

/* Secondary */
.p-button-secondary {
  background: var(--bgColor-neutral-emphasis, #656c76);
  color: var(--fgColor-default, #ffffff);
  border-color: var(--bgColor-neutral-emphasis, #656c76);
}

.p-button-secondary:hover:not(:disabled) {
  background: var(--bgColor-emphasis, #3d444d);
  border-color: var(--bgColor-emphasis, #3d444d);
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

/* Outlined */
.p-button-outlined {
  background: transparent;
  border-color: var(--borderColor-default, #3d444d);
}

.p-button-outlined.p-button-primary {
  color: var(--button-primary-bgColor-rest, #238636);
  border-color: var(--button-primary-bgColor-rest, #238636);
}

.p-button-outlined.p-button-primary:hover:not(:disabled) {
  background: var(--bgColor-success-muted, rgba(42, 134, 54, 0.15));
}

.p-button-outlined.p-button-danger {
  color: var(--bgColor-danger-emphasis, #da3633);
  border-color: var(--bgColor-danger-emphasis, #da3633);
}

.p-button-outlined.p-button-danger:hover:not(:disabled) {
  background: var(--bgColor-danger-muted, rgba(218, 54, 51, 0.1));
}

/* Text only */
.p-button-text {
  background: transparent;
  border-color: transparent;
  color: var(--fgColor-accent, #4493f8);
}

.p-button-text:hover:not(:disabled) {
  background: var(--bgColor-neutral-muted, rgba(101, 108, 118, 0.2));
}

/* Rounded */
.p-button-rounded {
  border-radius: 50%;
  padding: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
}

.p-button-rounded.p-button-small {
  width: 2rem;
  height: 2rem;
  padding: 0.375rem;
}

.p-button-rounded.p-button-large {
  width: 3rem;
  height: 3rem;
  padding: 0.75rem;
}

/* Icon only */
.p-button-icon-only {
  padding: 0.5rem;
  width: 2.5rem;
}

.p-button-icon-only.p-button-small {
  width: 2rem;
}

.p-button-icon-only.p-button-large {
  width: 3rem;
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
