const multer = require('multer')

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatar/'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    const fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
    cb(null, fileName)  
  }
})
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('只能上传图片'))
    cb(null, true)
  }
})

module.exports = uploadAvatar