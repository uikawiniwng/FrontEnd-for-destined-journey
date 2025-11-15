/**
 * 安全获取值，带默认值
 */
export function safeGet<T = any>(obj: any, path: string, defaultValue: T): T {
  return _.get(obj, path, defaultValue);
}

/**
 * 兼容性获取函数 - 支持新旧数据格式
 * 优先尝试新路径，如果不存在则尝试旧路径
 *
 * @param obj 数据对象
 * @param newPath 新格式路径
 * @param oldPath 旧格式路径（可选）
 * @param defaultValue 默认值
 * @returns 获取到的值或默认值
 */
export function compatGet<T = any>(obj: any, newPath: string, oldPath: string | null, defaultValue: T): T {
  // 先尝试新路径
  const newValue = _.get(obj, newPath);
  if (newValue !== undefined) {
    return newValue;
  }

  // 如果新路径不存在且提供了旧路径，尝试旧路径
  if (oldPath) {
    const oldValue = _.get(obj, oldPath);
    if (oldValue !== undefined) {
      return oldValue;
    }
  }

  // 都不存在则返回默认值
  return defaultValue;
}

/**
 * 获取可扩展对象中的所有项
 * 自动过滤 $meta 字段
 */
export function getExtensibleItems<T = any>(data: any): Record<string, T> {
  if (!data || typeof data !== 'object') return {};

  return _.omitBy(data, (value, key) => key === '$meta' || key === '$__META_EXTENSIBLE__$') as Record<string, T>;
}

/**
 * 检查是否为空值
 */
export function isEmpty(value: any): boolean {
  return _.isEmpty(value) || value === '' || value === null || value === undefined;
}

/**
 * 处理身份/职业等字段
 * 如果是 ["$__META_EXTENSIBLE__$"]，返回空数组
 */
export function normalizeStringOrArray(value: any): string | string[] {
  if (Array.isArray(value)) {
    if (value.length === 0 || value[0] === '$__META_EXTENSIBLE__$') {
      return [];
    }
    return value;
  }
  return value || '';
}
