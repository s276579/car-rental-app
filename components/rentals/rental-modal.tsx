"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type Car = Database["public"]["Tables"]["cars"]["Row"]
type Customer = Database["public"]["Tables"]["customers"]["Row"]

type Step = "dates" | "details" | "payment" | "confirmation"

export function RentalModal({
  car,
  isOpen,
  onClose,
}: {
  car: Car
  isOpen: boolean
  onClose: () => void
}) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>("dates")
  const [insuranceType, setInsuranceType] = useState<string>("basic")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 3)))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerDetails, setCustomerDetails] = useState<Partial<Customer>>({})
  const [hasRequiredDetails, setHasRequiredDetails] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Payment details
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})
  const [paymentAttempted, setPaymentAttempted] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Calculate rental details
  const days = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  const insuranceCost = insuranceType === "basic" ? 15 * days : insuranceType === "standard" ? 25 * days : 40 * days

  const totalCost = days * car.rental_rate + insuranceCost

  // Required fields for customer details
  const requiredFields = [
    "first_name",
    "last_name",
    "licence_number",
    "address_line1",
    "city",
    "county",
    "postcode",
    "date_of_birth",
  ] as const

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("customers").select("*").eq("id", user.id).single()

        if (error) throw error

        if (data) {
          setCustomerDetails(data)

          // Check if required fields are filled
          const hasAllRequired = requiredFields.every((field) => data[field] !== null && data[field] !== "")

          setHasRequiredDetails(hasAllRequired)
        }
      } catch (error) {
        console.error("Error fetching customer details:", error)
      }
    }

    if (isOpen) {
      fetchCustomerDetails()
      setValidationErrors({})
      setPaymentErrors({})
      setPaymentAttempted(false)
      setTouchedFields({})

      // Reset payment fields when modal opens
      setCardNumber("")
      setCardName("")
      setExpiryDate("")
      setCvv("")
    }
  }, [user, isOpen])

  // Reset payment attempted flag when changing steps
  useEffect(() => {
    setPaymentAttempted(false)
    setTouchedFields({})
  }, [step])

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCustomerDetails((prev) => ({ ...prev, [name]: value }))

    // Clear validation error for this field if it has a value
    if (value.trim()) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCardNumber(value)
    setTouchedFields((prev) => ({ ...prev, cardNumber: true }))

    if (value.trim()) {
      setPaymentErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors["cardNumber"]
        return newErrors
      })
    }
  }

  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCardName(value)
    setTouchedFields((prev) => ({ ...prev, cardName: true }))

    if (value.trim()) {
      setPaymentErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors["cardName"]
        return newErrors
      })
    }
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setExpiryDate(value)
    setTouchedFields((prev) => ({ ...prev, expiryDate: true }))

    if (value.trim() && value.includes("/")) {
      setPaymentErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors["expiryDate"]
        return newErrors
      })
    }
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCvv(value)
    setTouchedFields((prev) => ({ ...prev, cvv: true }))

    if (value.trim() && value.length >= 3) {
      setPaymentErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors["cvv"]
        return newErrors
      })
    }
  }

  const validateCustomerDetails = () => {
    const errors: Record<string, string> = {}

    requiredFields.forEach((field) => {
      const value = customerDetails[field]
      if (!value || (typeof value === "string" && !value.trim())) {
        errors[field] = "This field is required"
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePaymentDetails = () => {
    const errors: Record<string, string> = {}

    if (!cardNumber.trim()) {
      errors.cardNumber = "Card number is required"
    }

    if (!cardName.trim()) {
      errors.cardName = "Name on card is required"
    }

    if (!expiryDate.trim()) {
      errors.expiryDate = "Expiry date is required"
    } else if (!expiryDate.includes("/")) {
      errors.expiryDate = "Please use MM/YY format"
    }

    if (!cvv.trim()) {
      errors.cvv = "CVV is required"
    } else if (cvv.length < 3) {
      errors.cvv = "CVV must be at least 3 digits"
    }

    setPaymentErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveDetails = async () => {
    if (!user) return

    // Validate all required fields
    if (!validateCustomerDetails()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("customers").upsert({
        id: user.id,
        ...customerDetails,
      })

      if (error) throw error

      setHasRequiredDetails(true)
      setStep("payment")

      toast({
        title: "Details saved",
        description: "Your details have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving customer details:", error)
      toast({
        title: "Error",
        description: "There was a problem saving your details.",
        variant: "destructive",
      })
    }
  }

  const handleProcessPayment = () => {
    setPaymentAttempted(true)

    if (!validatePaymentDetails()) {
      toast({
        title: "Missing payment information",
        description: "Please fill in all payment fields correctly.",
        variant: "destructive",
      })
      return
    }

    // In a real app, we would process the payment here
    // For this demo, we'll just move to the next step
    setStep("confirmation")
  }

  const handleSubmit = async () => {
    if (!user || !startDate || !endDate) return

    setIsSubmitting(true)

    try {
      // Create rental
      const { data: rental, error: rentalError } = await supabase
        .from("rentals")
        .insert({
          car_id: car.id,
          customer_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
        })
        .select()
        .single()

      if (rentalError) throw rentalError

      // Create insurance
      const { error: insuranceError } = await supabase.from("insurance").insert({
        rental_id: rental.id,
        type: insuranceType,
        cost: insuranceCost,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })

      if (insuranceError) throw insuranceError

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        rental_id: rental.id,
        amount: totalCost,
        date: new Date().toISOString(),
        method: "card",
        status: "completed",
      })

      if (paymentError) throw paymentError

      // Update car status
      const { error: carError } = await supabase.from("cars").update({ status: "rented" }).eq("id", car.id)

      if (carError) throw carError

      toast({
        title: "Success!",
        description: "Your car has been rented successfully.",
      })

      onClose()
    } catch (error) {
      console.error("Error creating rental:", error)
      toast({
        title: "Error",
        description: "There was a problem creating your rental.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to determine if a field should show error styling
  const shouldShowError = (fieldName: string) => {
    return paymentAttempted || touchedFields[fieldName] ? !!paymentErrors[fieldName] : false
  }

  const renderStepContent = () => {
    switch (step) {
      case "dates":
        return (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="insurance">Insurance Type</Label>
                <Select value={insuranceType} onValueChange={setInsuranceType}>
                  <SelectTrigger id="insurance">
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (£15/day)</SelectItem>
                    <SelectItem value="standard">Standard (£25/day)</SelectItem>
                    <SelectItem value="premium">Premium (£40/day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="text-sm space-y-1">
                <p>Daily Rate: £{car.rental_rate}</p>
                {startDate && endDate && (
                  <>
                    <p>Total Days: {days}</p>
                    <p>Insurance Cost: £{insuranceCost}</p>
                    <p className="font-bold">Total Cost: £{totalCost}</p>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (hasRequiredDetails) {
                    setStep("payment")
                  } else {
                    setStep("details")
                  }
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )

      case "details":
        return (
          <>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Please provide your details to continue with the rental. All fields marked with * are required.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex">
                    First Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={customerDetails.first_name || ""}
                    onChange={handleDetailsChange}
                    className={validationErrors.first_name ? "border-red-500" : ""}
                  />
                  {validationErrors.first_name && <p className="text-xs text-red-500">{validationErrors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex">
                    Last Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={customerDetails.last_name || ""}
                    onChange={handleDetailsChange}
                    className={validationErrors.last_name ? "border-red-500" : ""}
                  />
                  {validationErrors.last_name && <p className="text-xs text-red-500">{validationErrors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licence_number" className="flex">
                  Driving Licence Number <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="licence_number"
                  name="licence_number"
                  value={customerDetails.licence_number || ""}
                  onChange={handleDetailsChange}
                  className={validationErrors.licence_number ? "border-red-500" : ""}
                />
                {validationErrors.licence_number && (
                  <p className="text-xs text-red-500">{validationErrors.licence_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="flex">
                  Date of Birth <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={customerDetails.date_of_birth || ""}
                  onChange={handleDetailsChange}
                  className={validationErrors.date_of_birth ? "border-red-500" : ""}
                />
                {validationErrors.date_of_birth && (
                  <p className="text-xs text-red-500">{validationErrors.date_of_birth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1" className="flex">
                  Address Line 1 <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  value={customerDetails.address_line1 || ""}
                  onChange={handleDetailsChange}
                  className={validationErrors.address_line1 ? "border-red-500" : ""}
                />
                {validationErrors.address_line1 && (
                  <p className="text-xs text-red-500">{validationErrors.address_line1}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  name="address_line2"
                  value={customerDetails.address_line2 || ""}
                  onChange={handleDetailsChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex">
                    City <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={customerDetails.city || ""}
                    onChange={handleDetailsChange}
                    className={validationErrors.city ? "border-red-500" : ""}
                  />
                  {validationErrors.city && <p className="text-xs text-red-500">{validationErrors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county" className="flex">
                    County <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="county"
                    name="county"
                    value={customerDetails.county || ""}
                    onChange={handleDetailsChange}
                    className={validationErrors.county ? "border-red-500" : ""}
                  />
                  {validationErrors.county && <p className="text-xs text-red-500">{validationErrors.county}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postcode" className="flex">
                  Postcode <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="postcode"
                  name="postcode"
                  value={customerDetails.postcode || ""}
                  onChange={handleDetailsChange}
                  className={validationErrors.postcode ? "border-red-500" : ""}
                />
                {validationErrors.postcode && <p className="text-xs text-red-500">{validationErrors.postcode}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("dates")}>
                Back
              </Button>
              <Button onClick={handleSaveDetails}>Save and Continue</Button>
            </DialogFooter>
          </>
        )

      case "payment":
        return (
          <>
            <div className="grid gap-4 py-4">
              <div className="bg-muted p-4 rounded-md mb-4">
                <h3 className="font-medium mb-2">Rental Summary</h3>
                <div className="text-sm space-y-1">
                  <p>
                    Car: {car.make} {car.model}
                  </p>
                  <p>
                    Rental Period: {startDate ? format(startDate, "PPP") : ""} - {endDate ? format(endDate, "PPP") : ""}
                  </p>
                  <p>Days: {days}</p>
                  <p>Daily Rate: £{car.rental_rate}</p>
                  <p>
                    Insurance: {insuranceType} (£{insuranceCost})
                  </p>
                  <p className="font-bold pt-2 border-t mt-2">Total: £{totalCost}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Please enter your payment details. All fields are required.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number" className="flex">
                    Card Number <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className={shouldShowError("cardNumber") ? "border-red-500" : ""}
                  />
                  {shouldShowError("cardNumber") && <p className="text-xs text-red-500">{paymentErrors.cardNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-name" className="flex">
                    Name on Card <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="card-name"
                    placeholder="J. Smith"
                    value={cardName}
                    onChange={handleCardNameChange}
                    className={shouldShowError("cardName") ? "border-red-500" : ""}
                  />
                  {shouldShowError("cardName") && <p className="text-xs text-red-500">{paymentErrors.cardName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="flex">
                      Expiry Date <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      className={shouldShowError("expiryDate") ? "border-red-500" : ""}
                    />
                    {shouldShowError("expiryDate") && (
                      <p className="text-xs text-red-500">{paymentErrors.expiryDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="flex">
                      CVV <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                      className={shouldShowError("cvv") ? "border-red-500" : ""}
                    />
                    {shouldShowError("cvv") && <p className="text-xs text-red-500">{paymentErrors.cvv}</p>}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("dates")}>
                Back
              </Button>
              <Button onClick={handleProcessPayment}>Pay £{totalCost}</Button>
            </DialogFooter>
          </>
        )

      case "confirmation":
        return (
          <>
            <div className="grid gap-4 py-8 text-center">
              <div className="mx-auto">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Payment Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  Your payment of £{totalCost} has been processed successfully.
                </p>
                <div className="bg-muted p-4 rounded-md text-left text-sm space-y-1 max-w-xs mx-auto">
                  <p>
                    Car: {car.make} {car.model}
                  </p>
                  <p>
                    Rental Period: {startDate ? format(startDate, "PPP") : ""} - {endDate ? format(endDate, "PPP") : ""}
                  </p>
                  <p>Insurance: {insuranceType}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Complete Rental"}
              </Button>
            </DialogFooter>
          </>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "confirmation" ? "Booking Confirmation" : `Rent ${car.make} ${car.model}`}
          </DialogTitle>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  )
}

