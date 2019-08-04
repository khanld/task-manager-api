const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		alias: 'n'
	},
	email: {
		type: String,
		unique:true,
		required: true,
		trim: true,
		lowercase: true,
		validate(value){
			return validator.isEmail(value)
		}
	},
	age: {
		type: Number,
		default: 0,
		validate(value){
			if(value < 0){
				throw new Error('Age must be a positive number')
			}
		}
	},
	password: {
		type: String,
		required: true,
		trim: true,
		minlength: 7,
		validate(password){
			if(password.toLowerCase().includes('password'))
				throw new Error("Password's length must be greater than 6")
		}
	},

	tokens: [{
		token: {
			type: String,
			required: true
		}
	}],
	avatar: {
		type: Buffer
	}
}, {
	timestamps: true
})

userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'owner'
})

userSchema.methods.generateAuthToken = async function(){
	const token =  jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET_KEY)
	this.tokens.push({token})
	await this.save()
	return token
}

userSchema.methods.toJSON = function(){
	const userObject = this.toObject()

	delete userObject.password
	delete userObject.tokens
	delete userObject.avatar

	return userObject
}

userSchema.statics.findByCredentials = async function(email, password){
	 const user = await this.findOne({email})
	 if(!user)
	 	throw new Error()

	 const isMatch = await bcrypt.compare(password, user.password)
	 if(!isMatch)
	 	throw new Error()

	return user
}

//HAsh the plain text password
userSchema.pre('save',  async function(next){
	if(this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 8)
	}
})

userSchema.pre('remove', async function(next){

	await Task.deleteMany({owner: this._id})
	next()
})

const User = mongoose.model('User', userSchema)

module.exports = User