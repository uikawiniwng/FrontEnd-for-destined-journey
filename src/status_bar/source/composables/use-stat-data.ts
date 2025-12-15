import { storeToRefs } from 'pinia';
import { useStatDataStore } from '../store/stat-data';

/**
 * 状态数据 composable
 * 使用 Pinia store 管理，支持手动刷新
 */
export function useStatData() {
  const store = useStatDataStore();
  const { data, loading, error, lastRefreshTime } = storeToRefs(store);

  // 初始加载数据
  onMounted(() => {
    // 只在 store 未加载数据时才加载
    if (data.value === null) {
      store.refresh();
    }
  });

  return {
    /** 状态数据 */
    statData: data,
    /** 是否正在加载 */
    loading,
    /** 错误信息 */
    error,
    /** 最后刷新时间 */
    lastRefreshTime,
    /** 刷新数据 */
    refresh: store.refresh,
  };
}
