const puppeteer = require('puppeteer');
const path = require('path');

// buyma 데이터 크롤링
async function buyma() {
    
    const id = process.env.BUYMA_ID || buymaId;
    const password = process.env.BUYMA_PASSWORD || buymaPassword;
    let array1 = [];//색 나누기
    let array2 = [];//색 나누기
    let imagePathArray = []; // 이미지 path 격납
    let browser = {};
    let page = {};

    try {
        browser = await puppeteer.launch({
        headless: true,
        args: [
            // '--window-size=1920,1080',
            // '--disable-notifications',
            // "--proxy-server=157.90.137.189:3128",
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
        // slowMo : 1 ,
        userDataDir: path.join(__dirname, '../UserData') // 로그인 정보 쿠키 저장
    });
    page = await browser.newPage();
    // await page.setViewport({
    //     width: 1280,
    //     height: 1080,
    // });
    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://www.buyma.com/my/sell/new?tab=b');

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