const puppeteer = require('puppeteer');
const path = require('path');

const Product = require('../models/product');
const TodayCount = require('../models/todayCount');

// buyma 데이터 크롤링
async function buyma() {
    
    const id = process.env.BUYMA_ID || buymaId;
    const password = process.env.BUYMA_PASSWORD || buymaPassword;
    let browser = {};
    let page = {};

    let products = [];
    let today = new Date();
    let year = today.getFullYear(); // 년도
    let month = today.getMonth() + 1;  // 월
    let date = today.getDate();  // 날짜
    today = year + '/' + month + '/' + date;

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
    products = await page.evaluate((today) => {
        const tags = document.querySelectorAll('table tbody tr:nth-child(even)');
        const products = [];
        tags.forEach((t)=> {
            products.push({
                productId : t && t.querySelector('.item_name p:nth-of-type(2) a:nth-of-type(1)') && t.querySelector('.item_name p:nth-of-type(2) a:nth-of-type(1)').textContent,
                productName : t && t.querySelector('.item_name p:nth-of-type(1)') && t.querySelector('.item_name p:nth-of-type(1)').textContent,
                productStatus : "出品中",
                releaseDate : t && t.querySelector('._item_yukodate span') && t.querySelector('._item_yukodate span').textContent.replace(/\n\s+/g,''),
                cart :  t && t.querySelector('td:nth-of-type(11) span') && t.querySelector('td:nth-of-type(11) span').textContent,
                wish :  t && t.querySelector('td:nth-of-type(12) span') && t.querySelector('td:nth-of-type(12) span').textContent,
                access :  t && t.querySelector('td:nth-of-type(13) span') && t.querySelector('td:nth-of-type(13) span').textContent,
                today
            })
        });
        return products;
    }, today)

    // 나중에 그래프 그릴 때, today값이 없을 때, 출품정지로 생각하여 표시 하지 않음.
    // 나중에 그래프 상세에서 댓글기능을 추가하여, 상품의 사진, 가격을 변경 이력을 남길 수 있게 할기.

    // 어제 상품 데이터 - 오늘 상품 데이터 = 오늘 증가 데이터
    // TodayCount테이블에 오늘 증가 데이터 등록
    // 경우의 수, 1. 증가 데이터 없는경우 2. 어제의 데이터에 상품ID가 없는 경우
    for (let product of products) {
        if (product.productId) {
            try {
                let result = await Product.findOne({
                    where: { productId: product.productId}
                })
                console.log("product.cart",typeof product.cart);
                console.log("product.cart",product.cart);
                console.log("result.cart",typeof result.cart);
                console.log("result.cart",result.cart);
                console.log("Number(product.cart) ",typeof Number(product.cart) );
                console.log("Number(result.cart)",typeof Number(result.cart));

                let cart = Number(product.cart) - Number(result.cart);
                let wish = Number(product.wish)- Number(result.wish);
                let access = Number(product.access) - Number(result.access);

                const result2 = await TodayCount.create({
                    productId: product.productId,
                    today: product.today,
                    cart: cart,
                    wish: wish,
                    access: access,
                })


            } catch (e) {
                console.log("오늘 증가 데이터 에러 : ", e);
            }
        }
    }

    // 어제 데이터 삭제 (전체 데이터 삭제)

    // 오늘 데이터 등록
    for (let product of products) {
        if (product.productId) {
            try {
                const result = await Product.create({
                    productId: product.productId,
                    productName: product.productName,
                    productStatus: product.productStatus,
                    releaseDate: product.releaseDate,
                    today: product.today,
                    cart: product.cart,
                    wish: product.wish,
                    access: product.access,
                })
                console.log("result : ", result)
            } catch (e) {
                console.log("insert error", e);
            }
        }
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