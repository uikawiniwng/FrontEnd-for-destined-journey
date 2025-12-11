/**
 * MVU 变量框架 composable
 * 用于封装 MVU 变量的读写操作
 */

import { toBoolean } from '../utils/data-adapter';

/**
 * 获取当前消息楼层的 MVU 数据
 */
export function getMvuData() {
  return Mvu.getMvuData({
    type: 'message',
    message_id: getCurrentMessageId(),
  });
}

/**
 * 更新命定之人的"是否在场"状态
 * @param characterName 角色名称
 * @param newValue 新状态值（保持原始类型：boolean 或 "是"/"否" 字符串）
 */
export async function setDestinyCharacterPresence(
  characterName: string,
  newValue: boolean | string,
) {
  const mvuData = getMvuData();
  const path = `命定系统.命定之人.${characterName}.是否在场`;

  // 使用 MVU 的 setMvuVariable 来更新变量
  const success = await Mvu.setMvuVariable(mvuData, path, newValue);

  if (success) {
    // 将更新后的数据写回消息楼层
    await Mvu.replaceMvuData(mvuData, {
      type: 'message',
      message_id: getCurrentMessageId(),
    });
  }

  return success;
}

/**
 * 切换命定之人的"是否在场"状态
 * @param characterName 角色名称
 * @param currentState 当前状态 (兼容 boolean 和 "是"/"否" 字符串)
 * @returns 是否成功
 *
 * 注意：写回时保持与原始数据相同的类型
 * - 原值是字符串 "是"/"否" → 写回字符串
 * - 原值是布尔值 true/false → 写回布尔值
 */
export async function toggleDestinyCharacterPresence(
  characterName: string,
  currentState: boolean | string,
) {
  // 兼容字符串和布尔值，转换为布尔值进行逻辑判断
  const currentBool = toBoolean(currentState, true);
  const newBool = !currentBool;

  // 根据原始类型决定写回的值类型
  let newValue: boolean | string;
  if (typeof currentState === 'string') {
    // 原值是字符串格式，写回字符串
    newValue = newBool ? '是' : '否';
  } else {
    // 原值是布尔值格式，写回布尔值
    newValue = newBool;
  }

  return await setDestinyCharacterPresence(characterName, newValue);
}
