const payments = [
    { petName: "Chester", amount :50, status: "APPROVED"},
    { petName:"Mochi", amount :80, status: "PENDING"},
    { petName: "Mira", amount: 40, status: "DECLINED"}
];



const checkstatus= (req, res, next) => {
    for (const payment of payments)
        if (payment.petname === "Mochi")
            msg = payments.petName+"'s payment status"+status
        if (payment.status === "APPROVED")
                msg = "Pet-care service for"+payments.petName+"confirmed"
        else if (payment.status === "PENDING")
                msg = "Payment for"+payments.petName+"is being processed"
        else
                msg = "Payment for"+payments.petName+"unsuccessful"

console.log(msg)

}
checkstatus();