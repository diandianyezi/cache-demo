const Koa = require('koa');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { inflateRaw } = require('zlib');

const mimes = {
  css: 'text/css',
  less: 'text/less',
  gif: 'image/gif',
  html: 'text/html',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  swf: 'application/x-shockwave-flash',
  tiff: 'image/tiff',
  txt: 'text/plain',
  wav: 'audio/x-wav',
  wma: 'audio/x-ms-wma',
  wmv: 'video/x-ms-wmv',
  xml: 'text/xml',
}

// 获取文件类型
function parseMime(url) {
  let extName = path.extname(url);
  extName = extName ? extName.slice(1): 'unkown';
  return mimes[extName]
}

// 将文件转成传输所需格式
const parseStatic = (dir) => {
  return new Promise((resolve) => {
    resolve(fs.readFileSync(dir), 'binary');
  })
}

// 获取文件信息
const getFileStat = (path) => {
  return new Promise((resolve) => {
    fs.stat(path, (_, stat) => {
      resolve(stat)
    })
  })
}

const app = new Koa()

app.use(async (ctx) => {
  const url = ctx.request.url;
  if(url === '/') {
    ctx.set('Content-Type', 'text/html');
    ctx.body = await parseStatic('./index.html');
  } else {
    const filePath = path.resolve(__dirname, `.${url}`)
    ctx.set('Content-Type', parseMime(url))

    // 强缓存：1. 设置 Expires 响应头 单位是毫秒，绝对时间
    // 在这个时间前都使用本地缓存
    // const time = new Date(Date.now() + 30000).toUTCString()
    // ctx.set('Expires', time)

    // 强缓存：2. 设置 cache-control 单位秒 相对时间: 
    // 设置 Cache-Control 响应头：30s内都使用本地缓存
    // ctx.set('Cache-Control', 'max-age=30')
    

    // 协商缓存: 需要请求服务端某个资源时，如果命中缓存返回304，否则服务端返回资源
    // 1. Last-Modified 和 If-Modified-Since
    // const ifModifiedSince = ctx.request.header['if-modified-since']
    // const fileStat = await getFileStat(filePath)
    // console.info(new Date(fileStat.mtime).getTime())

    // ctx.set('Cache-Control', 'no-cache');
    // if(ifModifiedSince === fileStat.mtime.toGMTString()) {
    //   ctx.status = 304
    // } else {
    //   ctx.set('Last-Modified', fileStat.mtime.toGMTString())
    //   ctx.body = await parseStatic(filePath)
    // }

    // 2. Etag 和 If-None-Match 与上面的区别在于
    // 前者是对比资源内容，来确定资源是否修改，
    // 后者是比较资源最后一次的修改时间，如果资源修改与资源请求在同一时间，则还是会使用缓存,前者可以解决这个问题
    const ifNoneMatch = ctx.request.header['if-none-match']

    const hash = crypto.createHash('md5');
    const fileBuffer = await parseStatic(filePath)
    hash.update(fileBuffer)

    const eTag = `${hash.digest('hex')}`
    console.info(eTag, ifNoneMatch)
    ctx.set('Cache-Control', 'no-cache')
    // 对比hash值
    if (ifNoneMatch === eTag) {
      ctx.status = 304
    } else {
      ctx.set('etag', eTag)
      ctx.body = fileBuffer
    }
  }
})

app.listen(9898, () => {
  console.log('start on port: 9898')
})