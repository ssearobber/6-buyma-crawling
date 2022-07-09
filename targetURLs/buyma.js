const puppeteer = require('puppeteer');
const dayjs = require('dayjs');

const TemporaryProductCount = require('../models/temporaryProductCount');
const ProductTodayCount = require('../models/productTodayCount');
const Product = require('../models/product');
const sequelize = require('sequelize');
const Op = sequelize.Op;

// buyma 데이터 크롤링
async function buyma() {
  const id = process.env.BUYMA_ID || buymaId;
  const password = process.env.BUYMA_PASSWORD || buymaPassword;
  const userId = process.env.USER_ID || userId;
  let browser = {};
  let page = {};

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        // '--window-size=1920,1080',
        // '--disable-notifications',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      // slowMo : 1 ,
      // userDataDir: path.join(__dirname, '../UserData') // 로그인 정보 쿠키 저장  // 쿠키 저장x--> [수정 2021/11/13]
    });
    page = await browser.newPage();
    // await page.setViewport({
    //   width: 1280,
    //   height: 1080,
    // });
    await page.setDefaultNavigationTimeout(0);

    // 1. 반복문으로 paging별로 이동
    // 2. 1 page만 로그인 처리 하기
    // 3. page별 크롤링
    // 4. 해당page에 데이터가 없을 경우, 처리 종료
    let isDataInThePage = true;
    let pageNum = 1;
    let today = dayjs().format('YYYY/MM/DD');
    let totalProducts = [];
    let products = [];
    while (isDataInThePage) {
      console.log(
        `https://www.buyma.com/my/sell?duty_kind=all&order=desc&page=${pageNum}&rows=100&sale_kind=all&sort=item_id&status=for_sale&timesale_kind=all#/에 이동`,
      );
      let response = await page.goto(
        `https://www.buyma.com/my/sell?duty_kind=all&order=desc&page=${pageNum}&rows=100&sale_kind=all&sort=item_id&status=for_sale&timesale_kind=all#/`,
        {
          waitUntil: 'networkidle0',
          timeout: 30000,
        },
      );
      if (!response) {
        throw 'Failed to load page!';
      }

      if (pageNum == 1) {
        // 로그인 작업 건너뛰기
        if (await page.$('.user_name')) {
          console.log('이미 로그인 되어 있습니다.');
        } else {
          await page.evaluate(
            (id, password) => {
              // login
              document.querySelector('#txtLoginId').value = id;
              document.querySelector('#txtLoginPass').value = password;
              document.querySelector('#login_do').click();
            },
            id,
            password,
          );
          console.log('로그인했습니다.');
        }
      }

      await page.waitForTimeout(20000); // 없으면 크롤링 안됨
      console.log('데이터 존재 체크 시작.');
      let isTd2TagInTheTable = await page.evaluate(() => {
        let td2TagCheck = document.querySelectorAll(
          'table tbody tr:nth-child(even) td:nth-child(2)',
        ).length;
        return td2TagCheck;
      });
      console.log('데이터 존재 체크 종료.');

      if (isTd2TagInTheTable) {
        // 데이터 크롤링
        console.log('데이터 크롤링 시작.');
        products = await page.evaluate((today) => {
          let tags = document.querySelectorAll('table tbody tr:nth-child(even)');
          let products = [];
          tags.forEach((t) => {
            products.push({
              productId:
                t &&
                t.querySelector('.item_name p:nth-of-type(2) a:nth-of-type(1)') &&
                t.querySelector('.item_name p:nth-of-type(2) a:nth-of-type(1)').textContent,
              productName:
                t &&
                t.querySelector('.item_name p:nth-of-type(1)') &&
                t.querySelector('.item_name p:nth-of-type(1)').textContent,
              productStatus: '出品中',
              releaseDate:
                t &&
                t.querySelector('._item_kokaidate_text') &&
                t.querySelector('._item_kokaidate_text').textContent.replace(/\n\s+/g, ''),
              cart:
                t &&
                t.querySelector('td:nth-of-type(11) span') &&
                t.querySelector('td:nth-of-type(11) span').textContent,
              wish:
                t &&
                t.querySelector('td:nth-of-type(12) span') &&
                t.querySelector('td:nth-of-type(12) span').textContent,
              access:
                t &&
                t.querySelector('td:nth-of-type(13) span') &&
                t.querySelector('td:nth-of-type(13) span').textContent,
              today,
              link:
                'https://www.buyma.com' + t &&
                t.querySelector('td:nth-of-type(2) a') &&
                t.querySelector('td:nth-of-type(2) a').href,
            });
          });
          return products;
        }, today);

        totalProducts.push(...products);
        pageNum++;
      } else {
        isDataInThePage = false;
        await page.close();
        await browser.close();
        console.log('데이터 크롤링 종료.');
      }
    }

    // product테이블 삭제 (전체 데이터 삭제)
    console.log('product테이블의 데이터 삭제시작.');
    try {
      await Product.destroy({
        where: {},
        truncate: true,
      });
    } catch (e) {
      console.log('delete error', e);
    }
    console.log('product테이블의 데이터 삭제종료.');
    // product테이블에 出品中인 데이터갱신  --> [추가 2021/10/26]
    console.log('product테이블의 데이터 입력시작.');
    for (let product of totalProducts) {
      if (product.productId) {
        try {
          await Product.create({
            user_id: userId,
            buyma_product_id: product.productId,
            buyma_product_name: product.productName,
            buyma_product_status: product.productStatus,
            buyma_product_realease_date: product.releaseDate,
            create_id: 'crawling',
            date_created: today,
            update_id: 'crawling',
            last_updated: today,
          });
        } catch (e) {
          console.log('insert error', e);
        }
      }
    }
    console.log('product테이블의 데이터 입력종료.');

    console.log('ProductTodayCount테이블에 10일전 데이터 삭제시작.');
    let before10Day = dayjs().subtract(10, 'd').format('YYYY/MM/DD');
    try {
      await TemporaryProductCount.destroy({
        where: { today: { [Op.lte]: before10Day } },
        truncate: true,
      });
    } catch (e) {
      console.log('delete error', e);
    }
    console.log('ProductTodayCount테이블에 10일전 데이터 삭제종료.');

    // 어제 상품 데이터 - 오늘 상품 데이터 = 오늘 증가 데이터  --> [수정 2021/06/12]
    // ProductTodayCount테이블에 오늘 증가 데이터 등록
    // 경우의 수, 1. 증가 데이터 없는경우 2. 어제의 데이터에 상품ID가 없는 경우
    console.log('ProductTodayCount테이블에 증가데이터 입력시작.');
    let cart = 0;
    let wish = 0;
    let access = 0;
    for (let product of totalProducts) {
      if (product.productId) {
        try {
          let result = await TemporaryProductCount.findOne({
            where: { buyma_product_id: product.productId },
          });

          if (!result) {
            // cart = Number(product.cart);
            // wish = Number(product.wish)
            // access = Number(product.access);
            // [수정 2021/06/12] 1.처음등록, 재출품인 경우 첫날 db입력하지 않음.
          } else {
            cart = Number(product.cart) - Number(result.cart);
            wish = Number(product.wish) - Number(result.wish);
            access = Number(product.access) - Number(result.access);
          }

          let productResult = await Product.findOne({
            where: { buyma_product_id: product.productId },
          });

          await ProductTodayCount.create({
            product_id: productResult.id,
            buyma_product_id: product.productId,
            buyma_product_name: product.productName,
            today: product.today,
            cart: cart,
            wish: wish,
            access: access,
            link: product.link,
            create_id: 'crawling',
            date_created: today,
            update_id: 'crawling',
            last_updated: today,
          });
        } catch (e) {
          console.log('오늘 증가 데이터 에러 : ', e);
        }
      }
    }
    console.log('ProductTodayCount테이블에 증가데이터 입력종료.');

    // 어제 데이터 삭제 (전체 데이터 삭제)
    console.log('TemporaryProductCount테이블의 어제 데이터 삭제시작.');
    try {
      await TemporaryProductCount.destroy({
        where: {},
        truncate: true,
      });
    } catch (e) {
      console.log('delete error', e);
    }
    console.log('TemporaryProductCount테이블의 어제 데이터 삭제종료.');
    // 오늘 데이터 등록
    console.log('TemporaryProductCount테이블에 오늘 데이터 등록시작.');
    for (let product of totalProducts) {
      if (product.productId) {
        try {
          await TemporaryProductCount.create({
            buyma_product_id: product.productId,
            buyma_product_name: product.productName,
            buyma_product_status: product.productStatus,
            buyma_product_realease_date: product.releaseDate,
            today: product.today,
            cart: product.cart,
            wish: product.wish,
            access: product.access,
            create_id: 'crawling',
            date_created: today,
            update_id: 'crawling',
            last_updated: today,
          });
        } catch (e) {
          console.log('insert error', e);
        }
      }
    }
    console.log('TemporaryProductCount테이블에 오늘 데이터 등록종료.');
  } catch (e) {
    console.log(e);
    await page.close();
    await browser.close();
  }
}

module.exports.buyma = buyma;
