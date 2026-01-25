const sendEmail = require('../email');
const {consumeFromQueue} = require('../broker/broker');

module.exports =  function (){
    consumeFromQueue("AUTH_NOTIFICATION_USER_CREATED", async (data) => {
    console.log("Received data from AUTH_NOTIFICATION_USER_CREATED queue:", data);
  const emailHTMLTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to VyaparX</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background:#0d6efd; color:#ffffff; text-align:center; padding:20px;">
              <h1 style="margin:0;">VyaparX</h1>
              <p style="margin:5px 0 0;">Grow Your Business Digitally</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#333333;">
              <h2 style="margin-top:0;">Welcome to VyaparX 🎉</h2>

              <p>Dear <strong>${data.fullName?.firstName || ""} ${data.fullName?.lastName || ""}</strong>,</p>

              <p>
                Thank you for registering with <strong>VyaparX</strong>.  
                We are excited to help you manage and grow your business smarter and faster.
              </p>

              <p>
                You can now explore our platform, manage your services, and connect with customers easily.
              </p>

              <a href="https://vyaparx.com" 
                 style="display:inline-block; padding:12px 20px; background:#0d6efd; color:#ffffff; text-decoration:none; border-radius:5px; margin-top:15px;">
                Visit VyaparX
              </a>

              <p style="margin-top:25px;">
                If you have any questions, feel free to contact our support team anytime.
              </p>

              <p>
                Best Regards,<br>
                <strong>Kunal Singh Patel</strong><br>
                Founder, VyaparX
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f1f1; text-align:center; padding:15px; font-size:12px; color:#666;">
              © ${new Date().getFullYear()} VyaparX. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;


    sendEmail(data.email, "Welcome to Our Service", "Thank you for registering with us.", emailHTMLTemplate);

 consumeFromQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED",async(data)=>{
    
    const emailHTMLTemplate = `
     <h1>Payment Successful!</h1>
     <p>Dear Customer, <strong>${data.email}</strong> </p>
     <p>Amount:- ${data.amount}</p>
     <p>We are pleased to inform you that your payment has been successfully processed.</p>

    
    `
 })
 sendEmail(data.email, "Payment Successful", "Your payment has been processed successfully.", emailHTMLTemplate);


 consumeFromQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED",async(data)=>{

const emailHTMLTemplate = `
     <h1>Payment Failed</h1>
     <p>Dear Customer, <strong>${data.email}</strong> </p>
     <p>We regret to inform you that your recent payment attempt was unsuccessful.</p>
     <p>Please try again or contact support if the issue persists.</p>`

 sendEmail(data.email, "Payment Failed", "Your payment could not be processed.", emailHTMLTemplate);
 })
  
});
}