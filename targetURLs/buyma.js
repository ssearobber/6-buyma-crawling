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
    await page.goto('https://www.buyma.com/my/sell/?tab=b');

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