import { Context, Logger, segment } from 'koishi'
import {} from 'koishi-plugin-puppeteer'
import { Page } from 'puppeteer-core'

export const name = 'star-history'
export const using = ['puppeteer']

const logger = new Logger('star-history')

export async function apply(ctx: Context) {
  ctx.command('star-history [...repos:string]', '查询 https://star-history.com/')
    .action(async ({ session }, ...repos) => {
      if (repos.length === 0) return '请输入仓库名。'
      let page: Page
      try {
        const url = `https://api.star-history.com/svg?repos=${repos.join(',')}&type=Date`
        page = await ctx.puppeteer.page()
        await page.setViewport({ width: 1920, height: 1080 })
        await page.goto(url, { waitUntil: 'networkidle0' })
        const element = await page.$(':root')
        const notFound: string = await element.evaluate(dom => dom['innerText'])
        if (notFound) {
          const match = notFound.match(/^Not Found: Repo (.+) not found$/)
          if (!match) throw notFound
          const [, repo] = match
          return `仓库 ${repo} 不存在。`
        }
        return segment.image(await element.screenshot())
      } catch(e) {
        logger.error(e)
        return '请求失败，请重试。'
      } finally {
        page?.close()
      }
    })
}
