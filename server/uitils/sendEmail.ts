import nodeMailer, { Transport } from "nodemailer";
import ejs from "ejs";
import path, { parse } from "path";

interface emailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
}

const sendEmail = async (options: emailOptions): Promise<void> => {
    const transporter = nodeMailer.createTransport({
        host: process.env.SMTPHOST,
        secure: true,
        port: parseInt(process.env.SMTPPORT || "587"),
        auth: { user: process.env.SMTPMAIL, pass: process.env.SMTPPASS }
    })

    const { email, subject, template, data } = options;
    // path to email template
    const templatePath = path.join(__dirname, '../templates', template);
    const html: string = await ejs.renderFile(templatePath, data);
    const mailOptions = { from: process.env.SMTPMAIL, to: email, subject: subject, html: html }

    await transporter.sendMail(mailOptions);
}

export default sendEmail