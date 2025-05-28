# Scripts 文档

## 问卷组合生成脚本

### `generateQuestionnaireGroups.js`

这个脚本用于预生成所有可能的问卷组合，确保覆盖整个测试数据集。

#### 功能特点

- **全面覆盖**: 确保每个正常问题至少被包含在一个问卷组合中
- **智能分布**: 平均每个问题被包含2次，保证良好的数据覆盖度
- **避免重复**: 每个问卷组合中的正常问题来自不同的任务组（taskGroupId）
- **随机化**: 组合内的问题顺序是随机的
- **陷阱问题**: 每个组合包含2个陷阱问题用于质量控制

#### 使用方法

```bash
# 生成问卷组合数据
npm run generate:questionnaire

# 或者使用别名重新生成
npm run regenerate:questionnaire
```

#### 输出

脚本会生成 `src/data/preGeneratedQuestionnaireGroups.json` 文件，包含：

- 200个预生成的问卷组合
- 每个组合包含6个正常问题 + 2个陷阱问题
- 完整的覆盖统计信息

#### 数据结构

```json
[
  {
    "questionnaireId": "随机生成的32位ID",
    "questions": [
      {
        "id": "问题UUID",
        "taskGroupId": "任务组ID",
        "linkA": { "id": "A", "url": "...", "title": "...", "description": "..." },
        "linkB": { "id": "B", "url": "...", "title": "...", "description": "..." },
        "userQuery": "用户查询",
        "isTrap": true // 仅陷阱问题有此字段
      }
    ]
  }
]
```

#### 性能优化

修改后的 `createQuestionnaireGroup()` 函数现在：

- 直接从预生成的数据中随机选择一个组合
- 避免了每次调用时的复杂计算
- 保证了数据的一致性和覆盖度
- 显著提升了性能

#### 注意事项

- 每次运行脚本都会重新生成数据文件
- 生成的问卷ID和组合都是随机的
- 建议在修改源数据文件后重新运行此脚本 