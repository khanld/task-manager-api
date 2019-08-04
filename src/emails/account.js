
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
	to: email,
	from: 'khanhld218@uef.edu.com',
	subject: 'TThanks for joining in',
	text: `Welcome to the app ${name}`,
})
}

const sendCancelationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from:  'khanhld218@uef.edu.com',
		subject: 'Out cc',
		text: 'dmm'
	})
}
module.exports = {
	sendWelcomeEmail,
	sendCancelationEmail
}
