import React, { useState, useEffect, useRef } from 'react';
import { MastodonConfig } from '../types';

// Mastodon Logo Component
const MastodonIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    width={size}
    height={size * 1.053} // 保持原始比例
    viewBox="0 0 75 79"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M73.8393 17.4898C72.6973 9.00165 65.2994 2.31235 56.5296 1.01614C55.05 0.797115 49.4441 0 36.4582 0H36.3612C23.3717 0 20.585 0.797115 19.1054 1.01614C10.5798 2.27644 2.79399 8.28712 0.904997 16.8758C-0.00358524 21.1056 -0.100549 25.7949 0.0682394 30.0965C0.308852 36.2651 0.355538 42.423 0.91577 48.5665C1.30307 52.6474 1.97872 56.6957 2.93763 60.6812C4.73325 68.042 12.0019 74.1676 19.1233 76.6666C26.7478 79.2728 34.9474 79.7055 42.8039 77.9162C43.6682 77.7151 44.5217 77.4817 45.3645 77.216C47.275 76.6092 49.5123 75.9305 51.1571 74.7385C51.1797 74.7217 51.1982 74.7001 51.2112 74.6753C51.2243 74.6504 51.2316 74.6229 51.2325 74.5948V68.6416C51.2321 68.6154 51.2259 68.5896 51.2142 68.5661C51.2025 68.5426 51.1858 68.522 51.1651 68.5058C51.1444 68.4896 51.1204 68.4783 51.0948 68.4726C51.0692 68.4669 51.0426 68.467 51.0171 68.4729C45.9835 69.675 40.8254 70.2777 35.6502 70.2682C26.7439 70.2682 24.3486 66.042 23.6626 64.2826C23.1113 62.762 22.7612 61.1759 22.6212 59.5646C22.6197 59.5375 22.6247 59.5105 22.6357 59.4857C22.6466 59.4609 22.6633 59.4391 22.6843 59.422C22.7053 59.4048 22.73 59.3929 22.7565 59.3871C22.783 59.3813 22.8104 59.3818 22.8367 59.3886C27.7864 60.5826 32.8604 61.1853 37.9522 61.1839C39.1768 61.1839 40.3978 61.1839 41.6224 61.1516C46.7435 61.008 52.1411 60.7459 57.1796 59.7621C57.3053 59.7369 57.431 59.7154 57.5387 59.6831C65.4861 58.157 73.0493 53.3672 73.8178 41.2381C73.8465 40.7606 73.9184 36.2364 73.9184 35.7409C73.9219 34.0569 74.4606 23.7949 73.8393 17.4898Z" fill="url(#paint0_linear_mastodon)"/>
    <path d="M61.2484 27.0263V48.114H52.8916V27.6475C52.8916 23.3388 51.096 21.1413 47.4437 21.1413C43.4287 21.1413 41.4177 23.7409 41.4177 28.8755V40.0782H33.1111V28.8755C33.1111 23.7409 31.0965 21.1413 27.0815 21.1413C23.4507 21.1413 21.6371 23.3388 21.6371 27.6475V48.114H13.2839V27.0263C13.2839 22.7176 14.384 19.2946 16.5843 16.7572C18.8539 14.2258 21.8311 12.926 25.5264 12.926C29.8036 12.926 33.0357 14.5705 35.1905 17.8559L37.2698 21.346L39.3527 17.8559C41.5074 14.5705 44.7395 12.926 49.0095 12.926C52.7013 12.926 55.6784 14.2258 57.9553 16.7572C60.1531 19.2922 61.2508 22.7152 61.2484 27.0263Z" fill="white"/>
    <defs>
      <linearGradient id="paint0_linear_mastodon" x1="37.0692" y1="0" x2="37.0692" y2="79" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6364FF"/>
        <stop offset="1" stop-color="#563ACC"/>
      </linearGradient>
    </defs>
  </svg>
);

interface MastodonStatus {
  id: string;
  content: string;
  url: string;
  account: {
    username: string;
    display_name: string;
    url: string;
  };
  created_at: string;
}

interface MastodonTickerProps {
  config?: MastodonConfig;
}

const MastodonTicker: React.FC<MastodonTickerProps> = ({ config }) => {
  const [statuses, setStatuses] = useState<MastodonStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取 Mastodon 数据
  useEffect(() => {
    // 如果没有配置或禁用了，则不获取数据
    if (!config || !config.enabled) {
      setLoading(false);
      return;
    }

    const fetchStatuses = async () => {
      try {
        console.log('Mastodon config:', config);

        let instance = config.instance;
        let username = config.username;

        // 如果 username 是 @username@instance 格式，解析出 instance 和 username
        if (username && username.startsWith('@') && username.includes('@')) {
          const parts = username.split('@');
          if (parts.length === 3) {
            // 格式：@username@instance
            username = parts[1];
            instance = parts[2];
            console.log('Parsed username:', username, 'instance:', instance);
          }
        }

        // 第一步：查找用户 ID
        const accountLookupUrl = `https://${instance}/api/v1/accounts/lookup?acct=${username}`;
        console.log('Fetching Mastodon account:', accountLookupUrl);

        const lookupResponse = await fetch(accountLookupUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CloudNav/1.0'
          }
        });

        if (!lookupResponse.ok) {
          console.error('Account lookup failed:', lookupResponse.status, lookupResponse.statusText);
          throw new Error(`Failed to lookup account: ${lookupResponse.status} ${lookupResponse.statusText}`);
        }

        const account = await lookupResponse.json();
        const accountId = account.id;
        console.log('Found account ID:', accountId);

        // 第二步：获取 statuses
        const params = new URLSearchParams({
          limit: (config.limit || 10).toString(),
          exclude_replies: (config.exclude_replies !== false).toString(),
          exclude_reblogs: (config.exclude_reblogs !== false).toString(),
          pinned: (config.pinned === true).toString()
        });

        const statusesUrl = `https://${instance}/api/v1/accounts/${accountId}/statuses?${params}`;
        console.log('Fetching statuses from:', statusesUrl);
        console.log('Config params:', {
          limit: config.limit,
          exclude_replies: config.exclude_replies,
          exclude_reblogs: config.exclude_reblogs,
          pinned: config.pinned
        });

        const response = await fetch(statusesUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CloudNav/1.0'
          }
        });

        if (!response.ok) {
          console.error('Statuses fetch failed:', response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received statuses count:', data.length);

        // 处理数据，移除 HTML 标签并限制长度
        const processedStatuses = data.map((status: any) => ({
          id: status.id,
          content: status.content
            .replace(/<[^>]*>/g, '') // 移除 HTML 标签
            .replace(/&nbsp;/g, ' ') // 替换&nbsp;为空格
            .replace(/&amp;/g, '&') // 替换 HTML 实体
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim()
            .substring(0, 120), // 限制长度，适配小空间
          url: status.url,
          account: {
            username: status.account.username,
            display_name: status.account.display_name,
            url: status.account.url
          },
          created_at: status.created_at
        })).filter((status: MastodonStatus) => status.content.length > 0); // 过滤空内容

        setStatuses(processedStatuses);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch Mastodon statuses:', err);
        console.error('Error stack:', (err as Error).stack);
        setError(`无法获取动态：${(err as Error).message}`);
        setLoading(false);
      }
    };

    fetchStatuses();

    // 每 5 分钟刷新一次数据
    const interval = setInterval(fetchStatuses, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [config]);

  // 向上滚动逻辑
  useEffect(() => {
    if (statuses.length === 0 || isPaused) return;

    let index = 0;

    const startScrolling = () => {
      intervalRef.current = setInterval(() => {
        if (!isPaused && contentRef.current) {
          index = (index + 1) % (statuses.length + 1); // +1 因为有一个复制项
          setCurrentIndex(index);

          // 使用 transform 实现向上滚动
          const translateY = -index * 36; // 每个条目高 36px
          contentRef.current.style.transform = `translateY(${translateY}px)`;
        }
      }, 3000); // 每 3 秒切换一次
    };

    // 延迟开始，让初始显示稳定
    const startDelay = setTimeout(startScrolling, 2000);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statuses.length, isPaused]);

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  // 如果没有配置或禁用了，则不显示组件
  if (!config || !config.enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-full text-xs text-slate-500 dark:text-slate-400 h-9 min-w-10 leading-none">
        <MastodonIcon size={12} className="animate-spin" />
        <span className="hidden 2xl:inline">加载动态中...</span>
        <span className="2xl:hidden">...</span>
      </div>
    );
  }

  if (error || statuses.length === 0) {
    return (
      <div className="hidden xl:flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-full text-xs text-slate-500 dark:text-slate-400 h-9 min-w-10 leading-none">
        <MastodonIcon size={12} />
        <span className="hidden 2xl:inline">{error || '暂无动态'}</span>
        <span className="2xl:hidden">...</span>
      </div>
    );
  }

  return (
    <div className="hidden xl:flex items-center gap-2 bg-slate-50 dark:bg-slate-700/30 rounded-full px-3 py-2 max-w-sm 2xl:max-w-md h-9 min-w-10 leading-none">
      <MastodonIcon size={12} className="text-blue-500 shrink-0" />
      <div
        className="relative overflow-hidden flex-1 h-9"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={contentRef}
          className="flex flex-col transition-transform duration-500 ease-in-out items-start"
        >
          {statuses.map((status) => (
            <div
              key={status.id}
              className="shrink-0 h-9 flex items-center justify-center"
            >
              <div
                className="cursor-pointer hover:text-blue-500 transition-colors flex items-center gap-1 w-full"
                onClick={() => window.open(status.url, '_blank')}
                title={`${status.account.display_name} (@${status.account.username}): ${status.content}`}
              >
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-70 2xl:max-w-80">
                  {status.content}
                </span>
              </div>
            </div>
          ))}
          {/* 复制第一项实现无缝循环 */}
          <div className="shrink-0 h-6 flex items-center">
            <div
              className="cursor-pointer hover:text-blue-500 transition-colors flex items-center gap-1 w-full"
              onClick={() => window.open(statuses[0].url, '_blank')}
              title={`${statuses[0].account.display_name} (@${statuses[0].account.username}): ${statuses[0].content}`}
            >
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-70 2xl:max-w-80">
                {statuses[0].content}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MastodonTicker;