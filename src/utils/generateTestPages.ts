// 生成随机验证码
export function generateVerificationCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 生成带验证码的HTML页面
export function generateTestPageWithCode(
    title: string,
    verificationCode: string,
    backgroundColor: string = '#ffffff',
    borderColor: string = '#4caf50'
): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: ${backgroundColor};
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 4px solid ${borderColor};
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: ${borderColor};
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .content {
            background: ${backgroundColor === '#ffffff' ? '#f8f9fa' : '#ffffff'};
            padding: 30px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 5px solid ${borderColor};
        }
        .verification-section {
            background: linear-gradient(135deg, ${borderColor}15, ${borderColor}25);
            border: 2px solid ${borderColor};
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .verification-code {
            font-size: 2em;
            font-weight: bold;
            color: ${borderColor};
            background: white;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            margin: 15px 0;
            letter-spacing: 3px;
            border: 2px solid ${borderColor};
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid ${borderColor}50;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .feature-title {
            font-weight: bold;
            color: ${borderColor};
            margin-bottom: 10px;
        }
        .highlight {
            background: ${borderColor}20;
            padding: 2px 6px;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid ${borderColor}30;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        
        <div class="content">
            <p>欢迎来到<span class="highlight">${title}</span>！这是一个专门为用户界面评估研究设计的演示页面。</p>
            <p>本页面展示了现代化的设计理念和用户友好的界面元素，旨在为用户提供优质的浏览体验。</p>
        </div>

        <div class="verification-section">
            <h3>🔐 验证码区域</h3>
            <p>为了验证您已仔细查看本页面内容，请记录下方显示的验证码：</p>
            <div class="verification-code">${verificationCode}</div>
            <p><small>请将此验证码输入到问卷系统中</small></p>
        </div>

        <div class="features">
            <div class="feature-card">
                <div class="feature-title">🎨 设计美观</div>
                <p>采用现代化设计风格，界面简洁美观，视觉层次分明。</p>
            </div>
            <div class="feature-card">
                <div class="feature-title">📱 响应式布局</div>
                <p>支持各种设备尺寸，在手机、平板和桌面都有良好体验。</p>
            </div>
            <div class="feature-card">
                <div class="feature-title">⚡ 快速加载</div>
                <p>优化的代码结构和资源管理，确保页面快速加载。</p>
            </div>
            <div class="feature-card">
                <div class="feature-title">🔧 易于使用</div>
                <p>直观的用户界面设计，降低学习成本，提升使用效率。</p>
            </div>
        </div>

        <div class="content">
            <h3>🌟 主要特色</h3>
            <ul>
                <li>用户体验优先的设计理念</li>
                <li>清晰的信息架构和导航结构</li>
                <li>一致的视觉语言和交互模式</li>
                <li>无障碍访问支持</li>
                <li>跨浏览器兼容性</li>
            </ul>
        </div>

        <div class="footer">
            <p>© 2024 ${title} - 为用户界面评估研究而设计</p>
            <p><small>验证码: <strong>${verificationCode}</strong></small></p>
        </div>
    </div>

    <script>
        // 简单的页面交互追踪
        let startTime = Date.now();
        
        // 页面可见性变化追踪
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                console.log('用户离开页面');
            } else {
                console.log('用户返回页面');
            }
        });

        // 页面卸载时记录停留时间
        window.addEventListener('beforeunload', function() {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            console.log('页面停留时间:', timeSpent + '秒');
        });

        // 模拟一些用户交互
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            });
        });

        // 高亮验证码区域
        const verificationSection = document.querySelector('.verification-section');
        setInterval(() => {
            verificationSection.style.boxShadow = verificationSection.style.boxShadow === 'none' ? 
                '0 0 20px ${borderColor}40' : 'none';
        }, 2000);
    </script>
</body>
</html>`;
}

// 预定义的一些测试页面配置
export const testPageConfigs = [
    {
        title: "创新设计方案 A",
        backgroundColor: "#f8f9fa",
        borderColor: "#007bff"
    },
    {
        title: "优质用户体验 B",
        backgroundColor: "#f1f8e9",
        borderColor: "#4caf50"
    },
    {
        title: "现代界面设计 C",
        backgroundColor: "#fff3e0",
        borderColor: "#ff9800"
    },
    {
        title: "专业解决方案 D",
        backgroundColor: "#f3e5f5",
        borderColor: "#9c27b0"
    }
];

// 批量生成测试页面
export function generateTestPages(count: number = 4): Array<{
    title: string;
    verificationCode: string;
    html: string;
    config: typeof testPageConfigs[0];
}> {
    const pages = [];

    for (let i = 0; i < count; i++) {
        const config = testPageConfigs[i % testPageConfigs.length];
        const verificationCode = generateVerificationCode();
        const html = generateTestPageWithCode(
            config.title,
            verificationCode,
            config.backgroundColor,
            config.borderColor
        );

        pages.push({
            title: config.title,
            verificationCode,
            html,
            config
        });
    }

    return pages;
}

// 创建数据URI格式的页面链接
export function createDataUri(html: string): string {
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
} 