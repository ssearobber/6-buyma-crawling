const puppeteer = require('puppeteer');
const path = require('path');
const dayjs = require("dayjs");

const Product = require('../models/product');
const TodayCount = require('../models/todayCount');

// buyma 데이터 크롤링
async function buyma() {
    
    const id = process.env.BUYMA_ID || buymaId;
    const password = process.env.BUYMA_PASSWORD || buymaPassword;
    let browser = {};
    let page = {};

    let products = [];
    let today = dayjs().format('YYYY/MM/DD');

    try {
        browser = await puppeteer.launch({
        headless: true,
        args: [
            // '--window-size=1920,1080',
            // '--disable-notifications',
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

    await page.waitForTimeout(20000); // 없으면 크롤링 안됨
    // 데이터 크롤링
    console.log('데이터 크롤링 시작.');
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
                today,
                link : "https://www.buyma.com" + t && t.querySelector('td:nth-of-type(2) a') && t.querySelector('td:nth-of-type(2) a').href
            })
        });
        return products;
    }, today);

    await page.close();
    await browser.close();
    console.log('데이터 크롤링 종료.');

    // 어제 상품 데이터 - 오늘 상품 데이터 = 오늘 증가 데이터
    // TodayCount테이블에 오늘 증가 데이터 등록
    // 경우의 수, 1. 증가 데이터 없는경우 2. 어제의 데이터에 상품ID가 없는 경우
    console.log('TodayCount테이블에 증가데이터 입력시작.');
    let cart = 0;
    let wish = 0;
    let access = 0;
    for (let product of products) {
        if (product.productId) {
            try {
                let result = await Product.findOne({
                    where: { productId: product.productId}
                })

                if (!result) {
                    cart = Number(product.cart);
                    wish = Number(product.wish)
                    access = Number(product.access);
                } else {
                    cart = Number(product.cart) - Number(result.cart);
                    wish = Number(product.wish)- Number(result.wish);
                    access = Number(product.access) - Number(result.access);
                }

                await TodayCount.create({
                    productId: product.productId,
                    productName: product.productName,
                    today: product.today,
                    cart: cart,
                    wish: wish,
                    access: access,
                    link: product.link,
                })

            } catch (e) {
                console.log("오늘 증가 데이터 에러 : ", e);
            }
        }
    }
    console.log('TodayCount테이블에 증가데이터 입력종료.');

    // 어제 데이터 삭제 (전체 데이터 삭제)
    console.log('Products테이블의 어제 데이터 삭제시작.');
    try {
        await Product.destroy({
            where: {},
            truncate: true
        });
        } catch (e) {
            console.log("delete error", e);
        }
    console.log('Products테이블의 어제 데이터 삭제종료.');
    // 오늘 데이터 등록
    console.log('Products테이블에 오늘 데이터 등록시작.');
    for (let product of products) {
        if (product.productId) {
            try {
                await Product.create({
                    productId: product.productId,
                    productName: product.productName,
                    productStatus: product.productStatus,
                    releaseDate: product.releaseDate,
                    today: product.today,
                    cart: product.cart,
                    wish: product.wish,
                    access: product.access,
                })
            } catch (e) {
                console.log("insert error", e);
            }
        }
    }
    console.log('Products테이블에 오늘 데이터 등록종료.');

    }
    catch(e) {
        console.log(e);
        await page.close();
        await browser.close();
    } 
}

module.exports.buyma = buyma;