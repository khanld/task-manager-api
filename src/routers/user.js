const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth.js')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')


router.route('/')
	.post(  async (req,res) =>{
		const user = new User(req.body)
		try {
			const token = await user.generateAuthToken()
			sendWelcomeEmail(user.email, user.name)
			res.status(201).send({user, token})
		} catch (error) {
			res.status(400).send(error)
		}
	})
	

router.get('/me',auth ,async (req,res) => {
		try{
			res.status(200).send(req.user)
		}catch(e){
			res.status(500).send(e)
		}
	})



router.post("/login", async(req, res) =>{
	try{
		const user = await User.findByCredentials(req.body.email, req.body.password)
		const token = await user.generateAuthToken()
		res.send({
			user,
			token
		})

	} catch (err) {
		res.status(400).send({err: 'Unable to login'})
	}
})
router.post('/logout', auth, async (req, res) => {
	try{
		req.user.tokens = req.user.tokens.filter(token => {
			return token.token !== req.token
		})

		await req.user.save()
		res.send()
	} catch (e) {
		res.status(500).send()
	}
})

router.post('/logoutAll', auth, async (req, res) => {
	try{
		req.user.tokens = []
		await req.user.save()
		res.send()
	} catch (e) {
		res.status(500).send()
	}
})

router.patch('/me', auth, async(req,res)=>{
		const updates = Object.keys(req.body)
		const allowedUpdates = ['name', 'email', 'password', 'age']
		const isValid = updates.every((update) => {
			return allowedUpdates.includes(update)
		})

		if(!isValid){
			return res.status(400).send({error: 'invalid updates'})
		}
		try{
			updates.forEach(update =>{
				req.user[update] = req.body[update]
			})

			await req.user.save()
			res.status(200).send(req.user)
		}catch(err){
			res.status(400).send(err)
		}
	})


router.delete('/me', auth, async(req, res) => {
		try{
			await req.user.remove()
			sendCancelationEmail(req.user.email, req.user.name)
			res.send(req.user)
		}catch(err){
			res.status(500).send(err)
		}
})

const upload = multer({
	limits: {
		fileSize: 1000000
	},
	fileFilter (req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)/))
			return cb(new Error('Please upload a JPG JPEG PNG file'))

		cb(undefined, true)
	}
})


router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
	const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()

	req.user.avatar = buffer
	await req.user.save()

	res.send()
}, (error, req, res, next) => {
	return res.status(400).send({err: error.message})	
})

router.delete('/me/avatar', auth, async (req, res) => {
	try {
		req.user.avatar = undefined
		await req.user.save()
		res.send()
	} catch (e) {
		res.status(500).send()
	}
})

router.get('/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id) 
		if (!user || !user.avatar) {
			throw new Error()
		}

		res.set('Content-type', 'image/png')
		res.send(user.avatar)

	} catch (e) {
		res.status(404).send()
	}
} )

module.exports = router