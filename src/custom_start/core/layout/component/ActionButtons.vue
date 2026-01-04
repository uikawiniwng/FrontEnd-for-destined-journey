<script setup lang="ts">
/**
 * 页面操作按钮组件
 * 提供随机生成和重置当前页面的功能
 */
import { randomGenerateBus, resetPageBus } from '../../composables';

const handleRandomGenerate = () => {
  randomGenerateBus.emit();
};

const handleReset = () => {
  resetPageBus.emit();
};
</script>

<template>
  <div class="action-buttons">
    <button
      class="action-button random-button"
      title="随机生成当前页面内容"
      @click="handleRandomGenerate"
    >
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span class="text">随机当前页</span>
    </button>
    <button class="action-button reset-button" title="重置当前页面" @click="handleReset">
      <i class="fa-solid fa-rotate-left"></i>
      <span class="text">重置当前页</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-md);
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);

  i {
    font-size: 1rem;
  }

  &.random-button {
    background: linear-gradient(135deg, #e8d5c4 0%, #d4c4b0 100%);
    color: var(--title-color);

    &:hover {
      background: linear-gradient(135deg, #f0ddd0 0%, #e0d5c7 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }

  &.reset-button {
    background: linear-gradient(135deg, #c6b8a5 0%, #b0a295 100%);
    color: var(--title-color);

    &:hover {
      background: linear-gradient(135deg, #d4c4b0 0%, #c6b8a5 100%);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
}

@media (max-width: 768px) {
  .action-buttons {
    flex-wrap: wrap;
  }

  .action-button {
    flex: 1;
  }
}
</style>
