PS C:\Users\vedan\OneDrive\Desktop\Shakti Backend> node server
(node:33440) [MONGODB DRIVER] Warning: useNewUrlParser is a deprecated option: useNewUrlParser has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
(Use `node --trace-warnings ...` to show where the warning was created)
(node:33440) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: useUnifiedTopology has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
🚀 Server running on port 5000
✅ MongoDB connected
OTP email sent: 250 2.0.0 OK  1748445664 d9443c01a7336-234d35cbb95sm13096775ad.255 - gsmtp
Signup3 Error: Error: FinancialDetails validation failed: existingloanDetails.Total_Loan_Amount: Path `existingloanDetails.Total_Loan_Amount` is required., existingloanDetails.Monthly_Payment: Path `existingloanDetails.Monthly_Payment` is required.
    at ValidationError.inspect (C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\error\validation.js:52:26)
    at formatValue (node:internal/util/inspect:850:19)
    at inspect (node:internal/util/inspect:387:10)
    at formatWithOptionsInternal (node:internal/util/inspect:2366:40)
    at formatWithOptions (node:internal/util/inspect:2228:10)
    at console.value (node:internal/console/constructor:345:14)
    at console.error (node:internal/console/constructor:412:61)
    at signup3User (C:\Users\vedan\OneDrive\Desktop\Shakti Backend\Controllers\finalsignup.js:128:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
  errors: {
    'existingloanDetails.Total_Loan_Amount': ValidatorError: Path `existingloanDetails.Total_Loan_Amount` is required.
        at validate (C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\schemaType.js:1404:13)
        at SchemaType.doValidate (C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\schemaType.js:1388:7)
        at C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\document.js:3096:18
        at process.processTicksAndRejections (node:internal/process/task_queues:85:11) {
      properties: [Object],
      kind: 'required',
      path: 'existingloanDetails.Total_Loan_Amount',
      value: undefined,
      reason: undefined,
      [Symbol(mongoose#validatorError)]: true
    },
    'existingloanDetails.Monthly_Payment': ValidatorError: Path `existingloanDetails.Monthly_Payment` is required.
        at validate (C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\schemaType.js:1404:13)
        at SchemaType.doValidate (C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\schemaType.js:1388:7)
        at C:\Users\vedan\OneDrive\Desktop\Shakti Backend\node_modules\mongoose\lib\document.js:3096:18
        at process.processTicksAndRejections (node:internal/process/task_queues:85:11) {
      properties: [Object],
      kind: 'required',
      path: 'existingloanDetails.Monthly_Payment',
      value: undefined,
      reason: undefined,
      [Symbol(mongoose#validatorError)]: true
    }
  },
  _message: 'FinancialDetails validation failed'
}


