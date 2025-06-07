import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, ChevronDown, ChevronUp, Info, FileText, User, RefreshCw } from 'lucide-react';
import { AdminFilterOptions, DimensionsAnalyticsData, QuestionnaireSelectionData } from '@/types';
import { buildQueryParams } from '@/utils/adminCommon';

interface UserSelectionDistributionCardProps {
    filters?: AdminFilterOptions;
}

interface ChartDataItem {
    questionId: string;
    A: number;
    B: number;
    tie: number;
    total: number;
    consistency: number;
    userDetails?: {
        A: string[];
        B: string[];
        tie: string[];
    };
}

const getConsistencyColor = (consistency: number) => {
    if (consistency >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (consistency >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (consistency >= 0.4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
};

const getConsistencyLabel = (consistency: number) => {
    if (consistency >= 0.8) return 'High Consistency';
    if (consistency >= 0.6) return 'Moderate Consistency';
    if (consistency >= 0.4) return 'Low Consistency';
    return 'Very Low Consistency';
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
                <p className="font-medium text-sm mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-sm">Choice A: {data.A} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-sm">Choice B: {data.B} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span className="text-sm">Tie: {data.tie} users</span>
                    </div>
                    <div className="border-t pt-1 mt-2">
                        <p className="text-sm font-medium">
                            Consistency: {(data.consistency * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Total Users: {data.total}
                        </p>
                    </div>
                    {data.userDetails && (
                        <div className="border-t pt-1 mt-2 text-xs">
                            {data.userDetails.A.length > 0 && (
                                <div>A: {data.userDetails.A.join(', ')}</div>
                            )}
                            {data.userDetails.B.length > 0 && (
                                <div>B: {data.userDetails.B.join(', ')}</div>
                            )}
                            {data.userDetails.tie.length > 0 && (
                                <div>Tie: {data.userDetails.tie.join(', ')}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default function UserSelectionDistributionCard({ filters }: UserSelectionDistributionCardProps) {
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('');
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [sortBy, setSortBy] = useState<'consistency' | 'total' | 'questionId'>('questionId');
    const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireSelectionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Fetch questionnaire data
    const fetchQuestionnaireData = async () => {
        try {
            setLoading(true);
            setError('');
            const queryParams = filters ? buildQueryParams(filters) : '';
            const response = await fetch(`/api/admin/questionnaire-user-selections?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to fetch questionnaire data');
            }

            const result = await response.json();
            if (result.success) {
                console.log('result.data', result.data);
                // Extract questionnaires array from the analytics data
                setQuestionnaireData(result.data.questionnaires);
                // Set default selection to first questionnaire
                if (result.data.questionnaires.length > 0 && !selectedQuestionnaire) {
                    setSelectedQuestionnaire(result.data.questionnaires[0].questionnaireId);
                }
            } else {
                throw new Error(result.message || 'Failed to fetch data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            console.error('Error fetching questionnaire data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestionnaireData();
    }, [filters]);

    // Filter questionnaires based on search term
    const filteredQuestionnaireData = useMemo(() => {
        if (!searchTerm.trim()) return questionnaireData;
        return questionnaireData.filter(q =>
            q.questionnaireId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [questionnaireData, searchTerm]);

    // 处理图表数据
    const chartData: ChartDataItem[] = useMemo(() => {
        if (!selectedQuestionnaire || !questionnaireData) return [];

        const questionnaire = questionnaireData.find(q => q.questionnaireId === selectedQuestionnaire);
        if (!questionnaire) return [];

        const data = Object.values(questionnaire.questions).map(question => ({
            questionId: question.questionId,
            A: question.distribution.A,
            B: question.distribution.B,
            tie: question.distribution.tie,
            total: question.distribution.total,
            consistency: question.consistency,
            userDetails: showUserDetails ? question.userList : undefined
        }));

        // 根据排序选项排序
        return data.sort((a, b) => {
            if (sortBy === 'consistency') return b.consistency - a.consistency;
            if (sortBy === 'total') return b.total - a.total;
            return a.questionId.localeCompare(b.questionId);
        });
    }, [selectedQuestionnaire, questionnaireData, showUserDetails, sortBy]);

    // 当前问卷统计
    const currentQuestionnaireStats = useMemo(() => {
        if (!selectedQuestionnaire || !questionnaireData) return null;

        const questionnaire = questionnaireData.find(q => q.questionnaireId === selectedQuestionnaire);
        if (!questionnaire) return null;

        const consistencyDistribution = {
            high: Object.values(questionnaire.questions).filter(q => q.consistency >= 0.8).length,
            moderate: Object.values(questionnaire.questions).filter(q => q.consistency >= 0.6 && q.consistency < 0.8).length,
            low: Object.values(questionnaire.questions).filter(q => q.consistency >= 0.4 && q.consistency < 0.6).length,
            veryLow: Object.values(questionnaire.questions).filter(q => q.consistency < 0.4).length
        };

        // 新增分布类型统计
        const distributionTypes = {
            completeAgreement: 0,  // 完全一致：所有用户选择同一个选项
            majorityAgreement: 0,  // 多数一致：存在明显的多数选择
            completeDisagreement: 0  // 完全分歧：最高票数相等（平票）
        };

        Object.values(questionnaire.questions).forEach(question => {
            const { A, B, tie, total } = question.distribution;

            // 如果没有回答，跳过
            if (total === 0) return;

            const choices = [A, B, tie].sort((a, b) => b - a); // 降序排列
            const [highest, second, lowest] = choices;

            // 完全一致：只有一个选项有票数，其他都是0
            if (highest > 0 && second === 0 && lowest === 0) {
                distributionTypes.completeAgreement++;
            }
            // 完全分歧：最高票数等于次高票数（平票情况）
            else if (highest === second && highest > 0) {
                distributionTypes.completeDisagreement++;
            }
            // 多数一致：最高票数严格大于其他任何票数
            else if (highest > second) {
                distributionTypes.majorityAgreement++;
            }
        });

        return {
            ...questionnaire,
            consistencyDistribution,
            distributionTypes
        };
    }, [selectedQuestionnaire, questionnaireData]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Selection Distribution by Questionnaire
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Loading questionnaire data...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Selection Distribution by Questionnaire
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-600 py-8">
                        <p className="mb-4">Error: {error}</p>
                        <Button onClick={fetchQuestionnaireData} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (questionnaireData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Selection Distribution by Questionnaire
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        No questionnaire data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Selection Distribution by Questionnaire
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Shows how individual users chose between options A, B, and Tie for each question in a questionnaire</span>
                </div>

                {/* Questionnaire Selector */}
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Select Questionnaire:</span>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire}>
                            <SelectTrigger className="w-full min-w-80">
                                <SelectValue placeholder="Choose a questionnaire">
                                    {selectedQuestionnaire && (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="truncate pr-2">
                                                {selectedQuestionnaire.length > 40
                                                    ? `${selectedQuestionnaire.substring(0, 40)}...`
                                                    : selectedQuestionnaire
                                                }
                                            </span>
                                            <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                                                {questionnaireData.find(q => q.questionnaireId === selectedQuestionnaire)?.totalQuestions || 0} Q
                                            </Badge>
                                        </div>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {/* Search input */}
                                <div className="p-2 border-b">
                                    <input
                                        type="text"
                                        placeholder="Search questionnaires..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredQuestionnaireData.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            {searchTerm ? 'No questionnaires found' : 'No questionnaires available'}
                                        </div>
                                    ) : (
                                        filteredQuestionnaireData.map(questionnaire => (
                                            <SelectItem
                                                key={questionnaire.questionnaireId}
                                                value={questionnaire.questionnaireId}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="truncate pr-2" title={questionnaire.questionnaireId}>
                                                        {questionnaire.questionnaireId.length > 50
                                                            ? `${questionnaire.questionnaireId.substring(0, 50)}...`
                                                            : questionnaire.questionnaireId
                                                        }
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {questionnaire.totalQuestions}Q
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {questionnaire.totalResponses}R
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={fetchQuestionnaireData} variant="outline" size="sm" className="shrink-0">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>

                {/* Current Questionnaire Stats */}
                {currentQuestionnaireStats && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                            Questions: {currentQuestionnaireStats.totalQuestions}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            Total Responses: {currentQuestionnaireStats.totalResponses}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            Avg Consistency: {(currentQuestionnaireStats.avgConsistency * 100).toFixed(1)}%
                        </Badge>
                    </div>
                )}
            </CardHeader>

            <CardContent>
                {!selectedQuestionnaire ? (
                    <div className="text-center text-muted-foreground py-8">
                        Please select a questionnaire to view user selection distribution
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Controls */}
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <Button
                                    variant={sortBy === 'questionId' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortBy('questionId')}
                                >
                                    Sort by Question ID
                                </Button>
                                <Button
                                    variant={sortBy === 'consistency' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortBy('consistency')}
                                >
                                    Sort by Consistency
                                </Button>
                                <Button
                                    variant={sortBy === 'total' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortBy('total')}
                                >
                                    Sort by Total Users
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUserDetails(!showUserDetails)}
                            >
                                <User className="h-3 w-3 mr-1" />
                                {showUserDetails ? 'Hide User IDs' : 'Show User IDs'}
                            </Button>
                        </div>

                        {/* Chart */}
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="questionId"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        fontSize={10}
                                        interval={0}
                                    />
                                    <YAxis label={{ value: 'Number of Users', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="A" stackId="choices" fill="#3B82F6" name="Choice A" />
                                    <Bar dataKey="B" stackId="choices" fill="#10B981" name="Choice B" />
                                    <Bar dataKey="tie" stackId="choices" fill="#F59E0B" name="Tie" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Consistency Overview */}
                        {currentQuestionnaireStats && (
                            <div className="space-y-4">
                                {/* 新增的分布类型统计 */}
                                <div>
                                    <h4 className="font-medium text-sm mb-2">Selection Pattern Distribution</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-700">
                                                {currentQuestionnaireStats.distributionTypes.completeAgreement}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Complete Agreement</div>
                                            <div className="text-xs text-gray-500 font-mono">(1-0-0, 2-0-0, 3-0-0)</div>
                                            <div className="text-xs text-green-700">
                                                {((currentQuestionnaireStats.distributionTypes.completeAgreement / currentQuestionnaireStats.totalQuestions) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-700">
                                                {currentQuestionnaireStats.distributionTypes.majorityAgreement}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Majority Agreement</div>
                                            <div className="text-xs text-gray-500 font-mono">(2-1-0)</div>
                                            <div className="text-xs text-blue-700">
                                                {((currentQuestionnaireStats.distributionTypes.majorityAgreement / currentQuestionnaireStats.totalQuestions) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-red-700">
                                                {currentQuestionnaireStats.distributionTypes.completeDisagreement}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Complete Disagreement</div>
                                            <div className="text-xs text-gray-500 font-mono">(1-1-0, 1-1-1)</div>
                                            <div className="text-xs text-red-700">
                                                {((currentQuestionnaireStats.distributionTypes.completeDisagreement / currentQuestionnaireStats.totalQuestions) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detailed Question List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            <h4 className="font-medium text-sm mb-2">Question Details</h4>
                            {chartData.map((item) => (
                                <div key={item.questionId} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                                    <div className="flex-1">
                                        <h5 className="font-medium text-sm">{item.questionId}</h5>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>A: {item.A} users</span>
                                            <span>B: {item.B} users</span>
                                            <span>Tie: {item.tie} users</span>
                                            <span>Total: {item.total} users</span>
                                        </div>
                                        {showUserDetails && item.userDetails && (
                                            <div className="mt-2 text-xs">
                                                {item.userDetails.A.length > 0 && (
                                                    <div><strong>A:</strong> {item.userDetails.A.join(', ')}</div>
                                                )}
                                                {item.userDetails.B.length > 0 && (
                                                    <div><strong>B:</strong> {item.userDetails.B.join(', ')}</div>
                                                )}
                                                {item.userDetails.tie.length > 0 && (
                                                    <div><strong>Tie:</strong> {item.userDetails.tie.join(', ')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={`text-xs ${getConsistencyColor(item.consistency)}`}
                                            variant="outline"
                                        >
                                            {getConsistencyLabel(item.consistency)}
                                        </Badge>
                                        <div className="text-sm font-medium">
                                            {(item.consistency * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Explanation */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs text-blue-800">
                                <strong>Questionnaire User Selection Analysis:</strong>
                                <div className="mt-1 space-y-1">
                                    <div>• Each bar represents one question in the selected questionnaire</div>
                                    <div>• <strong>A/B/Tie</strong>: Number of users who chose each option</div>
                                    <div>• <strong>Consistency</strong>: How much users agree (highest choice / total users)</div>
                                    <div>• <strong>Complete Agreement</strong>: All users chose the same option (e.g., 1-0-0, 2-0-0, 3-0-0)</div>
                                    <div>• <strong>Majority Agreement</strong>: One option has more votes than any other option (e.g., 2-1-0)</div>
                                    <div>• <strong>Complete Disagreement</strong>: Two or more options have equal highest vote counts (e.g., 1-1-0, 1-1-1)</div>
                                    <div>• Enable "Show User IDs" to see which specific users chose each option</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 