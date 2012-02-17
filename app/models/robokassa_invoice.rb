class RobokassaInvoice < Invoice
  field :robokassa_invoice_id, :type => Integer
  index :robokassa_invoice_id, :unique => true
end
