const timeAgo = (dateString) => {
  const now = Math.floor(Date.now() / 1000); // 当前时间的秒数
  const past = Math.floor(new Date(dateString).getTime() / 1000); // 给定日期的秒数
  const diffSec = now - past; // 计算时间差（秒）

  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 }
  ];

  for (const unit of units) {
    const diff = Math.floor(diffSec / unit.seconds);
    if (diff >= 1) return diff === 1 ? `1 ${unit.name} ago` : `${diff} ${unit.name}s ago`;
  }
  return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`; // 处理小于一分钟的情况
};

const dateStr = "2024-10-19T18:15:56Z";
console.log(timeAgo(dateStr));