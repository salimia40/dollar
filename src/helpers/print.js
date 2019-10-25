const puppeteer = require('puppeteer')

const config = require('../config')
const {
    templates
} = config

const printImage = async (content) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 800
    })
    await page.setContent(content)
    let res = await page.screenshot({
        fullPage: true
    })
    await browser.close()
    return res
}

const printPDF = async (content) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 800
    })
    await page.setContent(content)
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true
    });

    await browser.close();
    return pdf
}



module.exports = {
    printImage, printPDF
}