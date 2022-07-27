const Koa = require('koa');
const fs = require('fs');
const path = require('path');

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

const app = new Koa()

app.use(async (ctx) => {
  const url = ctx.request.url;
  if(url === '/') {
    ctx.set('Content-Type', 'text/html');
    ctx.body = await parseStatic('./index.html');
  } else {
    const filePath = path.resolve(__dirname, `.${url}`)
    ctx.set('Content-Type', parseMime(url))
    
    ctx.body = await parseStatic(filePath)
    console.info(ctx)
  }
})

app.listen(9898, () => {
  console.log('start on port: 9898')
})