const express=require('express')
const cors=require('cors')
const joi = require('joi')
const app=express()
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use('/uploads', express.static('./uploads'))
app.use(express.json())

app.use((req, res, next) => {
  res.cc = function (err, status = 1) {
    res.send({
      status,
      message: err instanceof Error ? err.message : err,
    })
  }
  next()
})

const expressJWT = require('express-jwt')
const config = require('./config')
app.use(expressJWT({ secret: config.jwtSecretKey }).unless({ path: [/^\/api/] }))



const userRouter = require('./router/user')
app.use('/api', userRouter)
const userinfoRouter = require('./router/userinfo')
app.use('/my', userinfoRouter)
const videoCateRouter = require('./router/videocate')
app.use('/my/cate', videoCateRouter)
const videoRouter = require('./router/video')
app.use('/my/video', videoRouter)

app.use((err, req, res, next) => {
  // 验证失败导致的错误
  if (err instanceof joi.ValidationError) return res.cc(1,err)
  // 身份认证失败后的错误
  if (err.name === 'UnauthorizedError') return res.cc('身份认证失败！')
  // 未知的错误
  res.cc(err)
})



app.listen(3007,function(){
    console.log('api server running at http://127.0.0.1:3007')
})