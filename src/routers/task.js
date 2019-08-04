const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')


router.route('/')
	.post(auth, async (req,res) => {

		const task = new Task({
			...req.body,
			owner: req.user._id
		})

		try{
			await task.save()
			res.status(201).send(task)
		}catch(err){
			res.status(400).send(err)
		} 
	})

	.get(auth, async (req,res)=>{
		const match = {owner: req.user._id}
		const sort = {}

		if(req.query.completed){
				match.completed = req.query.completed === "true"
		}

		if(req.query.sortBy) {
			const parts = req.query.sortBy.split(':')
			sort[parts[0]] = (parts[1] === "desc")? -1: 1
		}
		const opts = {
			limit: parseInt(req.query.limit),
			skip: parseInt(req.query.skip),
			sort
		}
		try{
			// await req.user.populate({
			// 	path: 'tasks',
			// 	match,
			// 	options: {
			// 		limit: parseInt(req.query.limit),
			// 		skip: parseInt(req.query.skip),
			// 		sort
			// 	}
			// }).execPopulate()
			console.log(match)

			const tasks = await Task.find(match, null, opts)
			res.status(200).send(tasks)
		}catch(err){
			 res.status(500).send(err)

		} 
	})


router.route('/:id')
	.get( auth, async (req, res) => {
		const _id = req.params.id
		
		try{
			const task = await Task.findOne({_id, owner: req.user._id})
			console.log(!task)
					console.log(req.user._id)
			if(!task)
				return res.status(404).send()
			res.send(task)
		} catch (e) {
			res.status(500).send()
		}

			
	})
	.patch(auth, async(req, res)=>{
		const updates = Object.keys(req.body)
		const allowedUpdates = ['description', 'completed']

		const isValid = updates.every((update) => allowedUpdates.includes(update))

		if(!isValid)
			return res.status(400).send({error: 'invalid updates'})

		try{
			const task = await Task.findOne({_id: req.params.id, owner: req.user._id})


			if(!task)
				return res.status(404).send()

			updates.forEach(update => {
				task[update] = req.body[update]
			})

			await task.save()

			res.send(task)
		}catch(err){
			res.status(400).send(err)
		}
	})
	.delete(auth, async(req,res) => {
		try{
			const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

			if(!task)
				return res.status(404).send()

			res.send(task)
		}catch(err){
			 res.status(500).send(err)
		} 
	})





module.exports = router