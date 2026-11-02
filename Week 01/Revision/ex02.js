const paymentStatus = "APPROVED"

//check the payment status and display the appropriate message
const checkstatus= () => {
    let msg;
    if (paymentStatus == "APPROVED")
        {msg = "Pet-care service confirmed";}
    else if (paymentStatus == "Pending")
        {msg = "Payment is being processed";}
    else
        {msg = "Payment unsuccessful";}

console.log(msg)
}
checkstatus();