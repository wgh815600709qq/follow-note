const config = require('./config.js')
const fs = require('fs');
const path = require('path');
var originRequest = require('request');
var cheerio = require('cheerio');  // 解析 HTML, 服务器端 jQuery 选择器
var iconv = require('iconv-lite');  // 中文乱码
var bunyan = require('bunyan'); // 
var nodemailer = require('nodemailer'); // 邮件
var schedule = require("node-schedule")
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}
function request(url, callback) {
    var options = {
        url: url,
        encoding: null,
        headers: headers
    }
    originRequest(options, callback)
}

// 12位邮箱第三方登陆授权码
function sendMessage(charpter) {
    let message = createMessage(charpter);
    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log('Error occurred');
            console.log(error.message);
            return;
        }
        console.log('Message sent successfully!');
        console.log('Server responded with "%s"', info.response);
        transporter.close();
    });
    console.log('Send Mail');
}

// 定义消息端
var transporter = nodemailer.createTransport({
    service: 'QQ',
    auth: {
        user: '8156XX709@qq.com',//发送者邮箱
        pass: '12位邮箱第三方登陆授权码' //邮箱第三方登录授权码  [qq参考https://jingyan.baidu.com/article/fedf0737af2b4035ac8977ea.html]
    },
    logger: bunyan.createLogger({
        name: 'nodemailer'
    }),//打印日志
    debug: true
}, {
        from: '8156XX709@qq.com',//发送者邮箱
        headers: {
            'X-Laziness-level': 1000
        }
    });

console.log('SMTP Configured');

// 生成消息模板
var createMessage = function (charpter) {
    return {
        // Comma separated lsit of recipients 收件人用逗号间隔
        to: '815600709@qq.com',

        // Subject of the message 信息主题
        subject: '您关注的《伏天氏》小说已经更新',

        // plaintext body
        text: `最新章节已经更新到: ${charpter}`,

        // An array of attachments 附件
        attachments: [
        ]

    }
}


// 开始定时任务
schedule.scheduleJob('5 * * * * *', function () {
    request(config.url, function (err, res, body) {
        var time = new Date()
        var now = time.getFullYear() + '年' + (time.getMonth() + 1 ) + '月' +  time.getDate() + '日' + time.getHours() + '时' + time.getMinutes() + '分'
        console.log('开始拉取小说最新内容...', now);
        var html = iconv.decode(body, 'gb2312')
        // var $ = cheerio.load(html, { decodeEntities: false })
        var match = html.match(/\<p\>最新章节.+\<\/p\>/)[0];
        var charpter = match.replace(/\<[^>]*\>/g, '').slice(5);
        if (config.currentChapter) {
            console.log(config.currentChapter, 'currentChapter')
            console.log(charpter, 'charpter')
            if (config.currentChapter === charpter) return
            sendMessage(charpter)
        }
        // 无论结果如何都讲最新章节变成已读章节
        let road = path.resolve(__dirname, 'config.js')
        let content = `module.exports = { url:  '${config.url}',  currentChapter: '${charpter}'}`
        fs.writeFileSync(road, content)
        config.currentChapter = charpter
    })
})



