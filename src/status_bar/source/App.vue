<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Ascension from './components/Ascension.vue';
import Destiny from './components/Destiny/index.vue';
import Equipment from './components/Equipment/index.vue';
import Items from './components/Items/index.vue';
import News from './components/News/index.vue';
import Skills from './components/Skills/index.vue';
import Task from './components/Task.vue';
import ThemePanel from './components/ThemePanel.vue';
import UserInfo from './components/UserInfo/index.vue';
import WorldStatus from './components/WorldStatus.vue';

import { useStatData } from './composables/use-stat-data';
import { useTheme } from './composables/use-theme';

const { themeStore } = useTheme();
const { refresh: refreshStatData } = useStatData();

// 刷新动画状态
const isRefreshing = ref(false);

// 初始化主题
onMounted(() => {
  // 从酒馆加载主题配置
  themeStore.loadThemeFromTavern();
  // 应用 CSS 变量
  themeStore.applyCssVariables();
});

// 处理刷新按钮点击
const handleRefresh = () => {
  isRefreshing.value = true;
  refreshStatData();
  // 动画结束后恢复状态
  setTimeout(() => {
    isRefreshing.value = false;
  }, 500);
};
</script>

<template>
  <div class="layout">
    <!-- 刷新按钮 -->
    <button
      class="refresh-btn"
      :class="{ refreshing: isRefreshing }"
      title="刷新数据"
      @click="handleRefresh"
    >
      <i class="fa-solid fa-rotate-right"></i>
    </button>

    <ThemePanel />
    <WorldStatus />
    <Ascension />
    <Task />
    <UserInfo />
    <Equipment />
    <Skills />
    <Items />
    <Destiny />
    <News />
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  padding: 15px;
  background-color: var(--theme-background);
  opacity: var(--theme-background-opacity);
  border: var(--theme-main-border-width) solid var(--theme-main-border);
  border-radius: 8px;
  overflow: hidden;
}

/* 刷新按钮 - 左上角，主题按钮下方 */
.refresh-btn {
  position: fixed;
  top: 62px; /* 8px + 46px(按钮高度) + 8px(间距) */
  left: 8px;
  width: 46px;
  height: 46px;
  background-color: var(--theme-button-bg);
  color: var(--theme-button-text);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    background-color: var(--theme-button-bg-hover);
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.35);
  }

  &.refreshing {
    animation: spin 0.5s ease-in-out;
  }

  i {
    pointer-events: none;
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    width: 42px;
    height: 42px;
    font-size: 17px;
    top: 54px; /* 6px + 42px(按钮高度) + 6px(间距) */
    left: 6px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
