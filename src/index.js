const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const cors = require('cors')

const app = express()
const port = process.env.PORT

//Parsing request body with json content
app.use(cors())
app.use(express.json())



//Registering router
app.use('/users',userRouter)
app.use('/tasks',taskRouter)



app.listen(port, ()=>{
	console.log('Sever is up on port '+ port)
})
