import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data
const groupedPromptsPath = path.join(__dirname, '../src/data/grouped_prompts.json');
const trapQuestionsPath = path.join(__dirname, '../src/data/trapQuestions.json');

const groupedPrompts = JSON.parse(fs.readFileSync(groupedPromptsPath, 'utf-8'));
const trapQuestions = JSON.parse(fs.readFileSync(trapQuestionsPath, 'utf-8'));

// 提取所有正常问题
const allNormalQuestions = [];
groupedPrompts.forEach(group => {
    group.items.forEach(comparison => {
        allNormalQuestions.push({
            id: comparison.uuid,
            taskGroupId: group.groupId,
            linkA: {
                id: 'A',
                url: comparison.link1,
                title: "Example A",
                description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                verificationCode: comparison.verificationCodeA
            },
            linkB: {
                id: 'B',
                url: comparison.link2,
                title: "Example B",
                description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                verificationCode: comparison.verificationCodeB
            },
            userQuery: comparison.prompt
        });
    });
});

// 提取所有陷阱问题
const allTrapQuestions = [];
trapQuestions.forEach(group => {
    group.items.forEach(comparison => {
        allTrapQuestions.push({
            id: comparison.uuid,
            taskGroupId: group.groupId,
            linkA: {
                id: 'A',
                url: comparison.link1,
                title: "Example A",
                description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                verificationCode: comparison.verificationCodeA
            },
            linkB: {
                id: 'B',
                url: comparison.link2,
                title: "Example B",
                description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                verificationCode: comparison.verificationCodeB
            },
            userQuery: comparison.prompt,
            isTrap: true
        });
    });
});

console.log(`总共有 ${allNormalQuestions.length} 个正常问题`);
console.log(`总共有 ${allTrapQuestions.length} 个陷阱问题`);

// 生成问卷组合策略：
// 1. 每个组合包含6个正常问题 + 2个陷阱问题
// 2. 确保每个正常问题至少被包含在一个组合中
// 3. 生成足够多的组合来覆盖所有数据
// 4. 随机化但保证覆盖度

const NORMAL_QUESTIONS_PER_GROUP = 6;
const TRAP_QUESTIONS_PER_GROUP = 2;
const TARGET_COVERAGE_MULTIPLIER = 1; // 每个问题平均被包含的次数

function generateQuestionnaireGroups() {
    const questionnaireGroups = [];
    const normalQuestionUsage = new Array(allNormalQuestions.length).fill(0);
    const trapQuestionUsage = new Array(allTrapQuestions.length).fill(0);

    // 计算需要生成的组合数量，确保每个正常问题至少被覆盖指定次数
    const totalNormalQuestions = allNormalQuestions.length;
    const minGroupsNeeded = Math.ceil((totalNormalQuestions * TARGET_COVERAGE_MULTIPLIER) / NORMAL_QUESTIONS_PER_GROUP);

    console.log(`计算需要生成 ${minGroupsNeeded} 个问卷组合来确保覆盖度`);

    // 生成问卷组合
    for (let i = 0; i < minGroupsNeeded; i++) {
        const questionnaireId = uuidv4();

        // 选择正常问题 - 优先选择使用次数少的问题
        const normalIndices = Array.from({ length: totalNormalQuestions }, (_, idx) => idx)
            .sort((a, b) => normalQuestionUsage[a] - normalQuestionUsage[b]);

        const selectedNormalIndices = [];
        const usedTaskGroups = new Set();

        // 优先选择使用次数最少的问题，但避免同一个 taskGroupId 的问题
        for (let idx of normalIndices) {
            if (selectedNormalIndices.length >= NORMAL_QUESTIONS_PER_GROUP) break;

            const question = allNormalQuestions[idx];
            if (!usedTaskGroups.has(question.taskGroupId)) {
                selectedNormalIndices.push(idx);
                usedTaskGroups.add(question.taskGroupId);
            }
        }

        // 如果还不够6个，随机补充
        while (selectedNormalIndices.length < NORMAL_QUESTIONS_PER_GROUP) {
            const availableIndices = normalIndices.filter(idx => !selectedNormalIndices.includes(idx));
            if (availableIndices.length === 0) break;

            const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            selectedNormalIndices.push(randomIdx);
        }

        // 选择陷阱问题
        const trapIndices = Array.from({ length: allTrapQuestions.length }, (_, idx) => idx)
            .sort((a, b) => trapQuestionUsage[a] - trapQuestionUsage[b])
            .slice(0, TRAP_QUESTIONS_PER_GROUP);

        // 更新使用计数
        selectedNormalIndices.forEach(idx => normalQuestionUsage[idx]++);
        trapIndices.forEach(idx => trapQuestionUsage[idx]++);

        // 构建问题列表
        const selectedQuestions = [
            ...selectedNormalIndices.map(idx => allNormalQuestions[idx]),
            ...trapIndices.map(idx => allTrapQuestions[idx])
        ];

        // 随机排序
        selectedQuestions.sort(() => Math.random() - 0.5);

        questionnaireGroups.push({
            questionnaireId,
            questions: selectedQuestions
        });

        if ((i + 1) % 100 === 0) {
            console.log(`已生成 ${i + 1}/${minGroupsNeeded} 个问卷组合`);
        }
    }

    // 统计覆盖情况
    const minNormalUsage = Math.min(...normalQuestionUsage);
    const maxNormalUsage = Math.max(...normalQuestionUsage);
    const avgNormalUsage = normalQuestionUsage.reduce((a, b) => a + b, 0) / normalQuestionUsage.length;

    const minTrapUsage = Math.min(...trapQuestionUsage);
    const maxTrapUsage = Math.max(...trapQuestionUsage);
    const avgTrapUsage = trapQuestionUsage.reduce((a, b) => a + b, 0) / trapQuestionUsage.length;

    console.log(`\n覆盖统计:`);
    console.log(`正常问题使用次数: 最少=${minNormalUsage}, 最多=${maxNormalUsage}, 平均=${avgNormalUsage.toFixed(2)}`);
    console.log(`陷阱问题使用次数: 最少=${minTrapUsage}, 最多=${maxTrapUsage}, 平均=${avgTrapUsage.toFixed(2)}`);

    return questionnaireGroups;
}

// 生成组合数据
console.log('开始生成问卷组合...');
const questionnaireGroups = generateQuestionnaireGroups();

// 保存到文件
const outputPath = path.join(__dirname, '../src/data/questionnaire_groups.json');
fs.writeFileSync(outputPath, JSON.stringify(questionnaireGroups, null, 2));

console.log(`\n生成完成！`);
console.log(`总共生成了 ${questionnaireGroups.length} 个问卷组合`);
console.log(`保存到: ${outputPath}`);
console.log(`每个组合包含 ${NORMAL_QUESTIONS_PER_GROUP} 个正常问题 + ${TRAP_QUESTIONS_PER_GROUP} 个陷阱问题`); 