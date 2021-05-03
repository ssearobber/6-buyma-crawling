const puppeteer = require('puppeteer');
const path = require('path');

// buyma 데이터 크롤링
async function buyma() {
    
    const id = process.env.BUYMA_ID || buymaId;
    const password = process.env.BUYMA_PASSWORD || buymaPassword;
    let browser = {};
    let page = {};

    try {
        browser = await puppeteer.launch({
        headless: false,
        args: [
            '--window-size=1920,1080',
            '--disable-notifications',
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
        // slowMo : 1 ,
        userDataDir: path.join(__dirname, '../UserData') // 로그인 정보 쿠키 저장
    });
    page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 1080,
    });
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.buyma.com/my/sell?duty_kind=all&order=desc&page=1&rows=100&sale_kind=all&sort=item_id&status=for_sale&timesale_kind=all#/');

    // 로그인 작업 건너뛰기
    if (await page.$('.user_name')) {
        console.log('이미 로그인 되어 있습니다.')
    } else {
        await page.evaluate((id,password) => {
            // login
            document.querySelector('#txtLoginId').value = id;
            document.querySelector('#txtLoginPass').value = password;
            document.querySelector('#login_do').click();
        }, id,password);
        console.log('로그인했습니다.')
    }

    // 데이터 크롤링
    let result = [];
    let today = new Date();
    let year = today.getFullYear(); // 년도
    let month = today.getMonth() + 1;  // 월
    let date = today.getDate();  // 날짜
    today = year + '/' + month + '/' + date;
    result = await page.evaluate((today) => {
        const tags = document.querySelectorAll('table tbody tr:nth-child(even)');
        const result = [];
        tags.forEach((t)=> {
            result.push({
                productName : t && t.querySelector('.item_name p:nth-of-type(1)') && t.querySelector('.item_name p:nth-of-type(1)').textContent,
                productId : t && t.querySelector('.item_name p:nth-of-type(2) a:nth-of-type(1)') && t.querySelector('.item_name p:nth-of-type(2) a:nth-of-type(1)').textContent,
                releaseDate : t && t.querySelector('._item_yukodate span') && t.querySelector('._item_yukodate span').textContent.replace(/\n\s+/g,''),
                cart :  t && t.querySelector('td:nth-of-type(11) span') && t.querySelector('td:nth-of-type(11) span').textContent,
                wish :  t && t.querySelector('td:nth-of-type(12) span') && t.querySelector('td:nth-of-type(12) span').textContent,
                access :  t && t.querySelector('td:nth-of-type(13) span') && t.querySelector('td:nth-of-type(13) span').textContent,
                today : today
            })
        });
        return result;
    }, today)

    // db 등록
    console.log("result" ,result);

    await page.close();
    await browser.close();

    }
    catch(e) {
        console.log(e);
        await page.close();
        await browser.close();

    }
    
}

module.exports.buyma = buyma;