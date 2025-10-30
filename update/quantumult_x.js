// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;
[general]
server_check_url=http://cp.cloudflare.com/generate_204
dns_exclusion_list=*.cmpassport.com, *.jegotrip.com.cn, *.icitymobile.mobi, id6.me
geo_location_checker=http://ip-api.com/json/?lang=zh-CN, https://raw.githubusercontent.com/Orz-3/Orz-3/master/QuantumultX/IP.js
resource_parser_url=https://fastly.jsdelivr.net/gh/KOP-XIAO/QuantumultX@master/Scripts/resource-parser.js
excluded_routes=239.255.255.250/32
udp_whitelist=1-442, 444-65535

[dns]
no-ipv6
server=119.29.29.29
address=/mtalk.google.com/108.177.125.188
server=/dl.google.com/119.29.29.29
server=/dl.l.google.com/119.29.29.29
server=/update.googleapis.com/119.29.29.29
server=/*.dl.playstation.net/119.29.29.29
server=/amplifi.lan/system
server=/router.synology.com/system
server=/sila.razer.com/system
server=/router.asus.com/system
server=/routerlogin.net/system
server=/orbilogin.com/system
server=/www.LinksysSmartWiFi.com/system
server=/LinksysSmartWiFi.com/system
server=/myrouter.local/system
server=/www.miwifi.com/system
server=/miwifi.com/system
server=/mediarouter.home/system
server=/tplogin.cn/system
server=/tplinklogin.net/system
server=/melogin.cn/system
server=/falogin.cn/system

[policy]
static=DouYin, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png
static=Shawn, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/WeChat.png
static=大陆服务, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Reject.png
static=Disney+, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AbemaTV.png
static=AI Platforms, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Alibaba.png
static=Apple Service, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png
static=机场专线, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/Global.png
static=Netflix, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Rocket.png
static=广告拦截, direct, proxy, reject, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/ssLinks.png
# 苹果服务
static = 苹果服务, direct, proxy, 自动选择, 香港节点, 台湾节点, 日本节点, 韩国节点, 狮城节点, 美国节点, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/Apple-2.png

# 国内媒体
static = 国内媒体, direct, proxy, 香港节点, 台湾节点, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/StreamingCN.png

# 国际媒体
static = 国际媒体, proxy, direct, 自动选择, 香港节点, 台湾节点, 日本节点, 韩国节点, 狮城节点, 美国节点, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/Streaming.png

# 全球加速
static = 全球加速, proxy, direct, 自动选择, 香港节点, 台湾节点, 日本节点, 韩国节点, 狮城节点, 美国节点, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/Global.png

# 黑白名单
static = 黑白名单, proxy, direct, 自动选择, 香港节点, 台湾节点, 日本节点, 韩国节点, 狮城节点, 美国节点, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/Final.png

# 自动选择
url-latency-benchmark = 自动选择, server-tag-regex=.*, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/Available.png

# 香港节点
url-latency-benchmark = 香港节点, server-tag-regex=香港|港|🇭🇰|HK|(?i)Hong, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/HK.png

# 台湾节点
url-latency-benchmark = 台湾节点, server-tag-regex=台湾|台|🇹🇼|TW|(?i)Taiwan, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/TW.png

# 日本节点
url-latency-benchmark = 日本节点, server-tag-regex=日本|日|🇯🇵|JP|(?i)Japan, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/JP.png

# 韩国节点
url-latency-benchmark = 韩国节点, server-tag-regex=韩国|韩|🇰🇷|KR|(?i)Korea, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/KR.png

# 狮城节点
url-latency-benchmark = 狮城节点, server-tag-regex=新加坡|新|🇸🇬|SG|(?i)Singapore, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/SG.png

# 美国节点
url-latency-benchmark = 美国节点, server-tag-regex=美国|美|🇺🇸|US|(?i)States, check-interval=1800, tolerance=50, alive-checking=false, img-url=https://raw.githubusercontent.com/Centralmatrix3/Matrix-io/master/Gallery/Color/US.png

[server_remote]

[filter_remote]
https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/refs/heads/master/rule/QuantumultX/DouYin/DouYin.list, tag=抖音, update-interval=172800, opt-parser=true, enabled=true
https://raw.githubusercontent.com/NobyDa/Script/master/Surge/WeChat.list, tag=微信直连, update-interval=172800, opt-parser=true, enabled=true
# OpenAi
https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/OpenAI/OpenAI.list, tag=OpenAi, force-policy=美国节点, update-interval=172800, opt-parser=true, enabled=true
# 国际媒体
https://raw.githubusercontent.com/ddgksf2013/Filter/master/Streaming.list, tag=国际媒体, force-policy=国际媒体, update-interval=172800, opt-parser=true, enabled=true
https://raw.githubusercontent.com/Moli-X/Resources/main/Filter/Mainland.list, tag=大陆服务, update-interval=172800, opt-parser=true, enabled=true
# 苹果服务
https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Apple/Apple.list, tag=苹果服务, force-policy=苹果服务, update-interval=172800, opt-parser=true, enabled=true
# 全球加速
https://raw.githubusercontent.com/ConnersHua/RuleGo/master/Surge/Ruleset/Proxy.list, tag=全球加速, force-policy=全球加速, update-interval=172800, opt-parser=true, enabled=true
# 国内网站

[rewrite_remote]
https://gist.githubusercontent.com/95du/46b10dd9675ab3a6a840c3c33bd1ce79/raw/d29073da34112f553b00e38c7b2af106ab0b3824/get_lucky_cookie_body_conf.js, tag=多账号_Cookie_Body, update-interval=172800, opt-parser=true, enabled=true
https://github.com/chavyleung/scripts/raw/master/box/rewrite/boxjs.rewrite.quanx.conf, tag=boxjs, update-interval=172800, opt-parser=true, enabled=true
https://raw.githubusercontent.com/ddgksf2013/Rewrite/master/AdBlock/YoutubeAds.conf, tag=油管广告屏蔽 视频自动PIP+背景播放, update-interval=172800, opt-parser=true, enabled=true
https://raw.githubusercontent.com/95du/scripts/master/rewrite/getCookieToken.conf, tag=Cookie_token, update-interval=172800, opt-parser=true, enabled=true

[server_local]

[filter_local]
DOMAIN,sqb3.com,DIRECT
DOMAIN,e761dszb.com,DIRECT
host-suffix, local, direct
ip-cidr, 192.168.0.0/16, direct
ip-cidr, 10.0.0.0/8, direct
ip-cidr, 172.16.0.0/12, direct
ip-cidr, 127.0.0.0/8, direct
ip-cidr, 100.64.0.0/10, direct
ip-cidr, 224.0.0.0/4, direct
ip6-cidr, fe80::/10, direct
ip-cidr, 203.107.1.1/24, reject
ip-cidr, 183.240.197.130/32, direct
final, 黑白名单

[rewrite_local]

[task_local]
35 */5 * * * * wju73681_double_1414.js, tag=两字合分_1414, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Ryan.png, enabled=true
35 */5 * * * * wju73681_double_loop.js, tag=两位合分循环_1414, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Bot.png, enabled=false
35 */5 * * * * wju73681_autoBet.js, tag=全单双_Bet, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Copilot.png, enabled=false
40 */5 * * * * send_notify.js, tag=Send Bot, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png, enabled=true

[http_backend]

[mitm]
hostname = raw.githubusercontent.com,gist.githubusercontent.com,github.com