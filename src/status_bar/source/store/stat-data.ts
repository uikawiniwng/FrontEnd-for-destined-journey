import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 状态数据 Store
 * 用于管理 MVU 变量数据，支持手动刷新
 */
export const useStatDataStore = defineStore('status-bar-stat-data', () => {
  // ============ State ============

  /** 状态数据 */
  const data = ref<Record<string, any> | null>(null);

  /** 是否正在加载 */
  const loading = ref(true);

  /** 错误信息 */
  const error = ref<string | null>(null);

  /** 最后刷新时间 */
  const lastRefreshTime = ref<Date | null>(null);

  // ============ Actions ============

  /**
   * 加载/刷新状态数据
   */
  const refresh = () => {
    try {
      loading.value = true;

      // 获取变量数据
      const variables = getVariables({
        type: 'message',
        message_id: getCurrentMessageId(),
      });

      // 提取 stat_data
      const statData = _.get(variables, 'stat_data', {});

      if (!statData || Object.keys(statData).length === 0) {
        throw new Error('无法获取状态数据');
      }

      data.value = statData;
      error.value = null;
      lastRefreshTime.value = new Date();
      console.log('[StatDataStore] 数据已刷新');
    } catch (e) {
      console.error('[StatDataStore] 加载数据失败:', e);
      error.value = e instanceof Error ? e.message : '未知错误';
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    lastRefreshTime,
    refresh,
  };
});
